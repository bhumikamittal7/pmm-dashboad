"""
Data processing module for analyzing GitHub repository data.
"""

from typing import List, Dict, Tuple
from datetime import datetime

import pandas as pd
import re


class DataProcessor:
    """Class to process and analyze GitHub repository data."""
    
    @staticmethod
    def create_dataframes(issues: List[Dict], prs: List[Dict]) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Convert lists of issues and PRs to pandas DataFrames.
        
        Args:
            issues: List of issue dictionaries
            prs: List of PR dictionaries
            
        Returns:
            Tuple of (issues_df, prs_df)
        """
        issues_df = pd.DataFrame(issues)
        prs_df = pd.DataFrame(prs)
        
        return issues_df, prs_df
    
    @staticmethod
    def extract_labels_frequency(issues_df: pd.DataFrame, prs_df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract and count label frequencies across all issues and PRs.
        
        Args:
            issues_df: DataFrame of issues
            prs_df: DataFrame of PRs
            
        Returns:
            DataFrame with label counts
        """
        all_labels = []
        
        # Collect labels from issues
        if not issues_df.empty and 'labels' in issues_df.columns:
            for labels in issues_df['labels']:
                all_labels.extend(labels)
        
        # Collect labels from PRs
        if not prs_df.empty and 'labels' in prs_df.columns:
            for labels in prs_df['labels']:
                all_labels.extend(labels)
        
        # Count label frequencies
        if all_labels:
            label_counts = pd.Series(all_labels).value_counts()
            return pd.DataFrame({
                'Label': label_counts.index,
                'Count': label_counts.values
            }).sort_values('Count', ascending=False)
        else:
            return pd.DataFrame(columns=['Label', 'Count'])
    
    @staticmethod
    def create_contributor_leaderboard(issues_df: pd.DataFrame, prs_df: pd.DataFrame) -> pd.DataFrame:
        """
        Create a leaderboard showing contributor activity.
        
        Args:
            issues_df: DataFrame of issues
            prs_df: DataFrame of PRs
            
        Returns:
            DataFrame with contributor statistics
        """
        contributor_data = {}
        
        # Count issues per contributor
        if not issues_df.empty and 'user' in issues_df.columns:
            issue_counts = issues_df['user'].value_counts()
            for user, count in issue_counts.items():
                if user not in contributor_data:
                    contributor_data[user] = {'Issues': 0, 'PRs': 0}
                contributor_data[user]['Issues'] = count
        
        # Count PRs per contributor
        if not prs_df.empty and 'user' in prs_df.columns:
            pr_counts = prs_df['user'].value_counts()
            for user, count in pr_counts.items():
                if user not in contributor_data:
                    contributor_data[user] = {'Issues': 0, 'PRs': 0}
                contributor_data[user]['PRs'] = count
        
        if contributor_data:
            leaderboard_df = pd.DataFrame.from_dict(
                contributor_data, 
                orient='index'
            ).reset_index()
            leaderboard_df.columns = ['Contributor', 'Issues', 'PRs']
            leaderboard_df['Total'] = leaderboard_df['Issues'] + leaderboard_df['PRs']
            leaderboard_df = leaderboard_df.sort_values('Total', ascending=False)
            return leaderboard_df
        else:
            return pd.DataFrame(columns=['Contributor', 'Issues', 'PRs', 'Total'])
    
    @staticmethod
    def extract_pr_issue_linkage(prs_df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract PR-Issue linkages from PR descriptions.
        
        Args:
            prs_df: DataFrame of PRs
            
        Returns:
            DataFrame with PR-Issue linkages
        """
        linkages = []
        
        if prs_df.empty or 'body' not in prs_df.columns:
            return pd.DataFrame(columns=['PR Number', 'PR Title', 'Linked Issues'])
        
        # Patterns to match issue references
        patterns = [
            r'#(\d+)',  # #123
            r'closes?\s+#(\d+)',  # closes #123
            r'fixes?\s+#(\d+)',  # fixes #123
            r'resolves?\s+#(\d+)',  # resolves #123
            r'related\s+to\s+#(\d+)',  # related to #123
        ]
        
        for _, pr in prs_df.iterrows():
            pr_number = pr.get('number', 'N/A')
            pr_title = pr.get('title', 'N/A')
            body = pr.get('body', '')
            
            linked_issues = set()
            
            if body:
                for pattern in patterns:
                    matches = re.findall(pattern, body, re.IGNORECASE)
                    linked_issues.update(matches)
            
            if linked_issues:
                linkages.append({
                    'PR Number': pr_number,
                    'PR Title': pr_title,
                    'Linked Issues': ', '.join(sorted(linked_issues, key=int))
                })
        
        if linkages:
            return pd.DataFrame(linkages)
        else:
            return pd.DataFrame(columns=['PR Number', 'PR Title', 'Linked Issues'])
    
    @staticmethod
    def create_timeline_data(issues_df: pd.DataFrame, prs_df: pd.DataFrame) -> pd.DataFrame:
        """
        Create timeline data for activity over time.
        
        Args:
            issues_df: DataFrame of issues
            prs_df: DataFrame of PRs
            
        Returns:
            DataFrame with daily activity counts
        """
        timeline_data = []
        
        # Process issues
        if not issues_df.empty and 'created_at' in issues_df.columns:
            issues_copy = issues_df.copy()
            issues_copy['date'] = pd.to_datetime(issues_copy['created_at']).dt.date
            issue_counts = issues_copy.groupby('date').size()
            for date, count in issue_counts.items():
                timeline_data.append({
                    'Date': date,
                    'Issues': count,
                    'PRs': 0
                })
        
        # Process PRs
        if not prs_df.empty and 'created_at' in prs_df.columns:
            prs_copy = prs_df.copy()
            prs_copy['date'] = pd.to_datetime(prs_copy['created_at']).dt.date
            pr_counts = prs_copy.groupby('date').size()
            for date, count in pr_counts.items():
                # Check if date already exists
                existing = next((x for x in timeline_data if x['Date'] == date), None)
                if existing:
                    existing['PRs'] = count
                else:
                    timeline_data.append({
                        'Date': date,
                        'Issues': 0,
                        'PRs': count
                    })
        
        if timeline_data:
            timeline_df = pd.DataFrame(timeline_data)
            timeline_df = timeline_df.sort_values('Date')
            timeline_df['Total'] = timeline_df['Issues'] + timeline_df['PRs']
            return timeline_df
        else:
            return pd.DataFrame(columns=['Date', 'Issues', 'PRs', 'Total'])
    
    @staticmethod
    def calculate_kpis(issues_df: pd.DataFrame, prs_df: pd.DataFrame) -> Dict:
        """
        Calculate key performance indicators.
        
        Args:
            issues_df: DataFrame of issues
            prs_df: DataFrame of PRs
            
        Returns:
            Dictionary of KPI values
        """
        kpis = {}
        
        # Basic counts
        kpis['total_issues'] = len(issues_df) if not issues_df.empty else 0
        kpis['total_prs'] = len(prs_df) if not prs_df.empty else 0
        kpis['open_issues'] = len(issues_df[issues_df['state'] == 'open']) if not issues_df.empty else 0
        kpis['open_prs'] = len(prs_df[prs_df['state'] == 'open']) if not prs_df.empty else 0
        kpis['closed_issues'] = len(issues_df[issues_df['state'] == 'closed']) if not issues_df.empty else 0
        if not prs_df.empty and 'merged' in prs_df.columns:
            kpis['merged_prs'] = len(prs_df[prs_df['merged'] == True])
        else:
            kpis['merged_prs'] = 0
        
        # Calculate average resolution time
        if not issues_df.empty and 'created_at' in issues_df.columns and 'closed_at' in issues_df.columns:
            closed_issues = issues_df[issues_df['state'] == 'closed'].copy()
            if not closed_issues.empty and closed_issues['closed_at'].notna().any():
                closed_issues['resolution_time'] = (
                    pd.to_datetime(closed_issues['closed_at']) - 
                    pd.to_datetime(closed_issues['created_at'])
                ).dt.total_seconds() / 86400  # Convert to days
                kpis['avg_issue_resolution_days'] = closed_issues['resolution_time'].mean()
            else:
                kpis['avg_issue_resolution_days'] = 0
        else:
            kpis['avg_issue_resolution_days'] = 0
        
        if not prs_df.empty and 'created_at' in prs_df.columns and 'merged_at' in prs_df.columns and 'merged' in prs_df.columns:
            merged_prs = prs_df[prs_df['merged'] == True].copy()
            if not merged_prs.empty and merged_prs['merged_at'].notna().any():
                merged_prs['merge_time'] = (
                    pd.to_datetime(merged_prs['merged_at']) - 
                    pd.to_datetime(merged_prs['created_at'])
                ).dt.total_seconds() / 86400  # Convert to days
                kpis['avg_pr_merge_days'] = merged_prs['merge_time'].mean()
            else:
                kpis['avg_pr_merge_days'] = 0
        else:
            kpis['avg_pr_merge_days'] = 0
        
        return kpis

    @staticmethod
    def create_throughput_data(issues_df: pd.DataFrame, prs_df: pd.DataFrame, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """
        Create throughput data showing merged PRs vs closed issues over time periods.

        Args:
            issues_df: DataFrame of issues
            prs_df: DataFrame of PRs
            start_date: Start date for analysis
            end_date: End date for analysis

        Returns:
            DataFrame with Period, Merged_PRs, Closed_Issues columns
        """
        throughput_data = []

        # Calculate number of days in range
        days_range = (end_date - start_date).days

        # Determine grouping period based on date range
        if days_range <= 7:
            period = 'D'  # Daily
        elif days_range <= 30:
            period = 'W'  # Weekly
        elif days_range <= 90:
            period = 'W'  # Weekly
        else:
            period = 'M'  # Monthly

        # Process closed issues
        if not issues_df.empty and 'closed_at' in issues_df.columns:
            closed_issues = issues_df[issues_df['state'] == 'closed'].copy()
            if not closed_issues.empty:
                closed_issues['closed_at'] = pd.to_datetime(closed_issues['closed_at'])
                closed_issues = closed_issues[(closed_issues['closed_at'] >= start_date) & (closed_issues['closed_at'] <= end_date)]
                closed_counts = closed_issues.groupby(pd.Grouper(key='closed_at', freq=period)).size()

                for period_date, count in closed_counts.items():
                    throughput_data.append({
                        'Period': period_date.strftime('%Y-%m-%d'),
                        'Closed_Issues': count,
                        'Merged_PRs': 0
                    })

        # Process merged PRs
        if not prs_df.empty and 'merged_at' in prs_df.columns and 'merged' in prs_df.columns:
            merged_prs = prs_df[prs_df['merged'] == True].copy()
            if not merged_prs.empty:
                merged_prs['merged_at'] = pd.to_datetime(merged_prs['merged_at'])
                merged_prs = merged_prs[(merged_prs['merged_at'] >= start_date) & (merged_prs['merged_at'] <= end_date)]
                merged_counts = merged_prs.groupby(pd.Grouper(key='merged_at', freq=period)).size()

                for period_date, count in merged_counts.items():
                    period_str = period_date.strftime('%Y-%m-%d')
                    # Check if period already exists
                    existing = next((x for x in throughput_data if x['Period'] == period_str), None)
                    if existing:
                        existing['Merged_PRs'] = count
                    else:
                        throughput_data.append({
                            'Period': period_str,
                            'Closed_Issues': 0,
                            'Merged_PRs': count
                        })

        if throughput_data:
            df = pd.DataFrame(throughput_data)
            df = df.sort_values('Period')
            return df
        else:
            return pd.DataFrame(columns=['Period', 'Closed_Issues', 'Merged_PRs'])

    @staticmethod
    def create_cycle_time_data(prs_df: pd.DataFrame, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """
        Create cycle time data showing average time from PR creation to merge over time.

        Args:
            prs_df: DataFrame of PRs
            start_date: Start date for analysis
            end_date: End date for analysis

        Returns:
            DataFrame with Period, Avg_Cycle_Time_Days columns
        """
        if prs_df.empty or 'created_at' not in prs_df.columns or 'merged_at' not in prs_df.columns or 'merged' not in prs_df.columns:
            return pd.DataFrame(columns=['Period', 'Avg_Cycle_Time_Days'])

        merged_prs = prs_df[prs_df['merged'] == True].copy()
        if merged_prs.empty:
            return pd.DataFrame(columns=['Period', 'Avg_Cycle_Time_Days'])

        merged_prs['created_at'] = pd.to_datetime(merged_prs['created_at'])
        merged_prs['merged_at'] = pd.to_datetime(merged_prs['merged_at'])
        merged_prs = merged_prs[(merged_prs['created_at'] >= start_date) & (merged_prs['merged_at'] <= end_date)]

        if merged_prs.empty:
            return pd.DataFrame(columns=['Period', 'Avg_Cycle_Time_Days'])

        # Calculate cycle time in days
        merged_prs['cycle_time_days'] = (merged_prs['merged_at'] - merged_prs['created_at']).dt.total_seconds() / 86400

        # Determine grouping period
        days_range = (end_date - start_date).days
        if days_range <= 7:
            period = 'D'
        elif days_range <= 30:
            period = 'W'
        elif days_range <= 90:
            period = 'W'
        else:
            period = 'M'

        # Group by period and calculate average cycle time
        merged_prs['period'] = merged_prs['merged_at'].dt.to_period(period)
        cycle_time_avg = merged_prs.groupby('period')['cycle_time_days'].mean().reset_index()
        cycle_time_avg['Period'] = cycle_time_avg['period'].astype(str)
        cycle_time_avg = cycle_time_avg.rename(columns={'cycle_time_days': 'Avg_Cycle_Time_Days'})
        cycle_time_avg = cycle_time_avg[['Period', 'Avg_Cycle_Time_Days']]

        return cycle_time_avg

    @staticmethod
    def create_issue_aging_data(issues_df: pd.DataFrame, current_date: datetime) -> pd.DataFrame:
        """
        Create issue aging data showing distribution of open issues by age buckets.

        Args:
            issues_df: DataFrame of issues
            current_date: Current date to calculate ages against

        Returns:
            DataFrame with Age_Bucket, Count columns
        """
        if issues_df.empty or 'created_at' not in issues_df.columns:
            return pd.DataFrame(columns=['Age_Bucket', 'Count'])

        open_issues = issues_df[issues_df['state'] == 'open'].copy()
        if open_issues.empty:
            return pd.DataFrame(columns=['Age_Bucket', 'Count'])

        open_issues['created_at'] = pd.to_datetime(open_issues['created_at'])
        open_issues['age_days'] = (current_date - open_issues['created_at']).dt.total_seconds() / 86400

        # Define age buckets
        def get_age_bucket(age_days):
            if age_days <= 7:
                return '0-7 days'
            elif age_days <= 30:
                return '7-30 days'
            else:
                return '30+ days'

        open_issues['Age_Bucket'] = open_issues['age_days'].apply(get_age_bucket)
        bucket_counts = open_issues['Age_Bucket'].value_counts().reset_index()
        bucket_counts.columns = ['Age_Bucket', 'Count']

        # Ensure all buckets are present
        all_buckets = ['0-7 days', '7-30 days', '30+ days']
        for bucket in all_buckets:
            if bucket not in bucket_counts['Age_Bucket'].values:
                bucket_counts = pd.concat([bucket_counts, pd.DataFrame({'Age_Bucket': [bucket], 'Count': [0]})])

        # Sort by bucket order
        bucket_order = {'0-7 days': 0, '7-30 days': 1, '30+ days': 2}
        bucket_counts['order'] = bucket_counts['Age_Bucket'].map(bucket_order)
        bucket_counts = bucket_counts.sort_values('order').drop('order', axis=1)

        return bucket_counts
