'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import AnalysisResultModal from '@/components/AnalysisResultModal';
import { documentsApi, Document } from '@/lib/api';
import { skillsApi } from '@/lib/api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
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
  const [analysisResult, setAnalysisResult] = useState<{ isOpen: boolean; summary: string; skills: string[]; existingSkills?: string[] }>({
    isOpen: false,
    summary: '',
    skills: [],
    existingSkills: [],
  });
  const [formData, setFormData] = useState({
    name: '',
    type: 'Resume' as Document['type'],
    fileUrl: '',
    description: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await documentsApi.getAll();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.name.trim()) {
      showAlert('Validation Error', 'Please enter a document name', 'warning');
      return;
    }
    
    if (uploadMethod === 'file') {
      if (!selectedFile && !editingDoc) {
        showAlert('Validation Error', 'Please select a file to upload', 'warning');
        return;
      }
    } else {
      if (!formData.fileUrl || !formData.fileUrl.trim()) {
        showAlert('Validation Error', 'Please enter a file URL', 'warning');
        return;
      }
    }
    
    setUploading(true);
    try {
      if (editingDoc && editingDoc._id) {
        // Update existing document
        await documentsApi.update(editingDoc._id, formData);
        showAlert('Success', 'Document updated successfully!', 'success');
      } else {
        // Create new document
        if (uploadMethod === 'file' && selectedFile) {
          await documentsApi.create(formData, selectedFile);
        } else {
          await documentsApi.create(formData);
        }
        showAlert('Success', 'Document added successfully!', 'success');
      }
      
      setShowModal(false);
      resetForm();
      fetchDocuments();
    } catch (error: any) {
      console.error('Error saving document:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Error saving document. Please try again.';
      showAlert('Error', errorMessage, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDoc(doc);
    setFormData({
      name: doc.name,
      type: doc.type,
      fileUrl: doc.fileUrl || '',
      description: doc.description || '',
    });
    setUploadMethod(doc.fileUrl?.startsWith('data:') ? 'file' : 'url');
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      async () => {
        try {
          await documentsApi.delete(id);
          fetchDocuments();
          showAlert('Success', 'Document deleted successfully!', 'success');
        } catch (error: any) {
          console.error('Error deleting document:', error);
          showAlert('Error', error?.message || 'Error deleting document. Please try again.', 'error');
        }
      }
    );
  };

  const handleAnalyze = async (doc: Document) => {
    if (!doc.fileUrl) {
      showAlert('Analysis Unavailable', 'Document analysis requires a file URL.', 'warning');
      return;
    }

    if (doc.type !== 'Resume') {
      showAlert('Analysis Unavailable', 'Document analysis is currently only available for Resume files.', 'warning');
      return;
    }

    setAnalyzing(doc._id);
    try {
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock analysis result for demo purposes
      const mockResult = {
        summary: `This resume demonstrates strong technical skills and professional experience. The candidate shows expertise in software development, project management, and team collaboration. Key highlights include experience with modern web technologies, cloud platforms, and agile methodologies.`,
        skills: [
          'JavaScript',
          'React.js',
          'Node.js',
          'TypeScript',
          'Python',
          'SQL',
          'Git',
          'AWS',
          'Docker',
          'Agile Methodologies',
          'Project Management',
          'Team Leadership',
        ],
      };
      
      // Fetch existing skills to show duplicates in modal
      let existingSkills: string[] = [];
      try {
        const existing = await skillsApi.getAll();
        existingSkills = existing.map(s => s.name);
      } catch (error) {
        console.error('Error fetching existing skills:', error);
      }
      
      // Show results in modal
      setAnalysisResult({
        isOpen: true,
        summary: mockResult.summary,
        skills: mockResult.skills,
        existingSkills: existingSkills,
      });
    } catch (error: any) {
      console.error('Error analyzing document:', error);
      showAlert('Error', error?.message || 'Error analyzing document. Please try again.', 'error');
    } finally {
      setAnalyzing(null);
    }
  };

  const handleAddSkills = async () => {
    try {
      // Fetch existing skills to check for duplicates
      const existingSkills = await skillsApi.getAll();
      const existingSkillNames = new Set(existingSkills.map(s => s.name.toLowerCase()));
      
      const skillsToAdd: string[] = [];
      const skippedSkills: string[] = [];
      
      // Filter out duplicates
      for (const skillName of analysisResult.skills) {
        const skillNameLower = skillName.trim().toLowerCase();
        if (existingSkillNames.has(skillNameLower)) {
          skippedSkills.push(skillName);
        } else {
          skillsToAdd.push(skillName);
        }
      }
      
      // Add only new skills
      let addedCount = 0;
      let failedCount = 0;
      
      for (const skillName of skillsToAdd) {
        try {
          await skillsApi.create({
            name: skillName.trim(),
            level: 'Intermediate',
            category: 'Technical',
          });
          addedCount++;
        } catch (error: any) {
          console.error(`Error adding skill ${skillName}:`, error);
          failedCount++;
        }
      }
      
      // Show appropriate message
      let message = '';
      if (addedCount > 0 && skippedSkills.length === 0 && failedCount === 0) {
        message = `Successfully added ${addedCount} skill${addedCount > 1 ? 's' : ''} to your skills page!`;
        showAlert('Success', message, 'success');
      } else if (addedCount > 0) {
        message = `Added ${addedCount} new skill${addedCount > 1 ? 's' : ''}.`;
        if (skippedSkills.length > 0) {
          message += ` ${skippedSkills.length} skill${skippedSkills.length > 1 ? 's were' : ' was'} already in your list.`;
        }
        if (failedCount > 0) {
          message += ` ${failedCount} skill${failedCount > 1 ? 's failed' : ' failed'} to add.`;
        }
        showAlert('Partial Success', message, 'info');
      } else if (skippedSkills.length > 0) {
        message = `All ${skippedSkills.length} skill${skippedSkills.length > 1 ? 's are' : ' is'} already in your skills list.`;
        showAlert('No New Skills', message, 'info');
      } else {
        showAlert('Error', 'Failed to add skills. Please try again.', 'error');
      }
      
      setAnalysisResult({ ...analysisResult, isOpen: false });
      
      // Refresh skills list if any were added
      if (addedCount > 0) {
        // Optionally refresh the skills page if it's open
        // This would require a global state or event system
      }
    } catch (error: any) {
      console.error('Error adding skills:', error);
      showAlert('Error', error?.message || 'Failed to add skills. Please try again.', 'error');
    }
  };

  const handleDownload = (doc: Document) => {
    if (doc.fileUrl) {
      // If it's a data URL, create a download link
      if (doc.fileUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = doc.fileUrl;
        link.download = doc.name || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(doc.fileUrl, '_blank');
      }
    }
  };

  const handleView = (doc: Document) => {
    if (doc.fileUrl) {
      // If it's a data URL, open in new window
      if (doc.fileUrl.startsWith('data:')) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`<img src="${doc.fileUrl}" style="max-width: 100%; height: auto;" />`);
        }
      } else {
        window.open(doc.fileUrl, '_blank');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Resume',
      fileUrl: '',
      description: '',
    });
    setSelectedFile(null);
    setUploadMethod('file');
    setEditingDoc(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        showAlert('File Too Large', 'File size must be less than 10MB. Please choose a smaller file.', 'warning');
        return;
      }
      setSelectedFile(file);
      // Auto-fill name if empty
      if (!formData.name) {
        setFormData({ ...formData, name: file.name.replace(/\.[^/.]+$/, '') });
      }
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'Resume':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'Cover Letter':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'Portfolio':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'Certificate':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
            <p className="text-gray-600">Manage your resumes, cover letters, and portfolios</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition shadow-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Document
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-6">Start by uploading your first document</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              + Add Document
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div key={doc._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start gap-3 mb-4 flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                    {getFileIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 
                      className="text-lg font-semibold text-gray-900 truncate break-words" 
                      title={doc.name}
                    >
                      {doc.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 truncate">{doc.type}</p>
                  </div>
                </div>
                
                {doc.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 break-words">{doc.description}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 mt-auto">
                  <button
                    onClick={() => handleView(doc)}
                    className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  {doc.type === 'Resume' && doc.fileUrl && (
                    <button
                      onClick={() => handleAnalyze(doc)}
                      disabled={analyzing === doc._id}
                      className="flex-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Extract skills and generate summary"
                    >
                      {analyzing === doc._id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Analyze
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(doc)}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition text-sm font-medium"
                    title="Edit document"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition text-sm font-medium"
                    title="Delete document"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-2xl w-full my-8">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingDoc ? 'Edit Document' : 'Add New Document'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Upload or link your professional documents</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Document Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                    placeholder="e.g., My Resume 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Document Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Document['type'] })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                  >
                    <option value="Resume">Resume</option>
                    <option value="Cover Letter">Cover Letter</option>
                    <option value="Portfolio">Portfolio</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {!editingDoc && (
                  <>
                    {/* Upload Method Toggle */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Upload Method</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setUploadMethod('file')}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition font-medium ${
                            uploadMethod === 'file'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMethod('url')}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition font-medium ${
                            uploadMethod === 'url'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Use URL
                        </button>
                      </div>
                    </div>

                    {uploadMethod === 'file' ? (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Select File <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                          <input
                            type="file"
                            id="file-upload"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                            className="hidden"
                          />
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700 mb-1">
                              Click to upload or drag and drop
                            </span>
                            <span className="text-xs text-gray-500">
                              PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
                            </span>
                          </label>
                          {selectedFile && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedFile(null);
                                    const input = document.getElementById('file-upload') as HTMLInputElement;
                                    if (input) input.value = '';
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          File URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          required={uploadMethod === 'url'}
                          value={formData.fileUrl}
                          onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                          placeholder="https://drive.google.com/... or https://..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Paste a link to your document (Google Drive, Dropbox, etc.)</p>
                      </div>
                    )}
                  </>
                )}

                {editingDoc && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Current file:</strong> {editingDoc.fileUrl?.startsWith('data:') ? 'Uploaded file' : editingDoc.fileUrl}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">To change the file, delete and re-upload this document.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none text-gray-900"
                    placeholder="Add a description or notes about this document..."
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Saving...' : editingDoc ? 'Update Document' : 'Add Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Alert Modal */}
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
        />

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />

        {/* Analysis Result Modal */}
        <AnalysisResultModal
          isOpen={analysisResult.isOpen}
          onClose={() => setAnalysisResult({ ...analysisResult, isOpen: false })}
          summary={analysisResult.summary}
          skills={analysisResult.skills}
          existingSkills={analysisResult.existingSkills || []}
          onAddSkills={analysisResult.skills.length > 0 ? handleAddSkills : undefined}
        />
      </div>
    </AppLayout>
  );
}
