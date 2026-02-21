// Type definitions for GitHub Repository Analytics Dashboard

// === RAW DATA (fetched from GitHub, stored in cache) ===

export interface PRReview {
  user: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
  submitted_at: string;
  body: string;
  is_bot: boolean;
}

export interface Issue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  user: string;
  labels: string[];
  comments: number;
  is_pr: false;
  reopened: boolean;
  milestone: string | null;
}

export interface PullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: string;
  avatar_url: string;
  labels: string[];
  comments: number;
  review_comments: number;
  body: string;
  is_pr: true;
  merged: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  /** People who were explicitly requested to review (assigned). Omit in old cache. */
  requested_reviewers?: string[];
  /** requested_reviewers + anyone who submitted a review (for backward compat). */
  reviewers: string[];
  draft: boolean;
  reviews: PRReview[];
  commits_count: number;
  first_review_at: string | null;
  first_approval_at: string | null;
}

export interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  author: string;
  prerelease: boolean;
  draft: boolean;
}

// === COMPUTED METRICS (derived from raw data, never stored) ===

export interface ComputedKPIs {
  // Counts
  total_issues: number;
  open_issues: number;
  closed_issues: number;
  total_prs: number;
  open_prs: number;
  merged_prs: number;

  // PR Metrics
  merge_rate: number;
  comment_rate: number;
  pick_up_time_hours: number;
  avg_pr_size: number;
  open_to_approval_hours: number;
  open_to_merge_hours: number;
  avg_issue_resolution_days: number;
  avg_pr_merge_days: number;

  // Review Breakdown
  reviews_approved: number;
  reviews_changes_requested: number;
  reviews_commented: number;

  // Release & Quality
  release_rate: number;
  defect_rate: number;

  // Issue Metrics
  bug_feature_ratio: number;
  new_issues_per_week: number;
  closed_issues_per_week: number;
  avg_time_to_close_days: number;
  reopen_rate: number;

  // PR-Issue Relationship
  pct_prs_linked_to_issues: number;
  pct_issues_closed_via_pr: number;
  prs_without_linked_issue: number;
}

export interface ContributorMetrics {
  username: string;
  avatar_url: string;

  // As Author
  prs_opened: number;
  prs_merged: number;
  avg_pr_size: number;
  avg_merge_time_hours: number;
  rework_rate: number;
  lines_added: number;
  lines_deleted: number;

  // As Reviewer
  reviews_performed: number;
  avg_review_response_hours: number;
  comments_per_review: number;
  pct_prs_reviewed: number;

  // Timing (medians)
  response_time_median_hours: number;
  time_waiting_on_review_median_hours: number;
  wait_time_to_first_review_median_hours: number;
  publish_to_merge_time_median_hours: number;
  review_cycles_avg: number;
}

export interface BacklogAgingBucket {
  bucket: string;
  count: number;
}

// === CHART DATA STRUCTURES ===

export interface LabelData {
  Label: string;
  Count: number;
}

export interface ContributorData {
  Contributor: string;
  Issues: number;
  PRs: number;
  Total: number;
}

export interface TimelineData {
  Date: string;
  Issues: number;
  PRs: number;
  Total: number;
}

export interface ThroughputData {
  Period: string;
  Closed_Issues: number;
  Merged_PRs: number;
}

export interface CycleTimeData {
  Period: string;
  Avg_Cycle_Time_Days: number;
}

export interface IssueAgingData {
  Issue_Number: number;
  Issue_Title: string;
  PR_Merge_Date: string;
  Age_Days: number;
}

export interface PRIssueLinkage {
  pr_number: number;
  pr_title: string;
  linked_issues: number[];
}

export interface PRSizeMergeTimeData {
  PR_Number: number;
  PR_Title: string;
  Size: number;
  Merge_Time_Days: number;
}

export interface MergeTimeByUser {
  user: string;
  count: number;
  avg_merge_days: number;
}

export interface ReviewBreakdownData {
  period: string;
  approved: number;
  changes_requested: number;
  commented: number;
}

export interface PRSizeDistributionData {
  bucket: string;
  count: number;
}

// === API TYPES ===

export interface FetchDataRequest {
  repository: string;
  startDate: string;
  endDate: string;
}

export interface FetchDataResponse {
  success: boolean;
  data?: {
    issues: Issue[];
    prs: PullRequest[];
    releases: Release[];
    kpis: ComputedKPIs;
    labels: LabelData[];
    contributors: ContributorData[];
    contributorMetrics: ContributorMetrics[];
    timeline: TimelineData[];
    throughput: ThroughputData[];
    cycleTime: CycleTimeData[];
    issueAging: IssueAgingData[];
    prIssueLinkage: PRIssueLinkage[];
    prSizeMergeTime: PRSizeMergeTimeData[];
    mergeTimeByAuthor: MergeTimeByUser[];
    mergeTimeByReviewer: MergeTimeByUser[];
    reviewBreakdown: ReviewBreakdownData[];
    prSizeDistribution: PRSizeDistributionData[];
    backlogAging: BacklogAgingBucket[];
  };
  error?: string;
}
