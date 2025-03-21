# Project API Documentation

The Project API provides endpoints for managing creative projects, including creation, retrieval, updating, deletion, and media management within projects.

## Endpoints

### Get User Projects

Retrieves all projects for the authenticated user.

- **URL**: `/api/projects`
- **Method**: `GET`
- **Auth Required**: Yes

**Response Example**:

```json
{
  "projects": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "My Project",
      "description": "Project description",
      "creator_id": "550e8400-e29b-41d4-a716-446655440001",
      "created_at": "2023-07-21T15:30:45Z",
      "updated_at": "2023-07-21T15:30:45Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "Another Project",
      "description": "Another project description",
      "creator_id": "550e8400-e29b-41d4-a716-446655440001",
      "created_at": "2023-07-22T10:15:30Z",
      "updated_at": "2023-07-22T10:15:30Z"
    }
  ]
}
```

### Get Project

Retrieves a specific project.

- **URL**: `/api/projects/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Parameters**:
  - `id` (path, required): UUID of the project

**Response Example**:

```json
{
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "My Project",
    "description": "Project description",
    "creator_id": "550e8400-e29b-41d4-a716-446655440001",
    "created_at": "2023-07-21T15:30:45Z",
    "updated_at": "2023-07-21T15:30:45Z"
  }
}
```

### Create Project

Creates a new project.

- **URL**: `/api/projects`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body Parameters**:
  - `title` (required): Project title
  - `description` (optional): Project description

**Request Example**:

```json
{
  "title": "New Project",
  "description": "This is a new project"
}
```

**Response Example**:

```json
{
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "New Project",
    "description": "This is a new project",
    "creator_id": "550e8400-e29b-41d4-a716-446655440001",
    "created_at": "2023-07-21T15:30:45Z",
    "updated_at": "2023-07-21T15:30:45Z"
  }
}
```

### Update Project

Updates an existing project.

- **URL**: `/api/projects/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Parameters**:
  - `id` (path, required): UUID of the project
- **Body Parameters**:
  - `title` (optional): Project title
  - `description` (optional): Project description

**Request Example**:

```json
{
  "title": "Updated Project Title",
  "description": "Updated project description"
}
```

**Response Example**:

```json
{
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Project Title",
    "description": "Updated project description",
    "creator_id": "550e8400-e29b-41d4-a716-446655440001",
    "created_at": "2023-07-21T15:30:45Z",
    "updated_at": "2023-07-21T16:45:12Z"
  }
}
```

### Delete Project

Deletes a project and optionally its associated media.

- **URL**: `/api/projects/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Parameters**:
  - `id` (path, required): UUID of the project
  - `cascade` (query, optional): Boolean flag to delete all associated media (default: false)

**Response Example**:

```json
{
  "message": "Project deleted successfully"
}
```

### Get Project Media

Retrieves all media (images and videos) associated with a project.

- **URL**: `/api/projects/:id/media`
- **Method**: `GET`
- **Auth Required**: No
- **Parameters**:
  - `id` (path, required): UUID of the project

**Response Example**:

```json
{
  "success": true,
  "data": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "project_title": "Project Name",
    "media": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "type": "image",
        "url": "https://media.example.com/path/to/image.jpg",
        "alt_text": "Example image",
        "created_at": "2023-07-21T15:30:45Z",
        "updated_at": "2023-07-21T15:30:45Z",
        "order": 0,
        "thumbnails": {
          "thumbnail": "https://media.example.com/path/to/thumbnails/image.jpg"
        },
        "creator": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "username": "creator_username"
        }
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440003",
        "type": "video",
        "url": "https://media.example.com/path/to/video.mp4",
        "title": "Example video",
        "description": "Video description",
        "created_at": "2023-07-21T15:35:22Z",
        "updated_at": "2023-07-21T15:35:22Z",
        "order": 1,
        "creator": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "username": "creator_username"
        }
      }
    ],
    "total": 2,
    "images_count": 1,
    "videos_count": 1
  }
}
```

### Add Project Media

Uploads a single media file to a project.

- **URL**: `/api/projects/:id/media`
- **Method**: `POST`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `id` (path, required): UUID of the project
  - `file` (form, required): The media file to upload
  - `alt_text` (body, optional): Alternative text for the image
  - `title` (body, optional): Title for the media (especially for videos)
  - `description` (body, optional): Description for the media (especially for videos)
  - `order` (body, optional): Display order in the project

**Response Example**:

```json
{
  "media": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "type": "image",
    "url": "https://media.example.com/path/to/image.jpg",
    "thumbnailUrl": "https://media.example.com/path/to/thumbnails/image.jpg",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "creatorId": "550e8400-e29b-41d4-a716-446655440001",
    "metadata": {
      "alt_text": "New image",
      "order": 0,
      "file_size": 1024000,
      "mime_type": "image/jpeg",
      "original_filename": "my-image.jpg"
    },
    "created_at": "2023-07-21T15:30:45Z"
  }
}
```

### Delete Project Media

Deletes a specific media item from a project.

- **URL**: `/api/projects/:id/media/:mediaId`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Parameters**:
  - `id` (path, required): UUID of the project
  - `mediaId` (path, required): UUID of the media item
  - `type` (query, required): Type of media ("image" or "video")

**Response Example**:

```json
{
  "message": "Media deleted successfully"
}
```

### Update Project Media

Updates metadata for a specific media item in a project.

- **URL**: `/api/projects/:id/media/:mediaId`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Parameters**:
  - `id` (path, required): UUID of the project
  - `mediaId` (path, required): UUID of the media item
  - `type` (query, required): Type of media ("image" or "video")
- **Body Parameters**:
  - For images:
    - `alt_text` (optional): Alternative text for the image
    - `order` (optional): Display order in the project
  - For videos:
    - `title` (optional): Video title
    - `description` (optional): Video description
    - `order` (optional): Display order in the project

**Request Example (Image)**:

```json
{
  "alt_text": "Updated image alt text",
  "order": 2
}
```

**Response Example**:

```json
{
  "success": true,
  "data": {
    "media": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "type": "image",
      "url": "https://media.example.com/path/to/image.jpg",
      "alt_text": "Updated image alt text",
      "created_at": "2023-07-21T15:30:45Z",
      "updated_at": "2023-07-21T16:45:12Z",
      "order": 2,
      "thumbnails": {
        "thumbnail": "https://media.example.com/path/to/thumbnails/image.jpg"
      }
    },
    "message": "Image updated successfully"
  }
}
```

## Media Organization

Project media is stored in Supabase Storage with the following path structure:

```
userId/projectId/[image|video]-uuid.extension
```

Thumbnails are stored in a `thumbnails` subfolder:

```
userId/projectId/thumbnails/thumb_uuid.extension
```

## Notes

1. **Authentication**: All project management endpoints require authentication. Users can only access and modify their own projects.

2. **Caching**: The API implements caching for project data to improve performance. When projects or their media are updated or deleted, relevant caches are automatically invalidated.

3. **Media Type Validation**: When uploading media, the API automatically detects the file type and validates it against supported formats.

4. **Permissions**: Project operations are restricted to the creator of the project. Attempts to access or modify projects that don't belong to the authenticated user will result in a 403 Forbidden response.
