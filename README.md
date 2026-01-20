# GitHub Repository Analytics Dashboard

A comprehensive Streamlit-based dashboard for analyzing GitHub repository activity, including issues, pull requests, contributor activity, and more.

## ✨ Features

### 📊 Analytics Dashboard
- **Throughput Analysis**: Bar chart showing PRs merged vs Issues closed over time
- **Cycle Time Metrics**: Line graph displaying average time from PR creation to merge
- **Contributor Leaderboard**: Horizontal bar chart ranking top contributors by activity
- **Label Distribution**: Donut chart showing frequency of labels (bug, feature, debt, etc.)
- **Issue Aging**: Histogram showing issues by age buckets (0-7 days, 7-30 days, 30+ days)
- **Activity Timeline**: Line chart showing repository activity trends over time

### 📈 Key Performance Indicators
- Total/Open/Closed Issues count
- Total/Open/Merged Pull Requests count
- Average Issue Resolution Time
- Average PR Merge Time
- Real-time KPI cards with clean visual design

### 🔒 Security & Authentication
- **Secure Authentication**: GitHub Personal Access Token (PAT) support
- **Environment Variables**: Local development with `.env` files
- **Streamlit Secrets**: Secure deployment with encrypted secrets
- **Token Validation**: Automatic format checking and masked display

### 🎨 User Experience
- **Clean UI**: Modern light theme with professional styling
- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Charts**: Hover tooltips and dynamic updates
- **Progress Indicators**: Loading states and progress bars
- **Error Handling**: Comprehensive error messages and recovery suggestions

### ⚡ Performance
- **Smart Caching**: 1-hour TTL caching for expensive operations
- **Session Management**: Efficient data storage and reuse
- **Optimized Queries**: Minimized API calls with intelligent caching
- **Background Processing**: Non-blocking data processing

## Tech Stack

- **Streamlit**: Web application framework
- **PyGithub**: GitHub API interaction
- **Pandas**: Data processing and analysis
- **Plotly**: Interactive charts and visualizations

## Prerequisites

- Python 3.8 or higher
- GitHub Personal Access Token (PAT) with appropriate permissions

### 🔑 Creating a GitHub Personal Access Token

1. **Go to GitHub Settings:**
   - Visit: https://github.com/settings/tokens
   - Click "Generate new token (classic)"

2. **Configure Token:**
   - **Name**: `GitHub Analytics Dashboard`
   - **Expiration**: Set to "No expiration" or choose a reasonable timeframe
   - **Scopes**: Select the following permissions:
     - ✅ `public_repo` (Access public repositories)
     - ✅ `repo` (Full access to private repositories - only if needed)
     - ✅ `read:org` (Read org membership - optional, for organization repos)

3. **Generate and Save:**
   - Click "Generate token"
   - **⚠️ Copy the token immediately** (you won't see it again!)
   - Store securely - treat like a password

### ⚡ API Rate Limits & Best Practices

GitHub API has rate limits that affect usage:
- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5,000 requests/hour

**Best Practices:**
- Use a Personal Access Token for higher limits
- The app caches data for 1 hour to minimize API calls
- Large date ranges may require more API calls
- Monitor your usage in GitHub Settings → Developer settings

## 🚀 Deployment Options

### Option 1: Streamlit Cloud (Recommended)

1. **Fork or clone this repository to your GitHub account**

2. **Create a Streamlit Cloud account** at [share.streamlit.io](https://share.streamlit.io)

3. **Deploy from Streamlit Cloud:**
   - Click "New app" in Streamlit Cloud
   - Connect your GitHub account
   - Select this repository
   - Set main file path to `app.py`
   - Click "Deploy"

4. **Configure Secrets in Streamlit Cloud:**
   - Go to your deployed app
   - Click **"Manage app"** (bottom right corner)
   - Go to the **"Secrets"** section
   - Add the following secrets (one per line):
   ```
   GITHUB_TOKEN = "your_github_personal_access_token_here"
   GITHUB_REPOSITORY = "owner/repository_name"
   ```
   Or alternatively:
   ```
   GITHUB_TOKEN = "your_github_personal_access_token_here"
   GITHUB_OWNER = "repository_owner"
   GITHUB_REPO = "repository_name"
   ```
   - Click **"Save"** and **redeploy** your app

5. **Redeploy** your app after adding secrets

### Option 2: Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd pm-dashboard
   ```

2. **Activate the virtual environment:**
   ```bash
   # On macOS/Linux:
   source venv/bin/activate

   # On Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment file:**
   Create a `.env` file in the project root with your GitHub credentials:
   ```bash
   # .env
   GITHUB_TOKEN=your_github_personal_access_token_here
   GITHUB_REPOSITORY=owner/repository_name

   # Alternative: Use separate owner/repo variables
   # GITHUB_OWNER=repository_owner
   # GITHUB_REPO=repository_name
   ```

5. **Test your configuration (recommended):**
   ```bash
   python test_config.py
   ```
   This will verify your token and repository settings before running the app.

6. **Run the application:**
   ```bash
   streamlit run app.py
   ```

6. **Open your browser** to the URL shown in the terminal (usually `http://localhost:8501`)

### Option 3: Other Cloud Platforms

#### Heroku Deployment
1. Create a `Procfile`:
   ```
   web: streamlit run app.py --server.port $PORT --server.address 0.0.0.0
   ```

2. Set environment variables in Heroku dashboard or CLI:
   ```bash
   heroku config:set GITHUB_TOKEN=your_token_here
   heroku config:set GITHUB_REPOSITORY=owner/repo
   ```

#### Docker Deployment
A `Dockerfile` is included for containerized deployment:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8501

CMD ["streamlit", "run", "app.py", "--server.address", "0.0.0.0"]
```

Build and run:
```bash
docker build -t github-analytics .
docker run -p 8501:8501 -e GITHUB_TOKEN=your_token github-analytics
```

3. **Activate the virtual environment:**
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create a `.env` file in the project root:**
   ```bash
   touch .env
   ```
   
   Then add the following content to `.env`:
   ```env
   # GitHub Personal Access Token
   GITHUB_TOKEN=your_github_personal_access_token_here
   
   # Repository Information (Option 1: Use GITHUB_REPOSITORY)
   GITHUB_REPOSITORY=owner_name/repository_name
   
   # Repository Information (Option 2: Use separate owner and repo)
   # GITHUB_OWNER=owner_name
   # GITHUB_REPO=repository_name
   ```
   
   Replace `your_github_personal_access_token_here` with your actual GitHub PAT and update the repository information.

## Usage

1. **Start the Streamlit application:**
   ```bash
   streamlit run app.py
   ```

2. **The application will open in your default web browser** (usually at `http://localhost:8501`)

3. **The application will automatically load your GitHub token and repository from the `.env` file.**
   - You can override these values in the sidebar if needed
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
├── app.py                 # Main Streamlit application
├── github_api.py          # GitHub API interaction module
├── data_processor.py      # Data processing and analysis module
├── visualizations.py      # Chart and visualization module
├── requirements.txt       # Python dependencies
└── README.md             # This file
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

### `visualizations.py`
- Creates interactive Plotly charts
- Generates bar charts for labels and contributors
- Creates timeline line charts

### `app.py`
- Main Streamlit application
- Handles user input and authentication
- Displays KPIs, charts, and tables
- Manages application state

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

1. **StreamlitSecretNotFoundError / Secrets not configured**
   - **For Streamlit Cloud**: Go to your app → "Manage app" → "Secrets" → Add required secrets
   - **For Local Development**: Create a `.env` file with your credentials
   - Ensure secret names match exactly: `GITHUB_TOKEN`, `GITHUB_REPOSITORY`

2. **"Error fetching data"**
   - Verify your GitHub PAT is correct and has the right permissions
   - Check that the repository name is in the correct format (Owner/Repo)
   - Ensure the repository exists and is accessible

3. **"No data found"**
   - Verify the date range includes dates when issues/PRs were created
   - Check that the repository has activity in the selected range

4. **Rate Limiting**
   - GitHub API has rate limits. If you hit the limit, wait a few minutes and try again
   - Consider using a PAT with higher rate limits

5. **App crashes on startup**
   - Check that all required secrets are properly set
   - Verify the repository format is correct (owner/repo)
   - Ensure your GitHub token is valid

## License

This project is open source and available for personal and commercial use.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## Support

For issues or questions, please open an issue on the repository or contact the maintainer.
