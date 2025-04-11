const puppeteer = require("puppeteer");
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
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

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
          waitUntil: "networkidle2",
          timeout: 30000,
        });
      } else {
        throw navigationError;
      }
    }

    // Wait for some time to ensure dynamic content loads
    await this.page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 3000))
    );
  }

  /**
   * Helper function to scroll down the page to ensure all lazy-loaded content is loaded
   */
  async autoScroll() {
    try {
      await this.page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const maxScrollAttempts = 100; // Limit the maximum scroll attempts
          let scrollAttempt = 0;

          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            scrollAttempt++;

            if (
              totalHeight >= scrollHeight ||
              scrollAttempt >= maxScrollAttempts
            ) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });

      // Wait a bit after scrolling to allow for images to load
      await this.page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 2000))
      );
    } catch (error) {
      // Handle execution context errors gracefully
      logger.warn(`Error during page scrolling: ${error.message}`);
      // Don't throw the error - allow scraping to continue with what we have
    }
  }

  /**
   * Extract basic images from the page
   */
  async extractImages() {
    try {
      const images = await this.page.evaluate(() => {
        const imgElements = Array.from(document.querySelectorAll("img"));

        // Filter out very small images (likely icons, avatars, etc.)
        const filteredImgs = imgElements.filter((img) => {
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;

          // Keep images that:
          // 1. Are reasonably large OR
          // 2. Don't have size info yet but might be important
          return (width > 200 && height > 200) || (!width && !height);
        });

        // Extract data from the remaining images
        return filteredImgs.map((img) => {
          // Get the best available source - many sites use data attributes for high-res versions
          const srcset = img.srcset;
          let bestSrc = img.src;

          // Handle srcset if available
          if (srcset) {
            const srcSetParts = srcset.split(",");
            // Get the last (usually highest resolution) image from srcset
            if (srcSetParts.length > 0) {
              const lastSrcSet = srcSetParts[srcSetParts.length - 1]
                .trim()
                .split(" ")[0];
              if (lastSrcSet) bestSrc = lastSrcSet;
            }
          }

          // Try various data attributes that might contain better quality images
          const dataSrc =
            img.getAttribute("data-src") ||
            img.getAttribute("data-original") ||
            img.getAttribute("data-lazy-src") ||
            img.getAttribute("data-hi-res-src") ||
            img.getAttribute("data-image") ||
            img.getAttribute("data-full-src");

          if (dataSrc && dataSrc.includes("http")) {
            bestSrc = dataSrc;
          }

          return {
            url: bestSrc,
            alt: img.alt || undefined,
            width: img.naturalWidth || img.width || undefined,
            height: img.naturalHeight || img.height || undefined,
          };
        });
      });

      // Filter out duplicate URLs and non-HTTP URLs
      const uniqueUrls = new Set();
      return images.filter((image) => {
        if (!image.url || !image.url.startsWith("http")) return false;
        if (uniqueUrls.has(image.url)) return false;
        uniqueUrls.add(image.url);
        return true;
      });
    } catch (error) {
      logger.warn(`Error extracting images: ${error.message}`);
      return []; // Return empty array if extraction fails
    }
  }

  /**
   * Close the browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * Main scrape method to be overridden by platform-specific scrapers
   */
  async scrape() {
    throw new Error("Method 'scrape()' must be implemented by subclass");
  }
}

/**
 * Behance-specific scraper implementation
 */
class BehanceScraper extends BaseScraper {
  constructor(url) {
    super(url);
  }

  /**
   * Handle Behance-specific initial page handling
   */
  async handlePageSpecifics() {
    // Try to accept cookies if the dialog is present
    try {
      const cookieButton = await this.page.$(
        '[data-testid="PrivacyBanner-acceptAllButton"]'
      );
      if (cookieButton) {
        await cookieButton.click();
        await this.page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 1000))
        );
      }
    } catch (e) {
      logger.debug("No cookie banner found or error handling it:", e);
    }

    // Behance sometimes shows a signup modal
    try {
      const closeModalButton = await this.page.$("button.js-close-modal");
      if (closeModalButton) {
        await closeModalButton.click();
        await this.page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 1000))
        );
      }
    } catch (e) {
      logger.debug("No modal found or error handling it:", e);
    }
  }

  /**
   * Extract Behance-specific project images from modules with specific aria-label
   */
  async extractBehanceImages() {
    try {
      return await this.page.evaluate(() => {
        // Look for elements with aria-label="Project Module (a number)"
        const moduleElements = Array.from(
          document.querySelectorAll('[aria-label^="Project Module"]')
        );
        const images = [];

        // Extract images from these specific modules
        moduleElements.forEach((module) => {
          // Find images within this module
          const imgElements = module.querySelectorAll("img");

          imgElements.forEach((img) => {
            const srcset = img.srcset;
            let bestSrc = img.src;

            // Handle srcset if available
            if (srcset) {
              const srcSetParts = srcset.split(",");
              // Get the last (usually highest resolution) image from srcset
              if (srcSetParts.length > 0) {
                const lastSrcSet = srcSetParts[srcSetParts.length - 1]
                  .trim()
                  .split(" ")[0];
                if (lastSrcSet) bestSrc = lastSrcSet;
              }
            }

            // Try various data attributes that might contain better quality images
            const dataSrc =
              img.getAttribute("data-src") ||
              img.getAttribute("data-original") ||
              img.getAttribute("data-lazy-src") ||
              img.getAttribute("data-hi-res-src") ||
              img.getAttribute("data-image") ||
              img.getAttribute("data-full-src");

            if (dataSrc && dataSrc.includes("http")) {
              bestSrc = dataSrc;
            }

            // Only add if we have a valid URL
            if (bestSrc && bestSrc.startsWith("http")) {
              images.push({
                url: bestSrc,
                alt: img.alt || undefined,
                width: img.naturalWidth || img.width || undefined,
                height: img.naturalHeight || img.height || undefined,
                module: module.getAttribute("aria-label") || undefined,
              });
            }
          });
        });

        // Also try to extract from project data in scripts if available
        const scripts = Array.from(document.querySelectorAll("script"));
        let projectData = null;

        // Try to find the script containing project data
        for (const script of scripts) {
          const content = script.textContent || "";
          // Look for patterns that indicate project data
          if (
            content.includes('"project":') &&
            content.includes('"modules":')
          ) {
            try {
              // Try to extract the JSON object
              const jsonMatch = content.match(/\{.*"project":.*"modules":.*\}/);
              if (jsonMatch) {
                projectData = JSON.parse(jsonMatch[0]);
                break;
              }
            } catch (e) {
              // Continue to next script if parsing fails
              continue;
            }
          }
        }

        // If we found project data, extract images from modules
        if (projectData && projectData.project && projectData.project.modules) {
          const moduleImages = projectData.project.modules
            .filter((module) => module.type === "image" && module.src)
            .map((module) => ({
              url: module.src,
              width: module.width || undefined,
              height: module.height || undefined,
              alt: module.alt || undefined,
              module: `Project Module ${module.id || ""}`,
            }));

          images.push(...moduleImages);
        }

        return images;
      });
    } catch (behanceError) {
      logger.warn(`Error extracting Behance images: ${behanceError.message}`);
      return [];
    }
  }

  /**
   * Extract video platform and ID from URL
   */
  extractVideoInfo(url) {
    if (!url) return { platform: null, videoId: null };

    // Normalize URL
    url = url.trim();

    // Check for Vimeo
    const vimeoPatterns = [
      /vimeo\.com\/(\d+)/, // Standard URL
      /vimeo\.com\/channels\/[^\/]+\/(\d+)/, // Channel URL
      /vimeo\.com\/groups\/[^\/]+\/videos\/(\d+)/, // Group URL
      /player\.vimeo\.com\/video\/(\d+)/, // Embedded player URL
    ];

    for (const pattern of vimeoPatterns) {
      const match = url.match(pattern);
      if (match) {
        return { platform: "vimeo", videoId: match[1] };
      }
    }

    // Check for YouTube
    const youtubePatterns = [
      /youtube\.com\/watch\?v=([^&]+)/, // Standard URL
      /youtu\.be\/([^?]+)/, // Short URL
      /youtube\.com\/embed\/([^?\/]+)/, // Embedded player URL
      /youtube\.com\/v\/([^?\/]+)/, // Old API URL
    ];

    for (const pattern of youtubePatterns) {
      const match = url.match(pattern);
      if (match) {
        return { platform: "youtube", videoId: match[1] };
      }
    }

    // Not recognized or invalid
    return { platform: null, videoId: null };
  }

  /**
   * Extract videos from Behance project
   */
  async extractBehanceVideos() {
    try {
      return await this.page.evaluate(() => {
        const videos = [];

        // Look for iframes (potential embedded videos)
        const iframes = Array.from(document.querySelectorAll("iframe"));
        iframes.forEach((iframe) => {
          const src = iframe.getAttribute("src");
          if (
            src &&
            (src.includes("vimeo.com") ||
              src.includes("youtube.com") ||
              src.includes("youtu.be"))
          ) {
            videos.push({ url: src });
          }
        });

        // Look for direct video elements
        const videoElements = Array.from(document.querySelectorAll("video"));
        videoElements.forEach((video) => {
          const src = video.getAttribute("src");
          if (src) {
            videos.push({ url: src });
          }
        });

        // Look for video links
        const videoLinks = Array.from(
          document.querySelectorAll(
            'a[href*="vimeo.com"], a[href*="youtube.com"], a[href*="youtu.be"]'
          )
        );
        videoLinks.forEach((link) => {
          const href = link.getAttribute("href");
          if (href) {
            videos.push({ url: href });
          }
        });

        return videos;
      });
    } catch (error) {
      logger.warn(`Error extracting Behance videos: ${error.message}`);
      return [];
    }
  }

  /**
   * Implement the scrape method for Behance
   */
  async scrape() {
    try {
      await this.initialize();
      await this.navigateTo();

      // Handle Behance-specific page elements
      await this.handlePageSpecifics();

      // Scroll to load lazy content
      logger.debug("Scrolling to load lazy content");
      await this.autoScroll();

      // Extract Behance-specific images (only those with the specified aria-label)
      const behanceImages = await this.extractBehanceImages();

      // Extract videos from Behance
      const behanceVideoElements = await this.extractBehanceVideos();

      // Process video elements to extract platform and ID
      const behanceVideos = [];
      for (const videoElement of behanceVideoElements) {
        const { platform, videoId } = this.extractVideoInfo(videoElement.url);
        if (platform && videoId) {
          behanceVideos.push({
            url: videoElement.url,
            platform,
            videoId,
          });
        }
      }

      // Remove duplicate videos based on platform and videoId
      const uniqueVideos = [];
      const videoKeys = new Set();
      behanceVideos.forEach((video) => {
        const key = `${video.platform}_${video.videoId}`;
        if (!videoKeys.has(key)) {
          videoKeys.add(key);
          uniqueVideos.push(video);
        }
      });

      logger.info(`Found ${uniqueVideos.length} unique videos`);

      // Filter out duplicate images
      const uniqueImageUrls = new Set();
      const filteredImages = behanceImages.filter((image) => {
        if (!image.url || !image.url.startsWith("http")) return false;
        if (uniqueImageUrls.has(image.url)) return false;
        uniqueImageUrls.add(image.url);
        return true;
      });

      // Format images for project media upload
      const formattedImages = filteredImages.map((image, index) => ({
        url: image.url,
        alt_text: image.alt || "",
        type: "image",
        order: index,
      }));

      // Format videos for project media upload
      const formattedVideos = uniqueVideos.map((video, index) => ({
        url: video.url,
        type: "video",
        [`${video.platform}_id`]: video.videoId,
        order: formattedImages.length + index,
      }));

      // Combine all media items
      const allMedia = [...formattedImages, ...formattedVideos];

      logger.info(
        `Scraped ${formattedImages.length} images and ${formattedVideos.length} videos from ${this.url}`
      );

      // Return data directly without wrapping it
      return {
        source_url: this.url,
        media: allMedia,
        total: allMedia.length,
      };
    } finally {
      await this.close();
    }
  }
}

/**
 * Dribbble-specific scraper implementation
 */
class DribbbleScraper extends BaseScraper {
  constructor(url) {
    super(url);
  }

  /**
   * Handle Dribbble-specific initial page handling
   */
  async handlePageSpecifics() {
    // Try to handle cookie consent if present
    try {
      const cookieButton = await this.page.$(
        "button#onetrust-accept-btn-handler"
      );
      if (cookieButton) {
        await cookieButton.click();
        await this.page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 1000))
        );
      }
    } catch (e) {
      logger.debug("No cookie banner found or error handling it:", e);
    }

    // Handle any modals or pop-ups specific to Dribbble
    try {
      const closeModalButtons = await this.page.$$("button.close-button");
      for (const button of closeModalButtons) {
        await button.click();
        await this.page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 500))
        );
      }
    } catch (e) {
      logger.debug("No modal found or error handling it:", e);
    }
  }

  /**
   * Extract Dribbble-specific images from the page data
   */
  async extractDribbbleImages() {
    try {
      return await this.page.evaluate(() => {
        // Look for high-quality images in the page
        const shots = document.querySelectorAll(".shot-media-container");
        const images = [];

        shots.forEach((shot) => {
          // Check for high-res images in the data attributes
          const mediaImage = shot.querySelector(".media-shot");
          if (mediaImage) {
            const srcset = mediaImage.getAttribute("srcset");
            const src = mediaImage.getAttribute("src");
            const dataSrc = mediaImage.getAttribute("data-src");

            let bestUrl = src;

            // Try to get the highest resolution from srcset
            if (srcset) {
              const srcSetParts = srcset.split(",");
              // Get the last (usually highest resolution) image from srcset
              if (srcSetParts.length > 0) {
                const lastSrcSet = srcSetParts[srcSetParts.length - 1]
                  .trim()
                  .split(" ")[0];
                if (lastSrcSet) bestUrl = lastSrcSet;
              }
            }

            // Use data-src if available
            if (dataSrc && dataSrc.includes("http")) {
              bestUrl = dataSrc;
            }

            if (bestUrl && bestUrl.startsWith("http")) {
              images.push({
                url: bestUrl,
                alt: mediaImage.alt || undefined,
                width: mediaImage.naturalWidth || mediaImage.width || undefined,
                height:
                  mediaImage.naturalHeight || mediaImage.height || undefined,
              });
            }
          }
        });

        // Also look for image data in any script tags
        const scripts = Array.from(
          document.querySelectorAll("script[type='application/ld+json']")
        );
        scripts.forEach((script) => {
          try {
            if (script.textContent) {
              const data = JSON.parse(script.textContent);
              // Look for image data in schema.org markup
              if (data && data.image) {
                const imageUrl =
                  typeof data.image === "string"
                    ? data.image
                    : data.image.url || data.image[0]?.url;

                if (imageUrl && imageUrl.startsWith("http")) {
                  images.push({
                    url: imageUrl,
                    alt: data.name || undefined,
                  });
                }
              }
            }
          } catch (e) {
            // Continue if JSON parsing fails
          }
        });

        return images;
      });
    } catch (dribbbleError) {
      logger.warn(`Error extracting Dribbble images: ${dribbbleError.message}`);
      return [];
    }
  }

  /**
   * Implement the scrape method for Dribbble
   */
  async scrape() {
    try {
      await this.initialize();
      await this.navigateTo();

      // Handle Dribbble-specific page elements
      await this.handlePageSpecifics();

      // Scroll to load lazy content
      logger.debug("Scrolling to load lazy content");
      await this.autoScroll();

      // Extract both regular and Dribbble-specific images
      const regularImages = await this.extractImages();
      const dribbbleImages = await this.extractDribbbleImages();

      // Combine and deduplicate
      const allImages = [...regularImages, ...dribbbleImages];
      const uniqueUrls = new Set();
      const filteredImages = allImages.filter((image) => {
        if (!image.url || !image.url.startsWith("http")) return false;
        if (uniqueUrls.has(image.url)) return false;
        uniqueUrls.add(image.url);
        return true;
      });

      // Format data for project media upload
      const formattedMedia = filteredImages.map((image, index) => ({
        url: image.url,
        alt_text: image.alt || "",
        type: "image",
        order: index,
      }));

      logger.info(`Scraped ${formattedMedia.length} images from ${this.url}`);

      // Return data directly without wrapping it
      return {
        source_url: this.url,
        media: formattedMedia,
        total: formattedMedia.length,
      };
    } finally {
      await this.close();
    }
  }
}

/**
 * Factory function to create the appropriate scraper based on URL
 */
function createScraper(url) {
  if (url.includes("behance.net")) {
    return new BehanceScraper(url);
  } else if (url.includes("dribbble.com")) {
    return new DribbbleScraper(url);
  } else {
    // For unknown sites, use the most basic scraper implementation
    // This could be extended with a GenericScraper class if needed
    return new BehanceScraper(url); // Using BehanceScraper as a base for now
  }
}

module.exports = {
  createScraper,
  BaseScraper,
  BehanceScraper,
  DribbbleScraper,
};
