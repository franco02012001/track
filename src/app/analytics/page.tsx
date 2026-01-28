'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { applicationsApi, Application } from '@/lib/api';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({ total: 0, active: 0, interviews: 0, offers: 0 });
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, appsData] = await Promise.all([
        applicationsApi.getStats(),
        applicationsApi.getAll(),
      ]);
      setStats(statsData);
      setApplications(appsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate status distribution
  const statusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {
      Applied: 0,
      Screening: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
      Withdrawn: 0,
    };

    applications.forEach((app) => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [applications]);

  // Helper function to group dates by period
  const groupByPeriod = (date: Date, period: TimePeriod): string => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const week = getWeekNumber(date);
    const day = date.getDate();
    
    switch (period) {
      case 'day':
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      case 'week':
        return `${year}-W${String(week).padStart(2, '0')}`;
      case 'month':
        return `${year}-${String(month + 1).padStart(2, '0')}`;
      case 'year':
        return String(year);
      default:
        return date.toISOString().split('T')[0];
    }
  };

  // Helper function to get week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Helper function to format date label based on period
  const formatDateLabel = (dateStr: string, period: TimePeriod): string => {
    if (period === 'day') {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period === 'week') {
      const [year, week] = dateStr.split('-W');
      return `W${week} ${year}`;
    } else if (period === 'month') {
      const [year, month] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else {
      return dateStr;
    }
  };

  // Calculate applications over time based on selected period
  const applicationsOverTime = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let periods: string[] = [];
    let periodCount = 0;
    
    // Determine number of periods and create period keys
    switch (timePeriod) {
      case 'day':
        periodCount = 30;
        for (let i = periodCount - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          periods.push(groupByPeriod(date, 'day'));
        }
        break;
      case 'week':
        periodCount = 12;
        for (let i = periodCount - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - (i * 7));
          periods.push(groupByPeriod(date, 'week'));
        }
        break;
      case 'month':
        periodCount = 12;
        for (let i = periodCount - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setMonth(date.getMonth() - i);
          periods.push(groupByPeriod(date, 'month'));
        }
        break;
      case 'year':
        periodCount = 5;
        for (let i = periodCount - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setFullYear(date.getFullYear() - i);
          periods.push(groupByPeriod(date, 'year'));
        }
        break;
    }

    // Group applications by period
    const periodData: Record<string, number> = {};
    periods.forEach(period => {
      periodData[period] = 0;
    });

    applications.forEach((app) => {
      if (!app.appliedDate) return;
      const appDate = new Date(app.appliedDate);
      const periodKey = groupByPeriod(appDate, timePeriod);
      if (periodData.hasOwnProperty(periodKey)) {
        periodData[periodKey]++;
      }
    });

    return periods.map(period => ({
      date: formatDateLabel(period, timePeriod),
      fullDate: period,
      count: periodData[period] || 0,
    }));
  }, [applications, timePeriod]);

  // Calculate status trends over time based on selected period
  const statusTrends = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let periods: string[] = [];
    let periodCount = 0;
    
    // Determine number of periods
    switch (timePeriod) {
      case 'day':
        periodCount = 30;
        for (let i = periodCount - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          periods.push(groupByPeriod(date, 'day'));
        }
        break;
      case 'week':
        periodCount = 12;
        for (let i = periodCount - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - (i * 7));
          periods.push(groupByPeriod(date, 'week'));
        }
        break;
      case 'month':
        periodCount = 12;
        for (let i = periodCount - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setMonth(date.getMonth() - i);
          periods.push(groupByPeriod(date, 'month'));
        }
        break;
      case 'year':
        periodCount = 5;
        for (let i = periodCount - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setFullYear(date.getFullYear() - i);
          periods.push(groupByPeriod(date, 'year'));
        }
        break;
    }

    const statuses = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
    const data: Record<string, Array<{ date: string; count: number }>> = {};

    statuses.forEach((status) => {
      data[status] = [];
      periods.forEach((period) => {
        // Count cumulative applications up to this period
        const count = applications.filter((app) => {
          if (app.status !== status) return false;
          if (!app.appliedDate) return false;
          const appDate = new Date(app.appliedDate);
          const appPeriod = groupByPeriod(appDate, timePeriod);
          
          // Compare periods
          return periods.indexOf(appPeriod) <= periods.indexOf(period);
        }).length;

        data[status].push({
          date: formatDateLabel(period, timePeriod),
          count,
        });
      });
    });

    return data;
  }, [applications, timePeriod]);

  // Calculate top companies
  const topCompanies = useMemo(() => {
    const companyCounts: Record<string, number> = {};
    
    applications.forEach((app) => {
      if (app.company) {
        companyCounts[app.company] = (companyCounts[app.company] || 0) + 1;
      }
    });

    return Object.entries(companyCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [applications]);

  // Calculate success rate
  const successRate = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.offers / stats.total) * 100);
  }, [stats]);

  // Pie chart colors
  const pieColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#6B7280', // gray
  ];

  // Calculate pie chart data
  const pieData = statusDistribution.filter((item) => item.value > 0);
  const totalForPie = pieData.reduce((sum, item) => sum + item.value, 0);

  // Calculate angles for pie chart
  let currentAngle = -90;
  const pieSegments = pieData.map((item, index) => {
    const percentage = (item.value / totalForPie) * 100;
    const angle = (item.value / totalForPie) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    const largeArcFlag = angle > 180 ? 1 : 0;

    const x1 = 100 + 80 * Math.cos(startAngleRad);
    const y1 = 100 + 80 * Math.sin(startAngleRad);
    const x2 = 100 + 80 * Math.cos(endAngleRad);
    const y2 = 100 + 80 * Math.sin(endAngleRad);

    return {
      ...item,
      percentage: percentage.toFixed(1),
      startAngle,
      endAngle,
      largeArcFlag,
      x1,
      y1,
      x2,
      y2,
      color: pieColors[index % pieColors.length],
    };
  });

  // Bar chart max value
  const maxBarValue = Math.max(...statusDistribution.map((item) => item.value), 1);

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-gray-500">Loading analytics...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">View your job search statistics and insights</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Applications</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Pipeline</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Interviews</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.interviews}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Offers</h3>
            <p className="text-3xl font-bold text-green-600">{stats.offers}</p>
            {stats.total > 0 && (
              <p className="text-sm text-gray-500 mt-1">Success Rate: {successRate}%</p>
            )}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status Distribution Pie Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Status Distribution</h2>
            {pieData.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Pie Chart */}
                <div className="relative flex-shrink-0">
                  <svg width="240" height="240" viewBox="0 0 200 200" className="drop-shadow-sm">
                    {pieSegments.map((segment, index) => (
                      <path
                        key={index}
                        d={`M 100 100 L ${segment.x1} ${segment.y1} A 80 80 0 ${segment.largeArcFlag} 1 ${segment.x2} ${segment.y2} Z`}
                        fill={segment.color}
                        stroke="white"
                        strokeWidth="3"
                        className="hover:opacity-90 transition-opacity cursor-pointer"
                      />
                    ))}
                  </svg>
                </div>
                
                {/* Legend */}
                <div className="flex-1 w-full lg:w-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pieSegments.map((segment, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div
                          className="w-5 h-5 rounded flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: segment.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">{segment.name}</span>
                            <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                              {segment.value}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{
                                width: `${segment.percentage}%`,
                                backgroundColor: segment.color,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 mt-0.5">{segment.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No data available</div>
            )}
          </div>

          {/* Status Bar Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Applications by Status</h2>
            {statusDistribution.length > 0 ? (
              <div className="space-y-4">
                {statusDistribution.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className="text-sm font-bold text-gray-900">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{
                          width: `${(item.value / maxBarValue) * 100}%`,
                          backgroundColor: pieColors[index % pieColors.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No data available</div>
            )}
          </div>
        </div>

        {/* Applications Over Time - Line Chart */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Applications Over Time</h2>
              <p className="text-sm text-gray-500">
                Track your application activity by {timePeriod === 'day' ? 'daily' : timePeriod === 'week' ? 'weekly' : timePeriod === 'month' ? 'monthly' : 'yearly'} trends
              </p>
            </div>
            {/* Time Period Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl p-1 border border-gray-200">
              {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    timePeriod === period
                      ? 'bg-blue-600 text-white shadow-md transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {applicationsOverTime.some((item) => item.count > 0) ? (
            <div className="relative bg-gradient-to-b from-blue-50/30 to-transparent rounded-lg p-4 -mx-2">
              <svg width="100%" height="350" viewBox="0 0 900 350" className="overflow-visible">
                {/* Grid lines */}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Y-axis grid lines */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const maxCount = Math.max(...applicationsOverTime.map((item) => item.count), 1);
                  const y = 280 - (i * (220 / 5));
                  return (
                    <g key={i}>
                      <line
                        x1="70"
                        y1={y}
                        x2="850"
                        y2={y}
                        stroke="#E5E7EB"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                        opacity="0.6"
                      />
                      <text
                        x="60"
                        y={y + 4}
                        textAnchor="end"
                        className="text-xs fill-gray-600 font-medium"
                        fontSize="11"
                      >
                        {Math.round((maxCount / 5) * (5 - i))}
                      </text>
                    </g>
                  );
                })}

                {/* Calculate line path */}
                {(() => {
                  const maxCount = Math.max(...applicationsOverTime.map((item) => item.count), 1);
                  const padding = 70;
                  const chartWidth = 780;
                  const chartHeight = 220;
                  const stepX = chartWidth / (applicationsOverTime.length - 1 || 1);
                  
                  let pathData = '';
                  let areaPathData = '';
                  
                  applicationsOverTime.forEach((item, index) => {
                    const x = padding + (index * stepX);
                    const y = padding + chartHeight - (item.count / maxCount) * chartHeight;
                    
                    if (index === 0) {
                      pathData += `M ${x} ${y}`;
                      areaPathData += `M ${x} ${padding + chartHeight}`;
                    } else {
                      pathData += ` L ${x} ${y}`;
                      areaPathData += ` L ${x} ${y}`;
                    }
                    
                    if (index === applicationsOverTime.length - 1) {
                      areaPathData += ` L ${x} ${padding + chartHeight} Z`;
                    }
                  });

                  return (
                    <>
                      {/* Area fill */}
                      <path
                        d={areaPathData}
                        fill="url(#lineGradient)"
                      />
                      {/* Line */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Data points */}
                      {applicationsOverTime.map((item, index) => {
                        const maxCount = Math.max(...applicationsOverTime.map((i) => i.count), 1);
                        const x = padding + (index * stepX);
                        const y = padding + chartHeight - (item.count / maxCount) * chartHeight;
                        return (
                          <g key={index}>
                            <circle
                              cx={x}
                              cy={y}
                              r="5"
                              fill="#3B82F6"
                              stroke="white"
                              strokeWidth="2"
                              className="hover:r-7 transition-all cursor-pointer"
                            />
                            <title>{`${item.date}: ${item.count} applications`}</title>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}

                {/* X-axis labels */}
                {applicationsOverTime.map((item, index) => {
                  // Show labels based on period and data length
                  const labelInterval = timePeriod === 'day' ? 5 : timePeriod === 'week' ? 2 : timePeriod === 'month' ? 2 : 1;
                  if (index % labelInterval !== 0 && index !== applicationsOverTime.length - 1) return null;
                  
                  const maxCount = Math.max(...applicationsOverTime.map((i) => i.count), 1);
                  const padding = 70;
                  const chartWidth = 780;
                  const stepX = chartWidth / (applicationsOverTime.length - 1 || 1);
                  const x = padding + (index * stepX);
                  
                  return (
                    <g key={index}>
                      {/* Tick mark */}
                      <line
                        x1={x}
                        y1="300"
                        x2={x}
                        y2="310"
                        stroke="#9CA3AF"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x}
                        y="330"
                        textAnchor="middle"
                        className="text-xs fill-gray-600 font-medium"
                        fontSize="10"
                      >
                        {timePeriod === 'day' ? item.date.split(' ')[0] : item.date}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No applications in the last 30 days</div>
          )}
        </div>

        {/* Status Trends Line Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Status Trends Over Time</h2>
            {/* Time Period Filter */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    timePeriod === period
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {Object.keys(statusTrends).length > 0 ? (
            <div className="relative bg-gradient-to-b from-purple-50/30 to-transparent rounded-lg p-4 -mx-2">
              <svg width="100%" height="350" viewBox="0 0 900 350" className="overflow-visible">
                <defs>
                  {['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'].map((status, idx) => {
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
                    return (
                      <linearGradient key={status} id={`gradient-${status}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={colors[idx]} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={colors[idx]} stopOpacity="0" />
                      </linearGradient>
                    );
                  })}
                </defs>
                
                {/* Y-axis grid lines */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const allCounts = Object.values(statusTrends).flat().map((item) => item.count);
                  const maxCount = Math.max(...allCounts, 1);
                  const y = 250 - (i * (200 / 5));
                  return (
                    <g key={i}>
                      <line
                        x1="50"
                        y1={y}
                        x2="750"
                        y2={y}
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                      <text
                        x="40"
                        y={y + 5}
                        textAnchor="end"
                        className="text-xs fill-gray-500"
                        fontSize="12"
                      >
                        {Math.round((maxCount / 5) * (5 - i))}
                      </text>
                    </g>
                  );
                })}

                {/* Draw lines for each status */}
                {['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'].map((status, statusIdx) => {
                  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
                  const statusData = statusTrends[status];
                  if (!statusData || statusData.length === 0) return null;
                  
                  const allCounts = Object.values(statusTrends).flat().map((item) => item.count);
                  const maxCount = Math.max(...allCounts, 1);
                  const padding = 70;
                  const chartWidth = 780;
                  const chartHeight = 220;
                  const stepX = chartWidth / (statusData.length - 1 || 1);
                  
                  let pathData = '';
                  let areaPathData = '';
                  
                  statusData.forEach((item, index) => {
                    const x = padding + (index * stepX);
                    const y = padding + chartHeight - (item.count / maxCount) * chartHeight;
                    
                    if (index === 0) {
                      pathData += `M ${x} ${y}`;
                      areaPathData += `M ${x} ${padding + chartHeight}`;
                    } else {
                      pathData += ` L ${x} ${y}`;
                      areaPathData += ` L ${x} ${y}`;
                    }
                    
                    if (index === statusData.length - 1) {
                      areaPathData += ` L ${x} ${padding + chartHeight} Z`;
                    }
                  });

                  return (
                    <g key={status}>
                      {/* Area fill */}
                      <path
                        d={areaPathData}
                        fill={`url(#gradient-${status})`}
                        opacity="0.3"
                      />
                      {/* Line */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={colors[statusIdx]}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-sm"
                      />
                      {/* Data points */}
                      {statusData.map((item, index) => {
                        const x = padding + (index * stepX);
                        const y = padding + chartHeight - (item.count / maxCount) * chartHeight;
                        return (
                          <g key={index}>
                            {/* Hover circle */}
                            <circle
                              cx={x}
                              cy={y}
                              r="7"
                              fill={colors[statusIdx]}
                              opacity="0.1"
                              className="hover:opacity-20 transition-opacity"
                            />
                            {/* Main circle */}
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill={colors[statusIdx]}
                              stroke="white"
                              strokeWidth="2.5"
                              className="hover:r-5 transition-all drop-shadow-md"
                            />
                            {/* Inner dot */}
                            <circle
                              cx={x}
                              cy={y}
                              r="1.5"
                              fill={colors[statusIdx]}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {applicationsOverTime.map((item, index) => {
                  // Show labels based on period and data length
                  const labelInterval = timePeriod === 'day' ? 5 : timePeriod === 'week' ? 2 : timePeriod === 'month' ? 2 : 1;
                  if (index % labelInterval !== 0 && index !== applicationsOverTime.length - 1) return null;
                  
                  const padding = 70;
                  const chartWidth = 780;
                  const stepX = chartWidth / (applicationsOverTime.length - 1 || 1);
                  const x = padding + (index * stepX);
                  
                  return (
                    <g key={index}>
                      {/* Tick mark */}
                      <line
                        x1={x}
                        y1="300"
                        x2={x}
                        y2="310"
                        stroke="#9CA3AF"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x}
                        y="330"
                        textAnchor="middle"
                        className="text-xs fill-gray-600 font-medium"
                        fontSize="10"
                      >
                        {timePeriod === 'day' ? item.date.split(' ')[0] : item.date}
                      </text>
                    </g>
                  );
                })}
              </svg>
              
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-6 mt-6 pt-4 border-t border-gray-200">
                {['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'].map((status, idx) => {
                  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
                  return (
                    <div key={status} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                      <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: colors[idx] }}
                      />
                      <span className="text-sm font-medium text-gray-700">{status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">No status trend data available for the selected period</p>
            </div>
          )}
        </div>

        {/* Top Companies */}
        {topCompanies.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Companies</h2>
            <div className="space-y-3">
              {topCompanies.map((company, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                      {company.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{company.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(company.count / topCompanies[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">
                      {company.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
