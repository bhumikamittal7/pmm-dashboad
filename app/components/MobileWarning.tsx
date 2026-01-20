'use client';

import { useState, useEffect } from 'react';

export default function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check if screen width is less than 768px (mobile/tablet)
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Desktop View Required
        </h1>
        <p className="text-gray-600 mb-6">
          This dashboard is optimized for desktop viewing. Please open this application on a desktop or laptop computer for the best experience.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-medium mb-2">Why desktop?</p>
          <ul className="list-disc list-inside space-y-1 text-left">
            <li>Better chart visibility and interaction</li>
            <li>Optimal layout for data tables</li>
            <li>Improved performance with large datasets</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
