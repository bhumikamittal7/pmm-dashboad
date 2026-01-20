# Local Development Setup

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# .env.local
GITHUB_TOKEN=your_github_personal_access_token_here

# Optional: Set default repository (will be pre-filled in the UI)
GITHUB_REPOSITORY=owner/repo
# OR use separate variables:
# GITHUB_OWNER=owner
# GITHUB_REPO=repo
```

**To get a GitHub Personal Access Token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "PM Dashboard")
4. Select scopes: `public_repo` (or `repo` for private repos)
5. Click "Generate token"
6. Copy the token and paste it in `.env.local`

### 3. Run the Development Server

```bash
npm run dev
```

### 4. Open in Browser

The app will be available at: **http://localhost:3000**

## Usage

1. **Enter Repository**: Type your repository in the format `owner/repo` (e.g., `facebook/react`)
2. **Select Date Range**: Choose the start and end dates for analysis
3. **Fetch Data**: Click "Fetch Repository Data" button
4. **Explore**: View KPIs, charts, and detailed tables

## Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server (after build)
- `npm run lint` - Run ESLint

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, Next.js will automatically try the next available port (3001, 3002, etc.).

### GitHub Token Issues

- Make sure your token has the correct permissions
- Check that the token is correctly set in `.env.local`
- Restart the dev server after changing `.env.local`

### Build Errors

- Make sure Node.js 18+ is installed: `node --version`
- Delete `node_modules` and `.next` folder, then run `npm install` again

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | Your GitHub Personal Access Token |
| `GITHUB_REPOSITORY` | No | Default repository in format `owner/repo` (pre-fills UI) |
| `GITHUB_OWNER` | No | Alternative: Repository owner (use with `GITHUB_REPO`) |
| `GITHUB_REPO` | No | Alternative: Repository name (use with `GITHUB_OWNER`) |

**Examples:**
```bash
# Option 1: Single variable
GITHUB_REPOSITORY=facebook/react

# Option 2: Separate variables
GITHUB_OWNER=facebook
GITHUB_REPO=react
```

Note: `.env.local` is already in `.gitignore` and won't be committed to git.
