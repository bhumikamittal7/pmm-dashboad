'use client';

import { useState } from 'react';
import { Issue, PullRequest, PRIssueLinkage } from '@/types';
import { format, parseISO } from 'date-fns';

interface DataTablesProps {
  issues: Issue[];
  prs: PullRequest[];
  prIssueLinkage: PRIssueLinkage[];
}

export default function DataTables({ issues, prs, prIssueLinkage }: DataTablesProps) {
  const [activeTab, setActiveTab] = useState<'issues' | 'prs' | 'linkage'>('issues');

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'yyyy-MM-dd HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Detailed Data</h2>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('issues')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'issues'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Issues Details ({issues.length})
          </button>
          <button
            onClick={() => setActiveTab('prs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'prs'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pull Requests Details ({prs.length})
          </button>
          <button
            onClick={() => setActiveTab('linkage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'linkage'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            PR-Issue Linkage ({prIssueLinkage.length})
          </button>
        </nav>
      </div>

      {/* Issues Table */}
      {activeTab === 'issues' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {issues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Labels
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {issues.map((issue) => (
                    <tr key={issue.number}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {issue.number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{issue.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            issue.state === 'open'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {issue.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {issue.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(issue.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {issue.labels && issue.labels.length > 0
                          ? issue.labels.join(', ')
                          : 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No issues found in the selected date range.
            </div>
          )}
        </div>
      )}

      {/* PRs Table */}
      {activeTab === 'prs' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {prs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Merged
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Labels
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prs.map((pr) => (
                    <tr key={pr.number}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pr.number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{pr.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            pr.state === 'open'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {pr.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pr.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(pr.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            pr.merged ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {pr.merged ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {pr.labels && pr.labels.length > 0 ? pr.labels.join(', ') : 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No pull requests found in the selected date range.
            </div>
          )}
        </div>
      )}

      {/* PR-Issue Linkage Table */}
      {activeTab === 'linkage' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {prIssueLinkage.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PR Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PR Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Linked Issues
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prIssueLinkage.map((linkage, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {linkage['PR Number']}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{linkage['PR Title']}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {linkage['Linked Issues']}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No PR-Issue linkages found. PRs may not reference issues in their descriptions.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
