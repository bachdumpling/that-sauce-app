# Analysis API Documentation

The Analysis API provides endpoints for analyzing creative portfolios, projects, and associated media using AI. This API allows users to trigger analysis jobs, check analysis eligibility, and retrieve analysis results.

## Base URL

All API endpoints are relative to: `/api/analysis`

## Authentication

All Analysis API endpoints require authentication. Include the authentication token in the `Authorization` header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Portfolio Analysis

### Check if Portfolio Can Be Analyzed

Checks if a portfolio is eligible for AI analysis based on time limits and quotas.

- **URL**: `/portfolios/:portfolioId/can-analyze`
- **Method**: `GET`
- **Auth Required**: Yes
- **Path Parameters**:
  - `portfolioId` (required): UUID of the portfolio to check

**Response Example (Analysis Allowed)**:

```json
{
  "success": true,
  "data": {
    "allowed": true,
    "message": "Analysis allowed"
  }
}
```

**Response Example (Analysis Not Allowed)**:

```json
{
  "success": true,
  "data": {
    "allowed": false,
    "message": "Too soon since last analysis. Please wait 5 more hours.",
    "nextAvailableTime": "2025-04-23T10:30:00Z"
  }
}
```

**Response Example (Monthly Limit Reached)**:

```json
{
  "success": true,
  "data": {
    "allowed": false,
    "message": "Monthly analysis limit reached (100 per month). Please try again later."
  }
}
```

**Error Responses**:

- `401 Unauthorized` - Authentication required
- `403 Forbidden` - User doesn't have permission for this portfolio
- `404 Not Found` - Portfolio not found
- `500 Internal Server Error` - Server error

### Start Portfolio Analysis

Starts an AI analysis job for a portfolio and all its associated projects and media.

- **URL**: `/portfolios/:portfolioId`
- **Method**: `POST`
- **Auth Required**: Yes
- **Path Parameters**:
  - `portfolioId` (required): UUID of the portfolio to analyze

**Response Example (New Analysis Started)**:

```json
{
  "success": true,
  "data": {
    "message": "Portfolio analysis started",
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending"
  }
}
```

**Response Example (Analysis Already in Progress)**:

```json
{
  "success": true,
  "data": {
    "message": "Analysis is already in progress",
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing"
  }
}
```

**Error Responses**:

- `401 Unauthorized` - Authentication required
- `403 Forbidden` - User doesn't have permission or analysis not allowed (time limit)
- `404 Not Found` - Portfolio not found
- `500 Internal Server Error` - Server error

### Get Portfolio Analysis Results

Retrieves the completed AI analysis results for a portfolio.

- **URL**: `/portfolios/:portfolioId`
- **Method**: `GET`
- **Auth Required**: Yes
- **Path Parameters**:
  - `portfolioId` (required): UUID of the portfolio

**Response Example (Analysis Complete)**:

```json
{
  "success": true,
  "data": {
    "has_analysis": true,
    "analysis": "Professional portfolio analysis text here. This creative portfolio demonstrates a consistent style across projects with a focus on minimalist design approaches. The creator shows particular strength in typography and composition across both digital and print media..."
  }
}
```

**Response Example (Analysis in Progress)**:

```json
{
  "success": true,
  "data": {
    "message": "Analysis in progress",
    "has_analysis": false,
    "analysis": null,
    "job": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "processing",
      "progress": 65
    }
  }
}
```

**Response Example (No Analysis Yet)**:

```json
{
  "success": true,
  "data": {
    "has_analysis": false,
    "analysis": null
  }
}
```

**Error Responses**:

- `401 Unauthorized` - Authentication required
- `404 Not Found` - Portfolio not found
- `500 Internal Server Error` - Server error

## Project Analysis

### Start Project Analysis

Starts an AI analysis job for a single project and its associated media.

- **URL**: `/projects/:projectId`
- **Method**: `POST`
- **Auth Required**: Yes
- **Path Parameters**:
  - `projectId` (required): UUID of the project to analyze

**Response Example**:

```json
{
  "success": true,
  "data": {
    "message": "Project analysis started",
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending"
  }
}
```

**Error Responses**:

- `401 Unauthorized` - Authentication required
- `403 Forbidden` - User doesn't have permission for this project
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Server error

## Analysis Jobs

### Get Analysis Job Status

Retrieves the current status of an analysis job.

- **URL**: `/jobs/:jobId`
- **Method**: `GET`
- **Auth Required**: Yes
- **Path Parameters**:
  - `jobId` (required): UUID of the analysis job

**Response Example**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "portfolio_id": "660e8400-e29b-41d4-a716-446655440001",
    "creator_id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "processing",
    "progress": 42,
    "created_at": "2025-04-22T08:30:45Z",
    "updated_at": "2025-04-22T08:35:12Z"
  }
}
```

**Job Status Values**:

- `pending` - Job is queued but not yet started
- `processing` - Job is currently running
- `completed` - Job has finished successfully
- `failed` - Job failed with an error

**Error Responses**:

- `401 Unauthorized` - Authentication required
- `404 Not Found` - Job not found
- `500 Internal Server Error` - Server error

## Analysis Process

The analysis process goes through the following stages:

1. **Media Analysis**: All images and videos in the portfolio's projects are analyzed
2. **Project Analysis**: Each project is analyzed based on its media and metadata
3. **Portfolio Analysis**: An overall portfolio analysis is generated based on all projects

The analysis process uses AI to evaluate:

- Technical quality and execution
- Creative approach and stylistic elements
- Commercial relevance and target audience
- Professional strengths and specializations
- Portfolio coherence and creator identity

## Limitations

- **Rate Limits**: Analysis requests are limited to a configurable number per month
- **Time Between Analyses**: A minimum time period is required between analyses of the same portfolio
- **Media Size**: Video analysis may be limited by file size and duration
- **Project Count**: Very large portfolios with many projects may take longer to process

## Notes

1. Analysis jobs run asynchronously and can take several minutes to complete depending on the amount of content.
2. Progress percentage can be monitored through the job status endpoint.
3. Analysis results are stored in the database and can be retrieved even after the job completes.
4. Failed analyses will include an error message explaining the failure reason.
