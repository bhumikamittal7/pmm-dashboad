"""
GitHub API module for fetching repository data.
"""

from datetime import datetime
from typing import List, Dict

from github import Github
from github.Issue import Issue
from github.PullRequest import PullRequest


class GitHubRepositoryAnalyzer:
    """Class to interact with GitHub API and fetch repository data."""
    
    def __init__(self, token: str, owner: str, repo: str):
        """
        Initialize the GitHub repository analyzer.
        
        Args:
            token: GitHub Personal Access Token
            owner: Repository owner username
            repo: Repository name
        """
        self.github = Github(token)
        self.repo = self.github.get_repo(f"{owner}/{repo}")
        self.owner = owner
        self.repo_name = repo
    
    def fetch_issues_and_prs(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> tuple[List[Issue], List[PullRequest]]:
        """
        Fetch all issues and pull requests within the date range.
        
        Args:
            start_date: Start date for filtering
            end_date: End date for filtering
            
        Returns:
            Tuple of (issues, pull_requests) lists
        """
        issues = []
        pull_requests = []
        
        # Fetch all issues (includes PRs as they are issues in GitHub API)
        all_items = self.repo.get_issues(
            state='all',
            since=start_date
        )
        
        for item in all_items:
            # Check if the item was created within our date range
            if start_date <= item.created_at <= end_date:
                # Check if it's a pull request
                if item.pull_request is not None:
                    # Fetch the actual PR object for more details
                    pr = self.repo.get_pull(item.number)
                    pull_requests.append(pr)
                else:
                    issues.append(item)
        
        return issues, pull_requests
    
    def get_issue_data(self, issue: Issue) -> Dict:
        """Extract relevant data from an issue."""
        return {
            'number': issue.number,
            'title': issue.title,
            'state': issue.state,
            'created_at': issue.created_at,
            'closed_at': issue.closed_at,
            'user': issue.user.login if issue.user else 'Unknown',
            'labels': [label.name for label in issue.labels],
            'comments': issue.comments,
            'is_pr': False
        }
    
    def get_pr_data(self, pr: PullRequest) -> Dict:
        """Extract relevant data from a pull request."""
        return {
            'number': pr.number,
            'title': pr.title,
            'state': pr.state,
            'created_at': pr.created_at,
            'closed_at': pr.closed_at,
            'merged_at': pr.merged_at,
            'user': pr.user.login if pr.user else 'Unknown',
            'labels': [label.name for label in pr.labels],
            'comments': pr.comments,
            'review_comments': pr.review_comments,
            'body': pr.body or '',
            'is_pr': True,
            'merged': pr.merged
        }
