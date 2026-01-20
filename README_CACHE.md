# Local Data Cache

This application includes a local caching system that stores GitHub repository data to reduce API calls.

## How It Works

1. **Cache Storage**: Data is stored in `data/github-data-cache.json` (this directory is git-ignored)
2. **Automatic Cache Check**: When you request data for a date range, the system first checks if cached data covers that range
3. **Cache Hit**: If cached data exists and covers the requested range, it's used immediately (no API calls)
4. **Cache Miss**: If cached data doesn't cover the range, the system:
   - Fetches missing data from GitHub API
   - Merges it with existing cache
   - Updates the cache file

## Initializing the Cache

To pre-populate the cache with the last year of data, run:

```bash
GITHUB_REPOSITORY=owner/repo GITHUB_TOKEN=your_token npx tsx scripts/initialize-cache.ts
```

Or if you have the environment variables set in `.env.local`:

```bash
npx tsx scripts/initialize-cache.ts
```

**Note**: You may need to install `tsx` first:
```bash
npm install -D tsx
```

## Cache Benefits

- **Faster Load Times**: Cached data loads instantly without API calls
- **Reduced API Rate Limits**: Fewer requests to GitHub API
- **Offline Capability**: Once cached, data is available even if GitHub API is temporarily unavailable
- **Cost Savings**: Reduces API usage

## Cache Management

- The cache file is automatically created in the `data/` directory
- The cache is automatically updated when new data is fetched
- To clear the cache, simply delete `data/github-data-cache.json`
- The cache stores the date range it covers, so partial ranges are handled correctly

## Important Notes

- **Local Development Only**: The file-based cache works in local development
- **Production/Serverless**: For Vercel or other serverless environments, consider using:
  - A database (PostgreSQL, MongoDB)
  - Object storage (S3, Cloud Storage)
  - Redis or similar caching service
- The cache is repository-specific (one cache file per repository)
