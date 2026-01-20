'use client';

import { useState } from 'react';

interface ExpandableChartProps {
  title: string;
  children: React.ReactNode;
}

export default function ExpandableChart({ title, children }: ExpandableChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsExpanded(true)}
          className="absolute top-2 right-2 z-10 p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          title="Expand chart"
          aria-label="Expand chart"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>
        {children}
      </div>

      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
                aria-label="Close expanded chart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-gray-600"
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
            <div className="flex-1 overflow-auto p-6">
              <div className="w-full h-full min-h-[600px]">
                {children}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
