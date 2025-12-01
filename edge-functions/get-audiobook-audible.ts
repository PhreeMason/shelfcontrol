import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { corsHeaders, Logger, sanitizeSearchQuery, userAgent } from './utils.ts';

interface AudibleAudiobookData {
  asin: string | null;
  title: string | null;
  author: string | null;
  narrator: string | null;
  duration_ms: number | null;
  cover_url: string | null;
}

/**
 * Parse duration string from Audible format to milliseconds
 * Examples: "13 hrs and 31 mins", "1 hr and 5 mins", "45 mins"
 */
function parseDuration(durationText: string): number | null {
  if (!durationText) return null;

  // Match patterns like "13 hrs and 31 mins", "1 hr and 5 mins", "45 mins"
  const hoursMatch = durationText.match(/(\d+)\s*hrs?/i);
  const minutesMatch = durationText.match(/(\d+)\s*mins?/i);

  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

  if (hours === 0 && minutes === 0) return null;

  // Convert to milliseconds
  return (hours * 60 + minutes) * 60 * 1000;
}

/**
 * Scrape Audible search results for audiobook data
 */
async function scrapeAudible(
  title: string,
  author: string | undefined,
  logger: Logger
): Promise<AudibleAudiobookData | null> {
  const searchQuery = sanitizeSearchQuery(`${title} ${author || ''}`);
  const searchUrl = `https://www.audible.com/search?keywords=${encodeURIComponent(searchQuery)}`;

  logger.log(`Scraping Audible for: "${searchQuery}"`);
  logger.log(`URL: ${searchUrl}`);

  try {
    const response = await axiod.get(searchUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000,
    });

    if (!response?.data) {
      logger.log('No response from Audible');
      return null;
    }

    const $ = cheerio.load(response.data);

    // Find the first product result
    // Audible uses various selectors - try multiple approaches
    const productSelectors = [
      'li.productListItem',
      '.product-list-flyout-container li',
      '[data-testid="product-list-item"]',
      '.bc-list-item',
    ];

    let $product: cheerio.Cheerio | null = null;
    for (const selector of productSelectors) {
      const found = $(selector).first();
      if (found.length > 0) {
        $product = found;
        logger.log(`Found product using selector: ${selector}`);
        break;
      }
    }

    if (!$product || $product.length === 0) {
      logger.log('No products found on Audible search results');
      // Log some page info for debugging
      const pageTitle = $('title').text();
      logger.log(`Page title: ${pageTitle}`);
      return null;
    }

    // Extract ASIN from product link
    // URL pattern: /pd/Title-Slug/B08V8B2CGV
    let asin: string | null = null;
    const productLink = $product.find('a[href*="/pd/"]').attr('href');
    if (productLink) {
      const asinMatch = productLink.match(/\/pd\/[^/]+\/([A-Z0-9]{10})/);
      asin = asinMatch ? asinMatch[1] : null;
      logger.log(`Found ASIN: ${asin}`);
    }

    // Extract title
    const titleSelectors = [
      'h3.bc-heading a',
      '.bc-heading a',
      'a.bc-link[href*="/pd/"]',
      '.productListItem h3',
    ];
    let extractedTitle: string | null = null;
    for (const selector of titleSelectors) {
      const text = $product.find(selector).first().text().trim();
      if (text) {
        extractedTitle = text;
        break;
      }
    }
    logger.log(`Extracted title: ${extractedTitle}`);

    // Extract author (look for "By:" or "Written by:")
    const authorSelectors = [
      '.authorLabel a',
      '.bc-list-item:contains("By:") a',
      '.bc-list-item:contains("Written by:") a',
      'li.authorLabel a',
    ];
    let extractedAuthor: string | null = null;
    for (const selector of authorSelectors) {
      const text = $product.find(selector).first().text().trim();
      if (text) {
        extractedAuthor = text;
        break;
      }
    }
    logger.log(`Extracted author: ${extractedAuthor}`);

    // Extract narrator (look for "Narrated by:")
    const narratorSelectors = [
      '.narratorLabel a',
      '.bc-list-item:contains("Narrated by:") a',
      'li.narratorLabel a',
    ];
    let extractedNarrator: string | null = null;
    for (const selector of narratorSelectors) {
      const text = $product.find(selector).first().text().trim();
      if (text) {
        extractedNarrator = text;
        break;
      }
    }
    logger.log(`Extracted narrator: ${extractedNarrator}`);

    // Extract duration (look for "Length:" or runtime info)
    const runtimeSelectors = [
      '.runtimeLabel',
      '.bc-list-item:contains("Length:")',
      'li.runtimeLabel',
      '[class*="runtime"]',
    ];
    let durationMs: number | null = null;
    for (const selector of runtimeSelectors) {
      const text = $product.find(selector).first().text().trim();
      if (text) {
        logger.log(`Found runtime text: ${text}`);
        durationMs = parseDuration(text);
        if (durationMs) break;
      }
    }
    logger.log(`Extracted duration_ms: ${durationMs}`);

    // Extract cover image
    const coverSelectors = [
      'img.bc-pub-block',
      '.bc-image-inset-border img',
      'img[src*="images-amazon"]',
    ];
    let coverUrl: string | null = null;
    for (const selector of coverSelectors) {
      const src = $product.find(selector).first().attr('src');
      if (src && !src.includes('no-image')) {
        coverUrl = src;
        break;
      }
    }
    logger.log(`Extracted cover_url: ${coverUrl ? 'found' : 'not found'}`);

    // Only return if we found meaningful data (at minimum, duration)
    if (!durationMs) {
      logger.log('Could not extract duration from Audible result');
      return null;
    }

    return {
      asin,
      title: extractedTitle,
      author: extractedAuthor,
      narrator: extractedNarrator,
      duration_ms: durationMs,
      cover_url: coverUrl,
    };
  } catch (error) {
    logger.error('Audible scraping error:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

Deno.serve(async (req) => {
  const logger = new Logger();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, author } = await req.json();

    if (!title || typeof title !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Title is required',
          logs: logger.getLogs(),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    logger.log(`Audible lookup for: "${title}" by "${author || 'unknown'}"`);

    const audiobookData = await scrapeAudible(title, author, logger);

    if (audiobookData) {
      logger.log('Audible lookup successful');
      return new Response(
        JSON.stringify({
          success: true,
          source: 'audible',
          data: audiobookData,
          logs: logger.getLogs(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    logger.log('No audiobook found on Audible');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No audiobook found',
        logs: logger.getLogs(),
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('get-audiobook-audible error:', message);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        logs: logger.getLogs(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
