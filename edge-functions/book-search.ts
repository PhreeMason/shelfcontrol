// Setup type definitions for built-in Supabase Runtime APIs
import axiod from "https://deno.land/x/axiod/mod.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, generateUrl, Logger, userAgent } from './utils.ts';
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
    // Parse and validate request
    const body = await req.json().catch(()=>({}));
    const { query } = body;
    if (!query?.trim()) {
      return new Response(JSON.stringify({
        error: 'Query parameter is required',
        logs: logger.getLogs()
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    logger.log(`Starting book search for query: "${query}"`);
    // Scrape books
    const books = await scrapeBooks(query, logger);
    logger.log(`Search completed in ${(performance.now() - startTime).toFixed(2)}ms, found ${books.length} books`);
    // Save search history (non-blocking)
    supabase.from('user_searches').insert({
      user_id: userId,
      query,
      result_count: books.length
    }).then(({ error })=>{
      if (error) logger.error('Failed to save search history:', error);
    });
    return new Response(JSON.stringify({
      bookList: books,
      logs: logger.getLogs()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (err) {
    logger.error('Request failed:', err instanceof Error ? err.message : String(err));
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : 'Unknown error',
      logs: logger.getLogs()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      status: 500
    });
  }
});
async function scrapeGoodreads(query, logger) {
  const baseUrl = generateUrl(query);
  const startTime = performance.now();
  logger.log(`Scraping Goodreads for: "${query}"`);
  try {
    const response = await axiod.get(baseUrl, {
      headers: {
        'User-Agent': userAgent
      },
      timeout: 10000
    });
    if (!response?.data) {
      logger.log('No response from Goodreads');
      return [];
    }
    const $ = cheerio.load(response.data);
    const books = extractBookListData($);
    logger.log(`Goodreads scraping completed in ${(performance.now() - startTime).toFixed(2)}ms, found ${books.length} books`);
    return books;
  } catch (error) {
    logger.error('Goodreads scraping error:', error.message);
    return [];
  }
}
async function scrapeBooks(query, logger) {
  const [googleBooksResult, goodreadsResult] = await Promise.allSettled([
    searchGoogleBooks(query, logger),
    scrapeGoodreads(query, logger)
  ]);
  // const googleBooks = googleBooksResult.status === 'fulfilled' ? googleBooksResult.value : [];
  const googleBooks = [];
  const goodreadsBooks = goodreadsResult.status === 'fulfilled' ? goodreadsResult.value : [];
  const combinedBooks = [
    ...googleBooks,
    ...goodreadsBooks
  ];
  const deduplicatedBooks = deduplicateBooks(combinedBooks);
  logger.log(`Combined ${googleBooks.length} Google Books + ${goodreadsBooks.length} Goodreads = ${combinedBooks.length} total, ${deduplicatedBooks.length} after deduplication`);
  return deduplicatedBooks;
}
function extractBookListData($) {
  const bookList = [];
  $('tr[itemscope][itemtype="http://schema.org/Book"]').each((i, element)=>{
    const $el = $(element);
    try {
      const idDiv = $el.find('div.u-anchorTarget');
      const bookUrl = $el.find('a.bookTitle').attr('href')?.split('?')[0].replace('/book/show/', '') || '';
      const titleElement = $el.find('.bookTitle span[itemprop="name"]');
      const fullTitle = titleElement.text().trim();
      if (!fullTitle) return;
      const seriesMatch = fullTitle.match(/^(.*?)\s*\(([^#]+?)\s*#([\d.]+)(?:,.*)?\)$/);
      const title = seriesMatch ? seriesMatch[1].trim() : fullTitle;
      const series = seriesMatch ? seriesMatch[2].trim() : null;
      const seriesNumber = seriesMatch ? parseFloat(seriesMatch[3]) : null;
      const authors = [];
      $el.find('.authorName span[itemprop="name"]').each((_, auth)=>{
        const authorName = $(auth).text().trim();
        if (authorName) authors.push(authorName);
      });
      let coverImage = $el.find('img.bookCover').attr('src') || null;
      if (coverImage?.includes("nophoto")) {
        coverImage = null;
      }
      const ratingText = $el.find('span.minirating').text().trim();
      const ratingMatch = ratingText.match(/(\d+\.\d+) avg rating/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
      const ratingsCountMatch = ratingText.match(/—\s+([\d,]+) ratings/);
      const ratingsCount = ratingsCountMatch ? parseInt(ratingsCountMatch[1].replace(/,/g, ''), 10) : null;
      const publicationText = $el.find('.greyText.smallText.uitext').text();
      const publicationYearMatch = publicationText.match(/published\s+(\d{4})/);
      const publicationDate = publicationYearMatch ? `${publicationYearMatch[1]}-01-01` : null;
      const editionText = $el.find('a.greyText[rel="nofollow"]').text();
      const editionMatch = editionText.match(/(\d+) editions/);
      const editionCount = editionMatch ? parseInt(editionMatch[1], 10) : null;
      bookList.push({
        api_id: bookUrl,
        api_source: 'goodreads',
        bookUrl,
        cover_image_url: coverImage,
        title,
        publication_date: publicationDate,
        rating,
        source: 'api',
        epub_url: "",
        metadata: {
          goodreads_id: bookUrl,
          edition_count: editionCount,
          ratings_count: ratingsCount,
          series,
          series_number: seriesNumber,
          authors
        }
      });
    } catch (error) {
      console.error('Error parsing book element:', error);
    }
  });
  return bookList;
}
function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^\w\s]/g, '').trim();
}
function generateBookKey(book) {
  const normalizedTitle = normalizeString(book.title);
  const authors = book.metadata?.authors || [];
  const normalizedAuthor = authors.length > 0 ? normalizeString(authors[0]) : '';
  return `${normalizedTitle}::${normalizedAuthor}`;
}
function deduplicateBooks(books) {
  const bookMap = new Map();
  for (const book of books){
    const key = generateBookKey(book);
    const existing = bookMap.get(key);
    if (!existing) {
      bookMap.set(key, book);
    } else {
      const existingScore = (existing.rating ? 1 : 0) + (existing.cover_image_url ? 1 : 0);
      const newScore = (book.rating ? 1 : 0) + (book.cover_image_url ? 1 : 0);
      if (newScore > existingScore) {
        bookMap.set(key, book);
      }
    }
  }
  return Array.from(bookMap.values());
}
function transformGoogleBookForList(googleBook) {
  const volumeInfo = googleBook.volumeInfo || {};
  let coverImageUrl = null;
  if (volumeInfo.imageLinks) {
    coverImageUrl = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail;
    if (coverImageUrl && coverImageUrl.startsWith('http:')) {
      coverImageUrl = coverImageUrl.replace('http:', 'https:');
    }
  }
  let publicationDate = null;
  if (volumeInfo.publishedDate) {
    try {
      const dateStr = volumeInfo.publishedDate;
      if (dateStr.length === 4) {
        publicationDate = `${dateStr}-01-01`;
      } else if (dateStr.length === 7) {
        publicationDate = `${dateStr}-01`;
      } else {
        publicationDate = dateStr;
      }
    } catch (e) {
      publicationDate = null;
    }
  }
  return {
    api_id: googleBook.id,
    api_source: 'google_books',
    bookUrl: googleBook.id,
    cover_image_url: coverImageUrl,
    title: volumeInfo.title || '',
    publication_date: publicationDate,
    rating: volumeInfo.averageRating || null,
    source: 'api',
    epub_url: '',
    metadata: {
      google_volume_id: googleBook.id,
      authors: volumeInfo.authors || [],
      ratings_count: volumeInfo.ratingsCount || null,
      publisher: volumeInfo.publisher || null,
      categories: volumeInfo.categories || []
    }
  };
}
async function searchGoogleBooks(query, logger) {
  const googleApiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');
  if (!googleApiKey) {
    logger.log('Google Books API key not configured, skipping Google Books search');
    return [];
  }
  const startTime = performance.now();
  logger.log(`Searching Google Books for: "${query}"`);
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=30&key=${googleApiKey}`;
    const response = await axiod.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.data?.items || response.data.items.length === 0) {
      logger.log('No results from Google Books');
      return [];
    }
    const books = response.data.items.map(transformGoogleBookForList);
    logger.log(`Google Books search completed in ${(performance.now() - startTime).toFixed(2)}ms, found ${books.length} books`);
    return books;
  } catch (error) {
    logger.error('Google Books API error:', error.message);
    return [];
  }
}
