// Type definitions for GitHub Repository Analytics Dashboard

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
}

export interface PullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: string;
  labels: string[];
  comments: number;
  review_comments: number;
  body: string;
  is_pr: true;
  merged: boolean;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  reviewers?: string[];
}

export interface KPIs {
  total_issues: number;
  open_issues: number;
  closed_issues: number;
  total_prs: number;
  open_prs: number;
  merged_prs: number;
  avg_issue_resolution_days: number;
  avg_pr_merge_days: number;
}

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
  Age_Bucket: string;
  Count: number;
}

export interface PRIssueLinkage {
  'PR Number': number | string;
  'PR Title': string;
  'Linked Issues': string;
}

export interface PRSizeMergeTimeData {
  PR_Number: number;
  PR_Title: string;
  Size: number; // Total changes (additions + deletions)
  Merge_Time_Days: number;
}

export interface MergeTimeByUser {
  user: string;
  count: number;
  avg_merge_days: number;
}

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
    kpis: KPIs;
    labels: LabelData[];
    contributors: ContributorData[];
    timeline: TimelineData[];
    throughput: ThroughputData[];
    cycleTime: CycleTimeData[];
    issueAging: IssueAgingData[];
    prIssueLinkage: PRIssueLinkage[];
    prSizeMergeTime: PRSizeMergeTimeData[];
    mergeTimeByAuthor: MergeTimeByUser[];
    mergeTimeByReviewer: MergeTimeByUser[];
  };
  error?: string;
}
