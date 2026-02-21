# GitHub Repository Analytics Dashboard

A Next.js dashboard for engineering leadership: analyze GitHub repository activity with 30+ metrics across pull requests, issues, contributors, and releases. Multi-page layout with executive overview, PR/issue analytics, contributor table, and KPI comparison. Deployed on Vercel.

## Features

### Multi-Page Layout
- **Top navigation bar** — Repo selector, date range picker, and nav: **Overview** | **PRs** | **Issues** | **Contributors** | **Compare**
- **Executive Overview (`/`)** — KPI cards with sparklines, activity timeline, review breakdown, throughput, and health signals (bus factor, backlog aging)
- **PR Analytics (`/prs`)** — Merge rate, review breakdown, cycle time trend, PR size distribution, size vs merge time
- **Issue Analytics (`/issues`)** — Open by label, backlog aging, bug/feature ratio, reopen rate, issue throughput
- **Contributors (`/contributors`)** — Sortable table: PRs merged/reviewed, response times, wait times, LOC added/deleted; row click → profile
- **Contributor profile (`/contributors/[username]`)** — Author and reviewer stats, PR size and merge time trends, review activity
- **Compare (`/compare`)** — KPI comparison across date ranges with sparklines and context-aware color coding

### Key Performance Indicators (30+)
- **PR**: Merge rate, comment rate, pick-up time, avg PR size, open-to-approval, open-to-merge, review breakdown (approved/changes requested/commented)
- **Quality**: Release rate, defect rate (% merged PRs linked to bugs)
- **Issues**: Bug/feature ratio, new/closed per week, avg time to close, reopen rate, backlog aging buckets
- **Counts**: Total/open/closed issues and PRs, avg issue resolution time, avg PR merge time
- **Contributor**: Per-user author/reviewer metrics, rework rate, bus factor alerts

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
- **Next.js API routes**: Fetch issues, PRs, reviews, commits, and releases with rate-limit handling
- **Versioned cache**: Server file cache + optional client cache; raw data cached, KPIs computed on read
- **Rate limiter**: Parses GitHub rate-limit headers, throttles and backoff on 403/429

## Tech Stack

- **Next.js**: React framework and API routes
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: React charting library

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
   - Enter your repository in the format `owner/repo` in the top bar (repo selector)
   - Select the date range (compact picker: presets or custom)
   - Click "Fetch Repository Data"

4. **Explore the dashboard:**
   - **Overview**: KPIs with sparklines, activity timeline, review breakdown, health signals
   - **PRs**: Merge rate, review breakdown, cycle time, size distribution
   - **Issues**: Open by label, backlog aging, bug/feature ratio, reopen rate
   - **Contributors**: Sortable table; click a row for individual profile
   - **Compare**: Compare KPIs across two date ranges

## Project Structure

```
pm-dashboard/
├── app/
│   ├── api/fetch-data/   # Fetches issues, PRs, reviews, commits, releases
│   ├── components/       # TopNavBar, DateRangePicker, KPICards, KPICard, DataTables
│   │   └── charts/       # Timeline, Throughput, Labels, ReviewBreakdown, BacklogAging,
│   │                     # ContributorTable, BusFactor, PR size/merge charts, etc.
│   ├── context/          # DashboardContext (repo, date range, data, fetchData)
│   ├── lib/              # metrics.ts, dataCache.ts, rateLimiter.ts, formatters, api
│   ├── layout.tsx        # Root layout with DashboardContext + TopNavBar
│   ├── page.tsx          # Executive overview (/)
│   ├── prs/page.tsx      # PR analytics
│   ├── issues/page.tsx   # Issue analytics
│   ├── contributors/     # Table + [username] profile
│   └── compare/page.tsx  # KPI comparison
├── types/index.ts        # Raw and computed types (PR, PRReview, Release, ComputedKPIs, etc.)
├── SPEC.md               # Full project specification (architecture, metrics, schema)
├── package.json
├── vercel.json
└── README.md
```

## Module Descriptions

### `app/context/DashboardContext.tsx`
- Shared state: repository, date range, raw and processed data, loading, error
- `fetchData(forceRefresh?)` used by all pages; single source of truth for config and data

### `app/lib/metrics.ts`
- All 30+ metric formulas: merge rate, pick-up time, defect rate, contributor metrics, etc.
- Computed from raw cached data (cache raw, compute on read)

### `app/api/fetch-data/route.ts`
- Fetches issues, PRs, PR reviews, commit counts, releases (and optional issue events)
- Uses `app/lib/rateLimiter.ts` for throttling and backoff

### `app/components/TopNavBar.tsx`
- Navigation links, compact date range picker, repo selector
- Replaces the previous sidebar configuration

### `app/components/charts/`
- Recharts-based charts: Timeline, Throughput, Labels, ReviewBreakdown, BacklogAging, ContributorTable, BusFactor, PR size and merge time charts

For full architecture, data schema, and metric definitions, see **[SPEC.md](./SPEC.md)**.

## Metrics Explained

### Key Performance Indicators

- **Counts**: Total/open/closed issues; total/open/merged PRs
- **Avg Issue Resolution Time**: Average time (days) from issue creation to closure
- **Avg PR Merge Time**: Average time (days) from PR creation to merge
- **Merge Rate**: Merged PRs in range ÷ weekdays in range
- **Pick-up Time**: Median time to first human review (excludes bots)
- **Open-to-Approval**: Median time from PR open to first approval
- **Open-to-Merge**: Median time from PR open to merge
- **Avg PR Size**: Mean additions + deletions (PRs ≤ 2500 LOC)
- **Review Breakdown**: Counts of reviews by state (approved / changes requested / commented)
- **Release Rate**: Non-draft releases per week; **Defect Rate**: % merged PRs linked to bug issues
- **Issue metrics**: Bug/feature ratio, new/closed per week, reopen rate, backlog aging buckets

See **[SPEC.md](./SPEC.md)** for full metric definitions and edge cases.

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
