# Admin API Documentation

This document outlines the API endpoints available for admin users to manage creators' profiles and their projects.

## Authentication

All admin endpoints require authentication and admin privileges. The API uses JWT tokens for authentication.

## Base URL

```
/api/admin
```

## Creator Management Endpoints

### List Creators

Retrieves a paginated list of creators.

- **URL**: `/creators`
- **Method**: `GET`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of items per page (default: 10)
  - `search` (optional): Search term to filter creators by username

**Response**:

```json
{
  "creators": [
    {
      "id": "string",
      "username": "string",
      "location": "string",
      "primary_role": "string",
      "creative_fields": ["string"],
      "projects": [
        {
          "id": "string",
          "title": "string",
          "images": [
            {
              "id": "string",
              "url": "string",
              "resolutions": {}
            }
          ]
        }
      ]
    }
  ],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "pages": 0
  }
}
```

### Get Creator Details

Retrieves detailed information about a specific creator.

- **URL**: `/creators/:id`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: Creator ID

**Response**:

```json
{
  "creator": {
    "id": "string",
    "username": "string",
    "location": "string",
    "primary_role": "string",
    "creative_fields": ["string"],
    "bio": "string",
    "website": "string",
    "social_links": {},
    "projects": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "images": [
          {
            "id": "string",
            "url": "string",
            "resolutions": {}
          }
        ]
      }
    ]
  }
}
```

### Update Creator

Updates a creator's profile information.

- **URL**: `/creators/:id`
- **Method**: `PUT`
- **URL Parameters**:
  - `id`: Creator ID
- **Request Body**:

```json
{
  "username": "string",
  "location": "string",
  "primary_role": "string",
  "creative_fields": ["string"],
  "bio": "string",
  "website": "string",
  "social_links": {}
}
```

**Response**:

```json
{
  "message": "Creator profile updated successfully",
  "creator": {
    "id": "string",
    "username": "string",
    "location": "string",
    "primary_role": "string",
    "creative_fields": ["string"],
    "bio": "string",
    "website": "string",
    "social_links": {}
  }
}
```

### Delete Creator

Deletes a creator's profile.

- **URL**: `/creators/:id`
- **Method**: `DELETE`
- **URL Parameters**:
  - `id`: Creator ID

**Response**:

```json
{
  "message": "Creator deleted successfully"
}
```

### Reject Creator

Marks a creator as rejected/unqualified.

- **URL**: `/creators/:id/reject`
- **Method**: `POST`
- **URL Parameters**:
  - `id`: Creator ID

**Response**:

```json
{
  "message": "Creator rejected successfully"
}
```

### List Rejected Creators

Retrieves a paginated list of rejected creators.

- **URL**: `/unqualified/creators`
- **Method**: `GET`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of items per page (default: 10)

**Response**:

```json
{
  "creators": [
    {
      "id": "string",
      "username": "string",
      "location": "string",
      "primary_role": "string",
      "creative_fields": ["string"]
    }
  ],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "pages": 0
  }
}
```

## Project Management Endpoints

### List Projects

Retrieves a paginated list of projects.

- **URL**: `/projects`
- **Method**: `GET`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of items per page (default: 10)
  - `creator_id` (optional): Filter projects by creator ID
  - `search` (optional): Search term to filter projects by title

**Response**:

```json
{
  "projects": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "created_at": "string",
      "updated_at": "string",
      "creator_id": "string",
      "creators": {
        "id": "string",
        "username": "string"
      },
      "preview_image": {
        "id": "string",
        "url": "string",
        "resolutions": {}
      }
    }
  ],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "pages": 0
  }
}
```

### Get Project Details

Retrieves detailed information about a specific project.

- **URL**: `/projects/:id`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: Project ID

**Response**:

```json
{
  "project": {
    "id": "string",
    "title": "string",
    "description": "string",
    "created_at": "string",
    "updated_at": "string",
    "creator_id": "string",
    "creators": {
      "id": "string",
      "username": "string",
      "location": "string",
      "primary_role": "string",
      "creative_fields": ["string"],
      "bio": "string",
      "website": "string",
      "social_links": {}
    },
    "images": [
      {
        "id": "string",
        "url": "string",
        "resolutions": {},
        "order": 0
      }
    ],
    "videos": [
      {
        "id": "string",
        "url": "string",
        "thumbnail_url": "string"
      }
    ]
  }
}
```

### Update Project

Updates a project's information.

- **URL**: `/projects/:id`
- **Method**: `PUT`
- **URL Parameters**:
  - `id`: Project ID
- **Request Body**:

```json
{
  "title": "string",
  "description": "string"
}
```

**Response**:

```json
{
  "message": "Project updated successfully",
  "project": {
    "id": "string",
    "title": "string",
    "description": "string",
    "created_at": "string",
    "updated_at": "string",
    "creator_id": "string"
  }
}
```

### Delete Project

Deletes a project.

- **URL**: `/projects/:id`
- **Method**: `DELETE`
- **URL Parameters**:
  - `id`: Project ID

**Response**:

```json
{
  "message": "Project deleted successfully"
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User does not have admin privileges
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response format:

```json
{
  "error": "Error message"
}
``` 