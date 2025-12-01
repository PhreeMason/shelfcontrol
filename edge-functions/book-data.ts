// Setup type definitions for built-in Supabase Runtime APIs
import axiod from "https://deno.land/x/axiod/mod.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, Logger, userAgent } from './utils.ts';
Deno.serve(async (req)=>{
  const logger = new Logger();
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  const startTime = performance.now();
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    // Extract the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Authorization header missing'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const token = authHeader.replace('Bearer ', '');
    // Fetch the user object using the token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      throw error;
    }
    const userId = user?.id;
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Authentication failed',
        logs: logger.getLogs()
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { api_id, isbn, google_volume_id } = requestBody;
    if (typeof api_id !== 'string' && api_id !== undefined || typeof isbn !== 'string' && isbn !== undefined || typeof google_volume_id !== 'string' && google_volume_id !== undefined) {
      return new Response(JSON.stringify({
        error: 'Identifiers must be strings'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!api_id && !isbn && !google_volume_id) {
      return new Response(JSON.stringify({
        error: 'One of api_id, isbn, or google_volume_id is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    let bookData;
    const googleApiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');
    try {
      if (isbn && googleApiKey) {
        logger.log(`Fetching book by ISBN: ${isbn}`);
        bookData = await Promise.any([
          fetchFromDatabaseByISBN(supabase, isbn, logger),
          fetchFromGoogleBooksByISBN(isbn, googleApiKey, supabase, logger)
        ]);
      } else if (google_volume_id && googleApiKey) {
        logger.log(`Fetching book by Google Volume ID: ${google_volume_id}`);
        bookData = await Promise.any([
          fetchFromDatabaseByGoogleId(supabase, google_volume_id, logger),
          fetchFromGoogleBooksById(google_volume_id, googleApiKey, supabase, logger)
        ]);
      } else if (api_id) {
        logger.log(`Fetching book by API ID (Goodreads): ${api_id}`);
        bookData = await Promise.any([
          fetchFromDatabase(supabase, api_id, logger),
          fetchFromGoodreads(api_id, supabase, logger)
        ]);
      } else {
        return new Response(JSON.stringify({
          error: 'Google Books API key not configured. Please provide api_id for Goodreads lookup.',
          logs: logger.getLogs()
        }), {
          status: 503,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      const identifierUsed = isbn ? `ISBN: ${isbn}` : google_volume_id ? `Google Volume ID: ${google_volume_id}` : `API ID: ${api_id}`;
      logger.error(`All fetch methods failed for ${identifierUsed}`);
      return new Response(JSON.stringify({
        error: `Book not found with ${identifierUsed}. Neither database nor external API returned results.`,
        logs: logger.getLogs()
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify(bookData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
async function fetchFromDatabase(supabaseClient, api_id, logger) {
  const startTime = performance.now();
  const { data, error } = await supabaseClient.from('books').select('*').eq('api_id', api_id).single();
  if (error || !data) {
    return Promise.reject(new Error('Not in database'));
  }
  logger.log(`Book found in database, timing ${performance.now() - startTime}ms`);
  return data;
}
async function fetchFromDatabaseByISBN(supabaseClient, isbn, logger) {
  const startTime = performance.now();
  // Check both isbn10 and isbn13 fields
  const { data, error } = await supabaseClient.from('books').select('*').or(`isbn10.eq.${isbn},isbn13.eq.${isbn}`).single();
  if (error || !data) {
    return Promise.reject(new Error('Not in database'));
  }
  logger.log(`Book found in database by ISBN, timing ${performance.now() - startTime}ms`);
  return data;
}
async function fetchFromDatabaseByGoogleId(supabaseClient, google_volume_id, logger) {
  const startTime = performance.now();
  const { data, error } = await supabaseClient.from('books').select('*').eq('google_volume_id', google_volume_id).single();
  if (error || !data) {
    return Promise.reject(new Error('Not in database'));
  }
  logger.log(`Book found in database by Google Volume ID, timing ${performance.now() - startTime}ms`);
  return data;
}
async function storeInDatabase(supabaseClient, bookData, logger) {
  logger.log({
    bookData
  });
  const startTime = performance.now();
  try {
    // Call the database function with the book data
    const { error } = await supabaseClient.rpc('store_book_with_authors', {
      book_data: bookData
    });
    if (error) {
      logger.error("Error storing book and authors:", error);
      throw error;
    }
    logger.log(`Book and authors stored in database, timing ${performance.now() - startTime}ms`);
  } catch (err) {
    logger.error("Failed to store in database:", err);
    throw err;
  }
}
async function fetchFromGoodreads(api_id, supabaseClient, logger) {
  logger.log("Fetching fresh data from Goodreads");
  const startTime = performance.now();
  // Fetch from Goodreads
  const { data: html } = await axiod.get(`https://www.goodreads.com/book/show/${api_id}`, {
    headers: {
      'User-Agent': userAgent
    }
  });
  // Parse HTML with Cheerio
  const $ = cheerio.load(html);
  // Extract book data using your existing function
  const bookData = extractBookData($, api_id, logger);
  if (bookData.genres) {
    bookData.genres = bookData.genres.filter((g)=>!g.includes('more'));
  }
  await storeInDatabase(supabaseClient, bookData, logger).catch((err)=>{
    logger.error("Failed to store in database:", err);
  });
  logger.log(`Book fetched from goodreads, timing ${performance.now() - startTime}ms`);
  return bookData;
}
async function fetchFromGoogleBooksByISBN(isbn, apiKey, supabaseClient, logger) {
  logger.log("Fetching from Google Books API by ISBN");
  const startTime = performance.now();
  try {
    // Clean ISBN (remove hyphens if any)
    const cleanIsbn = isbn.replace(/-/g, '');
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&key=${apiKey}`;
    const response = await axiod.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.data?.items || response.data.items.length === 0) {
      return Promise.reject(new Error('Book not found in Google Books'));
    }
    // Use the first result (most relevant)
    const googleBook = response.data.items[0];
    const bookData = transformGoogleBookToDatabase(googleBook);
    await storeInDatabase(supabaseClient, bookData, logger).catch((err)=>{
      logger.error("Failed to store in database:", err);
    });
    logger.log(`Book fetched from Google Books by ISBN, timing ${performance.now() - startTime}ms`);
    return bookData;
  } catch (error) {
    logger.error('Google Books API error:', error);
    return Promise.reject(error);
  }
}
async function fetchFromGoogleBooksById(volumeId, apiKey, supabaseClient, logger) {
  logger.log("Fetching from Google Books API by Volume ID");
  const startTime = performance.now();
  try {
    const url = `https://www.googleapis.com/books/v1/volumes/${volumeId}?key=${apiKey}`;
    const response = await axiod.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.data) {
      return Promise.reject(new Error('Book not found in Google Books'));
    }
    const bookData = transformGoogleBookToDatabase(response.data);
    await storeInDatabase(supabaseClient, bookData, logger).catch((err)=>{
      logger.error("Failed to store in database:", err);
    });
    logger.log(`Book fetched from Google Books by Volume ID, timing ${performance.now() - startTime}ms`);
    return bookData;
  } catch (error) {
    logger.error('Google Books API error:', error);
    return Promise.reject(error);
  }
}
function transformGoogleBookToDatabase(googleBook) {
  const volumeInfo = googleBook.volumeInfo || {};
  const saleInfo = googleBook.saleInfo || {};
  // Extract ISBNs
  let isbn10 = null;
  let isbn13 = null;
  if (volumeInfo.industryIdentifiers) {
    const isbn13Obj = volumeInfo.industryIdentifiers.find((id)=>id.type === 'ISBN_13');
    const isbn10Obj = volumeInfo.industryIdentifiers.find((id)=>id.type === 'ISBN_10');
    isbn13 = isbn13Obj?.identifier || null;
    isbn10 = isbn10Obj?.identifier || null;
  }
  // Get best quality cover image
  let coverImageUrl = null;
  if (volumeInfo.imageLinks) {
    coverImageUrl = volumeInfo.imageLinks.large || volumeInfo.imageLinks.medium || volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail;
    // Ensure HTTPS
    if (coverImageUrl && coverImageUrl.startsWith('http:')) {
      coverImageUrl = coverImageUrl.replace('http:', 'https:');
    }
  }
  // Parse publication date
  let publicationDate = null;
  if (volumeInfo.publishedDate) {
    try {
      const dateStr = volumeInfo.publishedDate;
      let parsedDate;
      if (dateStr.length === 4) {
        parsedDate = new Date(`${dateStr}-01-01`);
      } else if (dateStr.length === 7) {
        parsedDate = new Date(`${dateStr}-01`);
      } else {
        parsedDate = new Date(dateStr);
      }
      if (isNaN(parsedDate.getTime())) {
        console.error(`Invalid date format from Google Books: ${dateStr}`);
        publicationDate = null;
      } else {
        publicationDate = parsedDate;
      }
    } catch (e) {
      console.error(`Error parsing date from Google Books: ${volumeInfo.publishedDate}`, e);
      publicationDate = null;
    }
  }
  // Determine format based on available info
  let format = null;
  if (saleInfo.isEbook) {
    format = 'eBook';
  } else if (volumeInfo.printType === 'BOOK') {
    format = 'physical';
  }
  return {
    api_id: null,
    google_volume_id: googleBook.id,
    api_source: 'google_books',
    cover_image_url: coverImageUrl,
    description: volumeInfo.description || null,
    edition: null,
    format: format,
    genres: volumeInfo.categories || [],
    has_user_edits: false,
    isbn10: isbn10,
    isbn13: isbn13,
    language: volumeInfo.language || null,
    metadata: {
      extraction_method: 'google_books_api',
      authors: volumeInfo.authors || [],
      subtitle: volumeInfo.subtitle || null,
      publisher: volumeInfo.publisher || null,
      page_count: volumeInfo.pageCount || null,
      maturity_rating: volumeInfo.maturityRating || null,
      preview_link: volumeInfo.previewLink || null,
      info_link: volumeInfo.infoLink || null,
      ratings_count: volumeInfo.ratingsCount || null,
      sale_info: {
        country: saleInfo.country || null,
        saleability: saleInfo.saleability || null,
        is_ebook: saleInfo.isEbook || false
      }
    },
    publication_date: publicationDate,
    publisher: volumeInfo.publisher || null,
    rating: volumeInfo.averageRating || null,
    source: 'google_books',
    title: volumeInfo.title || '',
    total_duration: null,
    total_pages: volumeInfo.pageCount || null
  };
}
function decodeHtmlEntities(str) {
  if (!str) return str;
  // Decode common HTML entities
  return str.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, dec)=>String.fromCharCode(dec)).replace(/&#x([a-fA-F0-9]+);/g, (_, hex)=>String.fromCharCode(parseInt(hex, 16)));
}
function extractBookData($, api_id, logger) {
  const startTime = performance.now();
  // Initialize book object with default values
  const book = {
    api_id: api_id,
    api_source: 'goodreads',
    cover_image_url: null,
    description: null,
    edition: null,
    format: null,
    genres: [],
    has_user_edits: false,
    isbn10: null,
    isbn13: null,
    language: null,
    metadata: {
      extraction_method: 'html'
    },
    publication_date: null,
    publisher: null,
    rating: null,
    source: 'goodreads',
    title: '',
    total_duration: null,
    total_pages: null
  };
  // Try to extract from NEXT_DATA script first (best data source)
  const nextDataScript = $('#__NEXT_DATA__').text();
  if (nextDataScript) {
    try {
      const nextData = JSON.parse(nextDataScript);
      extractFromNextData(nextData, book, logger);
    } catch (e) {
      logger.error('Failed to parse NEXT_DATA script:', e);
    }
  }
  // Extract from JSON-LD schema next
  const schemaScript = $('script[type="application/ld+json"]').text();
  if (schemaScript) {
    try {
      const schema = JSON.parse(schemaScript);
      if (schema) {
        extractFromSchema(schema, book);
      }
    } catch (e) {
      logger.error('Failed to parse schema.org data:', e);
    }
  }
  // Finally, extract from HTML elements as fallback
  extractFromHtml($, book);
  logger.log(`Book extracted from parsed data, timing ${performance.now() - startTime}ms`);
  return book;
}
function extractFromNextData(nextData, book, logger) {
  try {
    let bookProps = null;
    const targetLegacyId = parseInt(book.api_id.split('-')[0], 10);
    if (nextData?.props?.pageProps?.book) {
      bookProps = nextData.props.pageProps.book;
    } else if (nextData?.props?.pageProps?.apolloState) {
      const apolloState = nextData.props.pageProps.apolloState;
      for(const key in apolloState){
        if (key.startsWith('Book:')) {
          const candidateBook = apolloState[key];
          if (candidateBook.legacyId === targetLegacyId) {
            bookProps = candidateBook;
            break;
          }
        }
      }
    }
    if (!bookProps) return;
    if (book.metadata) book.metadata.extraction_method = 'next_data';
    if (!book.title && bookProps.title) book.title = decodeHtmlEntities(bookProps.title).replace(/\s*\(.*?\)$/, '');
    if (!book.cover_image_url && (bookProps.imageUrl || bookProps.coverImage)) {
      book.cover_image_url = bookProps.imageUrl || bookProps.coverImage;
    }
    if (!book.description && bookProps.description) book.description = decodeHtmlEntities(bookProps.description);
    if (!book.total_pages && bookProps.numPages) book.total_pages = bookProps.numPages;
    if (!book.language && bookProps.language) book.language = bookProps.language;
    if (!book.publisher && bookProps.publisher) {
      book.publisher = bookProps.publisher;
      logger.log(`Publisher found in NEXT_DATA: ${bookProps.publisher}`);
    }
    if (!book.publication_date && bookProps.publicationDate) {
      book.publication_date = formatDate(bookProps.publicationDate);
    }
    if (!book.rating && bookProps.rating) book.rating = parseFloat(bookProps.rating);
    const identifiers = nextData?.props?.pageProps?.bookDetails?.details?.details?.identifiers;
    if (identifiers) {
      if (!book.isbn10 && identifiers.isbn10) book.isbn10 = identifiers.isbn10;
      if (!book.isbn13 && identifiers.isbn13) book.isbn13 = identifiers.isbn13;
    }
    const details = bookProps.details;
    if (details) {
      if (!book.total_pages && details.numPages) book.total_pages = details.numPages;
      if (!book.publisher && details.publisher) {
        book.publisher = details.publisher;
        logger.log(`Publisher found in NEXT_DATA: ${details.publisher}`);
      }
      if (!book.language && details.language?.name) book.language = details.language.name;
      if (!book.isbn10 && details.isbn) book.isbn10 = details.isbn;
      if (!book.isbn13 && details.isbn13) book.isbn13 = details.isbn13;
      if (!book.edition && details.edition) book.edition = details.edition;
      if (!book.publication_date && details.publicationTime) {
        book.publication_date = formatDate(new Date(details.publicationTime));
      }
      if (!book.format && details.format) {
        const format = details.format.toLowerCase();
        if (format.includes('hardcover')) book.format = 'physical';
        else if (format.includes('paperback')) book.format = 'physical';
        else if (format.includes('eBook') || format.includes('kindle')) book.format = 'eBook';
        else if (format.includes('audio')) book.format = 'audio';
      }
    }
    if (!book.format && bookProps.format) {
      const format = bookProps.format.toLowerCase();
      if (format.includes('hardcover')) book.format = 'physical';
      else if (format.includes('paperback')) book.format = 'physical';
      else if (format.includes('eBook')) book.format = 'eBook';
      else if (format.includes('audio')) book.format = 'audio';
    }
    if (book.genres?.length === 0 && bookProps.genres && Array.isArray(bookProps.genres)) {
      book.genres = bookProps.genres.map((g)=>decodeHtmlEntities(g?.name || g)) || [];
    }
    book.metadata = book.metadata || {};
    if (!book.metadata.authors) {
      if (bookProps.authors && Array.isArray(bookProps.authors)) {
        book.metadata.authors = bookProps.authors.map((a)=>decodeHtmlEntities(a?.name || a));
      } else if (bookProps.primaryContributorEdge?.node?.__ref) {
        const authorRef = bookProps.primaryContributorEdge.node.__ref;
        const apolloState = nextData?.props?.pageProps?.apolloState;
        if (apolloState && apolloState[authorRef]) {
          const authorData = apolloState[authorRef];
          book.metadata.authors = [
            decodeHtmlEntities(authorData.name)
          ];
        }
      }
    }
    if (!book.metadata.series && bookProps.series) {
      book.metadata.series = bookProps.series.name || bookProps.series;
    }
  } catch (e) {
    logger.error('Error extracting from NEXT_DATA:', e);
  }
}
function extractFromSchema(schema, book) {
  if (book.metadata && !book.metadata.extraction_method) book.metadata.extraction_method = 'schema';
  if (!book.title && schema.name) {
    book.title = decodeHtmlEntities(schema.name).replace(/\s*\(.*?\)$/, '');
  }
  if (!book.cover_image_url && schema.image) {
    book.cover_image_url = schema.image;
  }
  if (!book.total_pages && schema.numberOfPages) {
    book.total_pages = parseInt(schema.numberOfPages);
  }
  if (!book.language && schema.inLanguage) {
    book.language = schema.inLanguage;
  }
  if (!book.publisher && schema.publisher) {
    if (typeof schema.publisher === 'string') {
      book.publisher = decodeHtmlEntities(schema.publisher);
    } else if (schema.publisher?.name) {
      book.publisher = decodeHtmlEntities(schema.publisher.name);
    }
  }
  if (schema.isbn) {
    const isbn = schema.isbn.replace(/-/g, '');
    if (!book.isbn10 && isbn.length === 10) book.isbn10 = isbn;
    else if (!book.isbn13 && isbn.length === 13) book.isbn13 = isbn;
  }
  if (!book.format && schema.bookFormat) {
    if (schema.bookFormat === 'Hardcover') book.format = 'physical';
    else if (schema.bookFormat === 'Paperback') book.format = 'physical';
    else if (schema.bookFormat === 'E-book') book.format = 'eBook';
    else if (schema.bookFormat === 'audio') book.format = 'audio';
  }
  if (!book.metadata?.authors && schema.author && Array.isArray(schema.author)) {
    book.metadata = book.metadata || {};
    book.metadata.authors = schema.author.map((a)=>decodeHtmlEntities(a.name));
  }
  if (!book.rating && schema.aggregateRating) {
    book.rating = parseFloat(schema.aggregateRating.ratingValue);
    book.metadata = book.metadata || {};
    if (!book.metadata.rating_count) book.metadata.rating_count = schema.aggregateRating.ratingCount;
    if (!book.metadata.review_count) book.metadata.review_count = schema.aggregateRating.reviewCount;
  }
  if (!book.metadata?.awards && schema.awards) {
    book.metadata = book.metadata || {};
    book.metadata.awards = decodeHtmlEntities(schema.awards);
  }
}
function extractFromHtml($, book) {
  // Title
  if (!book.title) {
    book.title = decodeHtmlEntities($('h1.Text__title1').text().trim()).replace(/\s*\(.*?\)$/, '');
  }
  // Cover image
  if (!book.cover_image_url) {
    const coverImg = $('.BookCover img.ResponsiveImage').attr('src');
    if (coverImg && !coverImg.includes('no-cover')) {
      book.cover_image_url = coverImg;
    }
  }
  // Description
  if (!book.description) {
    const description = $('.BookPageMetadataSection__description .TruncatedContent__text').text().trim();
    if (description) book.description = decodeHtmlEntities(description);
  }
  // Genres
  if (book.genres?.length === 0) {
    $('.BookPageMetadataSection__genres .Button--tag').each((_, el)=>{
      const genre = decodeHtmlEntities($(el).text().trim());
      if (genre) book.genres?.push(genre);
    });
  }
  // Publication info
  if (!book.publication_date || !book.publisher) {
    const publicationInfo = $('.FeaturedDetails [data-testid="publicationInfo"]').text();
    if (!book.publication_date) {
      const publicationMatch = publicationInfo.match(/First published (.+)/) || publicationInfo.match(/Expected publication (.+)/);
      if (publicationMatch) {
        book.publication_date = formatDate(publicationMatch[1]);
      }
    }
    if (!book.publisher) {
      const publisherMatch = publicationInfo.match(/by (.+)$/);
      if (publisherMatch) {
        book.publisher = decodeHtmlEntities(publisherMatch[1].trim());
      }
    }
  }
  // Page count and format
  if (!book.total_pages) {
    const pagesFormat = $('.FeaturedDetails [data-testid="pagesFormat"]').text();
    const pagesMatch = pagesFormat.match(/(\d+)\s+pages/);
    if (pagesMatch) book.total_pages = parseInt(pagesMatch[1], 10);
    // Format
    if (!book.format) {
      if (pagesFormat.includes('Hardcover')) book.format = 'physical';
      else if (pagesFormat.includes('Paperback')) book.format = 'physical';
      else if (pagesFormat.includes('Kindle')) book.format = 'eBook';
      else if (pagesFormat.includes('audio')) book.format = 'audio';
    }
  }
  // Rating
  if (!book.rating) {
    const ratingText = $('.RatingStatistics__rating').text().trim();
    if (ratingText) book.rating = parseFloat(ratingText);
  }
  if (!book.metadata?.authors) {
    const authorNames = [];
    $('.ContributorLink__name').each((_, el)=>{
      const name = decodeHtmlEntities($(el).text().trim());
      if (name) authorNames.push(name);
    });
    if (authorNames.length > 0) {
      book.metadata = book.metadata || {};
      book.metadata.authors = authorNames;
    }
  }
  // Series info
  if (!book.metadata?.series) {
    const seriesText = decodeHtmlEntities($('.Text__title3.Text__italic').text().trim());
    const seriesMatch = seriesText.match(/(.+?)(?:\s*#\d+)?$/);
    if (seriesMatch) {
      book.metadata = book.metadata || {};
      book.metadata.series = seriesMatch[1];
    }
  }
  // ISBN
  if (!book.isbn10 || !book.isbn13) {
    // Fallback to HTML scraping if not found in JSON
    const isbnSection = $('[data-testid="bookDetails"]').text();
    // Match ISBN patterns (ISBN-10: 10 digits, ISBN-13: 978/979 prefix + 10 digits)
    const isbn10Match = isbnSection.match(/ISBN-10: (\d{10})/);
    const isbn13Match = isbnSection.match(/ISBN-13: (\d{13})/);
    if (isbn10Match) book.isbn10 = isbn10Match[1];
    if (isbn13Match) book.isbn13 = isbn13Match[1];
  }
}
function formatDate(dateString) {
  const date = new Date(dateString);
  return date;
}
