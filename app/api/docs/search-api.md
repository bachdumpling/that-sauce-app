I'll update the documentation to reflect the new search implementation. Here's an updated version:

# Search API Documentation

The Search API provides endpoints to search across creators, projects, and media (images and videos) in the platform, leveraging AI-powered semantic search capabilities.

## Main Search Endpoint

The primary search endpoint that effectively combines all search functionality:

- **URL:** `/api/search`
- **Method:** `GET`
- **Authentication:** Optional
- **Query Parameters:**
  - `q` (required): Search query
  - `limit` (optional): Maximum number of results to return (default: 10)
  - `page` (optional): Page number for pagination (default: 1)
  - `contentType` (optional): Filter by content type - `all`, `videos`, or `images` (default: `all`)

**Example Request:**

```
GET /api/search?q=fashion%20photography&limit=5
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
          "username": "fashionphotographer",
          "bio": "Fashion photographer based in New York",
          "location": "New York, NY",
          "primary_role": ["Photographer", "Art Director"]
        },
        "score": 0.92,
        "content": [
          {
            "id": "img123",
            "type": "image",
            "url": "https://example.com/fashion1.jpg",
            "title": "Spring Collection",
            "score": 0.95,
            "project_id": "proj456",
            "project_title": "Fashion Week 2023"
          },
          {
            "id": "vid789",
            "type": "video",
            "url": "https://example.com/fashion-video.mp4",
            "title": "Behind the Scenes",
            "description": "Making of the Spring Collection photoshoot",
            "score": 0.89,
            "project_id": "proj456",
            "project_title": "Fashion Week 2023"
          }
        ]
      }
    ],
    "page": 1,
    "limit": 5,
    "total": 1,
    "query": "fashion photography",
    "content_type": "all",
    "processed_query": "fashion photography editorial"
  }
}
```

## Legacy Endpoints (Backward Compatibility)

The following endpoints are maintained for backward compatibility:

### Search Creators

- **URL:** `/api/search/creators`
- **Method:** `GET`
- **Parameters:** Same as main search endpoint

### Search Projects

- **URL:** `/api/search/projects`
- **Method:** `GET`
- **Parameters:** Same as main search endpoint

### Search Media

- **URL:** `/api/search/media`
- **Method:** `GET`
- **Parameters:** Same as main search endpoint

## Error Responses

In case of errors, the API returns a standard error response:

```json
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_FIELD",
    "message": "Search query is required"
  }
}
```

Common error codes:

- `MISSING_REQUIRED_FIELD`: Required parameter is missing
- `INVALID_PARAMETER`: Parameter has invalid value
- `SERVER_ERROR`: Internal server error

## Notes

- **AI-Enhanced Search**: The search is powered by semantic embeddings, allowing for meaningful search beyond exact keyword matching. The system may enhance your query to improve results.
- **Content Grouping**: Results are grouped by creator, with each creator's most relevant content displayed in order of relevance.
- **Result Scoring**: Each creator and content item has a relevance score (0-1) indicating how well it matches the query.
- **Performance Optimization**: The search is optimized with database vector operations for fast results even with large datasets.
- **Content Filtering**: Use the `contentType` parameter to filter results by media type.
- **Authentication**: Authentication is optional for search endpoints, but some content may be filtered based on visibility settings.

## Performance Considerations

- For best performance, be as specific as possible in your search queries
- Using the `contentType` filter can improve response times
- High-volume applications should implement client-side caching
- For very large result sets, use pagination to improve loading times
