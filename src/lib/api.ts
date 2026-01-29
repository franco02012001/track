// Mock API using localStorage - Frontend only implementation

// Helper function to generate IDs
const generateId = () => {
  return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to get data from localStorage
const getStorageData = <T>(key: string, defaultValue: T[]): T[] => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Helper function to save data to localStorage
const saveStorageData = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

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

// Get current user ID from localStorage
const getCurrentUserId = (): string => {
  if (typeof window === 'undefined') return 'default_user';
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.id || 'default_user';
    } catch {
      return 'default_user';
    }
  }
  return 'default_user';
};

// Mock User Data
const getMockUser = (): User => {
  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through to default
    }
  }
  return {
    id: 'default_user',
    name: 'Demo User',
    email: 'demo@example.com',
    picture: undefined,
    provider: undefined,
    twoFactorEnabled: false,
  };
};

export const authApi = {
  getProfile: async (): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return getMockUser();
  },
  
  checkStatus: async (): Promise<{ status: string; google: boolean; facebook: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      status: 'authenticated',
      google: true,
      facebook: true,
    };
  },
};

export const usersApi = {
  getProfile: async (): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getMockUser();
  },
  
  updateProfile: async (data: { name?: string; picture?: string }): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = getMockUser();
    const updated = { ...user, ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  },
  
  uploadPicture: async (file: File): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const user = getMockUser();
    // Create a data URL for the image
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const pictureUrl = reader.result as string;
        const updated = { ...user, picture: pictureUrl, updatedAt: new Date().toISOString() };
        localStorage.setItem('user', JSON.stringify(updated));
        resolve(updated);
      };
      reader.readAsDataURL(file);
    });
  },
  
  update2FA: async (enabled: boolean): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = getMockUser();
    const updated = { ...user, twoFactorEnabled: enabled, updatedAt: new Date().toISOString() };
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  },
  
  deleteAccount: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Clear all user data
    localStorage.removeItem('applications');
    localStorage.removeItem('tasks');
    localStorage.removeItem('contacts');
    localStorage.removeItem('documents');
    localStorage.removeItem('skills');
  },
};

export const applicationsApi = {
  getAll: async (): Promise<Application[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStorageData<Application>('applications', []);
  },
  
  getStats: async (): Promise<{ total: number; active: number; interviews: number; offers: number }> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const applications = getStorageData<Application>('applications', []);
    const total = applications.length;
    const active = applications.filter(app => 
      ['Applied', 'Screening', 'Interview'].includes(app.status)
    ).length;
    const interviews = applications.filter(app => app.status === 'Interview').length;
    const offers = applications.filter(app => app.status === 'Offer').length;
    return { total, active, interviews, offers };
  },
  
  getOne: async (id: string): Promise<Application> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const applications = getStorageData<Application>('applications', []);
    const app = applications.find(a => a._id === id);
    if (!app) throw new Error('Application not found');
    return app;
  },
  
  create: async (data: Partial<Application>): Promise<Application> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const applications = getStorageData<Application>('applications', []);
    const now = new Date().toISOString();
    const newApp: Application = {
      _id: generateId(),
      userId: getCurrentUserId(),
      jobTitle: data.jobTitle || '',
      company: data.company || '',
      location: data.location,
      jobUrl: data.jobUrl,
      description: data.description,
      workMode: data.workMode || 'On-site',
      status: data.status || 'Applied',
      salary: data.salary,
      notes: data.notes,
      appliedDate: data.appliedDate,
      interviewDate: data.interviewDate,
      offerDate: data.offerDate,
      createdAt: now,
      updatedAt: now,
    };
    applications.push(newApp);
    saveStorageData('applications', applications);
    return newApp;
  },
  
  update: async (id: string, data: Partial<Application>): Promise<Application> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const applications = getStorageData<Application>('applications', []);
    const index = applications.findIndex(a => a._id === id);
    if (index === -1) throw new Error('Application not found');
    applications[index] = {
      ...applications[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveStorageData('applications', applications);
    return applications[index];
  },
  
  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const applications = getStorageData<Application>('applications', []);
    const filtered = applications.filter(a => a._id !== id);
    saveStorageData('applications', filtered);
  },
};

export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStorageData<Task>('tasks', []);
  },
  
  getPendingCount: async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const tasks = getStorageData<Task>('tasks', []);
    return tasks.filter(t => t.status === 'Pending').length;
  },
  
  getOne: async (id: string): Promise<Task> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const tasks = getStorageData<Task>('tasks', []);
    const task = tasks.find(t => t._id === id);
    if (!task) throw new Error('Task not found');
    return task;
  },
  
  create: async (data: Partial<Task>): Promise<Task> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const tasks = getStorageData<Task>('tasks', []);
    const now = new Date().toISOString();
    const newTask: Task = {
      _id: generateId(),
      userId: getCurrentUserId(),
      title: data.title || '',
      description: data.description,
      priority: data.priority || 'Medium',
      status: data.status || 'Pending',
      dueDate: data.dueDate,
      applicationId: data.applicationId,
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(newTask);
    saveStorageData('tasks', tasks);
    return newTask;
  },
  
  update: async (id: string, data: Partial<Task>): Promise<Task> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const tasks = getStorageData<Task>('tasks', []);
    const index = tasks.findIndex(t => t._id === id);
    if (index === -1) throw new Error('Task not found');
    tasks[index] = {
      ...tasks[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveStorageData('tasks', tasks);
    return tasks[index];
  },
  
  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const tasks = getStorageData<Task>('tasks', []);
    const filtered = tasks.filter(t => t._id !== id);
    saveStorageData('tasks', filtered);
  },
};

export const contactsApi = {
  getAll: async (): Promise<Contact[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStorageData<Contact>('contacts', []);
  },
  
  getOne: async (id: string): Promise<Contact> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const contacts = getStorageData<Contact>('contacts', []);
    const contact = contacts.find(c => c._id === id);
    if (!contact) throw new Error('Contact not found');
    return contact;
  },
  
  create: async (data: Partial<Contact>): Promise<Contact> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const contacts = getStorageData<Contact>('contacts', []);
    const now = new Date().toISOString();
    const newContact: Contact = {
      _id: generateId(),
      userId: getCurrentUserId(),
      name: data.name || '',
      email: data.email,
      phone: data.phone,
      company: data.company,
      position: data.position,
      linkedIn: data.linkedIn,
      notes: data.notes,
      tags: data.tags,
      createdAt: now,
      updatedAt: now,
    };
    contacts.push(newContact);
    saveStorageData('contacts', contacts);
    return newContact;
  },
  
  update: async (id: string, data: Partial<Contact>): Promise<Contact> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const contacts = getStorageData<Contact>('contacts', []);
    const index = contacts.findIndex(c => c._id === id);
    if (index === -1) throw new Error('Contact not found');
    contacts[index] = {
      ...contacts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveStorageData('contacts', contacts);
    return contacts[index];
  },
  
  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const contacts = getStorageData<Contact>('contacts', []);
    const filtered = contacts.filter(c => c._id !== id);
    saveStorageData('contacts', filtered);
  },
};

export const documentsApi = {
  getAll: async (): Promise<Document[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStorageData<Document>('documents', []);
  },
  
  getOne: async (id: string): Promise<Document> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const documents = getStorageData<Document>('documents', []);
    const doc = documents.find(d => d._id === id);
    if (!doc) throw new Error('Document not found');
    return doc;
  },
  
  create: async (data: Partial<Document>, file?: File): Promise<Document> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const documents = getStorageData<Document>('documents', []);
    const now = new Date().toISOString();
    
    let fileUrl = data.fileUrl || '';
    if (file) {
      // Create a data URL for the file
      fileUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
    
    const newDoc: Document = {
      _id: generateId(),
      userId: getCurrentUserId(),
      name: data.name || '',
      type: data.type || 'Other',
      fileUrl: fileUrl,
      description: data.description,
      tags: data.tags,
      createdAt: now,
      updatedAt: now,
    };
    documents.push(newDoc);
    saveStorageData('documents', documents);
    return newDoc;
  },
  
  update: async (id: string, data: Partial<Document>): Promise<Document> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const documents = getStorageData<Document>('documents', []);
    const index = documents.findIndex(d => d._id === id);
    if (index === -1) throw new Error('Document not found');
    documents[index] = {
      ...documents[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveStorageData('documents', documents);
    return documents[index];
  },
  
  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const documents = getStorageData<Document>('documents', []);
    const filtered = documents.filter(d => d._id !== id);
    saveStorageData('documents', filtered);
  },
};

export const skillsApi = {
  getAll: async (): Promise<Skill[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStorageData<Skill>('skills', []);
  },
  
  getOne: async (id: string): Promise<Skill> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const skills = getStorageData<Skill>('skills', []);
    const skill = skills.find(s => s._id === id);
    if (!skill) throw new Error('Skill not found');
    return skill;
  },
  
  create: async (data: Partial<Skill>): Promise<Skill> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const skills = getStorageData<Skill>('skills', []);
    const now = new Date().toISOString();
    const newSkill: Skill = {
      _id: generateId(),
      userId: getCurrentUserId(),
      name: data.name || '',
      level: data.level || 'Intermediate',
      category: data.category,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
    skills.push(newSkill);
    saveStorageData('skills', skills);
    return newSkill;
  },
  
  update: async (id: string, data: Partial<Skill>): Promise<Skill> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const skills = getStorageData<Skill>('skills', []);
    const index = skills.findIndex(s => s._id === id);
    if (index === -1) throw new Error('Skill not found');
    skills[index] = {
      ...skills[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveStorageData('skills', skills);
    return skills[index];
  },
  
  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const skills = getStorageData<Skill>('skills', []);
    const filtered = skills.filter(s => s._id !== id);
    saveStorageData('skills', filtered);
  },
};

// Mock OAuth URLs - no longer needed but kept for compatibility
export const oauthUrls = {
  google: '#',
  facebook: '#',
};

// Default export for compatibility
const api = {
  get: async () => ({ data: {} }),
  post: async () => ({ data: {} }),
  patch: async () => ({ data: {} }),
  delete: async () => ({ data: {} }),
};

export default api;
