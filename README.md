# Creative Talent Search Platform

A full-stack application for discovering creative professionals using AI-powered search.

## Prerequisites

- Node.js >= 20
- npm

## Setup

1. Clone the repository:

```bash
git clone https://github.com/bachdumpling/muse-app.git
cd muse-app
```

2. Install dependencies:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd app/client
npm install

# Install API dependencies
cd ../api
npm install
```

3. Environment Setup:

Create `.env` files:

**For API (app/api/.env):**

```
PORT=8000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:3000
```

**For Client (app/client/.env.local):**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

Run both client and API servers concurrently:

```bash
npm run dev
```

This will start:

- Client server at http://localhost:3000
- API server at http://localhost:8000

## Building for Production

```bash
npm run build
```

## Project Structure

```
.
├── app/
│   ├── client/          # Next.js frontend
│   └── api/            # Express backend
├── packages/           # Shared packages
└── package.json        # Root package.json
```