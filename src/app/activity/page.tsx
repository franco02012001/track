'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { applicationsApi, Application, tasksApi, Task, contactsApi, Contact, documentsApi, Document, skillsApi, Skill } from '@/lib/api';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

interface ActivityItem {
  id: string;
  type: 'application' | 'task' | 'reminder' | 'contact' | 'document' | 'skill';
  action: 'created' | 'updated' | 'deleted' | 'completed';
  title: string;
  description: string;
  timestamp: string;
  icon: JSX.Element;
  color: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'application' | 'task' | 'reminder' | 'contact' | 'document' | 'skill'>('all');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    fetchActivities();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchActivities();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchActivities();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchActivities = async () => {
    try {
      const [applications, tasks, contacts, documents, skills] = await Promise.all([
        applicationsApi.getAll(),
        tasksApi.getAll(),
        contactsApi.getAll(),
        documentsApi.getAll(),
        skillsApi.getAll(),
      ]);

      const activityItems: ActivityItem[] = [];

      // Process applications
      applications.forEach((app: Application) => {
        activityItems.push({
          id: `app-${app._id}`,
          type: 'application',
          action: 'created',
          title: `Application: ${app.jobTitle} at ${app.company}`,
          description: `Status: ${app.status}${app.location ? ` | Location: ${app.location}` : ''}`,
          timestamp: app.createdAt,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          color: 'bg-blue-100 text-blue-700',
        });

        if (app.updatedAt !== app.createdAt) {
          activityItems.push({
            id: `app-update-${app._id}`,
            type: 'application',
            action: 'updated',
            title: `Updated: ${app.jobTitle} at ${app.company}`,
            description: `Status changed to ${app.status}`,
            timestamp: app.updatedAt,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
            color: 'bg-blue-100 text-blue-700',
          });
        }
      });

      // Process tasks
      tasks.forEach((task: Task) => {
        // Always classify as 'task' type, but use 'reminder' for display if it has dueDate
        const isReminder = !!task.dueDate;
        
        activityItems.push({
          id: `task-${task._id}`,
          type: 'task', // Always 'task' type for filtering
          action: task.status === 'Completed' ? 'completed' : 'created',
          title: isReminder ? `Reminder: ${task.title}` : `Task: ${task.title}`,
          description: `Priority: ${task.priority} | Status: ${task.status}${task.dueDate ? ` | Due: ${new Date(task.dueDate).toLocaleDateString()}` : ''}`,
          timestamp: task.createdAt,
          icon: isReminder ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
          color: isReminder ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700',
        });

        if (task.updatedAt !== task.createdAt && task.status === 'Completed') {
          activityItems.push({
            id: `task-complete-${task._id}`,
            type: 'task', // Always 'task' type
            action: 'completed',
            title: `Completed: ${task.title}`,
            description: 'Task marked as completed',
            timestamp: task.updatedAt,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: isReminder ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700',
          });
        }
      });

      // Process contacts
      contacts.forEach((contact: Contact) => {
        activityItems.push({
          id: `contact-${contact._id}`,
          type: 'contact',
          action: 'created',
          title: `Contact: ${contact.name}`,
          description: `${contact.company ? `Company: ${contact.company}` : ''}${contact.email ? ` | ${contact.email}` : ''}`,
          timestamp: contact.createdAt,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
          color: 'bg-purple-100 text-purple-700',
        });
      });

      // Process documents
      documents.forEach((doc: Document) => {
        activityItems.push({
          id: `doc-${doc._id}`,
          type: 'document',
          action: 'created',
          title: `Document: ${doc.name}`,
          description: `Type: ${doc.type || 'N/A'}`,
          timestamp: doc.createdAt,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          color: 'bg-indigo-100 text-indigo-700',
        });
      });

      // Process skills
      skills.forEach((skill: Skill) => {
        activityItems.push({
          id: `skill-${skill._id}`,
          type: 'skill',
          action: 'created',
          title: `Skill: ${skill.name}`,
          description: skill.level ? `Level: ${skill.level}${skill.category ? ` | Category: ${skill.category}` : ''}` : (skill.category ? `Category: ${skill.category}` : ''),
          timestamp: skill.createdAt,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ),
          color: 'bg-orange-100 text-orange-700',
        });
      });

      // Sort by timestamp (newest first)
      activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(activityItems);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setLoading(true);
    fetchActivities();
  };

  // Helper function to check if date is within time period
  const isWithinPeriod = (date: Date, period: TimePeriod): boolean => {
    const now = new Date();
    const activityDate = new Date(date);
    activityDate.setHours(0, 0, 0, 0);
    const periodStart = new Date(now);
    periodStart.setHours(0, 0, 0, 0);

    switch (period) {
      case 'day':
        return activityDate.getTime() === periodStart.getTime();
      case 'week':
        const weekStart = new Date(periodStart);
        weekStart.setDate(periodStart.getDate() - periodStart.getDay());
        return activityDate >= weekStart && activityDate <= now;
      case 'month':
        return activityDate.getMonth() === periodStart.getMonth() && 
               activityDate.getFullYear() === periodStart.getFullYear();
      case 'year':
        return activityDate.getFullYear() === periodStart.getFullYear();
      default:
        return true;
    }
  };

  // Filter activities by time period and type
  const filteredActivities = useMemo(() => {
    let filtered = activities.filter(activity => 
      isWithinPeriod(new Date(activity.timestamp), timePeriod)
    );
    
    if (filter !== 'all') {
      // When filtering by 'task', show all tasks (including those that are reminders)
      if (filter === 'task') {
        filtered = filtered.filter(activity => activity.type === 'task');
      } else if (filter === 'reminder') {
        // For reminder filter, show tasks with dueDate (they're still type 'task' but have reminder characteristics)
        filtered = filtered.filter(activity => 
          activity.type === 'task' && activity.title.includes('Reminder:')
        );
      } else {
        filtered = filtered.filter(activity => activity.type === filter);
      }
    }
    
    return filtered;
  }, [activities, timePeriod, filter]);

  // Calculate metrics for current period
  const metrics = useMemo(() => {
    const periodActivities = activities.filter(activity => 
      isWithinPeriod(new Date(activity.timestamp), timePeriod)
    );

    const taskActivities = periodActivities.filter(a => a.type === 'task');
    const reminderActivities = taskActivities.filter(a => a.title.includes('Reminder:'));

    return {
      total: periodActivities.length,
      applications: periodActivities.filter(a => a.type === 'application').length,
      tasks: taskActivities.length,
      reminders: reminderActivities.length,
      contacts: periodActivities.filter(a => a.type === 'contact').length,
      documents: periodActivities.filter(a => a.type === 'document').length,
      skills: periodActivities.filter(a => a.type === 'skill').length,
      completed: periodActivities.filter(a => a.action === 'completed').length,
      // Task-specific metrics
      taskMetrics: {
        total: taskActivities.length,
        created: taskActivities.filter(a => a.action === 'created').length,
        completed: taskActivities.filter(a => a.action === 'completed').length,
        reminders: reminderActivities.length,
        regularTasks: taskActivities.filter(a => !a.title.includes('Reminder:')).length,
        completedReminders: reminderActivities.filter(a => a.action === 'completed').length,
        completedTasks: taskActivities.filter(a => a.action === 'completed' && !a.title.includes('Reminder:')).length,
      },
    };
  }, [activities, timePeriod]);

  // Calculate activity trend (compare with previous period)
  const getTrend = useMemo(() => {
    const now = new Date();
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setHours(0, 0, 0, 0);

    let previousPeriodStart = new Date();
    previousPeriodStart.setHours(0, 0, 0, 0);

    switch (timePeriod) {
      case 'day':
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
        break;
      case 'week':
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        break;
      case 'month':
        previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
        break;
      case 'year':
        previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
        break;
    }

    const currentCount = activities.filter(a => 
      isWithinPeriod(new Date(a.timestamp), timePeriod)
    ).length;

    const previousCount = activities.filter(a => {
      const activityDate = new Date(a.timestamp);
      activityDate.setHours(0, 0, 0, 0);
      
      switch (timePeriod) {
        case 'day':
          return activityDate.getTime() === previousPeriodStart.getTime();
        case 'week':
          const weekStart = new Date(previousPeriodStart);
          weekStart.setDate(previousPeriodStart.getDate() - previousPeriodStart.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return activityDate >= weekStart && activityDate <= weekEnd;
        case 'month':
          return activityDate.getMonth() === previousPeriodStart.getMonth() && 
                 activityDate.getFullYear() === previousPeriodStart.getFullYear();
        case 'year':
          return activityDate.getFullYear() === previousPeriodStart.getFullYear();
        default:
          return false;
      }
    }).length;

    const diff = currentCount - previousCount;
    const percentage = previousCount > 0 ? Math.round((diff / previousCount) * 100) : (currentCount > 0 ? 100 : 0);
    
    return {
      diff,
      percentage,
      isPositive: diff >= 0,
    };
  }, [activities, timePeriod]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getActionBadge = (action: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      created: { text: 'Created', color: 'bg-green-100 text-green-700' },
      updated: { text: 'Updated', color: 'bg-blue-100 text-blue-700' },
      deleted: { text: 'Deleted', color: 'bg-red-100 text-red-700' },
      completed: { text: 'Completed', color: 'bg-purple-100 text-purple-700' },
    };
    return badges[action] || badges.created;
  };

  const getPeriodLabel = (period: TimePeriod): string => {
    switch (period) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">Activity</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary">
              Track all your job search activities
              {lastUpdated && (
                <span className="ml-0 sm:ml-2 block sm:inline text-xs text-gray-500 dark:text-dark-text-secondary mt-1 sm:mt-0">
                  • Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-300">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoRefresh" className="text-sm text-gray-700 cursor-pointer">
                Auto-refresh
              </label>
            </div>
            {/* Refresh interval selector */}
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>Every 10s</option>
                <option value={30}>Every 30s</option>
                <option value={60}>Every 1min</option>
                <option value={300}>Every 5min</option>
              </select>
            )}
            {/* Manual refresh button */}
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg 
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Time Period Selector */}
        <div className="mb-6 overflow-x-auto">
          <div className="inline-flex rounded-lg bg-gray-100 p-1 border border-gray-200 min-w-0">
            {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  timePeriod === period
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:text-dark-text-primary'
                }`}
              >
                {period === 'day' ? 'Daily' : period === 'week' ? 'Weekly' : period === 'month' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-dark-card-bg rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Total Activities</h3>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-1">{metrics.total}</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${getTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {getTrend.isPositive ? '↑' : '↓'} {Math.abs(getTrend.percentage)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-dark-text-secondary">vs previous period</span>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card-bg rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Applications</h3>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">{metrics.applications}</p>
          </div>

          <div className="bg-white dark:bg-dark-card-bg rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Tasks & Reminders</h3>
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">{metrics.tasks + metrics.reminders}</p>
          </div>

          <div className="bg-white dark:bg-dark-card-bg rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Completed</h3>
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">{metrics.completed}</p>
          </div>
        </div>

        {/* Task-Specific Metrics */}
        {metrics.taskMetrics.total > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">Task Activity Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-green-900">Total Tasks</h3>
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-green-900">{metrics.taskMetrics.total}</p>
                <p className="text-xs text-green-700 mt-1">All task activities</p>
              </div>

              <div className="bg-white dark:bg-dark-card-bg rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Created</h3>
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">{metrics.taskMetrics.created}</p>
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1">New tasks created</p>
              </div>

              <div className="bg-white dark:bg-dark-card-bg rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">Completed</h3>
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">{metrics.taskMetrics.completed}</p>
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1">Tasks completed</p>
                {metrics.taskMetrics.total > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${(metrics.taskMetrics.completed / metrics.taskMetrics.total) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1">
                      {Math.round((metrics.taskMetrics.completed / metrics.taskMetrics.total) * 100)}% completion rate
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 shadow-sm border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-yellow-900">Reminders</h3>
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-yellow-900">{metrics.taskMetrics.reminders}</p>
                <p className="text-xs text-yellow-700 mt-1">Reminders set</p>
              </div>
            </div>

            {/* Task Breakdown */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-dark-card-bg rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-4">Task Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Regular Tasks</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{metrics.taskMetrics.regularTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Reminders</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{metrics.taskMetrics.reminders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Completed Tasks</span>
                    <span className="text-lg font-semibold text-green-600">{metrics.taskMetrics.completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Completed Reminders</span>
                    <span className="text-lg font-semibold text-green-600">{metrics.taskMetrics.completedReminders}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-card-bg rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-4">Task Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-dark-text-secondary">Created</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-dark-text-primary">{metrics.taskMetrics.created}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${metrics.taskMetrics.total > 0 ? (metrics.taskMetrics.created / metrics.taskMetrics.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-dark-text-secondary">Completed</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-dark-text-primary">{metrics.taskMetrics.completed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${metrics.taskMetrics.total > 0 ? (metrics.taskMetrics.completed / metrics.taskMetrics.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  {metrics.taskMetrics.total > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                        Pending: <span className="font-semibold text-gray-900 dark:text-dark-text-primary">{metrics.taskMetrics.total - metrics.taskMetrics.completed}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-dark-card-bg rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-4">Activity Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Contacts</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{metrics.contacts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Documents</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{metrics.documents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Skills</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{metrics.skills}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card-bg rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary mb-4">Activity Types</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Tasks</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{metrics.tasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Reminders</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{metrics.reminders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Applications</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{metrics.applications}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">{getPeriodLabel(timePeriod)}</h3>
            <p className="text-2xl font-bold text-blue-900 mb-1">{metrics.total}</p>
            <p className="text-xs text-blue-700">Total activities this period</p>
            {getTrend.diff !== 0 && (
              <div className="mt-3 flex items-center gap-1">
                <span className={`text-xs font-medium ${getTrend.isPositive ? 'text-green-700' : 'text-red-700'}`}>
                  {getTrend.isPositive ? '↑' : '↓'} {Math.abs(getTrend.diff)}
                </span>
                <span className="text-xs text-blue-700">from previous period</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Activities
          </button>
          <button
            onClick={() => setFilter('application')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'application'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => setFilter('task')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'task'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setFilter('reminder')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'reminder'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Reminders
          </button>
          <button
            onClick={() => setFilter('contact')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'contact'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Contacts
          </button>
          <button
            onClick={() => setFilter('document')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'document'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setFilter('skill')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'skill'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Skills
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-dark-text-secondary">Loading activities...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-white dark:bg-dark-card-bg rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-2">No activities yet</h3>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              {filter === 'all' 
                ? 'Start tracking your job search by creating applications, tasks, or adding contacts.'
                : `No ${filter} activities found.`}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-card-bg rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredActivities.map((activity, index) => {
                const actionBadge = getActionBadge(activity.action);
                return (
                  <div key={activity.id} className="p-4 sm:p-6 hover:bg-gray-50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${activity.color}`}>
                        {activity.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-dark-text-primary">{activity.title}</h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${actionBadge.color}`}>
                                {actionBadge.text}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-2">{activity.description}</p>
                            <p className="text-xs text-gray-500 dark:text-dark-text-secondary">{formatTimestamp(activity.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
