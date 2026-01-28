import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
    // Enhance error message with backend response
    if (error.response?.data) {
      const message = error.response.data.message || error.response.data.error || error.message;
      error.message = message;
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider?: string;
  twoFactorEnabled?: boolean;
}

export interface Application {
  _id: string;
  userId: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobUrl?: string;
  description?: string;
  workMode?: 'On-site' | 'Hybrid' | 'Work from home';
  status: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';
  salary?: string;
  notes?: string;
  appliedDate?: string;
  interviewDate?: string;
  offerDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate?: string;
  applicationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  _id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  linkedIn?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  _id: string;
  userId: string;
  name: string;
  type: 'Resume' | 'Cover Letter' | 'Portfolio' | 'Certificate' | 'Other';
  fileUrl: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  _id: string;
  userId: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  checkStatus: async (): Promise<{ status: string; google: boolean; facebook: boolean }> => {
    const response = await api.get('/auth/status');
    return response.data;
  },
};

export const usersApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  
  updateProfile: async (data: { name?: string; picture?: string }): Promise<User> => {
    const response = await api.patch('/users/profile', data);
    return response.data;
  },
  
  uploadPicture: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('picture', file);
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_URL}/users/profile/picture`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
      },
      body: formData,
    });
    
    if (!response.ok) {
      let errorMessage = 'Error uploading picture';
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
        if (Array.isArray(error.message)) {
          errorMessage = error.message.join(', ');
        }
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch (textError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }
    
    try {
      return await response.json();
    } catch (e) {
      throw new Error('Invalid response from server');
    }
  },
  
  update2FA: async (enabled: boolean): Promise<User> => {
    const response = await api.patch('/users/profile/2fa', { enabled });
    return response.data;
  },
  
  deleteAccount: async (): Promise<void> => {
    await api.delete('/users/profile');
  },
};

export const applicationsApi = {
  getAll: async (): Promise<Application[]> => {
    const response = await api.get('/applications');
    return response.data;
  },
  
  getStats: async (): Promise<{ total: number; active: number; interviews: number; offers: number }> => {
    const response = await api.get('/applications/stats');
    return response.data;
  },
  
  getOne: async (id: string): Promise<Application> => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<Application>): Promise<Application> => {
    const response = await api.post('/applications', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Application>): Promise<Application> => {
    const response = await api.patch(`/applications/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/applications/${id}`);
  },
};

export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    const response = await api.get('/tasks');
    return response.data;
  },
  
  getPendingCount: async (): Promise<number> => {
    const response = await api.get('/tasks/pending/count');
    return response.data;
  },
  
  getOne: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<Task>): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Task>): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};

export const contactsApi = {
  getAll: async (): Promise<Contact[]> => {
    const response = await api.get('/contacts');
    return response.data;
  },
  
  getOne: async (id: string): Promise<Contact> => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<Contact>): Promise<Contact> => {
    const response = await api.post('/contacts', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Contact>): Promise<Contact> => {
    const response = await api.patch(`/contacts/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/contacts/${id}`);
  },
};

export const documentsApi = {
  getAll: async (): Promise<Document[]> => {
    const response = await api.get('/documents');
    return response.data;
  },
  
  getOne: async (id: string): Promise<Document> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<Document>, file?: File): Promise<Document> => {
    if (file) {
      // Upload file using FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', data.name || '');
      formData.append('type', data.type || 'Other');
      if (data.description) formData.append('description', data.description);
      if (data.fileUrl) formData.append('fileUrl', data.fileUrl);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error uploading document');
      }
      
      return response.json();
    } else {
      // Use regular API call for URL-based documents
      const response = await api.post('/documents', data);
      return response.data;
    }
  },
  
  update: async (id: string, data: Partial<Document>): Promise<Document> => {
    const response = await api.patch(`/documents/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },
};

export const skillsApi = {
  getAll: async (): Promise<Skill[]> => {
    const response = await api.get('/skills');
    return response.data;
  },
  
  getOne: async (id: string): Promise<Skill> => {
    const response = await api.get(`/skills/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<Skill>): Promise<Skill> => {
    const response = await api.post('/skills', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Skill>): Promise<Skill> => {
    const response = await api.patch(`/skills/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/skills/${id}`);
  },
};

// OAuth URLs
export const oauthUrls = {
  google: `${API_URL}/auth/google`,
  facebook: `${API_URL}/auth/facebook`,
};

export default api;
