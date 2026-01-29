'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useModals } from '@/hooks/useModals';
import { tasksApi, Task, applicationsApi, Application } from '@/lib/api';

export default function TasksPage() {
  const { alertModal, confirmModal, showAlert, showConfirm, closeAlert, closeConfirm } = useModals();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as Task['priority'],
    status: 'Pending' as Task['status'],
    dueDate: '',
    applicationId: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchApplications();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await tasksApi.getAll();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const data = await applicationsApi.getAll();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare data, handling empty dates
      const submitData: any = {
        ...formData,
      };
      
      // Validate required fields
      if (!submitData.title || !submitData.title.trim()) {
        showAlert('Validation Error', 'Task title is required.', 'warning');
        return;
      }
      
      // Only include dueDate if it's not empty
      if (!submitData.dueDate || submitData.dueDate.trim() === '') {
        delete submitData.dueDate;
      } else {
        // Validate date format
        const date = new Date(submitData.dueDate);
        if (isNaN(date.getTime())) {
          showAlert('Invalid Date', 'Invalid due date. Please enter a valid date.', 'warning');
          return;
        }
        // Ensure date is in ISO format (YYYY-MM-DD)
        submitData.dueDate = date.toISOString().split('T')[0];
      }

      // Only include applicationId if it's selected
      if (!submitData.applicationId || submitData.applicationId.trim() === '') {
        delete submitData.applicationId;
      }
      
      if (editingTask) {
        await tasksApi.update(editingTask._id, submitData);
        showAlert('Success', 'Task updated successfully!', 'success');
      } else {
        await tasksApi.create(submitData);
        showAlert('Success', 'Task added successfully!', 'success');
      }
      setShowModal(false);
      setEditingTask(null);
      resetForm();
      fetchTasks();
    } catch (error: any) {
      console.error('Error saving task:', error);
      // Show detailed error message
      let errorMessage = 'Error saving task. Please check all fields and try again.';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data) {
        // Handle array of error messages
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ');
        } else if (typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        }
      }
      
      showAlert('Error', errorMessage, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await tasksApi.delete(id);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'Medium',
      status: 'Pending',
      dueDate: '',
      applicationId: '',
    });
  };

  const getApplicationName = (applicationId?: string) => {
    if (!applicationId) return null;
    const app = applications.find(a => a._id === applicationId);
    return app ? `${app.jobTitle} at ${app.company}` : null;
  };

  // Kanban board functions
  const statusColumns = [
    { id: 'Pending', label: 'Pending', color: 'bg-gray-50 border-gray-200' },
    { id: 'In Progress', label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
    { id: 'Completed', label: 'Completed', color: 'bg-green-50 border-green-200' },
  ];

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    if (!draggedTask) return;

    if (draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      // Optimistically update the UI
      const updatedTasks = tasks.map(task =>
        task._id === draggedTask._id ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);

      // Update task status
      await tasksApi.update(draggedTask._id, { status: newStatus });
      setDraggedTask(null);
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert on error
      fetchTasks();
      showAlert('Error', 'Failed to update task status. Please try again.', 'error');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-1 sm:mb-2">Tasks</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary">Manage your tasks and reminders</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              {/* View Toggle */}
              <div className="inline-flex rounded-lg bg-gray-100 p-1 border border-gray-200 self-start sm:self-center">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition flex items-center ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm dark:bg-dark-primary'
                      : 'hover:bg-white/80 dark:hover:bg-dark-hover text-gray-600 dark:text-blue-400'
                  }`}
                >
                  <svg className={`w-4 h-4 inline mr-1.5 ${viewMode === 'list' ? 'text-blue-600 dark:text-white' : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className={viewMode === 'list' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-blue-400'}>List</span>
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition flex items-center ${
                    viewMode === 'kanban'
                      ? 'bg-white shadow-sm dark:bg-dark-primary'
                      : 'hover:bg-white/80 dark:hover:bg-dark-hover text-gray-600 dark:text-blue-400'
                  }`}
                >
                  <svg className={`w-4 h-4 inline mr-1.5 ${viewMode === 'kanban' ? 'text-blue-600 dark:text-white' : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <span className={viewMode === 'kanban' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-blue-400'}>Kanban</span>
                </button>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setEditingTask(null);
                  setShowModal(true);
                }}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition shadow-sm touch-manipulation"
              >
                + Add Task
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-dark-card-bg rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-2">No tasks yet</h3>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">Get started by adding your first task</p>
            <button
              onClick={() => {
                resetForm();
                setEditingTask(null);
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              + Add Task
            </button>
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Board View */
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {statusColumns.map((column) => {
                const columnTasks = getTasksByStatus(column.id as Task['status']);
                return (
                  <div
                    key={column.id}
                    className="flex-shrink-0 w-72"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id as Task['status'])}
                  >
                    <div className="bg-gray-50 dark:bg-dark-card-bg/50 rounded-lg p-4 border border-gray-200 dark:border-dark-border">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            column.id === 'Completed' ? 'bg-green-500' :
                            column.id === 'In Progress' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`}></span>
                          {column.label}
                        </h3>
                        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                          {columnTasks.length}
                        </span>
                      </div>
                      <div className="space-y-3 min-h-[200px]">
                        {columnTasks.map((task) => (
                          <div
                            key={task._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task)}
                            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition cursor-move"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary truncate">{task.title}</h4>
                                {task.description && (
                                  <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-0.5 line-clamp-2">{task.description}</p>
                                )}
                              </div>
                              <div className="flex gap-1 ml-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingTask(task);
                                    setShowViewModal(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:text-dark-text-secondary transition"
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
                                    setEditingTask(task);
                                    setFormData({
                                      title: task.title,
                                      description: task.description || '',
                                      priority: task.priority,
                                      status: task.status,
                                      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                                      applicationId: task.applicationId || '',
                                    });
                                    setShowModal(true);
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
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                task.priority === 'High' ? 'bg-red-100 text-red-700' :
                                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                            {task.applicationId && getApplicationName(task.applicationId) && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {getApplicationName(task.applicationId)}
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="text-xs text-gray-500">
                                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            )}
                          </div>
                        ))}
                        {columnTasks.length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                            Drop tasks here
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div key={task._id} className="bg-white dark:bg-dark-card-bg rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">{task.title}</h3>
                    {task.applicationId && getApplicationName(task.applicationId) && (
                      <div className="mb-2">
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {getApplicationName(task.applicationId)}
                        </span>
                      </div>
                    )}
                    {task.description && <p className="text-gray-600 dark:text-dark-text-secondary mb-3">{task.description}</p>}
                    <div className="flex items-center gap-4">
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
                        <span className="text-sm text-gray-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setFormData({
                          title: task.title,
                          description: task.description || '',
                          priority: task.priority,
                          status: task.status,
                          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                          applicationId: task.applicationId || '',
                        });
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card-bg rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                  {editingTask ? 'Edit Task' : 'Add New Task'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">Create a task to track your job search activities</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 dark:text-dark-text-primary"
                    placeholder="e.g., Follow up with recruiter"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none text-gray-900 dark:text-dark-text-primary"
                    placeholder="Add details about this task..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Related Application (Optional)</label>
                  <select
                    value={formData.applicationId}
                    onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 dark:text-dark-text-primary"
                  >
                    <option value="">No application linked</option>
                    {applications.map((app) => (
                      <option key={app._id} value={app._id}>
                        {app.jobTitle} at {app.company}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Link this task to a specific job application</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 dark:text-dark-text-primary"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 dark:text-dark-text-primary"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 dark:text-dark-text-primary"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTask(null);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-lg transition font-medium shadow-sm"
                  >
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
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

        {/* View Task Modal */}
        {viewingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card-bg rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Task Details</h2>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">View complete task information</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Title</label>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">{viewingTask.title}</h3>
                </div>

                {/* Description */}
                {viewingTask.description && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</label>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{viewingTask.description}</p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Priority */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Priority</label>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                        viewingTask.priority === 'High' ? 'bg-red-100 text-red-700' :
                        viewingTask.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {viewingTask.priority}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</label>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                        viewingTask.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        viewingTask.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {viewingTask.status}
                      </span>
                    </div>
                  </div>

                  {/* Due Date */}
                  {viewingTask.dueDate && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Due Date</label>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-900 dark:text-dark-text-primary font-medium">
                          {new Date(viewingTask.dueDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Linked Application */}
                  {viewingTask.applicationId && getApplicationName(viewingTask.applicationId) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Linked Application</label>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-900 dark:text-dark-text-primary font-medium">{getApplicationName(viewingTask.applicationId)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Created Date */}
                {viewingTask.createdAt && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Created</label>
                    <p className="text-gray-600 dark:text-dark-text-secondary">
                      {new Date(viewingTask.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setViewingTask(null);
                      setShowViewModal(false);
                      setEditingTask(viewingTask);
                      setFormData({
                        title: viewingTask.title,
                        description: viewingTask.description || '',
                        priority: viewingTask.priority,
                        status: viewingTask.status,
                        dueDate: viewingTask.dueDate ? new Date(viewingTask.dueDate).toISOString().split('T')[0] : '',
                        applicationId: viewingTask.applicationId || '',
                      });
                      setShowModal(true);
                    }}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Task
                  </button>
                  <button
                    onClick={() => {
                      setViewingTask(null);
                      setShowViewModal(false);
                    }}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
