# Admin API Documentation

The Admin API provides endpoints for managing creators, projects, and media content. These endpoints are restricted to administrators only.

## Authentication

All Admin API endpoints require authentication and admin privileges. Include the authentication token in the `Authorization` header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Base URL

All API endpoints are relative to: `/api/admin`

## Endpoints

### System Statistics

#### Get System Statistics

```
GET /stats
```

Returns overall system statistics including counts of creators, projects, and media.

**Response Example:**

```json
{
  "creators": {
    "total": 250,
    "pending": 15,
    "approved": 220,
    "rejected": 15
  },
  "projects": {
    "total": 560
  },
  "media": {
    "total": 2800,
    "images": 2500,
    "videos": 300
  }
}
```

### Creator Management

#### List Creators

```
GET /creators
```

Returns a paginated list of creators with basic information.

**Query Parameters:**

| Parameter | Type   | Default | Description                                     |
| --------- | ------ | ------- | ----------------------------------------------- |
| page      | number | 1       | Page number                                     |
| limit     | number | 10      | Number of creators per page                     |
| search    | string | null    | Search term to filter by username or location   |
| status    | string | "all"   | Filter by status ("all", "pending", "approved") |

**Response Example:**

```json
{
  "creators": [
    {
      "id": "f8e5d4c3-b2a1-9876-5432-1098765432f1",
      "username": "creative_designer",
      "location": "New York, NY",
      "primary_role": ["Graphic Designer", "Illustrator"],
      "status": "approved"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 250
}
```

#### Get Creator Details

```
GET /creators/:username
```

Returns detailed information about a specific creator.

**Path Parameters:**

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| username  | string | Creator's unique username |

**Response Example:**

```json
{
  "id": "f8e5d4c3-b2a1-9876-5432-1098765432f1",
  "username": "creative_designer",
  "location": "New York, NY",
  "bio": "Experienced designer with 10+ years in branding and identity design",
  "primary_role": ["Graphic Designer", "Illustrator"],
  "social_links": {
    "instagram": "https://instagram.com/creative_designer",
    "twitter": "https://twitter.com/creative_designer"
  },
  "projects": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
      "title": "Brand Identity for Tech Startup",
      "description": "Complete brand identity including logo, color palette, and guidelines",
      "images": [
        {
          "id": "i1d2i3d4",
          "url": "https://example.com/images/tech-brand-logo.jpg"
        }
      ]
    }
  ],
  "status": "approved",
  "created_at": "2023-05-15T14:30:45Z",
  "updated_at": "2023-06-20T09:15:22Z"
}
```

#### Update Creator

```
PUT /creators/:username
```

Updates a creator's information.

**Path Parameters:**

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| username  | string | Creator's unique username |

**Request Body:**

```json
{
  "location": "Los Angeles, CA",
  "bio": "Updated professional bio",
  "primary_role": ["UI Designer", "Brand Designer"],
  "social_links": {
    "instagram": "https://instagram.com/new_handle",
    "behance": "https://behance.net/new_handle"
  }
}
```

**Response Example:**

```json
{
  "id": "f8e5d4c3-b2a1-9876-5432-1098765432f1",
  "username": "creative_designer",
  "location": "Los Angeles, CA",
  "bio": "Updated professional bio",
  "primary_role": ["UI Designer", "Brand Designer"],
  "social_links": {
    "instagram": "https://instagram.com/new_handle",
    "behance": "https://behance.net/new_handle"
  },
  "updated_at": "2023-08-01T11:22:33Z"
}
```

#### Delete Creator

```
DELETE /creators/:username
```

Deletes a creator account and all associated data.

**Path Parameters:**

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| username  | string | Creator's unique username |

**Response Example:**

```json
{
  "message": "Creator 'creative_designer' has been deleted"
}
```

#### Update Creator Status

```
POST /creators/:username/status
```

Updates a creator's status (approve or reject).

**Path Parameters:**

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| username  | string | Creator's unique username |

**Request Body:**

```json
{
  "status": "approved"
}
```

Or for rejection:

```json
{
  "status": "rejected",
  "reason": "Insufficient portfolio quality"
}
```

**Response Example:**

```json
{
  "message": "Creator 'creative_designer' status updated to approved",
  "status": "approved"
}
```

#### Reject Creator

```
POST /creators/:username/reject
```

Rejects a creator, moving their data to the unqualified tables.

**Path Parameters:**

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| username  | string | Creator's unique username |

**Request Body:**

```json
{
  "reason": "Insufficient portfolio quality"
}
```

**Response Example:**

```json
{
  "success": true,
  "message": "Creator rejected successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Missing rejection reason
- `404 Not Found` - Creator not found
- `500 Internal Server Error` - Server-side error during processing

### Project Management

#### List Projects

```
GET /projects
```

Returns a paginated list of projects.

**Query Parameters:**

| Parameter  | Type   | Default | Description                                   |
| ---------- | ------ | ------- | --------------------------------------------- |
| page       | number | 1       | Page number                                   |
| limit      | number | 10      | Number of projects per page                   |
| creator_id | string | "all"   | Filter by creator ID                          |
| status     | string | "all"   | Filter by status ("published", "draft", etc.) |

**Response Example:**

```json
{
  "projects": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
      "title": "Brand Identity for Tech Startup",
      "description": "Complete brand identity including logo, color palette, and guidelines",
      "creator_id": "f8e5d4c3-b2a1-9876-5432-1098765432f1",
      "creator_username": "creative_designer",
      "status": "published",
      "image_count": 12,
      "video_count": 1,
      "created_at": "2023-06-15T08:30:22Z",
      "updated_at": "2023-06-20T14:45:10Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 560
}
```

#### Get Project Details

```
GET /projects/:id
```

Returns detailed information about a specific project.

**Path Parameters:**

| Parameter | Type   | Description         |
| --------- | ------ | ------------------- |
| id        | string | Project's unique ID |

**Response Example:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
  "title": "Brand Identity for Tech Startup",
  "description": "Complete brand identity including logo, color palette, and guidelines",
  "creator_id": "f8e5d4c3-b2a1-9876-5432-1098765432f1",
  "creator_username": "creative_designer",
  "status": "published",
  "media": {
    "images": [
      {
        "id": "i1d2i3d4",
        "url": "https://example.com/images/tech-brand-logo.jpg",
        "alt_text": "Brand logo",
        "order": 1
      }
    ],
    "videos": [
      {
        "id": "v1d2v3d4",
        "url": "https://example.com/videos/brand-presentation.mp4",
        "title": "Brand Presentation",
        "description": "Overview of the brand identity",
        "order": 1
      }
    ]
  },
  "created_at": "2023-06-15T08:30:22Z",
  "updated_at": "2023-06-20T14:45:10Z"
}
```

#### Update Project

```
PUT /projects/:id
```

Updates a project's information.

**Path Parameters:**

| Parameter | Type   | Description         |
| --------- | ------ | ------------------- |
| id        | string | Project's unique ID |

**Request Body:**

```json
{
  "title": "Updated Brand Identity for Tech Startup",
  "description": "Comprehensive brand identity system for innovative tech company",
  "status": "published"
}
```

**Response Example:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
  "title": "Updated Brand Identity for Tech Startup",
  "description": "Comprehensive brand identity system for innovative tech company",
  "status": "published",
  "updated_at": "2023-08-01T16:30:45Z"
}
```

#### Delete Project

```
DELETE /projects/:id
```

Deletes a project and all associated media.

**Path Parameters:**

| Parameter | Type   | Description         |
| --------- | ------ | ------------------- |
| id        | string | Project's unique ID |

**Response Example:**

```json
{
  "message": "Project 'Updated Brand Identity for Tech Startup' has been deleted"
}
```

### Media Management

#### List Media

```
GET /media
```

Returns a paginated list of media (images and videos).

**Query Parameters:**

| Parameter  | Type   | Default | Description                               |
| ---------- | ------ | ------- | ----------------------------------------- |
| page       | number | 1       | Page number                               |
| limit      | number | 20      | Number of media items per page            |
| project_id | string | "all"   | Filter by project ID                      |
| type       | string | "all"   | Filter by media type ("image" or "video") |

**Response Example:**

```json
{
  "media": [
    {
      "id": "i1d2i3d4",
      "url": "https://example.com/images/tech-brand-logo.jpg",
      "project_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
      "project_title": "Brand Identity for Tech Startup",
      "creator_id": "f8e5d4c3-b2a1-9876-5432-1098765432f1",
      "creator_username": "creative_designer",
      "media_type": "image",
      "alt_text": "Brand logo",
      "order": 1,
      "status": "published",
      "created_at": "2023-06-15T09:30:22Z",
      "updated_at": "2023-06-15T09:30:22Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 2800
}
```

#### Delete Media

```
DELETE /media/:id
```

Deletes a specific media item.

**Path Parameters:**

| Parameter | Type   | Description       |
| --------- | ------ | ----------------- |
| id        | string | Media's unique ID |

**Response Example:**

```json
{
  "message": "image with ID i1d2i3d4 has been deleted"
}
```

### Rejected Creators

#### List Rejected Creators

```
GET /unqualified/creators
```

Returns a paginated list of rejected creators.

**Query Parameters:**

| Parameter | Type   | Default | Description                 |
| --------- | ------ | ------- | --------------------------- |
| page      | number | 1       | Page number                 |
| limit     | number | 10      | Number of creators per page |

**Response Example:**

```json
{
  "creators": [
    {
      "id": "r8j5k4l3-c2d1-9876-5432-1098765432r1",
      "username": "rejected_user",
      "email": "rejected@example.com",
      "reason": "Insufficient portfolio quality",
      "rejected_at": "2023-07-12T10:25:33Z",
      "rejected_by": "admin_user_id"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 15
}
```

## Error Responses

All API endpoints return appropriate HTTP status codes:

- `200 OK` - The request was successful
- `400 Bad Request` - The request was invalid or missing required parameters
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions (non-admin user)
- `404 Not Found` - The requested resource was not found
- `500 Internal Server Error` - Server-side error

Error responses have the following format:

```json
{
  "error": "Descriptive error message"
}
```
