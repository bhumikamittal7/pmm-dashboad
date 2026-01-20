# GitHub Repository Analytics Dashboard

A comprehensive Next.js-based dashboard for analyzing GitHub repository activity, including issues, pull requests, contributor activity, and more. Deployed on Vercel with Python serverless functions.

## Features

### Analytics Dashboard
- **Throughput Analysis**: Bar chart showing PRs merged vs Issues closed over time
- **Cycle Time Metrics**: Line graph displaying average time from PR creation to merge
- **Contributor Leaderboard**: Horizontal bar chart ranking top contributors by activity
- **Label Distribution**: Donut chart showing frequency of labels (bug, feature, debt, etc.)
- **Issue Aging**: Histogram showing issues by age buckets (0-7 days, 7-30 days, 30+ days)
- **Activity Timeline**: Line chart showing repository activity trends over time

### Key Performance Indicators
- Total/Open/Closed Issues count
- Total/Open/Merged Pull Requests count
- Average Issue Resolution Time
- Average PR Merge Time
- Real-time KPI cards with clean visual design

### Security & Authentication
- **Secure Authentication**: GitHub Personal Access Token (PAT) support
- **Environment Variables**: Local development with `.env` files
- **Vercel Environment Variables**: Secure deployment with encrypted secrets
- **Token Validation**: Automatic format checking and masked display

### User Experience
- **Clean UI**: Modern light theme with professional styling
- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Charts**: Hover tooltips and dynamic updates
- **Progress Indicators**: Loading states and progress bars
- **Error Handling**: Comprehensive error messages and recovery suggestions

### Performance
- **Serverless Functions**: Fast, scalable API endpoints on Vercel
- **Client-Side Caching**: Efficient data storage and reuse
- **Optimized Queries**: Minimized API calls with intelligent caching
- **Background Processing**: Non-blocking data processing

## Tech Stack

- **Next.js**: React framework for the frontend
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: React charting library
- **TypeScript**: Type-safe development throughout

## Prerequisites

- Node.js 18+ and npm/yarn
- GitHub Personal Access Token (PAT) with appropriate permissions

### Creating a GitHub Personal Access Token

1. **Go to GitHub Settings:**
   - Visit: https://github.com/settings/tokens
   - Click "Generate new token (classic)"

2. **Configure Token:**
   - **Name**: `GitHub Analytics Dashboard`
   - **Expiration**: Set to "No expiration" or choose a reasonable timeframe
   - **Scopes**: Select the following permissions:
     - `public_repo` (Access public repositories)
     - `repo` (Full access to private repositories - only if needed)
     - `read:org` (Read org membership - optional, for organization repos)

3. **Generate and Save:**
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again!)
   - Store securely - treat like a password

### API Rate Limits & Best Practices

GitHub API has rate limits that affect usage:
- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5,000 requests/hour

**Best Practices:**
- Use a Personal Access Token for higher limits
- The app caches data for 1 hour to minimize API calls
- Large date ranges may require more API calls
- Monitor your usage in GitHub Settings → Developer settings

## Deployment

### Vercel Deployment (Recommended)

1. **Fork or clone this repository to your GitHub account**

2. **Create a Vercel account** at [vercel.com](https://vercel.com)

3. **Deploy from Vercel:**
   - Click "New Project" in Vercel
   - Import your GitHub repository
   - Vercel will automatically detect Next.js
   - Click "Deploy"

4. **Configure Environment Variables in Vercel:**
   - Go to your project settings
   - Navigate to **"Environment Variables"**
   - Add the following variables:
     - **Name**: `GITHUB_TOKEN` | **Value**: Your GitHub Personal Access Token (required)
     - **Name**: `GITHUB_REPOSITORY` | **Value**: `owner/repo` (optional, pre-fills UI)
     - OR use `GITHUB_OWNER` + `GITHUB_REPO` separately
   - Click **"Save"**
   - Redeploy your application

5. **Your app will be live** at `https://your-project.vercel.app`

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd pm-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   Create a `.env.local` file in the project root:
   ```bash
   # .env.local
   GITHUB_TOKEN=your_github_personal_access_token_here
   
   # Optional: Set default repository (will be pre-filled in UI)
   GITHUB_REPOSITORY=owner/repo
   # OR use separate variables:
   # GITHUB_OWNER=owner
   # GITHUB_REPO=repo
   ```
   
   **To get a GitHub token:**
   - Visit https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select `public_repo` scope (or `repo` for private repos)
   - Copy the token and add it to `.env.local`

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser** to `http://localhost:3000`

   The app will automatically reload when you make changes.

**For detailed setup instructions, see [LOCAL_SETUP.md](./LOCAL_SETUP.md)**

## Usage

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **The application will open in your default web browser** at `http://localhost:3000`

3. **Configure and fetch data:**
   - Enter your repository in the format `owner/repo` in the sidebar
   - Select the date range (defaults to last 30 days)
   - Click "Fetch Repository Data"

4. **Explore the dashboard:**
   - View KPIs at the top
   - Analyze label frequencies
   - Check contributor activity
   - Review activity timeline
   - Examine PR-Issue linkages
   - Browse detailed issue and PR tables

## Project Structure

```
pm-dashboard/
├── app/                   # Next.js app directory
│   ├── components/       # React components
│   │   ├── charts/       # Chart components (Recharts)
│   │   ├── ConfigSidebar.tsx
│   │   ├── KPICards.tsx
│   │   └── DataTables.tsx
│   ├── lib/              # Utilities
│   │   └── api.ts        # API client
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main dashboard page
│   └── globals.css       # Global styles
├── app/
│   ├── api/              # Next.js API routes
│   │   └── fetch-data/   # Main API endpoint
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── ...
├── types/                 # TypeScript type definitions
│   └── index.ts
├── package.json          # Node.js dependencies
├── vercel.json           # Vercel configuration
└── README.md            # This file
```

## Module Descriptions

### `github_api.py`
- Handles authentication with GitHub API
- Fetches issues and pull requests within date ranges
- Extracts relevant data from GitHub objects

### `data_processor.py`
- Processes raw GitHub data into pandas DataFrames
- Calculates KPIs and metrics
- Extracts label frequencies
- Creates contributor leaderboards
- Identifies PR-Issue linkages
- Generates timeline data

### `app/page.tsx`
- Main Next.js dashboard page
- Handles user input and state management
- Displays KPIs, charts, and tables
- Manages application state with React hooks

### `app/components/charts/`
- React components using Recharts
- Creates interactive charts for all visualizations
- Responsive and accessible chart components

## Metrics Explained

### Key Performance Indicators

- **Total Issues**: All issues created in the selected date range
- **Open Issues**: Issues currently open
- **Closed Issues**: Issues that have been closed
- **Total PRs**: All pull requests created in the selected date range
- **Open PRs**: Pull requests currently open
- **Merged PRs**: Pull requests that have been merged
- **Avg Issue Resolution Time**: Average time (in days) from issue creation to closure
- **Avg PR Merge Time**: Average time (in days) from PR creation to merge

### PR-Issue Linkage

The dashboard automatically detects PR-Issue linkages by parsing PR descriptions for common patterns:
- `#123` (direct issue reference)
- `closes #123` or `closes #123`
- `fixes #123` or `fixes #123`
- `resolves #123` or `resolves #123`
- `related to #123`

## Troubleshooting

### Common Issues

1. **Environment Variables not configured**
   - **For Vercel**: Go to your project → Settings → Environment Variables → Add `GITHUB_TOKEN`
   - **For Local Development**: Create a `.env.local` file with `GITHUB_TOKEN=your_token`
   - Ensure the variable name is exactly `GITHUB_TOKEN`

2. **"Error fetching data"**
   - Verify your GitHub PAT is correct and has the right permissions
   - Check that the repository name is in the correct format (owner/repo)
   - Ensure the repository exists and is accessible
   - Check browser console and network tab for detailed error messages

3. **"No data found"**
   - Verify the date range includes dates when issues/PRs were created
   - Check that the repository has activity in the selected range

4. **Rate Limiting**
   - GitHub API has rate limits. If you hit the limit, wait a few minutes and try again
   - Consider using a PAT with higher rate limits

5. **Build errors**
   - Ensure Node.js 18+ is installed
   - Run `npm install` to install all dependencies
   - Verify `vercel.json` is correctly configured

## License

This project is open source and available for personal and commercial use.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## Support

For issues or questions, please open an issue on the repository or contact the maintainer.
