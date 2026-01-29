'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useModals } from '@/hooks/useModals';
import { tasksApi, Task, applicationsApi, Application } from '@/lib/api';

export default function RemindersPage() {
  const { alertModal, confirmModal, showAlert, showConfirm, closeAlert, closeConfirm } = useModals();
  const [reminders, setReminders] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as Task['priority'],
    status: 'Pending' as Task['status'],
    dueDate: '',
    applicationId: '',
  });

  useEffect(() => {
    fetchReminders();
    fetchApplications();
  }, []);

  const fetchReminders = async () => {
    try {
      const data = await tasksApi.getAll();
      // Filter for reminders (tasks with due dates)
      const reminderTasks = data.filter(task => task.dueDate);
      setReminders(reminderTasks.sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }));
    } catch (error) {
      console.error('Error fetching reminders:', error);
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
      const submitData: any = { ...formData };
      // Only include applicationId if it's selected
      if (!submitData.applicationId || submitData.applicationId.trim() === '') {
        delete submitData.applicationId;
      }
      // Only include dueDate if it's not empty
      if (!submitData.dueDate || submitData.dueDate.trim() === '') {
        delete submitData.dueDate;
      } else {
        const date = new Date(submitData.dueDate);
        if (isNaN(date.getTime())) {
          showAlert('Invalid Date', 'Invalid due date. Please enter a valid date.', 'warning');
          return;
        }
        submitData.dueDate = date.toISOString().split('T')[0];
      }

      if (editingReminder) {
        await tasksApi.update(editingReminder._id, submitData);
        showAlert('Success', 'Reminder updated successfully!', 'success');
      } else {
        await tasksApi.create(submitData);
        showAlert('Success', 'Reminder added successfully!', 'success');
      }
      setShowModal(false);
      setEditingReminder(null);
      resetForm();
      fetchReminders();
    } catch (error: any) {
      console.error('Error saving reminder:', error);
      showAlert('Error', error?.message || 'Error saving reminder. Please try again.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      'Delete Reminder',
      'Are you sure you want to delete this reminder? This action cannot be undone.',
      async () => {
        try {
          await tasksApi.delete(id);
          fetchReminders();
          showAlert('Success', 'Reminder deleted successfully!', 'success');
        } catch (error: any) {
          console.error('Error deleting reminder:', error);
          showAlert('Error', error?.message || 'Error deleting reminder. Please try again.', 'error');
        }
      }
    );
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isToday = (dueDate: string) => {
    const today = new Date().toDateString();
    return new Date(dueDate).toDateString() === today;
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">Reminders</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary">Set and manage important reminders</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingReminder(null);
              setShowModal(true);
            }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition shadow-sm touch-manipulation"
          >
            + Add Reminder
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : reminders.length === 0 ? (
          <div className="bg-white dark:bg-dark-card-bg rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-2">No reminders yet</h3>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-6">Create reminders to stay on top of important dates</p>
            <button
              onClick={() => {
                resetForm();
                setEditingReminder(null);
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              + Add Reminder
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {reminders.map((reminder) => (
              <div
                key={reminder._id}
                className={`bg-white dark:bg-dark-card-bg rounded-xl p-6 shadow-sm border-2 transition ${
                  isOverdue(reminder.dueDate || '')
                    ? 'border-red-200 bg-red-50'
                    : isToday(reminder.dueDate || '')
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{reminder.title}</h3>
                      {isOverdue(reminder.dueDate || '') && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          Overdue
                        </span>
                      )}
                      {isToday(reminder.dueDate || '') && !isOverdue(reminder.dueDate || '') && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    {reminder.description && (
                      <p className="text-gray-600 dark:text-dark-text-secondary mb-3">{reminder.description}</p>
                    )}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                          {reminder.dueDate ? new Date(reminder.dueDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }) : 'No date'}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        reminder.priority === 'High' ? 'bg-red-50 text-red-700' :
                        reminder.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-green-50 text-green-700'
                      }`}>
                        {reminder.priority} Priority
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        reminder.status === 'Completed' ? 'bg-green-50 text-green-700' :
                        reminder.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        {reminder.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingReminder(reminder);
                        setFormData({
                          title: reminder.title,
                          description: reminder.description || '',
                          priority: reminder.priority,
                          status: reminder.status,
                          dueDate: reminder.dueDate ? new Date(reminder.dueDate).toISOString().split('T')[0] : '',
                          applicationId: reminder.applicationId || '',
                        });
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(reminder._id)}
                      className="text-red-600 hover:text-red-900 font-medium text-sm"
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
                  {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">Set a reminder for important dates and deadlines</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reminder Title <span className="text-red-500">*</span>
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
                    placeholder="Add details about this reminder..."
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
                  <p className="text-xs text-gray-500 mt-1">Link this reminder to a specific job application</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 dark:text-dark-text-primary"
                    />
                  </div>
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

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingReminder(null);
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
                    {editingReminder ? 'Update Reminder' : 'Create Reminder'}
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
      </div>
    </AppLayout>
  );
}
