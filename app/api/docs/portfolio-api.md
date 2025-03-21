# Portfolio API

The Portfolio API allows managing creator portfolios, including adding and removing projects.

## Authentication

Most portfolio routes require authentication as the creator who owns the portfolio or an admin.

## Endpoints

### Get Portfolio by ID

**GET /api/portfolios/:id**

Retrieves the portfolio details along with associated projects.

**Parameters:**

- `id` - The UUID of the portfolio to retrieve

**Response:**

- `200 OK` - Portfolio found
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "creator_id": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "projects": [
        {
          "id": "uuid",
          "title": "Project Title",
          "description": "Project description",
          "featured": true,
          "year": 2023,
          "created_at": "timestamp"
        }
      ],
      "creator": {
        "id": "uuid",
        "username": "creatorname"
      }
    }
  }
  ```

- `404 Not Found` - Portfolio not found
  ```json
  {
    "success": false,
    "error": "Portfolio not found"
  }
  ```

- `500 Internal Server Error` - Server error
  ```json
  {
    "success": false,
    "error": "Failed to retrieve portfolio details"
  }
  ```

### Update Portfolio

**PUT /api/portfolios/:id**

Updates a portfolio's general properties.

**Authentication Required**:
- Creator who owns the portfolio or Admin

**Parameters:**

- `id` - The UUID of the portfolio to update

**Response:**

- `200 OK` - Portfolio updated
  ```json
  {
    "success": true,
    "message": "Portfolio updated successfully",
    "data": {
      "id": "uuid",
      "creator_id": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  }
  ```

- `401 Unauthorized` - Not authenticated
  ```json
  {
    "success": false,
    "error": "Authentication required"
  }
  ```

- `403 Forbidden` - Not authorized
  ```json
  {
    "success": false,
    "error": "You don't have permission to modify this portfolio"
  }
  ```

- `404 Not Found` - Portfolio not found
  ```json
  {
    "success": false,
    "error": "Portfolio not found"
  }
  ```

- `500 Internal Server Error` - Server error
  ```json
  {
    "success": false,
    "error": "Failed to update portfolio"
  }
  ```

### Add Project to Portfolio

**POST /api/portfolios/:id/projects/:projectId**

Adds a project to a portfolio or moves it from another portfolio.

**Authentication Required**:
- Creator who owns the portfolio or Admin

**Parameters:**

- `id` - The UUID of the portfolio
- `projectId` - The UUID of the project to add

**Response:**

- `200 OK` - Project added
  ```json
  {
    "success": true,
    "message": "Project added to portfolio successfully",
    "data": {
      "id": "uuid",
      "portfolio_id": "uuid",
      "creator_id": "uuid",
      "title": "Project Title",
      "description": "Project description",
      "updated_at": "timestamp",
      "created_at": "timestamp"
    }
  }
  ```

- `200 OK` - Project moved from another portfolio
  ```json
  {
    "success": true,
    "message": "Project moved to this portfolio successfully",
    "data": {
      "id": "uuid",
      "portfolio_id": "uuid",
      "creator_id": "uuid",
      "title": "Project Title",
      "description": "Project description",
      "updated_at": "timestamp",
      "created_at": "timestamp"
    }
  }
  ```

- `400 Bad Request` - Project already in this portfolio
  ```json
  {
    "success": false,
    "error": "Project is already in this portfolio"
  }
  ```

- `403 Forbidden` - Project belongs to different creator
  ```json
  {
    "success": false,
    "error": "Project does not belong to the same creator as the portfolio"
  }
  ```

- `404 Not Found` - Portfolio or project not found
  ```json
  {
    "success": false,
    "error": "Portfolio not found"
  }
  ```

  ```json
  {
    "success": false,
    "error": "Project not found"
  }
  ```

- `500 Internal Server Error` - Server error
  ```json
  {
    "success": false,
    "error": "Failed to add project to portfolio"
  }
  ```

### Remove Project from Portfolio

**DELETE /api/portfolios/:id/projects/:projectId**

Removes a project from a portfolio.

**Authentication Required**:
- Creator who owns the portfolio or Admin

**Parameters:**

- `id` - The UUID of the portfolio
- `projectId` - The UUID of the project to remove

**Response:**

- `200 OK` - Project removed
  ```json
  {
    "success": true,
    "message": "Project removed from portfolio successfully",
    "data": {
      "id": "uuid",
      "portfolio_id": null,
      "creator_id": "uuid",
      "title": "Project Title",
      "description": "Project description",
      "updated_at": "timestamp",
      "created_at": "timestamp"
    }
  }
  ```

- `400 Bad Request` - Project not in this portfolio
  ```json
  {
    "success": false,
    "error": "Project is not in this portfolio"
  }
  ```

- `404 Not Found` - Portfolio not found
  ```json
  {
    "success": false,
    "error": "Portfolio not found"
  }
  ```

- `500 Internal Server Error` - Server error
  ```json
  {
    "success": false,
    "error": "Failed to remove project from portfolio"
  }
  ```

## Notes

- Each creator can have one portfolio, which is automatically created when the creator account is created.
- A project can only be associated with one portfolio at a time.
- When projects are added or removed from a portfolio, the portfolio's embedding is automatically updated to reflect the portfolio content for search functionality. 