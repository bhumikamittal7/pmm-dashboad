'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from '../context/DashboardContext';
import DateRangePicker from './DateRangePicker';

const NAV_LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/prs', label: 'Pull Requests' },
  { href: '/issues', label: 'Issues' },
  { href: '/contributors', label: 'Contributors' },
  { href: '/compare', label: 'Compare' },
];

export default function TopNavBar() {
  const pathname = usePathname();
  const {
    repository,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loading,
    fetchData,
    isFromCache,
  } = useDashboard();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-lg font-bold text-gray-900 whitespace-nowrap">
              PM Dashboard
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive(link.href)
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 gap-4">
          <div className="flex items-center gap-3">
            {repository && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500">Repo:</span>
                <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">{repository}</span>
              </div>
            )}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </div>
          <div className="flex items-center gap-2">
            {isFromCache && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Cached
              </span>
            )}
            <button
              onClick={() => fetchData(false)}
              disabled={loading || !repository}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Fetch Data'}
            </button>
            <button
              onClick={() => fetchData(true)}
              disabled={loading || !repository}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
              title="Force refresh (bypass cache)"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
