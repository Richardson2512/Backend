# InsightSnap Backend API

A robust Node.js backend API for social media research and content analysis.

## Quick Start

1. **Clone this repository**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```
4. **Start the server:**
   ```bash
   npm run dev
   ```

## Environment Variables

### Local Development

Create a `.env` file with:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
SCRAPECREATORS_API_KEY=your_scrapecreators_api_key_here
```

### Production on Railway

Set these in Railway dashboard:

```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://insightsnap.co
GROQ_API_KEY=your_groq_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
SCRAPECREATORS_API_KEY=your_scrapecreators_api_key_here
```

**⚠️ Important:** 
- `GROQ_API_KEY` - Primary AI service (Llama 3.1 70B via Groq API)
- `OLLAMA_BASE_URL` - Backup AI service (Llama 3.1 8B self-hosted, use `http://localhost:11434` if co-located)
- `SCRAPECREATORS_API_KEY` - Required for social media scraping

## API Endpoints

- `POST /api/search` - Main search endpoint
- `GET /health` - Health check
- `GET /api/reddit/health` - Reddit service status
- `GET /api/x/health` - X service status

## Deployment

This backend is designed to be deployed on Railway, Heroku, or similar platforms.

### Railway Deployment

1. **Deploy Backend Service:**
   - Connect this repository to Railway
   - Set environment variables in Railway dashboard (see above)
   - Deploy automatically

2. **Deploy Ollama Service (Backup - Optional but Recommended):**
   - Ollama runs in the same Railway service as backend (co-located)
   - Models are pulled automatically on startup via `start-railway.sh`
   - Backup model: Llama 3.1 8B (~4.7GB)
   - Primary AI: Groq API (Llama 3.1 70B) - no deployment needed

### Environment Variables for Production

Set these in Railway dashboard for **backend service**:

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Set to `production`
- `GROQ_API_KEY` - **Your Groq API key** (Primary AI - Llama 3.1 70B)
- `OLLAMA_BASE_URL` - Set to `http://localhost:11434` (Backup AI - Llama 3.1 8B, co-located)
- `SCRAPECREATORS_API_KEY` - **Your ScrapeCreators API key** (for Reddit, X/Twitter, YouTube, LinkedIn, Threads)
- `FRONTEND_URL` - Your frontend URL (`https://insightsnap.co`)

**Note:** 
- Groq API is primary (fast, free tier: 14,400 requests/day)
- Ollama runs in same service as backup (automatic fallback if Groq fails)
- Models are pulled automatically on startup

## Features

- Multi-platform search (Reddit, X/Twitter, YouTube, LinkedIn, Threads via ScrapeCreators API)
- AI-powered content categorization
- Rate limiting and security
- Comprehensive error handling
- Detailed logging

## License

MIT