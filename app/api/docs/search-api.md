# Search API Documentation

The Search API provides endpoints to search across creators, projects, and media (images and videos) in the platform.

## Endpoints

### Search Creators

Search for creator profiles and their content.

- **URL:** `/api/search/creators`
- **Method:** `GET`
- **Authentication:** Optional
- **Query Parameters:**
  - `q` (required): Search query
  - `limit` (optional): Maximum number of results to return (default: 5)
  - `page` (optional): Page number for pagination (default: 1)
  - `contentType` (optional): Filter by content type - `all`, `videos`, or `images` (default: `all`)

**Example Request:**
```
GET /api/search/creators?q=portrait%20photography&limit=3
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "profile": {
          "id": "c7b2a5e1-d234-4f9a-b451-dc9fa3819bcd",
          "username": "portraitmasters",
          "bio": "Professional portrait photographer with 10+ years of experience",
          "primary_role": "Photographer"
        },
        "projects": [
          {
            "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
            "title": "Urban Portrait Series",
            "description": "A collection of urban portraits",
            "images": [
              {
                "id": "img123",
                "url": "https://example.com/image1.jpg",
                "score": 0.87
              }
            ],
            "videos": []
          }
        ],
        "score": 0.92
      }
    ],
    "page": 1,
    "limit": 3,
    "total": 1,
    "query": "portrait photography",
    "content_type": "all",
    "processed_query": "portrait photography"
  }
}
```

### Search Projects

Search for projects across all creators.

- **URL:** `/api/search/projects`
- **Method:** `GET`
- **Authentication:** Optional
- **Query Parameters:**
  - `q` (required): Search query
  - `limit` (optional): Maximum number of results to return (default: 10)
  - `page` (optional): Page number for pagination (default: 1)
  - `contentType` (optional): Filter by content type - `all`, `videos`, or `images` (default: `all`)

**Example Request:**
```
GET /api/search/projects?q=landscape&limit=2
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
        "title": "Mountain Landscapes",
        "description": "Breathtaking mountain vistas from around the world",
        "images": [
          {
            "id": "img456",
            "url": "https://example.com/mountains1.jpg",
            "score": 0.89
          }
        ],
        "videos": [],
        "creator": {
          "id": "c7b2a5e1-d234-4f9a-b451-dc9fa3819bcd",
          "username": "naturephoto"
        }
      }
    ],
    "page": 1,
    "limit": 2,
    "total": 1,
    "query": "landscape",
    "content_type": "all",
    "processed_query": "landscape"
  }
}
```

### Search Media

Search for media (images and videos) across all projects and creators.

- **URL:** `/api/search/media`
- **Method:** `GET`
- **Authentication:** Optional
- **Query Parameters:**
  - `q` (required): Search query
  - `limit` (optional): Maximum number of results to return (default: 20)
  - `page` (optional): Page number for pagination (default: 1)
  - `contentType` (optional): Filter by content type - `all`, `videos`, or `images` (default: `all`)

**Example Request:**
```
GET /api/search/media?q=sunset&contentType=images
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "img789",
        "type": "image",
        "url": "https://example.com/sunset1.jpg",
        "alt_text": "Sunset over the ocean",
        "project_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
        "project_title": "Ocean Sunsets",
        "creator_id": "c7b2a5e1-d234-4f9a-b451-dc9fa3819bcd",
        "creator_username": "oceanviews",
        "score": 0.94
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1,
    "query": "sunset",
    "content_type": "images",
    "processed_query": "sunset"
  }
}
```

## Error Responses

In case of errors, the API returns a standard error response:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Search query is required"
  }
}
```

Common error codes:
- `INVALID_INPUT`: Missing or invalid query parameters
- `SERVER_ERROR`: Internal server error

## Notes

- Search is powered by semantic embeddings, allowing for meaningful search beyond exact keyword matching
- Results are ranked by relevance (score)
- Authentication is optional for search endpoints, but some content may be filtered based on visibility settings
- Performance may be improved by using more specific content type filters 