// THIS IS YOUR NEW scraper.ts FILE
import { ApifyClient } from "apify-client";

// --- This is the new Apify integration ---

// Initialize the Apify Client
const apifyClient = new ApifyClient({
  token: process.env.APIFY_TOKEN, // Pulls from Replit Secrets
});

if (!process.env.APIFY_TOKEN) {
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.error("APIFY_TOKEN secret is not set in Replit!");
  console.error("Please add your Apify token to Replit Secrets.");
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
}

// This is the JavaScript function we will "inject" into apify/web-scraper
// It's a "best-effort" scraper that tries to find common e-commerce elements.
// This will need to be customized for specific, difficult sites.
const universalPageFunction = `
  async function pageFunction(context) {
    const { $ } = context;

    // 1. Get Title
    const title = $('title').text().trim();

    // 2. Get Price & Currency
    // Tries to find price in common elements, then strips currency symbol
    let priceText = 
      $('[class*="price"], [id*="price"], [data-testid*="price"]')
        .not('span:only-child') // Exclude simple parent spans
        .first()
        .text()
        .trim();

    if (!priceText) {
      // Fallback for more complex price formats
      priceText = $('[class*="product-price"], [class*="Price-module"], [class*="price__value"]')
        .first()
        .text()
        .trim();
    }

    // Extract currency symbol ($, €, £, ¥) and number
    const currencyMatch = priceText.match(/[$\€\£\¥]/);
    const priceMatch = priceText.match(/[\\d,.]+/);

    const price = priceMatch ? priceMatch[0].replace(/,/g, '') : null;
    let currency = currencyMatch ? currencyMatch[0] : null;

    // Guess currency if not found
    if (!currency) {
      if (priceText.includes("USD")) currency = "USD";
      if (priceText.includes("EUR")) currency = "EUR";
      if (priceText.includes("GBP")) currency = "GBP";
      if (priceText.includes("CNY")) currency = "CNY";
    }

    // 3. Get Images
    // Get all images that look like product images and filter duplicates
    const images = [];
    $('img[src*="product"], img[id*="product"], img[class*="product"], img[data-testid*="product-image"]')
      .each((i, el) => {
        const src = $(el).attr('src');
        if (src && !images.includes(src)) {
          images.push(src);
        }
      });

    // 4. Get Sizes
    // Gets unique text from buttons or select options that look like sizes
    const sizes = [];
    $('select[id*="size"] option, button[class*="size"], [data-testid*="size-option"], .size-selector label')
      .each((i, el) => {
        const sizeText = $(el).text().trim();
        if (sizeText && sizeText.length < 10 && !sizes.includes(sizeText)) {
          sizes.push(sizeText);
        }
      });

    // 5. Get Colors
    const colors = [];
    $('[class*="color-swatch"], [class*="color-selector"] label, [data-testid*="color-swatch"]')
      .each((i, el) => {
        const name = $(el).attr('title') || $(el).attr('aria-label') || $(el).text().trim();
        const hex = $(el).css('background-color');
        if (name && !colors.find(c => c.name === name)) {
          colors.push({ name, hex });
        }
      });

    // 6. Get Stock Status
    // This is notoriously difficult. We'll look for "Out of Stock" text.
    const outOfStockText = $('[class*="out-of-stock"], [id*="out-of-stock"]').text().toLowerCase();
    const inStock = !outOfStockText.includes('out of stock');

    return {
      name: title,
      price: price,
      currency: currency || 'USD',
      images: images,
      colors: colors,
      sizes: sizes,
      inStock: inStock
    };
  }
`;

// --- Your existing interface. We will now return this! ---
export interface ScrapedData {
  name: string;
  price?: string;
  currency?: string;
  images: string[];
  colors?: { name: string; hex?: string; swatch?: string }[];
  sizes?: string[];
  inStock: boolean;
  storeName?: string;
  scraperType: string;
}

// --- This is the new, working scrapeUrl function ---
export async function scrapeUrl(url: string): Promise<ScrapedData> {
  if (!apifyClient) {
    throw new Error(
      "Apify client is not initialized. Check APIFY_TOKEN secret.",
    );
  }

  const hostname = new URL(url).hostname;
  const storeName = hostname.replace(/^www\./, "").split(".")[0];
  const platform = await detectPlatform(url);

  console.log(`Scraping ${url} using platform: ${platform}`);

  try {
    let rawData: any;

    if (platform === "shopify") {
      // --- Run the Shopify Scraper ---
      const actorRun = await apifyClient.actor("pocesar/shopify-scraper").call({
        start_urls: [{ url }],
        include_collections: false,
        max_products: 1, // We only want the one product from the URL
      });

      console.log("Shopify Actor run finished. Fetching results...");
      const { items } = await apifyClient
        .dataset(actorRun.defaultDatasetId)
        .listItems();

      rawData = items[0]; // Get the first (and only) product
    } else {
      // --- Run the Universal Web Scraper ---
      // We pass our 'pageFunction' to tell the scraper what data to get
      const actorRun = await apifyClient.actor("apify/web-scraper").call({
        startUrls: [{ url }],
        pageFunction: universalPageFunction,
        proxyConfiguration: { useApifyProxy: true }, // Use proxies to avoid blocks
      });

      console.log("Web Scraper Actor run finished. Fetching results...");
      const { items } = await apifyClient
        .dataset(actorRun.defaultDatasetId)
        .listItems();

      rawData = items[0];
    }

    if (!rawData) {
      throw new Error("Scraper returned no items.");
    }

    // --- Normalize the data ---
    // Convert the raw data from Apify into the ScrapedData format your app expects
    const scrapedData: ScrapedData = {
      name: rawData.name || rawData.title || `Product from ${storeName}`,
      price: rawData.price ? String(rawData.price) : undefined,
      currency: rawData.currency || "USD",
      images: rawData.images || [],
      colors: rawData.colors || [],
      sizes: rawData.sizes || [],
      inStock: rawData.inStock !== undefined ? rawData.inStock : true, // Default to in stock
      storeName: storeName.charAt(0).toUpperCase() + storeName.slice(1),
      scraperType: platform,
    };

    console.log("Scraping successful:", scrapedData.name);
    return scrapedData;
  } catch (error) {
    console.error("Failed to scrape URL with Apify:", error);
    throw new Error(
      `Failed to scrape URL: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

// --- This function is the same and is still needed ---
export async function detectPlatform(url: string): Promise<string> {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes("shopify") || hostname.includes("myshopify")) {
      return "shopify";
    }
    if (hostname.includes("zara")) {
      return "zara";
    }
    if (hostname.includes("hm.com") || hostname.includes("h&m")) {
      return "hm";
    }

    // For Zara, H&M, and others, we'll use the universal scraper
    return "universal";
  } catch (error) {
    return "universal";
  }
}
