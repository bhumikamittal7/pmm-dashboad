"""
Visualization module for creating charts and tables.
"""

import pandas as pd

import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots


class Visualizations:
    """Class to create visualizations for the dashboard."""
    
    @staticmethod
    def create_labels_chart(labels_df: pd.DataFrame) -> go.Figure:
        """
        Create a donut chart for label frequencies.

        Args:
            labels_df: DataFrame with Label and Count columns

        Returns:
            Plotly figure
        """
        if labels_df.empty:
            fig = go.Figure()
            fig.add_annotation(
                text="No labels found",
                xref="paper", yref="paper",
                x=0.5, y=0.5, showarrow=False,
                font=dict(size=14, color='#111827')
            )
            fig.update_layout(
                template='plotly_white',
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)'
            )
            return fig

        # Limit to top 10 labels for donut chart readability
        top_labels = labels_df.head(10)

        # Define color palette - indigo/blue tones
        colors = [
            '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81',
            '#581c87', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'
        ]

        fig = go.Figure(data=[go.Pie(
            labels=top_labels['Label'],
            values=top_labels['Count'],
            hole=0.6,
            marker_colors=colors[:len(top_labels)],
            textinfo='label+percent',
            textfont=dict(size=12, color='#111827'),
            hovertemplate='<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>'
        )])

        fig.update_layout(
            title=dict(
                text='Label Distribution',
                font=dict(size=18, color='#111827'),
                x=0.5,
                xanchor='center'
            ),
            template='plotly_white',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            height=400,
            showlegend=False,
            font=dict(color='#111827')
        )

        return fig
    
    @staticmethod
    def create_contributor_chart(leaderboard_df: pd.DataFrame) -> go.Figure:
        """
        Create a horizontal bar chart for contributor activity.

        Args:
            leaderboard_df: DataFrame with Contributor, Issues, PRs columns

        Returns:
            Plotly figure
        """
        if leaderboard_df.empty:
            fig = go.Figure()
            fig.add_annotation(
                text="No contributor data found",
                xref="paper", yref="paper",
                x=0.5, y=0.5, showarrow=False,
                font=dict(size=14, color='#111827')
            )
            fig.update_layout(
                template='plotly_white',
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)'
            )
            return fig

        # Limit to top 10 contributors for horizontal chart
        top_contributors = leaderboard_df.head(10)

        # Indigo color scheme
        issues_color = '#4f46e5'  # Indigo-600
        prs_color = '#6366f1'    # Indigo-500

        fig = go.Figure()
        fig.add_trace(go.Bar(
            name='Pull Requests',
            y=top_contributors['Contributor'],
            x=top_contributors['PRs'],
            orientation='h',
            marker_color=prs_color,
            hovertemplate='<b>%{y}</b><br>PRs: %{x}<extra></extra>'
        ))
        fig.add_trace(go.Bar(
            name='Issues',
            y=top_contributors['Contributor'],
            x=top_contributors['Issues'],
            orientation='h',
            marker_color=issues_color,
            hovertemplate='<b>%{y}</b><br>Issues: %{x}<extra></extra>'
        ))

        fig.update_layout(
            title=dict(
                text='Top Contributors',
                font=dict(size=18, color='#111827'),
                x=0.5,
                xanchor='center'
            ),
            xaxis_title='Contributions',
            yaxis_title='Contributor',
            barmode='stack',
            height=400,
            template='plotly_white',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#111827'),
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            )
        )
        return fig
    
    @staticmethod
    def create_timeline_chart(timeline_df: pd.DataFrame) -> go.Figure:
        """
        Create a line chart for activity timeline.

        Args:
            timeline_df: DataFrame with Date, Issues, PRs, Total columns

        Returns:
            Plotly figure
        """
        if timeline_df.empty:
            fig = go.Figure()
            fig.add_annotation(
                text="No timeline data found",
                xref="paper", yref="paper",
                x=0.5, y=0.5, showarrow=False,
                font=dict(size=14, color='#111827')
            )
            fig.update_layout(
                template='plotly_white',
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)'
            )
            return fig

        # Indigo color scheme
        issues_color = '#4f46e5'  # Indigo-600
        prs_color = '#6366f1'    # Indigo-500
        total_color = '#818cf8'  # Indigo-400

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=timeline_df['Date'],
            y=timeline_df['Issues'],
            mode='lines+markers',
            name='Issues',
            line=dict(color=issues_color, width=2.5),
            marker=dict(size=6, color=issues_color),
            hovertemplate='Issues: %{y}<extra></extra>'
        ))

        fig.add_trace(go.Scatter(
            x=timeline_df['Date'],
            y=timeline_df['PRs'],
            mode='lines+markers',
            name='Pull Requests',
            line=dict(color=prs_color, width=2.5),
            marker=dict(size=6, color=prs_color),
            hovertemplate='PRs: %{y}<extra></extra>'
        ))

        fig.add_trace(go.Scatter(
            x=timeline_df['Date'],
            y=timeline_df['Total'],
            mode='lines+markers',
            name='Total Activity',
            line=dict(color=total_color, width=2.5, dash='dash'),
            marker=dict(size=6, color=total_color),
            hovertemplate='Total: %{y}<extra></extra>'
        ))

        fig.update_layout(
            title=dict(
                text='Activity Timeline',
                font=dict(size=18, color='#111827'),
                x=0.5,
                xanchor='center'
            ),
            xaxis_title='Date',
            yaxis_title='Count',
            height=400,
            template='plotly_white',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#111827'),
            hovermode='x unified',
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            )
        )
        return fig

    @staticmethod
    def create_throughput_chart(throughput_df: pd.DataFrame) -> go.Figure:
        """
        Create a bar chart showing throughput (merged PRs vs closed issues).

        Args:
            throughput_df: DataFrame with Period, Merged_PRs, Closed_Issues columns

        Returns:
            Plotly figure
        """
        if throughput_df.empty:
            fig = go.Figure()
            fig.add_annotation(
                text="No throughput data found",
                xref="paper", yref="paper",
                x=0.5, y=0.5, showarrow=False,
                font=dict(size=14, color='#111827')
            )
            fig.update_layout(
                template='plotly_white',
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)'
            )
            return fig

        # Indigo color scheme
        prs_color = '#6366f1'    # Indigo-500
        issues_color = '#4f46e5' # Indigo-600

        fig = go.Figure()
        fig.add_trace(go.Bar(
            name='Merged PRs',
            x=throughput_df['Period'],
            y=throughput_df['Merged_PRs'],
            marker_color=prs_color,
            hovertemplate='<b>%{x}</b><br>Merged PRs: %{y}<extra></extra>'
        ))
        fig.add_trace(go.Bar(
            name='Closed Issues',
            x=throughput_df['Period'],
            y=throughput_df['Closed_Issues'],
            marker_color=issues_color,
            hovertemplate='<b>%{x}</b><br>Closed Issues: %{y}<extra></extra>'
        ))

        fig.update_layout(
            title=dict(
                text='Throughput: PRs Merged vs Issues Closed',
                font=dict(size=18, color='#111827'),
                x=0.5,
                xanchor='center'
            ),
            xaxis_title='Time Period',
            yaxis_title='Count',
            barmode='group',
            height=400,
            template='plotly_white',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#111827'),
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            )
        )
        return fig

    @staticmethod
    def create_cycle_time_chart(cycle_time_df: pd.DataFrame) -> go.Figure:
        """
        Create a line chart showing average cycle time for PRs.

        Args:
            cycle_time_df: DataFrame with Period, Avg_Cycle_Time_Days columns

        Returns:
            Plotly figure
        """
        if cycle_time_df.empty:
            fig = go.Figure()
            fig.add_annotation(
                text="No cycle time data found",
                xref="paper", yref="paper",
                x=0.5, y=0.5, showarrow=False,
                font=dict(size=14, color='#111827')
            )
            fig.update_layout(
                template='plotly_white',
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)'
            )
            return fig

        # Indigo color
        line_color = '#6366f1'

        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=cycle_time_df['Period'],
            y=cycle_time_df['Avg_Cycle_Time_Days'],
            mode='lines+markers',
            name='Avg Cycle Time',
            line=dict(color=line_color, width=3),
            marker=dict(size=8, color=line_color),
            hovertemplate='<b>%{x}</b><br>Avg Cycle Time: %{y:.1f} days<extra></extra>'
        ))

        fig.update_layout(
            title=dict(
                text='PR Cycle Time',
                font=dict(size=18, color='#111827'),
                x=0.5,
                xanchor='center'
            ),
            xaxis_title='Time Period',
            yaxis_title='Average Days to Merge',
            height=400,
            template='plotly_white',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#111827'),
            showlegend=False
        )
        return fig

    @staticmethod
    def create_issue_aging_chart(aging_df: pd.DataFrame) -> go.Figure:
        """
        Create a histogram showing issue aging distribution.

        Args:
            aging_df: DataFrame with Age_Bucket, Count columns

        Returns:
            Plotly figure
        """
        if aging_df.empty:
            fig = go.Figure()
            fig.add_annotation(
                text="No aging data found",
                xref="paper", yref="paper",
                x=0.5, y=0.5, showarrow=False,
                font=dict(size=14, color='#111827')
            )
            fig.update_layout(
                template='plotly_white',
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)'
            )
            return fig

        # Color scheme based on age buckets
        colors = {
            '0-7 days': '#10b981',   # Green-500
            '7-30 days': '#f59e0b',  # Amber-500
            '30+ days': '#ef4444'    # Red-500
        }

        bucket_colors = [colors.get(bucket, '#6366f1') for bucket in aging_df['Age_Bucket']]

        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=aging_df['Age_Bucket'],
            y=aging_df['Count'],
            marker_color=bucket_colors,
            hovertemplate='<b>%{x}</b><br>Count: %{y}<extra></extra>'
        ))

        fig.update_layout(
            title=dict(
                text='Issue Aging Distribution',
                font=dict(size=18, color='#111827'),
                x=0.5,
                xanchor='center'
            ),
            xaxis_title='Age Bucket',
            yaxis_title='Number of Issues',
            height=400,
            template='plotly_white',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#111827'),
            showlegend=False
        )
        return fig
