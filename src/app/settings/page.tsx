'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { usersApi } from '@/lib/api';

export default function SettingsPage() {
  const { user, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
      setTwoFactorEnabled(user.twoFactorEnabled || false);
      if (user.picture) {
        setPreviewUrl(user.picture);
      } else {
        setPreviewUrl(undefined);
      }
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) {
      showAlert('No File Selected', 'Please select an image file first.', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const updatedUser = await usersApi.uploadPicture(selectedFile);
      // Update preview with new picture URL
      if (updatedUser.picture) {
        // Use the picture URL directly (data URL or external URL)
        const pictureUrl = updatedUser.picture;
        setPreviewUrl(pictureUrl);
      }
      // Refresh profile to update context
      await refreshProfile();
      // Clear file input
      setSelectedFile(null);
      const fileInput = document.getElementById('profile-picture-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      showAlert('Success', 'Profile picture updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error uploading picture:', error);
      const errorMessage = error?.message || error?.toString() || 'Error uploading picture. Please try again.';
      showAlert('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.updateProfile({ name: formData.name });
      await refreshProfile();
      showAlert('Success', 'Profile updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showAlert('Error', error?.message || 'Error updating profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    const newValue = !twoFactorEnabled;
    setLoading(true);
    try {
      await usersApi.update2FA(newValue);
      setTwoFactorEnabled(newValue);
      alert(`Two-factor authentication ${newValue ? 'enabled' : 'disabled'} successfully!`);
    } catch (error: any) {
      console.error('Error updating 2FA:', error);
      alert(error?.message || 'Error updating two-factor authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    setLoading(true);
    try {
      await usersApi.deleteAccount();
      showAlert('Account Deleted', 'Your account has been deleted successfully.', 'success');
      setTimeout(() => {
        logout();
        router.push('/');
      }, 1500);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      showAlert('Error', error?.message || 'Error deleting account. Please try again.', 'error');
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Main Content (no sidebar) */}
      <main className="max-w-6xl mx-auto px-4 pb-12">
        {/* Top Header */}
        <header className="sticky top-0 z-30 backdrop-blur bg-white/80 dark:bg-dark-sidebar-bg/80 border-b border-slate-200 dark:border-dark-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-blue-100 shadow-sm overflow-hidden">
                  {(user?.picture ?? previewUrl) ? (
                    <img 
                      src={(user?.picture ?? previewUrl) ?? ''} 
                      alt={user?.name || 'Profile'} 
                      className="w-11 h-11 rounded-full object-cover" 
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-dark-text-secondary uppercase tracking-wide">Profile Settings</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary">
                  {user?.name || 'Your account'}
                </p>
                <p className="text-xs text-slate-500 dark:text-dark-text-secondary hidden sm:block">
                  Update your personal information, security and account preferences.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/')}
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-dark-text-secondary hover:text-slate-900 dark:hover:text-slate-100 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-hover border border-slate-200 dark:border-dark-border transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to dashboard
            </button>
          </div>
        </header>

        {/* Settings Content */}
        <div className="pt-8">
          <div className="max-w-5xl mx-auto">
            {/* Tabs */}
            <div className="inline-flex rounded-full bg-slate-100 p-1 mb-8 shadow-inner">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                  activeTab === 'profile'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                  activeTab === 'account'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Account
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                  activeTab === 'security'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Security
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white/90 dark:bg-dark-card-bg/90 backdrop-blur rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-dark-border">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-dark-text-primary mb-2">Profile information</h2>
                <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-6">
                  Keep your personal details up to date. This information is used across your Tracker workspace.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Profile Picture */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div>
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={formData.name || 'Profile'}
                          className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center border-2 border-slate-200 shadow-sm">
                          <span className="text-white font-bold text-2xl">
                            {formData.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 w-full">
                      <input
                        type="file"
                        id="profile-picture-upload"
                        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <label
                          htmlFor="profile-picture-upload"
                          className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg transition text-sm font-medium cursor-pointer shadow-sm"
                        >
                          {selectedFile ? 'Change selected photo' : 'Change photo'}
                        </label>
                      {selectedFile && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleUploadPicture}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {loading ? 'Uploading...' : 'Save Photo'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl(user?.picture || undefined);
                              const input = document.getElementById('profile-picture-upload') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        JPG, GIF, PNG or WEBP. Max size of 2MB.
                      </p>
                    </div>
                  </div>

                  {/* Basic info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Full name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white placeholder:text-slate-400 text-sm"
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 text-slate-900 text-sm"
                        placeholder="Enter your email"
                        disabled
                      />
                      <p className="text-xs text-slate-500 mt-1">Email is managed by your sign-in provider and cannot be changed here.</p>
                    </div>
                  </div>

                  {/* Provider Info */}
                  {user?.provider && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Sign-in Method
                      </label>
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                        {user.provider === 'google' ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        )}
                        <span className="text-slate-700 font-medium capitalize">{user.provider}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                    <button
                      type="button"
                      onClick={() => router.push('/')}
                      className="px-5 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="bg-white/90 dark:bg-dark-card-bg/90 backdrop-blur rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-dark-border">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-dark-text-primary mb-2">Account settings</h2>
                <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-6">
                  Manage your account lifecycle and data retention preferences.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Delete account</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium shadow-sm"
                      >
                        Delete account
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 font-semibold mb-1">Are you sure you want to delete your account?</p>
                          <p className="text-red-700 text-sm">
                            This action cannot be undone. All your data will be permanently deleted.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={loading}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={loading}
                            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm font-medium"
                          >
                            Not today
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white/90 dark:bg-dark-card-bg/90 backdrop-blur rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-dark-border">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-dark-text-primary mb-2">Security settings</h2>
                <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-6">
                  Strengthen your account protection with two-factor authentication and session monitoring.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary">Two-factor authentication</h3>
                        <p className="text-slate-600 dark:text-dark-text-secondary text-sm mt-1">
                          Add an extra layer of security to your account by enabling two-factor authentication.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={twoFactorEnabled}
                          onChange={handleToggle2FA}
                          disabled={loading}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-dark-hover rounded-lg border border-slate-100 dark:border-dark-border">
                      <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
                        {twoFactorEnabled ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">✓ Two-factor authentication is enabled for your account.</span>
                        ) : (
                          <span>Two-factor authentication is currently disabled.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-dark-border pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary mb-2">Active sessions</h3>
                    <p className="text-slate-600 dark:text-dark-text-secondary text-sm mb-4">
                      Manage and monitor your active sessions across different devices.
                    </p>
                    <button className="px-4 py-2 border border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text-secondary rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover transition text-sm font-medium shadow-sm">
                      View active sessions
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
