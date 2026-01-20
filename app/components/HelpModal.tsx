'use client';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Chart Guide</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
            aria-label="Close help"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Throughput: PRs Merged vs Issues Closed
              </h3>
              <p className="text-gray-700">
                This bar chart shows the number of pull requests merged and issues closed over time. 
                It helps you understand the velocity of your team's work. The time period (day/week/month) 
                is automatically adjusted based on your selected date range.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                PR Cycle Time
              </h3>
              <p className="text-gray-700">
                A line chart displaying the average time it takes for pull requests to be merged, 
                from creation to merge. Lower cycle times indicate faster code review and merge processes. 
                Track this metric to identify bottlenecks in your review workflow.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Top Contributors
              </h3>
              <p className="text-gray-700">
                A horizontal bar chart ranking contributors by their total activity (issues created + PRs opened). 
                This helps identify the most active team members and their contribution breakdown between issues and pull requests.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Label Distribution
              </h3>
              <p className="text-gray-700">
                A donut chart showing the frequency of labels used across issues. This helps you understand 
                how issues are categorized and which labels are most commonly used. Only issues are included 
                in this chart (not PRs). Certain deployment labels are automatically excluded.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Issue Aging Distribution
              </h3>
              <p className="text-gray-700">
                A bar chart categorizing open issues by their age: 0-7 days, 7-30 days, and 30+ days. 
                This helps identify stale issues that may need attention. Color coding: green for recent, 
                amber for medium-aged, and red for old issues.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Activity Timeline
              </h3>
              <p className="text-gray-700">
                A line chart showing the creation timeline of issues and pull requests over time. 
                This helps visualize activity trends and identify busy periods or potential slowdowns 
                in your repository.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                PR Size vs Merge Time
              </h3>
              <p className="text-gray-700">
                A scatter plot with logarithmic X-axis showing the relationship between PR size (total lines changed) 
                and merge time. This helps identify if larger PRs take longer to merge. Each point represents a merged PR. 
                The X-axis uses a log scale to better visualize the wide range of PR sizes.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Average PR Merge Time by Author
              </h3>
              <p className="text-gray-700">
                A bar chart showing the average merge time for PRs created by each author. This helps identify 
                if certain authors' PRs are merged faster or slower on average. Only merged PRs are included in this analysis.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Average PR Merge Time by Reviewer
              </h3>
              <p className="text-gray-700">
                A bar chart showing the average merge time for PRs where each person was requested as a reviewer. 
                This helps identify review efficiency patterns. Only merged PRs with requested reviewers are included.
              </p>
            </section>

            <section className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tips</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Click the expand icon (top-right) on any chart to view it in fullscreen</li>
                <li>Hover over chart elements to see detailed tooltips</li>
                <li>Use the author filter in the detailed tables to view data for specific contributors</li>
                <li>Adjust the date range to analyze different time periods</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
