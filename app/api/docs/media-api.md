# Media API Documentation

The Media API provides a unified approach for handling both images and videos within the application. This API allows for uploading, retrieving, updating, and deleting media assets associated with projects.

## Endpoints

### Get Media Details

Retrieves details about a specific media item (image or video).

- **URL**: `/api/media/:id`
- **Method**: `GET`
- **Auth Required**: No
- **Parameters**:
  - `id` (path, required): UUID of the media item

**Response Example**:

```json
{
  "success": true,
  "data": {
    "media": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "image",
      "url": "https://media.example.com/path/to/image.jpg",
      "thumbnailUrl": "https://media.example.com/path/to/thumbnails/image.jpg",
      "projectId": "550e8400-e29b-41d4-a716-446655440001",
      "creatorId": "550e8400-e29b-41d4-a716-446655440002",
      "metadata": {
        "alt_text": "Example image",
        "order": 0,
        "project_title": "Project Name",
        "file_size": 1024000,
        "mime_type": "image/jpeg",
        "original_filename": "original-name.jpg"
      },
      "created_at": "2023-07-21T15:30:45Z"
    }
  }
}
```

### Update Media Metadata

Updates metadata for a specific media item.

- **URL**: `/api/media/:id/metadata`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Parameters**:
  - `id` (path, required): UUID of the media item
  - `media_type` (body, required): Type of media ("image" or "video")
  - For images:
    - `alt_text` (body, optional): Alternative text for the image
    - `resolutions` (body, optional): Object containing different resolution URLs
    - `order` (body, optional): Display order in the project
  - For videos:
    - `title` (body, optional): Video title
    - `description` (body, optional): Video description
    - `vimeo_id` (body, optional): Vimeo video ID
    - `youtube_id` (body, optional): YouTube video ID
    - `order` (body, optional): Display order in the project

**Request Example (Image)**:

```json
{
  "media_type": "image",
  "alt_text": "Updated alternative text",
  "order": 1
}
```

**Response Example**:

```json
{
  "success": true,
  "data": {
    "media": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "image",
      "url": "https://media.example.com/path/to/image.jpg",
      "thumbnailUrl": "https://media.example.com/path/to/thumbnails/image.jpg",
      "projectId": "550e8400-e29b-41d4-a716-446655440001",
      "creatorId": "550e8400-e29b-41d4-a716-446655440002",
      "metadata": {
        "alt_text": "Updated alternative text",
        "order": 1,
        "project_title": "Project Name"
      },
      "created_at": "2023-07-21T15:30:45Z"
    },
    "message": "Media metadata updated successfully"
  }
}
```

### Delete Media

Deletes a specific media item and its associated files.

- **URL**: `/api/media/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Parameters**:
  - `id` (path, required): UUID of the media item

**Response Example**:

```json
{
  "success": true,
  "data": {
    "message": "Media deleted successfully"
  }
}
```

### Upload Media

Uploads a single media file (image or video) to a project.

- **URL**: `/api/media/upload`
- **Method**: `POST`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `project_id` (body, required): UUID of the project to associate the media with
  - `file` (form, required): The media file to upload
  - `alt_text` (body, optional): Alternative text for the image
  - `title` (body, optional): Title for the media (especially for videos)
  - `description` (body, optional): Description for the media (especially for videos)
  - `order` (body, optional): Display order in the project

**Note**: This endpoint is flexible with file field names. While `file` is the preferred field name, it will search for any file if the `file` field is not present.

**Response Example**:

```json
{
  "success": true,
  "data": {
    "media": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "image",
      "url": "https://media.example.com/path/to/image.jpg",
      "thumbnailUrl": "https://media.example.com/path/to/thumbnails/image.jpg",
      "projectId": "550e8400-e29b-41d4-a716-446655440001",
      "creatorId": "550e8400-e29b-41d4-a716-446655440002",
      "metadata": {
        "alt_text": "New image",
        "order": 0,
        "file_size": 1024000,
        "mime_type": "image/jpeg",
        "original_filename": "my-image.jpg"
      },
      "created_at": "2023-07-21T15:30:45Z"
    },
    "message": "Media uploaded successfully"
  }
}
```

### Batch Upload Media

Uploads multiple media files (images or videos) to a project.

- **URL**: `/api/media/batch-upload`
- **Method**: `POST`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `project_id` (body, required): UUID of the project to associate the media with
  - `files` (form, required): Array of media files to upload

**Note**: This endpoint is flexible with file field names. While `files` is the preferred field name for the array of files, it will search for any file array if the `files` field is not present.

**Response Example**:

```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "type": "image",
        "url": "https://media.example.com/path/to/image1.jpg",
        "thumbnailUrl": "https://media.example.com/path/to/thumbnails/image1.jpg",
        "projectId": "550e8400-e29b-41d4-a716-446655440001",
        "creatorId": "550e8400-e29b-41d4-a716-446655440002",
        "metadata": {
          "file_size": 1024000,
          "mime_type": "image/jpeg",
          "original_filename": "image1.jpg"
        },
        "created_at": "2023-07-21T15:30:45Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "type": "video",
        "url": "https://media.example.com/path/to/video1.mp4",
        "projectId": "550e8400-e29b-41d4-a716-446655440001",
        "creatorId": "550e8400-e29b-41d4-a716-446655440002",
        "metadata": {
          "title": "Video 1",
          "file_size": 10240000,
          "mime_type": "video/mp4",
          "original_filename": "video1.mp4"
        },
        "created_at": "2023-07-21T15:31:12Z"
      }
    ],
    "total": 2,
    "message": "Successfully uploaded 2 files"
  }
}
```

### Upload Video Link

Adds a YouTube or Vimeo video to a project without requiring file upload.

- **URL**: `/api/media/upload-video-link`
- **Method**: `POST`
- **Auth Required**: Yes
- **Content-Type**: `application/json`
- **Parameters**:
  - `project_id` (body, required): UUID of the project to associate the video with
  - `video_url` (body, required): URL of the YouTube or Vimeo video (e.g., `https://www.youtube.com/watch?v=WW62RWXMlTc` or `https://vimeo.com/1066595004`)
  - `title` (body, optional): Title for the video
  - `description` (body, optional): Description for the video

**Request Example**:

```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440001",
  "video_url": "https://www.youtube.com/watch?v=WW62RWXMlTc",
  "title": "My YouTube Video",
  "description": "A detailed description of the video content"
}
```

**Response Example**:

```json
{
  "success": true,
  "data": {
    "media": {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "type": "video",
      "url": "https://www.youtube.com/watch?v=WW62RWXMlTc",
      "projectId": "550e8400-e29b-41d4-a716-446655440001",
      "creatorId": "550e8400-e29b-41d4-a716-446655440002",
      "metadata": {
        "title": "My YouTube Video",
        "description": "A detailed description of the video content",
        "youtube_id": "WW62RWXMlTc",
        "vimeo_id": null
      },
      "created_at": "2023-07-21T15:32:30Z"
    },
    "message": "Video link added successfully"
  }
}
```

## Supported Media Types

### Images

- JPEG/JPG
- PNG
- GIF
- WebP

### Videos

- MP4
- QuickTime (MOV)
- AVI
- WMV
- WebM

### External Videos (via URL)

- YouTube videos
- Vimeo videos

## Storage Organization

Media files are stored in Supabase Storage with the following path structure:

```
userId/projectId/[image|video]-uuid.extension
```

Thumbnails are stored in a `thumbnails` subfolder:

```
userId/projectId/thumbnails/thumb_uuid.extension
```

## Notes

1. **Authentication**: Protected endpoints require authentication. The user must be the creator or have appropriate permissions for the project to upload, update, or delete media.

2. **File Size Limits**: Maximum file size is 50MB per file.

3. **Thumbnails**: Thumbnails are automatically generated for supported image formats (JPEG/JPG, PNG).

4. **Cache Control**: Media endpoints have cache control headers to optimize performance and reduce bandwidth usage.

5. **File Upload Flexibility**: The API is designed to be flexible with file field names in upload requests, making it easier to integrate with various frontend implementations.

6. **Video Links**: The API supports linking to YouTube and Vimeo videos without requiring file uploads. The system automatically extracts and stores the relevant video IDs.
