'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useModals } from '@/hooks/useModals';
import { skillsApi, Skill } from '@/lib/api';

const HIGH_DEMAND_SKILL_CATEGORIES: {
  name: string;
  skills: string[];
}[] = [
  {
    name: 'Artificial Intelligence & Machine Learning',
    skills: [
      'Prompt Engineering',
      'Machine Learning Algorithms',
      'Deep Learning (CNNs, RNNs, Transformers)',
      'Large Language Models (LLMs)',
      'Computer Vision',
      'Natural Language Processing',
      'Model Training & Fine-tuning',
      'AI Model Deployment (MLOps)',
      'Feature Engineering',
      'Reinforcement Learning',
      'Explainable AI (XAI)',
      'AI Ethics & Governance',
      'Recommendation Systems',
      'Edge AI',
      'Generative AI Applications',
    ],
  },
  {
    name: 'Cloud Computing & DevOps',
    skills: [
      'AWS Architecture',
      'Microsoft Azure',
      'Google Cloud Platform',
      'Docker & Containerization',
      'Kubernetes',
      'CI/CD Pipelines',
      'Infrastructure as Code (Terraform)',
      'Serverless Computing',
      'Cloud Cost Optimization',
      'Monitoring & Observability',
      'Site Reliability Engineering (SRE)',
      'Cloud Security',
      'Multi-Cloud Strategies',
      'Disaster Recovery',
      'DevSecOps',
    ],
  },
  {
    name: 'Cybersecurity',
    skills: [
      'Threat Intelligence',
      'Penetration Testing',
      'Ethical Hacking',
      'Cloud Security',
      'Zero Trust Architecture',
      'Incident Response',
      'SIEM & SOC Operations',
      'Vulnerability Management',
      'Identity & Access Management (IAM)',
      'Malware Analysis',
      'Digital Forensics',
      'Security Automation',
      'Compliance & Risk Management',
      'Network Security',
      'Application Security',
    ],
  },
  {
    name: 'Data Science, Analytics & Engineering',
    skills: [
      'Data Engineering',
      'SQL & NoSQL Databases',
      'Big Data Technologies (Spark, Hadoop)',
      'Data Visualization (Power BI, Tableau)',
      'Machine Learning for Analytics',
      'ETL/ELT Pipelines',
      'Cloud Data Warehousing',
      'Time Series Analysis',
      'A/B Testing',
      'Business Intelligence',
      'Statistical Modeling',
      'Data Governance',
      'Real-Time Data Processing',
      'Predictive Analytics',
      'Data Quality Management',
    ],
  },
  {
    name: 'Full-Stack Web Development',
    skills: [
      'React.js / Next.js',
      'Vue.js / Nuxt.js',
      'Angular',
      'Node.js / Express',
      'Backend APIs (REST & GraphQL)',
      'Database Design',
      'Authentication & Authorization',
      'Web Performance Optimization',
      'Web Security',
      'Progressive Web Apps (PWA)',
      'Server-Side Rendering (SSR)',
      'Microservices Architecture',
      'CI/CD Integration',
      'Responsive Design',
      'Web Accessibility (WCAG)',
    ],
  },
  {
    name: 'Mobile App Development',
    skills: [
      'Flutter',
      'React Native',
      'Swift (iOS)',
      'Kotlin (Android)',
      'Cross-Platform Architecture',
      'Mobile UI/UX',
      'App Performance Optimization',
      'Push Notifications',
      'In-App Purchases',
      'Mobile Security',
      'API Integration',
      'App Analytics',
      'App Store Optimization',
      'Offline Sync',
      'Mobile Testing Automation',
    ],
  },
  {
    name: 'UI/UX Design & Product Design',
    skills: [
      'User Research',
      'Wireframing',
      'Prototyping (Figma, Framer)',
      'Usability Testing',
      'Interaction Design',
      'Design Systems',
      'Accessibility Design',
      'Responsive Design',
      'Information Architecture',
      'Microinteractions',
      'Product Thinking',
      'UX Writing',
      'Design for AI Products',
      'Conversion Optimization',
      'Motion Design',
    ],
  },
  {
    name: 'Blockchain & Web3',
    skills: [
      'Smart Contract Development',
      'Solidity Programming',
      'Web3.js / Ethers.js',
      'DeFi Protocols',
      'NFT Development',
      'Blockchain Security',
      'Tokenomics',
      'Layer 2 Scaling Solutions',
      'DAO Governance',
      'Cryptography',
      'Blockchain Architecture',
      'Web3 UX Design',
      'Cross-Chain Interoperability',
      'Wallet Integration',
      'Blockchain Auditing',
    ],
  },
  {
    name: 'Internet of Things (IoT) & Edge Computing',
    skills: [
      'Embedded Systems',
      'IoT Protocols (MQTT, CoAP)',
      'Edge AI',
      'Sensor Integration',
      'Real-Time Data Processing',
      'Device Security',
      'Firmware Development',
      'Cloud IoT Platforms',
      'Digital Twins',
      'Industrial IoT (IIoT)',
      'Smart Home Systems',
      'IoT Data Analytics',
      'Hardware-Software Integration',
      'Low-Power Computing',
      'Remote Device Management',
    ],
  },
  {
    name: 'Automation, RPA & Low-Code/No-Code',
    skills: [
      'Robotic Process Automation (UiPath, Power Automate)',
      'Workflow Automation',
      'Business Process Modeling',
      'Low-Code App Development',
      'API Automation',
      'AI-Powered Automation',
      'Bot Development',
      'Process Mining',
      'Integration Platforms (Zapier, Make)',
      'Test Automation',
      'OCR & Intelligent Document Processing',
      'Citizen Development',
      'DevOps Automation',
      'Event-Driven Automation',
      'Automation Governance',
    ],
  },
  {
    name: 'Game Development & Interactive Media',
    skills: [
      'Unity Development',
      'Unreal Engine',
      'C# for Games',
      'C++ for Games',
      'Game AI',
      'AR/VR Development',
      'Multiplayer Networking',
      'Game Physics',
      'Level Design',
      '3D Modeling',
      'Character Animation',
      'Shader Programming',
      'Game Monetization',
      'Performance Optimization',
      'Game Testing',
    ],
  },
  {
    name: 'AR/VR & Spatial Computing',
    skills: [
      'AR Development (ARKit, ARCore)',
      'VR Development (Unity, Unreal)',
      '3D Interaction Design',
      'Spatial UX Design',
      'Computer Vision for AR',
      'SLAM Algorithms',
      'Mixed Reality',
      'Wearable Computing',
      'Digital Twins',
      'Metaverse Platforms',
      'Haptic Feedback Systems',
      'Immersive UI Design',
      'Real-Time Rendering',
      'XR Hardware Integration',
      'Spatial Audio',
    ],
  },
  {
    name: 'Product Management & Agile Leadership',
    skills: [
      'Product Strategy',
      'Roadmapping',
      'Agile & Scrum',
      'Stakeholder Management',
      'User Story Writing',
      'MVP Development',
      'Market Research',
      'KPI & Metrics Tracking',
      'Go-to-Market Strategy',
      'Customer Discovery',
      'Prioritization Frameworks',
      'Cross-Functional Leadership',
      'Product Analytics',
      'Risk Management',
      'Product Lifecycle Management',
    ],
  },
  {
    name: 'Digital Marketing & Growth',
    skills: [
      'Search Engine Optimization (SEO)',
      'Performance Marketing (PPC)',
      'Social Media Strategy',
      'Content Marketing',
      'Email Automation',
      'Conversion Rate Optimization',
      'Web Analytics (GA4)',
      'Influencer Marketing',
      'Marketing Automation Tools',
      'Brand Strategy',
      'Video Marketing',
      'AI in Marketing',
      'Customer Journey Mapping',
      'Affiliate Marketing',
      'Online Reputation Management',
    ],
  },
  {
    name: 'IT Support, Systems & Infrastructure',
    skills: [
      'IT Service Management (ITIL)',
      'Network Administration',
      'Windows/Linux System Administration',
      'Cloud Infrastructure Support',
      'Helpdesk Operations',
      'Virtualization (VMware, Hyper-V)',
      'Hardware Troubleshooting',
      'Patch Management',
      'Endpoint Security',
      'Backup & Disaster Recovery',
      'Identity Management',
      'Monitoring Tools',
      'Asset Management',
      'IT Documentation',
      'User Training & Support',
    ],
  },
];

export default function SkillsPage() {
  const { alertModal, confirmModal, showAlert, showConfirm, closeAlert, closeConfirm } = useModals();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    level: 'Intermediate' as Skill['level'],
    category: '',
    notes: '',
  });

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const data = await skillsApi.getAll();
      setSkills(data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicates on frontend before submitting
    const skillNameLower = formData.name.trim().toLowerCase();
    const isDuplicate = skills.some(skill => {
      if (editingSkill && skill._id === editingSkill._id) {
        return false; // Exclude current skill when editing
      }
      return skill.name.toLowerCase() === skillNameLower;
    });

    if (isDuplicate) {
      showAlert(
        'Duplicate Skill',
        `A skill with the name "${formData.name}" already exists. Please use a different name or edit the existing skill.`,
        'warning'
      );
      return;
    }

    try {
      if (editingSkill) {
        await skillsApi.update(editingSkill._id, formData);
        showAlert('Success', 'Skill updated successfully!', 'success');
      } else {
        await skillsApi.create(formData);
        showAlert('Success', 'Skill added successfully!', 'success');
      }
      setShowModal(false);
      setEditingSkill(null);
      resetForm();
      fetchSkills();
    } catch (error: any) {
      console.error('Error saving skill:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error saving skill. Please try again.';
      showAlert('Error', errorMessage, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      'Delete Skill',
      'Are you sure you want to delete this skill? This action cannot be undone.',
      async () => {
        try {
          await skillsApi.delete(id);
          fetchSkills();
          showAlert('Success', 'Skill deleted successfully!', 'success');
        } catch (error: any) {
          console.error('Error deleting skill:', error);
          showAlert('Error', error?.message || 'Error deleting skill. Please try again.', 'error');
        }
      }
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      level: 'Intermediate',
      category: '',
      notes: '',
    });
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills</h1>
            <p className="text-gray-600">Track your professional skills</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingSkill(null);
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition shadow-sm"
          >
            + Add Skill
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : skills.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No skills yet</h3>
            <button
              onClick={() => {
                resetForm();
                setEditingSkill(null);
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              + Add Skill
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <div key={skill._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{skill.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  skill.level === 'Expert' ? 'bg-purple-50 text-purple-700' :
                  skill.level === 'Advanced' ? 'bg-blue-50 text-blue-700' :
                  skill.level === 'Intermediate' ? 'bg-green-50 text-green-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  {skill.level}
                </span>
                {skill.category && <p className="text-gray-600 text-sm mt-2">{skill.category}</p>}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setEditingSkill(skill);
                      setFormData({
                        name: skill.name,
                        level: skill.level,
                        category: skill.category || '',
                        notes: skill.notes || '',
                      });
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(skill._id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingSkill ? 'Edit Skill' : 'Add New Skill'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Track your professional skills and expertise</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Skill Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                    placeholder="e.g., JavaScript, Python, Project Management"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Proficiency Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value as Skill['level'] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                      placeholder="e.g., Programming, Design, Management"
                    />
                  </div>
                </div>

                {/* Quick add from high-demand categories */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Quick add from high-demand skills</p>
                      <p className="text-xs text-gray-600">
                        Choose a category and skill to auto-fill the form.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Skill Category</label>
                      <select
                        value={
                          formData.category && HIGH_DEMAND_SKILL_CATEGORIES.some(c => c.name === formData.category)
                            ? formData.category
                            : ''
                        }
                        onChange={(e) => {
                          const categoryName = e.target.value;
                          const category = HIGH_DEMAND_SKILL_CATEGORIES.find(c => c.name === categoryName);
                          setFormData((prev) => ({
                            ...prev,
                            category: categoryName,
                            // If current name is empty or from another category, reset name
                            name: prev.name || (category ? category.skills[0] : ''),
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      >
                        <option value="">Select a category</option>
                        {HIGH_DEMAND_SKILL_CATEGORIES.map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Suggested Skills</label>
                      <select
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        disabled={
                          !formData.category ||
                          !HIGH_DEMAND_SKILL_CATEGORIES.some((c) => c.name === formData.category)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {formData.category
                            ? 'Select a skill'
                            : 'Select a category first'}
                        </option>
                        {HIGH_DEMAND_SKILL_CATEGORIES.find((c) => c.name === formData.category)?.skills.map(
                          (skillName) => (
                            <option key={skillName} value={skillName}>
                              {skillName}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none text-gray-900"
                    placeholder="Add any additional notes about this skill..."
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSkill(null);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium shadow-sm"
                  >
                    {editingSkill ? 'Update Skill' : 'Add Skill'}
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
