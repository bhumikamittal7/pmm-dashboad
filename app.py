"""
GitHub Repository Analytics Dashboard
Main Streamlit application for analyzing GitHub repository data.
"""

import os
import streamlit as st
from datetime import datetime, timedelta

import pandas as pd

from github_api import GitHubRepositoryAnalyzer
from data_processor import DataProcessor
from visualizations import Visualizations

# Cache configuration
CACHE_TTL = 3600  # 1 hour cache for expensive operations

# Page configuration
st.set_page_config(
    page_title="GitHub Repository Analytics",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for clean, minimal aesthetic
st.markdown("""
<style>
    /* Clean typography */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* Light theme background */
    .stApp {
        background-color: #ffffff;
    }

    /* Clean sidebar styling - using more stable selectors */
    [data-testid="stSidebar"] {
        background-color: #f9fafb !important;
        border-right: 1px solid #e5e7eb !important;
    }

    /* Clean main content area */
    .main .block-container {
        padding-top: 2rem;
        padding-left: 2rem;
        padding-right: 2rem;
        max-width: none;
    }

    /* Clean metric cards */
    .metric-container {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        margin: 0.5rem 0;
    }

    /* Clean headers */
    h1, h2, h3 {
        color: #111827 !important;
        font-weight: 600 !important;
        margin-bottom: 1rem !important;
    }

    /* Subtle text colors */
    p, span, div {
        color: #374151;
    }

    /* Clean buttons */
    .stButton button {
        background-color: #6366f1 !important;
        color: white !important;
        border: none !important;
        border-radius: 6px !important;
        font-weight: 500 !important;
        transition: background-color 0.2s ease !important;
    }

    .stButton button:hover {
        background-color: #4f46e5 !important;
    }

    /* Clean form elements */
    .stTextInput input, .stSelectbox select, .stDateInput input {
        border: 1px solid #d1d5db !important;
        border-radius: 6px !important;
        background-color: #ffffff !important;
    }

    /* Clean info/warning messages */
    .stAlert {
        border: 1px solid #e5e7eb !important;
        border-radius: 8px !important;
        border-left: 4px solid #6366f1 !important;
    }

    /* Sidebar specific styling */
    [data-testid="stSidebar"] .stMarkdown h3 {
        color: #111827 !important;
        font-weight: 600 !important;
        margin-bottom: 1rem !important;
    }

    [data-testid="stSidebar"] .stSuccess {
        background-color: #f0f9ff !important;
        border: 1px solid #0ea5e9 !important;
        color: #0c4a6e !important;
    }

    [data-testid="stSidebar"] .stError {
        background-color: #fef2f2 !important;
        border: 1px solid #ef4444 !important;
        color: #7f1d1d !important;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'analyzer' not in st.session_state:
    st.session_state.analyzer = None
if 'issues_data' not in st.session_state:
    st.session_state.issues_data = []
if 'prs_data' not in st.session_state:
    st.session_state.prs_data = []


def main():
    """Main application function."""
    # Load configuration from Streamlit secrets (for deployment) or environment variables (for local development)

    # Try to get secrets, but handle missing secrets gracefully
    github_token = ""
    repository_input = ""

    try:
        # Check if we're running on Streamlit Cloud (secrets available)
        if hasattr(st, 'secrets') and st.secrets:
            github_token = st.secrets.get("GITHUB_TOKEN", "")
            repository_input = st.secrets.get("GITHUB_REPOSITORY", "")
            if not repository_input:
                # Construct from separate owner/repo if available
                owner = st.secrets.get("GITHUB_OWNER", "")
                repo = st.secrets.get("GITHUB_REPO", "")
                repository_input = f"{owner}/{repo}" if owner and repo else ""
    except Exception:
        # If secrets fail for any reason, continue to fallback
        pass

    # Fallback to environment variables for local development
    if not github_token:
        github_token = os.getenv("GITHUB_TOKEN", "")

    if not repository_input:
        repository_input = os.getenv("GITHUB_REPOSITORY", "")
        if not repository_input:
            owner = os.getenv("GITHUB_OWNER", "")
            repo = os.getenv("GITHUB_REPO", "")
            repository_input = f"{owner}/{repo}" if owner and repo else ""
    
    # Sidebar for configuration
    with st.sidebar:
        st.header("🔧 Configuration")

        # Repository Configuration Section
        st.subheader("📁 Repository Settings")

        # Display configuration status
        if repository_input:
            st.success(f"**Repository:** {repository_input}")
        else:
            st.error("❌ Repository not configured.")
            st.info("Set `GITHUB_REPOSITORY` (format: owner/repo) or `GITHUB_OWNER` + `GITHUB_REPO` in secrets.")

        if github_token:
            # Show token status without revealing the actual token
            masked_token = github_token[:8] + "..." + github_token[-4:] if len(github_token) > 12 else "***"
            st.success(f"✅ GitHub token configured: `{masked_token}`")
        else:
            st.error("❌ GitHub token not configured.")
            with st.expander("🔑 How to set up secrets"):
                st.markdown("""
                ### For Streamlit Cloud:
                1. Go to your app dashboard
                2. Click **"Manage app"** (bottom right)
                3. Go to **"Secrets"** section
                4. Add these secrets:
                ```
                GITHUB_TOKEN = "your_github_personal_access_token"
                GITHUB_REPOSITORY = "owner/repository-name"
                ```

                ### For Local Development:
                Create a `.env` file with:
                ```
                GITHUB_TOKEN=your_github_token_here
                GITHUB_REPOSITORY=owner/repository_name
                ```
                """)
            return  # Stop execution if no token is configured

        # Security and help information
        with st.expander("🔒 Security & Configuration"):
            st.markdown("""
            ### 🔑 For Local Development
            Create a `.env` file in your project root:
            ```bash
            GITHUB_TOKEN=your_github_personal_access_token_here
            GITHUB_REPOSITORY=owner/repository_name
            ```

            ### 🚀 For Streamlit Cloud Deployment
            Add secrets in your Streamlit Cloud dashboard:
            - `GITHUB_TOKEN` (required)
            - `GITHUB_REPOSITORY` (format: owner/repo) OR
            - `GITHUB_OWNER` + `GITHUB_REPO` (separate)

            ### ⚠️ Security Best Practices
            - 🔐 **Never commit tokens** to version control
            - 🔄 **Rotate tokens regularly** for security
            - 👁️ **Use minimal required permissions** on your PAT
            - 🌐 **Keep tokens private** - treat them like passwords

            ### 📊 API Usage
            - **Rate Limits**: 5,000 requests/hour (authenticated)
            - **Caching**: Data is cached for 1 hour to minimize API calls
            - **Costs**: GitHub API is free for public repos, paid for private
            """)

        # Show current configuration status for debugging
        if st.checkbox("🔍 Show Configuration Status", value=True):
            st.markdown("**Current Configuration:**")
            config_status = []
            config_status.append(f"✅ GitHub Token: {'Configured' if github_token else '❌ Missing'}")
            config_status.append(f"✅ Repository: {'Configured' if repository_input else '❌ Missing'}")
            if repository_input:
                config_status.append(f"   Repository: `{repository_input}`")

            for status in config_status:
                st.code(status, language="text")

        with st.expander("❓ Troubleshooting"):
            st.markdown("""
            ### Common Issues:
            - **401 Unauthorized**: Check your GitHub token is valid
            - **403 Forbidden**: Token lacks required permissions
            - **404 Not Found**: Repository doesn't exist or is private
            - **Rate Limited**: Wait and retry, or use a different token

            ### Performance Tips:
            - 📅 **Smaller date ranges** = faster loading
            - 🔄 **Use cached data** when possible
            - 📊 **Limit to recent data** for best performance
            """)

        st.markdown("---")

        # Date Range Selection
        st.subheader("📅 Date Range")
        default_end = datetime.now()
        default_start = default_end - timedelta(days=30)

        col_start, col_end = st.columns(2)
        with col_start:
            start_date = st.date_input(
                "Start Date",
                value=default_start,
                max_value=datetime.now().date(),
                help="Select the start date for analysis"
            )

        with col_end:
            end_date = st.date_input(
                "End Date",
                value=default_end,
                max_value=datetime.now().date(),
                help="Select the end date for analysis"
            )

        # Validate date range
        if start_date > end_date:
            st.error("⚠️ Start date must be before end date!")
            return

        # Validate date range is reasonable (not too large to prevent API abuse)
        date_range_days = (end_date - start_date).days
        if date_range_days > 365:
            st.warning("⚠️ Large date range selected (>1 year). This may take longer to process and use more API calls.")
        elif date_range_days < 1:
            st.error("❌ Date range must be at least 1 day.")
            return

        # Fetch button with improved styling
        st.markdown("---")
        fetch_button = st.button(
            "🚀 Fetch Repository Data",
            type="primary",
            use_container_width=True,
            help="Load data from GitHub for the selected date range"
        )

        # Instructions section
        if not fetch_button:
            st.markdown("---")
            st.markdown("### 📖 How to Use")
            st.markdown("""
            <div style="
                background: #f8fafc;
                padding: 1rem;
                border-radius: 6px;
                border-left: 3px solid #6366f1;
                margin-top: 1rem;
            ">
                <div style="color: #374151; line-height: 1.6; font-size: 0.9rem;">
                    <strong style="color: #111827;">1.</strong> Select your desired date range above<br>
                    <strong style="color: #111827;">2.</strong> Click "Fetch Repository Data" to load analytics<br>
                    <strong style="color: #111827;">3.</strong> Explore the comprehensive dashboard below
                </div>
            </div>
            """, unsafe_allow_html=True)
    
    st.title("GitHub Repository Analytics Dashboard")
    st.markdown("---")
    
    # Configuration is already loaded above
    
    # Main content area
    if fetch_button or (st.session_state.analyzer is not None and st.session_state.issues_data):
        # Validate configuration (additional check in case secrets were set after initial load)
        if not github_token:
            st.error("❌ GitHub Personal Access Token not found.")
            st.info("Please configure your secrets as shown in the sidebar.")
            return

        if not repository_input or '/' not in repository_input:
            st.error("❌ Repository not configured properly.")
            st.info("Please set GITHUB_REPOSITORY (format: owner/repo) in your secrets.")
            return

        # Validate repository format
        try:
            owner, repo = repository_input.split('/', 1)
            if not owner or not repo:
                raise ValueError("Empty owner or repo")
        except ValueError:
            st.error("❌ Invalid repository format. Use format: owner/repository")
            st.info("💡 Example: 'octocat/Hello-World' or 'microsoft/vscode'")
            return

        # Validate token format (basic check)
        if not github_token.startswith(('ghp_', 'github_pat_')) and len(github_token) < 20:
            st.warning("⚠️ GitHub token format looks unusual. Please ensure it's a valid Personal Access Token.")
        
        # Create cache key for this specific request
        cache_key = f"{repository_input}_{start_date}_{end_date}"

        # Check if we already have this data cached
        if (st.session_state.analyzer is not None and
            st.session_state.issues_data and
            getattr(st.session_state, 'cache_key', None) == cache_key):
            st.info("📋 Using cached data for this date range.")
        else:
            # Show loading spinner
            with st.spinner(f"🔄 Fetching data from {owner}/{repo}..."):
                try:
                    # Initialize analyzer
                    analyzer = GitHubRepositoryAnalyzer(github_token, owner, repo)
                    st.session_state.analyzer = analyzer

                    # Convert dates to datetime
                    start_datetime = datetime.combine(start_date, datetime.min.time())
                    end_datetime = datetime.combine(end_date, datetime.max.time())

                    # Fetch issues and PRs with progress updates
                    progress_bar = st.progress(0)
                    progress_bar.progress(10, text="Connecting to GitHub API...")

                    issues, prs = analyzer.fetch_issues_and_prs(start_datetime, end_datetime)
                    progress_bar.progress(50, text="Processing issues and pull requests...")

                    # Convert to dictionaries
                    issues_data = [analyzer.get_issue_data(issue) for issue in issues]
                    prs_data = [analyzer.get_pr_data(pr) for pr in prs]

                    progress_bar.progress(90, text="Finalizing data...")

                    # Store in session state
                    st.session_state.issues_data = issues_data
                    st.session_state.prs_data = prs_data
                    st.session_state.cache_key = cache_key

                    progress_bar.progress(100, text="Complete!")
                    progress_bar.empty()

                    # Success message with summary
                    total_items = len(issues_data) + len(prs_data)
                    st.success(f"✅ Successfully fetched {len(issues_data)} issues and {len(prs_data)} pull requests ({total_items} total items)!")

                except Exception as e:
                    error_msg = str(e)
                    if "404" in error_msg or "Not Found" in error_msg:
                        st.error("❌ Repository not found. Please check the repository name and ensure it exists.")
                        st.info("💡 Make sure the repository is public or your token has access to it.")
                    elif "401" in error_msg or "Unauthorized" in error_msg:
                        st.error("❌ Authentication failed. Please check your GitHub token.")
                        st.info("💡 Ensure your Personal Access Token has the necessary permissions.")
                    elif "403" in error_msg or "rate limit" in error_msg.lower():
                        st.error("❌ API rate limit exceeded. Please wait and try again.")
                        st.info("💡 GitHub API has rate limits. Consider using a token for higher limits.")
                    else:
                        st.error(f"❌ Error fetching data: {error_msg}")
                        st.info("💡 Please check your configuration and try again.")
                    return
        
        # Process data with caching
        @st.cache_data(ttl=CACHE_TTL)
        def process_dataframes(issues_data, prs_data):
            processor = DataProcessor()
            return processor.create_dataframes(issues_data, prs_data)

        @st.cache_data(ttl=CACHE_TTL)
        def calculate_kpis_cached(issues_df, prs_df):
            processor = DataProcessor()
            return processor.calculate_kpis(issues_df, prs_df)

        with st.spinner("📊 Processing data..."):
            issues_df, prs_df = process_dataframes(
                st.session_state.issues_data,
                st.session_state.prs_data
            )

            # Calculate KPIs
            kpis = calculate_kpis_cached(issues_df, prs_df)
        
        # Display KPIs with clean styling
        st.markdown("## Key Performance Indicators")

        # KPI cards in a responsive grid (2 rows of 4 columns each)
        kpi_data = [
            ("Total Issues", kpis['total_issues'], "#6366f1"),
            ("Open Issues", kpis['open_issues'], "#4f46e5"),
            ("Closed Issues", kpis['closed_issues'], "#3730a3"),
            ("Total PRs", kpis['total_prs'], "#6366f1"),
            ("Open PRs", kpis['open_prs'], "#4f46e5"),
            ("Merged PRs", kpis['merged_prs'], "#3730a3"),
            ("Avg Issue Resolution", f"{kpis['avg_issue_resolution_days']:.1f}d" if kpis['avg_issue_resolution_days'] > 0 else "N/A", "#10b981"),
            ("Avg PR Merge Time", f"{kpis['avg_pr_merge_days']:.1f}d" if kpis['avg_pr_merge_days'] > 0 else "N/A", "#f59e0b")
        ]

        # First row of KPIs
        kpi_cols_1 = st.columns(4)
        for i in range(4):
            label, value, color = kpi_data[i]
            with kpi_cols_1[i]:
                st.markdown(
                    f"""
                    <div style="
                        background-color: #ffffff;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        padding: 16px;
                        margin: 4px 0;
                        text-align: center;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        transition: box-shadow 0.2s ease;
                    ">
                        <div style="color: {color}; font-size: 24px; font-weight: bold; margin-bottom: 4px;">{value}</div>
                        <div style="color: #6b7280; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">{label}</div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )

        # Second row of KPIs
        kpi_cols_2 = st.columns(4)
        for i in range(4, 8):
            label, value, color = kpi_data[i]
            with kpi_cols_2[i-4]:
                st.markdown(
                    f"""
                    <div style="
                        background-color: #ffffff;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        padding: 16px;
                        margin: 4px 0;
                        text-align: center;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        transition: box-shadow 0.2s ease;
                    ">
                        <div style="color: {color}; font-size: 24px; font-weight: bold; margin-bottom: 4px;">{value}</div>
                        <div style="color: #6b7280; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">{label}</div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )

        st.markdown("<br>", unsafe_allow_html=True)
        
        # Create data for all charts with caching
        @st.cache_data(ttl=CACHE_TTL)
        def get_labels_data(issues_df, prs_df):
            return processor.extract_labels_frequency(issues_df, prs_df)

        @st.cache_data(ttl=CACHE_TTL)
        def get_leaderboard_data(issues_df, prs_df):
            return processor.create_contributor_leaderboard(issues_df, prs_df)

        @st.cache_data(ttl=CACHE_TTL)
        def get_timeline_data(issues_df, prs_df):
            return processor.create_timeline_data(issues_df, prs_df)

        @st.cache_data(ttl=CACHE_TTL)
        def get_throughput_data(issues_df, prs_df, start_dt, end_dt):
            return processor.create_throughput_data(issues_df, prs_df, start_dt, end_dt)

        @st.cache_data(ttl=CACHE_TTL)
        def get_cycle_time_data(prs_df, start_dt, end_dt):
            return processor.create_cycle_time_data(prs_df, start_dt, end_dt)

        @st.cache_data(ttl=CACHE_TTL)
        def get_aging_data(issues_df):
            return processor.create_issue_aging_data(issues_df, datetime.now())

        with st.spinner("📈 Generating analytics..."):
            labels_df = get_labels_data(issues_df, prs_df)
            leaderboard_df = get_leaderboard_data(issues_df, prs_df)
            timeline_df = get_timeline_data(issues_df, prs_df)
            throughput_df = get_throughput_data(issues_df, prs_df, start_datetime, end_datetime)
            cycle_time_df = get_cycle_time_data(prs_df, start_datetime, end_datetime)
            aging_df = get_aging_data(issues_df)

        # Charts layout in clean grid
        st.markdown("## Analytics Dashboard")

        # Row 1: Throughput and Cycle Time
        st.markdown("### Performance Metrics")
        col1, col2 = st.columns(2)
        with col1:
            if not throughput_df.empty:
                throughput_chart = Visualizations.create_throughput_chart(throughput_df)
                st.plotly_chart(throughput_chart, use_container_width=True)
            else:
                st.info("No throughput data available for the selected date range.")

        with col2:
            if not cycle_time_df.empty:
                cycle_time_chart = Visualizations.create_cycle_time_chart(cycle_time_df)
                st.plotly_chart(cycle_time_chart, use_container_width=True)
            else:
                st.info("No cycle time data available for merged PRs.")

        # Row 2: Contributors and Label Distribution
        st.markdown("### Contribution & Organization")
        col3, col4 = st.columns(2)
        with col3:
            if not leaderboard_df.empty:
                contributor_chart = Visualizations.create_contributor_chart(leaderboard_df)
                st.plotly_chart(contributor_chart, use_container_width=True)
            else:
                st.info("No contributor data found.")

        with col4:
            if not labels_df.empty:
                labels_chart = Visualizations.create_labels_chart(labels_df)
                st.plotly_chart(labels_chart, use_container_width=True)
            else:
                st.info("No labels found in the selected date range.")

        # Row 3: Issue Aging and Timeline
        st.markdown("### Trends & Aging")
        col5, col6 = st.columns(2)
        with col5:
            if not aging_df.empty:
                aging_chart = Visualizations.create_issue_aging_chart(aging_df)
                st.plotly_chart(aging_chart, use_container_width=True)
            else:
                st.info("No issue aging data available.")

        with col6:
            if not timeline_df.empty:
                timeline_chart = Visualizations.create_timeline_chart(timeline_df)
                st.plotly_chart(timeline_chart, use_container_width=True)
            else:
                st.info("No timeline data available.")
        
        # PR-Issue Linkage
        st.markdown("---")
        st.markdown("### PR-Issue Linkage")
        linkage_df = processor.extract_pr_issue_linkage(prs_df)
        if not linkage_df.empty:
            st.dataframe(
                linkage_df,
                use_container_width=True,
                hide_index=True
            )
        else:
            st.info("No PR-Issue linkages found. PRs may not reference issues in their descriptions.")
        
        # Detailed tables
        st.markdown("---")
        tab1, tab2 = st.tabs(["Issues Details", "Pull Requests Details"])
        
        with tab1:
            if not issues_df.empty:
                display_issues_df = issues_df[['number', 'title', 'state', 'user', 'created_at', 'labels']].copy()
                display_issues_df['created_at'] = pd.to_datetime(display_issues_df['created_at']).dt.strftime('%Y-%m-%d %H:%M')
                display_issues_df['labels'] = display_issues_df['labels'].apply(lambda x: ', '.join(x) if x else 'None')
                display_issues_df.columns = ['Number', 'Title', 'State', 'Creator', 'Created At', 'Labels']
                st.dataframe(display_issues_df, use_container_width=True, hide_index=True)
            else:
                st.info("No issues found in the selected date range.")
        
        with tab2:
            if not prs_df.empty:
                display_prs_df = prs_df[['number', 'title', 'state', 'user', 'created_at', 'merged', 'labels']].copy()
                display_prs_df['created_at'] = pd.to_datetime(display_prs_df['created_at']).dt.strftime('%Y-%m-%d %H:%M')
                display_prs_df['merged'] = display_prs_df['merged'].apply(lambda x: 'Yes' if x else 'No')
                display_prs_df['labels'] = display_prs_df['labels'].apply(lambda x: ', '.join(x) if x else 'None')
                display_prs_df.columns = ['Number', 'Title', 'State', 'Creator', 'Created At', 'Merged', 'Labels']
                st.dataframe(display_prs_df, use_container_width=True, hide_index=True)
            else:
                st.info("No pull requests found in the selected date range.")
    
    else:
        # Welcome screen with clean design
        st.markdown("""
        <style>
        .welcome-hero {
            text-align: center;
            padding: 3rem 1rem;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            margin: 2rem 0;
            border: 1px solid #e2e8f0;
        }
        .welcome-title {
            color: #111827;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .welcome-subtitle {
            font-size: 1.1rem;
            color: #64748b;
            margin-bottom: 2rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            line-height: 1.6;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .feature-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            text-align: center;
            transition: box-shadow 0.2s ease;
        }
        .feature-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .feature-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        .feature-title {
            color: #111827;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
            font-weight: 600;
        }
        .feature-desc {
            color: #6b7280;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        .get-started {
            background: #f8fafc;
            padding: 2rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            text-align: center;
            margin: 2rem 0;
        }
        .get-started h3 {
            color: #111827;
            margin-bottom: 1rem;
        }
        .get-started p {
            color: #64748b;
            margin-bottom: 1rem;
        }
        .arrow-indicator {
            font-size: 1.5rem;
            margin: 1rem 0;
        }
        .sidebar-hint {
            color: #6366f1;
            font-weight: 500;
        }
        </style>

        <div class="welcome-hero">
            <h1 class="welcome-title">📊 GitHub Repository Analytics</h1>
            <p class="welcome-subtitle">
                Gain deep insights into your repository's performance with comprehensive analytics
                on throughput, cycle time, contributions, and issue management.
            </p>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">📈</div>
                <h3 class="feature-title">Throughput Analysis</h3>
                <p class="feature-desc">Track PR merges vs issue closures over time</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">⚡</div>
                <h3 class="feature-title">Cycle Time Metrics</h3>
                <p class="feature-desc">Monitor PR merge time efficiency</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">👥</div>
                <h3 class="feature-title">Contributor Insights</h3>
                <p class="feature-desc">Top contributor leaderboard</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🏷️</div>
                <h3 class="feature-title">Label Analytics</h3>
                <p class="feature-desc">Label distribution and usage patterns</p>
            </div>
        </div>

        <div class="get-started">
            <h3>🚀 Get Started</h3>
            <p>Configure your repository settings and select a date range to begin analyzing your GitHub data.</p>
            <div class="arrow-indicator">👈</div>
            <p class="sidebar-hint">Use the sidebar to configure and fetch your data</p>
        </div>
        """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()
