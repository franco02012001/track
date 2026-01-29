'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from './AppLayout';
import { applicationsApi, tasksApi, Application } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, active: 0, interviews: 0, offers: 0 });
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, applicationsData, tasksCount] = await Promise.all([
          applicationsApi.getStats(),
          applicationsApi.getAll(),
          tasksApi.getPendingCount(),
        ]);
        
        setStats(statsData);
        setRecentApplications(applicationsData.slice(0, 3));
        setPendingTasks(tasksCount);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `Applied ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-1 sm:mb-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary">Track your job search progress</p>
          </div>
          <button 
            onClick={() => router.push('/applications?new=true')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition shadow-sm touch-manipulation"
          >
            + Add Application
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Applications */}
          <div className="bg-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-blue-100 text-sm font-medium">Total Applications</p>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-4xl font-bold mb-1">{loading ? '...' : stats.total}</p>
          </div>

          {/* Active Pipeline */}
          <div className="bg-blue-700 rounded-xl p-4 sm:p-6 text-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-blue-100 text-sm font-medium">Active Pipeline</p>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-4xl font-bold mb-1">{loading ? '...' : stats.active}</p>
          </div>

          {/* Interviews */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-blue-100 text-sm font-medium">Interviews</p>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-4xl font-bold mb-1">{loading ? '...' : stats.interviews}</p>
          </div>

          {/* Offers */}
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl p-4 sm:p-6 text-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-pink-100 text-sm font-medium">Offers</p>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-2xl sm:text-4xl font-bold mb-1">{loading ? '...' : stats.offers}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Applications */}
          <div className="bg-white dark:bg-dark-card-bg rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-dark-border">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-4 sm:mb-6">Recent Applications</h2>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">Loading...</div>
              ) : recentApplications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-dark-text-secondary">No applications yet</div>
              ) : (
                recentApplications.map((app) => (
                  <div key={app._id} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-dark-hover rounded-lg transition cursor-pointer" onClick={() => router.push('/applications')}>
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-dark-card-bg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-dark-text-primary font-semibold truncate">{app.jobTitle}</p>
                      <p className="text-gray-600 dark:text-dark-text-secondary text-sm truncate">{app.company}</p>
                      <p className="text-gray-500 dark:text-dark-text-secondary text-xs mt-1">{formatDate(app.appliedDate || app.createdAt)}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full whitespace-nowrap">
                      {app.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white dark:bg-dark-card-bg rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-dark-text-primary">Upcoming Tasks</h2>
              <span className="px-3 py-1 bg-gray-100 dark:bg-dark-card-bg text-gray-700 dark:text-dark-text-secondary text-xs font-medium rounded-full">
                {loading ? '...' : pendingTasks} pending
              </span>
            </div>
            {loading ? (
              <div className="text-center py-12 text-gray-500 dark:text-dark-text-secondary">Loading...</div>
            ) : pendingTasks === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-dark-text-secondary font-medium">No upcoming tasks. You're all caught up!</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-dark-text-secondary font-medium mb-4">You have {pendingTasks} pending task{pendingTasks !== 1 ? 's' : ''}</p>
                <button 
                  onClick={() => router.push('/tasks')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-lg transition"
                >
                  View Tasks
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
