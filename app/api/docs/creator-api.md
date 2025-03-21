# Creator API Documentation

The Creator API provides endpoints for managing creator profiles, portfolios, and related data. It allows creators to register, update their profiles, and showcase their projects.

## Endpoints

### List Creators

Returns a paginated list of creator profiles with filtering and search capabilities.

- **URL**: `/api/creators`
- **Method**: `GET`
- **Auth Required**: No
- **Parameters**:
  - `page` (query, optional): Page number for pagination (default: 1)
  - `limit` (query, optional): Items per page (default: 10)
  - `q` (query, optional): Search query term
  - `filter[field]=value` (query, optional): Filter by field (e.g., `filter[years_of_experience]=5`)
  - `primary_role` (query, optional): Filter by role (case-insensitive partial match)
  - `sort` (query, optional): Field to sort by (e.g., `username` for ascending, `-username` for descending)

**Example Requests**:

```
GET /api/creators?page=1&limit=10
GET /api/creators?q=designer&sort=-created_at
GET /api/creators?primary_role=Designer&limit=5
```

**Response Example**:

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "creator1",
      "bio": "Creator bio",
      "primary_role": ["Graphic Designer", "Creative Director"],
      "location": "San Francisco",
      "years_of_experience": 5,
      "first_name": "John",
      "last_name": "Doe",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "username": "creator2",
      "bio": "Another creator bio",
      "primary_role": ["UX Designer"],
      "location": "New York",
      "years_of_experience": 3,
      "first_name": "Jane",
      "last_name": "Smith",
      "created_at": "2023-02-01T00:00:00Z",
      "updated_at": "2023-02-01T00:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    },
    "filters": {
      "appliedFilters": {
        "primary_role": "Designer"
      },
      "availableFilters": {
        "primary_role": [
          "Graphic Designer",
          "UI Designer",
          "UX Designer",
          "Creative Director",
          "Product Designer",
          "Web Designer",
          "Art Director",
          "Illustrator",
          "Motion Designer",
          "3D Artist",
          "Photographer",
          "Developer",
          "Artist"
        ]
      }
    }
  }
}
```

### Check Username Availability

Checks if a username is available for registration.

- **URL**: `/api/creators/username-check`
- **Method**: `GET`
- **Auth Required**: No
- **Parameters**:
  - `username` (query, required): Username to check

**Response Example**:

```json
{
  "success": true,
  "data": {
    "available": true,
    "message": "Username is available"
  }
}
```

### Create Creator Profile

Creates a new creator profile for an authenticated user.

- **URL**: `/api/creators`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body Parameters**:
  - `username` (required): Unique username for the creator
  - `bio` (optional): Creator biography
  - `location` (optional): Creator location
  - `primary_role` (optional): Array of creator's primary roles
  - `years_of_experience` (optional): Years of experience
  - `work_email` (optional): Work email address
  - `social_links` (optional): Object containing social media links

**Request Example**:

```json
{
  "username": "newcreator",
  "bio": "My creator bio",
  "location": "New York",
  "primary_role": ["Graphic Designer", "Developer"],
  "years_of_experience": 3,
  "work_email": "creator@example.com",
  "social_links": {
    "twitter": "https://twitter.com/username",
    "instagram": "https://instagram.com/username"
  }
}
```

**Response Example**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "newcreator",
    "bio": "My creator bio",
    "location": "New York",
    "primary_role": ["Graphic Designer", "Developer"],
    "years_of_experience": 3,
    "work_email": "creator@example.com",
    "social_links": {
      "twitter": "https://twitter.com/username",
      "instagram": "https://instagram.com/username"
    },
    "profile_id": "660e8400-e29b-41d4-a716-446655440001",
    "first_name": "Jane",
    "last_name": "Doe",
    "created_at": "2023-06-15T14:30:00Z",
    "updated_at": "2023-06-15T14:30:00Z"
  }
}
```

### Get Creator Profile

Retrieves a creator's public profile by username.

- **URL**: `/api/creators/:username`
- **Method**: `GET`
- **Auth Required**: No
- **Parameters**:
  - `username` (path, required): Creator's username

**Response Example**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "creator1",
    "bio": "Creator bio",
    "location": "San Francisco",
    "primary_role": ["Graphic Designer", "Creative Director"],
    "years_of_experience": 5,
    "social_links": {
      "twitter": "https://twitter.com/creator1",
      "instagram": "https://instagram.com/creator1"
    },
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

### Get Creator Portfolio

Retrieves a creator's portfolio including projects and media.

- **URL**: `/api/creators/:username/portfolio`
- **Method**: `GET`
- **Auth Required**: No
- **Parameters**:
  - `username` (path, required): Creator's username

**Response Example**:

```json
{
  "success": true,
  "data": {
    "creator": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "creator1",
      "bio": "Creator bio",
      "location": "San Francisco",
      "primary_role": ["Graphic Designer", "Creative Director"],
      "years_of_experience": 5,
      "first_name": "John",
      "last_name": "Doe"
    },
    "projects": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "title": "Project 1",
        "description": "Project description",
        "created_at": "2023-02-01T00:00:00Z",
        "updated_at": "2023-02-01T00:00:00Z",
        "media": {
          "images": [
            {
              "id": "550e8400-e29b-41d4-a716-446655440002",
              "url": "https://media.example.com/path/to/image.jpg",
              "alt_text": "Image description",
              "order": 0,
              "created_at": "2023-02-02T00:00:00Z"
            }
          ],
          "videos": [
            {
              "id": "550e8400-e29b-41d4-a716-446655440003",
              "url": "https://media.example.com/path/to/video.mp4",
              "title": "Video title",
              "description": "Video description",
              "order": 1,
              "created_at": "2023-02-03T00:00:00Z"
            }
          ]
        }
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440004",
        "title": "Project 2",
        "description": "Another project description",
        "created_at": "2023-03-01T00:00:00Z",
        "updated_at": "2023-03-01T00:00:00Z",
        "media": {
          "images": [
            {
              "id": "660e8400-e29b-41d4-a716-446655440005",
              "url": "https://media.example.com/path/to/another-image.jpg",
              "alt_text": "Another image description",
              "order": 0,
              "created_at": "2023-03-02T00:00:00Z"
            }
          ],
          "videos": []
        }
      }
    ]
  }
}
```

### Get Creator Projects

Retrieves a list of projects for a specific creator.

- **URL**: `/api/creators/:username/projects`
- **Method**: `GET`
- **Auth Required**: No
- **Parameters**:
  - `username` (path, required): Creator's username
  - `page` (query, optional): Page number for pagination (default: 1)
  - `limit` (query, optional): Items per page (default: 10)

**Response Example**:

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "title": "Project 1",
        "description": "Project description",
        "created_at": "2023-02-01T00:00:00Z",
        "updated_at": "2023-02-01T00:00:00Z",
        "thumbnail": "https://media.example.com/path/to/thumbnail.jpg"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440004",
        "title": "Project 2",
        "description": "Another project description",
        "created_at": "2023-03-01T00:00:00Z",
        "updated_at": "2023-03-01T00:00:00Z",
        "thumbnail": "https://media.example.com/path/to/another-thumbnail.jpg"
      }
    ],
    "meta": {
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 2,
        "pages": 1
      }
    }
  }
}
```

### Update Creator Profile

Updates an existing creator profile.

- **URL**: `/api/creators/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Parameters**:
  - `id` (path, required): Creator ID
- **Body Parameters**: Same as Create Creator Profile (all fields optional)

**Request Example**:

```json
{
  "bio": "Updated creator bio",
  "location": "Los Angeles",
  "years_of_experience": 6
}
```

**Response Example**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "creator1",
    "bio": "Updated creator bio",
    "location": "Los Angeles",
    "primary_role": ["Graphic Designer", "Creative Director"],
    "years_of_experience": 6,
    "social_links": {
      "twitter": "https://twitter.com/creator1",
      "instagram": "https://instagram.com/creator1"
    },
    "profile_id": "660e8400-e29b-41d4-a716-446655440001",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-06-15T14:30:00Z"
  }
}
```

## Notes

1. **Authentication**: Creator profile creation and updates require authentication. The user can only create or modify their own profile.

2. **Caching**: Creator profile and portfolio data are cached to improve performance. When profiles or their projects are updated, relevant caches are automatically invalidated.

3. **Unique Constraints**: Usernames must be unique across the platform. The username-check endpoint can be used to verify availability before attempting to create a profile.

4. **Media Access**: When retrieving a creator's portfolio or projects, the API optimizes media queries to reduce database load and improve response times.

5. **Profile Ownership**: Each user can have only one creator profile. Attempting to create multiple profiles will result in an error.
