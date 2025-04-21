// src/services/scraperService.d.ts
export class BaseScraper {
  constructor(url: string);
  url: string;
  browser: any;
  page: any;
  initialize(): Promise<void>;
  navigateTo(): Promise<void>;
  autoScroll(): Promise<void>;
  extractImages(): Promise<any[]>;
  close(): Promise<void>;
  scrape(): Promise<any>;
}

export class BehanceScraper extends BaseScraper {
  constructor(url: string);
  handlePageSpecifics(): Promise<void>;
  extractBehanceImages(): Promise<any[]>;
  extractVideoInfo(url: string): {
    platform: string | null;
    videoId: string | null;
  };
  extractBehanceVideos(): Promise<any[]>;
  scrape(): Promise<{
    source_url: string;
    media: any[];
    total: number;
  }>;
}

export class DribbbleScraper extends BaseScraper {
  constructor(url: string);
  handlePageSpecifics(): Promise<void>;
  extractDribbbleImages(): Promise<any[]>;
  extractVideoInfo(url: string): {
    platform: string | null;
    videoId: string | null;
  };
  extractDribbbleVideos(): Promise<any[]>;
  scrape(): Promise<{
    source_url: string;
    media: any[];
    total: number;
  }>;
}

export interface ScrapedMedia {
  url: string;
  alt_text?: string;
  type: "image" | "video";
  order: number;
  youtube_id?: string;
  vimeo_id?: string;
}

export interface ScraperResult {
  source_url: string;
  media: ScrapedMedia[];
  total: number;
}

export function createScraper(url: string): BaseScraper;
