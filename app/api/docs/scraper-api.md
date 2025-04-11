# Scraper API Documentation

The Scraper API provides endpoints for extracting media (images and videos) from external portfolio websites like Behance and Dribbble. This API allows users to import content directly from these platforms into their projects.

## Endpoints

### Scrape Media from External URL

Extracts all media (images and videos) from a supported external website URL.

- **URL**: `/api/scraper/extract`
- **Method**: `POST`
- **Auth Required**: Yes
- **Content-Type**: `application/json`
- **Body Parameters**:
  - `url` (required): The external URL to scrape (e.g., Behance project URL, Dribbble shot URL)
  - `project_id` (optional): UUID of an existing project to associate the scraped media with
  - `auto_import` (optional): Boolean flag to automatically import the media into the specified project (default: false)

**Request Example**:

```json
{
  "url": "https://www.behance.net/gallery/162655239/Semplice-2023-Re-Design",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "auto_import": false
}
```

**Response Example**:

```json
{
  "success": true,
  "data": {
    "source_url": "https://www.behance.net/gallery/162655239/Semplice-2023-Re-Design",
    "media": [
      {
        "url": "https://mir-s3-cdn-cf.behance.net/project_modules/max_3840/92ac2b162655239.63d9430117a46.jpeg",
        "alt_text": "Figma homepage landing page ui design",
        "type": "image",
        "order": 0
      },
      {
        "url": "https://youtube.com/watch?v=WW62RWXMlTc",
        "type": "video",
        "youtube_id": "WW62RWXMlTc",
        "order": 1
      },
      {
        "url": "https://vimeo.com/574449348",
        "type": "video",
        "vimeo_id": "574449348",
        "order": 2
      }
    ],
    "total": 3
  }
}
```

## Supported Platforms

The Scraper API currently supports the following platforms:

### Behance

- Project pages (`behance.net/gallery/...`)
- User portfolio pages (partial support)

### Dribbble

- Shot pages (`dribbble.com/shots/...`)
- User portfolio pages (partial support)

## Media Types

The scraper extracts the following types of media:

### Images

- JPG/JPEG
- PNG
- GIF
- Other web-supported image formats

### Videos

- YouTube embeds (extracted as `youtube_id`)
- Vimeo embeds (extracted as `vimeo_id`)
- Direct video elements (when available)

## Notes

1. **Authentication**: All scraper endpoints require authentication. Users can only import media into their own projects.

2. **Rate Limiting**: To prevent abuse, scraper requests are rate-limited to 10 requests per hour per user.

3. **Media Processing**: When importing media, the system:

   - Downloads and stores images in the user's storage bucket
   - Creates appropriate database entries with metadata
   - For videos, stores only the reference (YouTube ID or Vimeo ID) without downloading the actual video

4. **Copyright Considerations**: Users are responsible for ensuring they have the right to use any media they import. The API is intended for importing users' own content from these platforms.

5. **Limitations**: The scraper may not be able to extract all media in some cases, especially for:
   - Dynamically loaded content that appears after user interaction
   - Content protected by login walls
   - Content using non-standard embedding techniques
