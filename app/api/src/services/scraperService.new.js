const logger = require("../config/logger").default;

/**
 * Base scraper class with common functionality
 */
class BaseScraper {
  constructor(url) {
    this.url = url;
    this.browser = null;
    this.page = null;
  }
  /**
   * Initialize the browser and page
   */
  async initialize() {
    logger.debug("Launching headless browser");

    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      // Import dependencies for production (Vercel)
      try {
        const puppeteerCore = require("puppeteer-core");
        const chromium = require("@sparticuz/chromium");
        
        this.browser = await puppeteerCore.launch({
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          defaultViewport: chromium.defaultViewport,
          headless: true,
          ignoreHTTPSErrors: true,
        });
      } catch (error) {
        logger.error(`Error launching browser in production: ${error.message}`);
        throw error;
      }
    } else {
      // Import for local development
      try {
        const puppeteer = require("puppeteer");
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
          ],
        });
      } catch (error) {
        logger.error(
          `Error launching browser in development: ${error.message}`
        );
        throw error;
      }
    }

    this.page = await this.browser.newPage();

    // Set a reasonable viewport size
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Set user agent to avoid bot detection
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
  }

  /**
   * Navigate to the URL with fallback
   */
  async navigateTo() {
    logger.debug(`Navigating to ${this.url}`);
    try {
      await this.page.goto(this.url, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });
    } catch (navigationError) {
      logger.warn(`Navigation error: ${navigationError.message}`);
      // If it's a timeout error, try again with a more lenient condition
      if (navigationError.name === "TimeoutError") {
        logger.debug("Retrying navigation with more lenient condition");
        await this.page.goto(this.url, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
      } else {
        throw navigationError;
      }
    }

    // Wait for a specific selector to ensure dynamic content has loaded
    try {
      await this.page.waitForSelector(".some-dynamic-content-selector", {
        timeout: 5000,
      });
    } catch (error) {
      logger.warn("Dynamic content selector not found within timeout.");
    }
  }
}

// Rest of your file...