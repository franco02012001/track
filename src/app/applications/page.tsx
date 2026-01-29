'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useModals } from '@/hooks/useModals';
import { applicationsApi, Application, tasksApi, Task } from '@/lib/api';

// Helper function to calculate working days (excluding weekends)
const addWorkingDays = (startDate: Date, days: number): Date => {
  const result = new Date(startDate);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }
  
  return result;
};

function ApplicationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { alertModal, confirmModal, showAlert, showConfirm, closeAlert, closeConfirm } = useModals();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [draggedApp, setDraggedApp] = useState<Application | null>(null);
  const [viewingApp, setViewingApp] = useState<Application | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    jobUrl: '',
    description: '',
    workMode: 'On-site' as Application['workMode'],
    status: 'Applied' as Application['status'],
    salary: '',
    notes: '',
    appliedDate: '',
  });
  const [createFollowUpReminder, setCreateFollowUpReminder] = useState(true);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowModal(true);
    }
    fetchApplications();
  }, [searchParams]);

  const fetchApplications = async () => {
    try {
      const data = await applicationsApi.getAll();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare data, handling empty dates
      const submitData: any = {
        ...formData,
      };
      
      // Validate and format dates
      if (submitData.appliedDate && submitData.appliedDate.trim() !== '') {
        const date = new Date(submitData.appliedDate);
        if (isNaN(date.getTime())) {
          showAlert('Invalid Date', 'Invalid applied date. Please enter a valid date.', 'warning');
          return;
        }
        // Ensure date is in ISO format (YYYY-MM-DD)
        submitData.appliedDate = date.toISOString().split('T')[0];
      } else {
        delete submitData.appliedDate;
      }
      
      // Validate required fields
      if (!submitData.jobTitle || !submitData.jobTitle.trim()) {
        showAlert('Validation Error', 'Job Title is required.', 'warning');
        return;
      }
      
      if (!submitData.company || !submitData.company.trim()) {
        showAlert('Validation Error', 'Company is required.', 'warning');
        return;
      }
      
      if (editingApp) {
        await applicationsApi.update(editingApp._id, submitData);
        showAlert('Success', 'Application updated successfully!', 'success');
      } else {
        const newApplication = await applicationsApi.create(submitData);
        showAlert('Success', 'Application added successfully!', 'success');
        
        // Create follow-up reminder if enabled and applied date is provided
        if (createFollowUpReminder && submitData.appliedDate) {
          try {
            const appliedDate = new Date(submitData.appliedDate);
            const followUpDate = addWorkingDays(appliedDate, 3);
            
            const reminderData = {
              title: `Follow up on ${submitData.jobTitle} at ${submitData.company}`,
              description: `Check for updates on your application for ${submitData.jobTitle} position at ${submitData.company}.`,
              priority: 'Medium' as Task['priority'],
              status: 'Pending' as Task['status'],
              dueDate: followUpDate.toISOString().split('T')[0],
              applicationId: newApplication._id,
            };
            
            await tasksApi.create(reminderData);
            // Don't show a separate alert for the reminder to avoid clutter
          } catch (error) {
            console.error('Error creating follow-up reminder:', error);
            // Don't show error to user as the application was created successfully
          }
        }
      }
      setShowModal(false);
      setEditingApp(null);
      resetForm();
      setCreateFollowUpReminder(true); // Reset checkbox
      fetchApplications();
    } catch (error: any) {
      console.error('Error saving application:', error);
      // Show detailed error message
      let errorMessage: string = 'Error saving application. Please check all fields and try again.';
      
      if (error?.response?.data?.message) {
        const message = error.response.data.message;
        if (Array.isArray(message)) {
          errorMessage = message.join(', ');
        } else if (typeof message === 'string') {
          errorMessage = message;
        }
      } else if (error?.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      
      showAlert('Error', errorMessage, 'error');
    }
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setFormData({
      jobTitle: app.jobTitle,
      company: app.company,
      location: app.location || '',
      jobUrl: app.jobUrl || '',
      description: app.description || '',
      workMode: app.workMode || 'On-site',
      status: app.status,
      salary: app.salary || '',
      notes: app.notes || '',
      appliedDate: app.appliedDate ? new Date(app.appliedDate).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const openJobUrl = (app: Application) => {
    if (!app.jobUrl || app.jobUrl.trim() === '') {
      showAlert(
        'No job URL',
        'This application does not have a job posting URL saved. You can add one when editing the application.',
        'info'
      );
      return;
    }

    try {
      const url = app.jobUrl.startsWith('http')
        ? app.jobUrl
        : `https://${app.jobUrl}`;
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      showAlert('Invalid URL', 'The job posting URL for this application is not valid.', 'warning');
    }
  };

  const handleDragStart = (e: React.DragEvent, app: Application) => {
    setDraggedApp(app);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('applicationId', app._id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Application['status']) => {
    e.preventDefault();
    if (!draggedApp) return;

    // Don't update if status hasn't changed
    if (draggedApp.status === newStatus) {
      setDraggedApp(null);
      return;
    }

    try {
      await applicationsApi.update(draggedApp._id, { status: newStatus });
      fetchApplications();
      showAlert('Success', `Application moved to ${newStatus}`, 'success');
    } catch (error: any) {
      console.error('Error updating application status:', error);
      let errorMessage: string = 'Failed to update application status. Please try again.';
      
      if (error?.response?.data?.message) {
        const message = error.response.data.message;
        if (Array.isArray(message)) {
          errorMessage = message.join(', ');
        } else if (typeof message === 'string') {
          errorMessage = message;
        }
      } else if (error?.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      
      showAlert('Error', errorMessage, 'error');
    } finally {
      setDraggedApp(null);
    }
  };

  const getApplicationsByStatus = (status: Application['status']) => {
    return applications.filter(app => app.status === status);
  };

  const filterApplications = (apps: Application[]) => {
    if (!searchQuery.trim()) return apps;
    
    const query = searchQuery.toLowerCase().trim();
    return apps.filter(app => 
      app.jobTitle.toLowerCase().includes(query) ||
      app.company.toLowerCase().includes(query) ||
      (app.location && app.location.toLowerCase().includes(query)) ||
      (app.description && app.description.toLowerCase().includes(query)) ||
      (app.notes && app.notes.toLowerCase().includes(query))
    );
  };

  const filteredApplications = filterApplications(applications);

  const statusColumns: Application['status'][] = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

  const handleView = async (app: Application) => {
    setViewingApp(app);
    setShowSummary(false);
    setShowViewModal(true);
    // Fetch related tasks and reminders
    try {
      const allTasks = await tasksApi.getAll();
      const related = allTasks.filter(task => task.applicationId === app._id);
      setRelatedTasks(related);
    } catch (error) {
      console.error('Error fetching related tasks:', error);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      'Delete Application',
      'Are you sure you want to delete this application? This action cannot be undone.',
      async () => {
        try {
          await applicationsApi.delete(id);
          fetchApplications();
          showAlert('Success', 'Application deleted successfully!', 'success');
        } catch (error: any) {
          console.error('Error deleting application:', error);
          showAlert('Error', error?.message || 'Error deleting application. Please try again.', 'error');
        }
      }
    );
  };

  const resetForm = () => {
    setFormData({
      jobTitle: '',
      company: '',
      location: '',
      jobUrl: '',
      description: '',
      workMode: 'On-site',
      status: 'Applied',
      salary: '',
      notes: '',
      appliedDate: '',
    });
    setCreateFollowUpReminder(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Applied: 'bg-blue-50 text-blue-700',
      Screening: 'bg-yellow-50 text-yellow-700',
      Interview: 'bg-purple-50 text-purple-700',
      Offer: 'bg-green-50 text-green-700',
      Rejected: 'bg-red-50 text-red-700',
      Withdrawn: 'bg-gray-50 text-gray-700',
    };
    return colors[status] || 'bg-gray-50 text-gray-700';
  };

  const getWorkModeColor = (mode?: Application['workMode']) => {
    if (!mode) return 'bg-gray-50 text-gray-600';
    const colors: Record<string, string> = {
      'On-site': 'bg-amber-50 text-amber-700',
      Hybrid: 'bg-indigo-50 text-indigo-700',
      'Work from home': 'bg-emerald-50 text-emerald-700',
    };
    return colors[mode] || 'bg-gray-50 text-gray-600';
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Applications</h1>
              <p className="text-gray-600">Manage your job applications</p>
            </div>
            <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="inline-flex rounded-lg bg-gray-100 p-1 border border-gray-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  viewMode === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Kanban
              </button>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingApp(null);
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition shadow-sm"
            >
              + Add Application
            </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              placeholder="Search by job title, company, location, description, or notes..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first job application</p>
            <button
              onClick={() => {
                resetForm();
                setEditingApp(null);
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              + Add Application
            </button>
          </div>
        ) : filteredApplications.length === 0 && searchQuery ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search query</p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Clear search
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Setup</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <tr key={app._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{app.jobTitle}</div>
                        {app.location && (
                          <div className="text-sm text-gray-500">{app.location}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{app.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getWorkModeColor(app.workMode)}`}>
                          {app.workMode || 'Not set'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(app.appliedDate || app.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleView(app)}
                          className="text-gray-600 hover:text-gray-900 mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(app)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(app._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {statusColumns.map((status) => {
                const statusApps = filterApplications(getApplicationsByStatus(status));
                return (
                  <div
                    key={status}
                    className="flex-shrink-0 w-72"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                  >
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ')[0]}`}></span>
                          {status}
                        </h3>
                        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                          {statusApps.length}
                        </span>
                      </div>
                      <div className="space-y-3 min-h-[200px]">
                        {statusApps.map((app) => (
                          <div
                            key={app._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, app)}
                            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition cursor-move"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{app.jobTitle}</h4>
                                <p className="text-xs text-gray-600 mt-0.5">{app.company}</p>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleView(app);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 transition"
                                  title="View"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(app);
                                  }}
                                  className="p-1 text-blue-400 hover:text-blue-600 transition"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            {app.location && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {app.location}
                              </div>
                            )}
                            {app.workMode && (
                              <div className="mb-2">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getWorkModeColor(app.workMode)}`}>
                                  {app.workMode}
                                </span>
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {formatDate(app.appliedDate || app.createdAt)}
                            </div>
                          </div>
                        ))}
                        {statusApps.length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                            Drop applications here
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingApp ? 'Edit application' : 'Add new application'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Enter the key details of this job so you can easily track its progress.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Role details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Role details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Job title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 text-sm placeholder:text-gray-400"
                        placeholder="e.g., Senior Software Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 text-sm placeholder:text-gray-400"
                        placeholder="e.g., Tech Corp"
                      />
                    </div>
                  </div>
                </div>

                {/* Location & setup */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Location & work setup</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 text-sm placeholder:text-gray-400"
                        placeholder="e.g., San Francisco, CA or Remote"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Work setup
                      </label>
                      <select
                        value={formData.workMode || 'On-site'}
                        onChange={(e) => setFormData({ ...formData, workMode: e.target.value as Application['workMode'] })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 text-sm"
                      >
                        <option value="On-site">On-site</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Work from home">Work from home</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Application['status'] })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 text-sm"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Screening">Screening</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Withdrawn">Withdrawn</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Posting & description */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                      Job posting URL
                    </label>
                    <input
                      type="url"
                      value={formData.jobUrl}
                      onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm text-gray-900 placeholder:text-gray-400"
                      placeholder="https://company.com/careers/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                      Job description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none text-gray-900 text-sm placeholder:text-gray-400"
                      placeholder="Paste the job description or key responsibilities here..."
                    />
                  </div>
                </div>

                {/* Timeline & compensation */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Timeline & compensation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Salary / compensation
                      </label>
                      <input
                        type="text"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 text-sm placeholder:text-gray-400"
                        placeholder="e.g., $100,000 - $120,000 or 80k base + bonus"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Applied date
                      </label>
                      <input
                        type="date"
                        value={formData.appliedDate}
                        onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none text-gray-900 text-sm placeholder:text-gray-400"
                    placeholder="Add next steps, interviewers, follow-up dates, or any other context..."
                  />
                </div>

                {/* Follow-up Reminder Option */}
                {!editingApp && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="createFollowUpReminder"
                        checked={createFollowUpReminder}
                        onChange={(e) => setCreateFollowUpReminder(e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <label htmlFor="createFollowUpReminder" className="block text-sm font-semibold text-gray-900 mb-1 cursor-pointer">
                          Create follow-up reminder
                        </label>
                        <p className="text-xs text-gray-600">
                          Automatically create a reminder to check for updates 3 working days after your application date. 
                          {formData.appliedDate && (
                            <span className="block mt-1 font-medium text-blue-700">
                              Reminder date: {addWorkingDays(new Date(formData.appliedDate), 3).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingApp(null);
                      resetForm();
                    }}
                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium shadow-sm"
                  >
                    {editingApp ? 'Save changes' : 'Create application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Options / Summary Modal */}
        {showViewModal && viewingApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto shadow-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <h2 className="text-xl font-bold text-gray-900">View application</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Choose how you want to view this application.
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Application overview */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900">
                    {viewingApp.jobTitle}
                  </p>
                  <p className="text-sm text-slate-600">
                    {viewingApp.company}
                  </p>
                  {(viewingApp.location || viewingApp.workMode) && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {viewingApp.location && (
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                          {viewingApp.location}
                        </span>
                      )}
                      {viewingApp.workMode && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkModeColor(viewingApp.workMode)}`}>
                          {viewingApp.workMode}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingApp.status)}`}>
                        {viewingApp.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Choice buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => openJobUrl(viewingApp)}
                    className="flex flex-col items-start justify-between px-4 py-3 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!viewingApp.jobUrl}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14h14" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-900">View job posting</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Open the job posting using the saved URL{!viewingApp.jobUrl && ' (no URL available)' }.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSummary(true)}
                    className="flex flex-col items-start justify-between px-4 py-3 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h4m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-900">View summary</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Quickly review key details and notes for this application.
                    </p>
                  </button>
                </div>

                {/* Related Tasks & Reminders - Always visible */}
                {relatedTasks.length > 0 && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Related Tasks & Reminders ({relatedTasks.length})
                    </h3>
                    <div className="space-y-3">
                      {relatedTasks.map((task: Task) => (
                        <div key={task._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              )}
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  task.priority === 'High' ? 'bg-red-50 text-red-700' :
                                  task.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-green-50 text-green-700'
                                }`}>
                                  {task.priority}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  task.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                  task.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                                  'bg-gray-50 text-gray-700'
                                }`}>
                                  {task.status}
                                </span>
                                {task.dueDate && (
                                  <span className="text-xs text-gray-600 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary details */}
                {showSummary && (
                  <div className="mt-2 border-t border-slate-200 pt-4 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Application summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Job title</p>
                        <p className="text-slate-900">{viewingApp.jobTitle}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Company</p>
                        <p className="text-slate-900">{viewingApp.company}</p>
                      </div>
                      {viewingApp.location && (
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Location</p>
                          <p className="text-slate-900">{viewingApp.location}</p>
                        </div>
                      )}
                      {viewingApp.workMode && (
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Work setup</p>
                          <p className="text-slate-900">{viewingApp.workMode}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Status</p>
                        <p className="text-slate-900">{viewingApp.status}</p>
                      </div>
                      {viewingApp.appliedDate && (
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Applied date</p>
                          <p className="text-slate-900">{formatDate(viewingApp.appliedDate)}</p>
                        </div>
                      )}
                      {viewingApp.salary && (
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Salary / compensation</p>
                          <p className="text-slate-900">{viewingApp.salary}</p>
                        </div>
                      )}
                      {viewingApp.jobUrl && (
                        <div className="sm:col-span-2">
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Job posting URL</p>
                          <p className="text-slate-900 break-all text-xs">{viewingApp.jobUrl}</p>
                        </div>
                      )}
                    </div>
                    {viewingApp.notes && (
                      <div className="mt-2">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-slate-900 text-sm whitespace-pre-line">{viewingApp.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(false);
                      setViewingApp(null);
                      setShowSummary(false);
                    }}
                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Modal */}
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={closeAlert}
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
        />

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirm}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </AppLayout>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-gray-500">Loading...</div>
        </div>
      </AppLayout>
    }>
      <ApplicationsPageContent />
    </Suspense>
  );
}
