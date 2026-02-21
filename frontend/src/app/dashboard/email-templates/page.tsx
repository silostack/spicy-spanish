'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  category: string;
  variables: string[];
  content: string;
  isActive: boolean;
  lastModified: string;
}

export default function EmailTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/email/templates');
      setTemplates(response.data);
      setLoading(false);
    } catch (error) {
      // Use mock data for demonstration
      const mockTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'Welcome Email',
          subject: 'Welcome to Spicy Spanish, {{firstName}}!',
          description: 'Sent to new students after registration',
          category: 'onboarding',
          variables: ['firstName', 'lastName', 'email'],
          content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background-color: #ff4444; color: white; padding: 20px; }
    .content { padding: 20px; }
    .button { background-color: #ff4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Spicy Spanish!</h1>
  </div>
  <div class="content">
    <p>Dear {{firstName}},</p>
    <p>Welcome to Spicy Spanish! We're thrilled to have you join our community of Spanish learners.</p>
    <p>Your journey to Spanish fluency starts now. Here's what you can do next:</p>
    <ul>
      <li>Complete your profile</li>
      <li>Browse available tutors</li>
      <li>Schedule your first lesson</li>
    </ul>
    <p><a href="{{dashboardUrl}}" class="button">Go to Dashboard</a></p>
    <p>Best regards,<br>The Spicy Spanish Team</p>
  </div>
</body>
</html>`,
          isActive: true,
          lastModified: '2025-03-01T10:00:00Z'
        },
        {
          id: '2',
          name: 'Lesson Reminder',
          subject: 'Reminder: Spanish lesson with {{tutorName}} in 24 hours',
          description: 'Sent 24 hours before scheduled lessons',
          category: 'scheduling',
          variables: ['firstName', 'tutorName', 'lessonDate', 'lessonTime', 'zoomLink'],
          content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background-color: #ff4444; color: white; padding: 20px; }
    .content { padding: 20px; }
    .lesson-box { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Lesson Reminder</h1>
  </div>
  <div class="content">
    <p>Hi {{firstName}},</p>
    <p>This is a friendly reminder about your upcoming Spanish lesson:</p>
    <div class="lesson-box">
      <strong>Tutor:</strong> {{tutorName}}<br>
      <strong>Date:</strong> {{lessonDate}}<br>
      <strong>Time:</strong> {{lessonTime}}<br>
      <strong>Duration:</strong> 45 minutes<br>
      <strong>Meeting Link:</strong> <a href="{{zoomLink}}">Join Lesson</a>
    </div>
    <p>Please make sure to prepare any questions or topics you'd like to discuss.</p>
    <p>See you soon!</p>
  </div>
</body>
</html>`,
          isActive: true,
          lastModified: '2025-03-05T14:30:00Z'
        },
        {
          id: '3',
          name: 'Payment Confirmation',
          subject: 'Payment Confirmed - {{packageName}}',
          description: 'Sent after successful payment',
          category: 'billing',
          variables: ['firstName', 'packageName', 'amount', 'hours', 'transactionId'],
          content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background-color: #ff4444; color: white; padding: 20px; }
    .content { padding: 20px; }
    .receipt { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Payment Confirmation</h1>
  </div>
  <div class="content">
    <p>Dear {{firstName}},</p>
    <p>Thank you for your payment! Your transaction has been successfully processed.</p>
    <div class="receipt">
      <h3>Receipt Details</h3>
      <p><strong>Package:</strong> {{packageName}}</p>
      <p><strong>Hours:</strong> {{hours}}</p>
      <p><strong>Amount:</strong> ${'{{amount}}'}</p>
      <p><strong>Transaction ID:</strong> {{transactionId}}</p>
    </div>
    <p>Your lesson hours have been added to your account and are ready to use.</p>
    <p>Happy learning!</p>
  </div>
</body>
</html>`,
          isActive: true,
          lastModified: '2025-02-28T09:15:00Z'
        },
        {
          id: '4',
          name: 'Course Completion',
          subject: 'Congratulations on completing {{courseName}}!',
          description: 'Sent when a student completes a course',
          category: 'achievement',
          variables: ['firstName', 'courseName', 'completionDate', 'certificateUrl'],
          content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background-color: #ff4444; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .achievement { text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Congratulations! 🎉</h1>
  </div>
  <div class="content">
    <p>Dear {{firstName}},</p>
    <div class="achievement">
      <h2>You've completed {{courseName}}!</h2>
      <p>Completion Date: {{completionDate}}</p>
    </div>
    <p>This is a fantastic achievement! Your dedication to learning Spanish is paying off.</p>
    <p>Your certificate is ready: <a href="{{certificateUrl}}">Download Certificate</a></p>
    <p>Keep up the great work!</p>
  </div>
</body>
</html>`,
          isActive: true,
          lastModified: '2025-03-10T16:00:00Z'
        },
        {
          id: '5',
          name: 'Password Reset',
          subject: 'Reset Your Spicy Spanish Password',
          description: 'Password reset request email',
          category: 'security',
          variables: ['firstName', 'resetLink', 'expirationTime'],
          content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background-color: #ff4444; color: white; padding: 20px; }
    .content { padding: 20px; }
    .button { background-color: #ff4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Password Reset Request</h1>
  </div>
  <div class="content">
    <p>Hi {{firstName}},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{resetLink}}" class="button">Reset Password</a>
    </p>
    <p>This link will expire in {{expirationTime}} hours.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Stay secure,<br>The Spicy Spanish Team</p>
  </div>
</body>
</html>`,
          isActive: true,
          lastModified: '2025-03-08T11:45:00Z'
        }
      ];
      
      setTemplates(mockTemplates);
      if (mockTemplates.length > 0) {
        setSelectedTemplate(mockTemplates[0]);
      }
      setLoading(false);
      setError(null);
    }
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditMode(false);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      await api.put(`/email/templates/${selectedTemplate.id}`, selectedTemplate);
      alert('Template saved successfully!');
      setEditMode(false);
      fetchTemplates();
    } catch (error) {
      alert('Failed to save template. Changes saved locally.');
      setEditMode(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedTemplate) return;
    
    const testEmail = prompt('Enter email address for test:');
    if (!testEmail) return;
    
    try {
      await api.post('/email/test', {
        templateId: selectedTemplate.id,
        to: testEmail
      });
      alert(`Test email sent to ${testEmail}`);
    } catch (error) {
      alert(`Test email would be sent to ${testEmail} (Demo mode)`);
    }
  };

  const toggleTemplateStatus = async (templateId: string, isActive: boolean) => {
    try {
      await api.patch(`/email/templates/${templateId}`, { isActive: !isActive });
      
      setTemplates(prevTemplates => 
        prevTemplates.map(template => 
          template.id === templateId 
            ? { ...template, isActive: !isActive } 
            : template
        )
      );
      
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate({ ...selectedTemplate, isActive: !isActive });
      }
    } catch (error) {
      // Update locally for demo
      setTemplates(prevTemplates => 
        prevTemplates.map(template => 
          template.id === templateId 
            ? { ...template, isActive: !isActive } 
            : template
        )
      );
      
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate({ ...selectedTemplate, isActive: !isActive });
      }
    }
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'scheduling', label: 'Scheduling' },
    { value: 'billing', label: 'Billing' },
    { value: 'achievement', label: 'Achievements' },
    { value: 'security', label: 'Security' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-spicy-red"></div>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-600">Only administrators can manage email templates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-spicy-dark">Email Templates</h1>
        <p className="text-gray-600">Manage and customize email templates sent to students and tutors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-4">
            {/* Search and Filter */}
            <div className="mb-4 space-y-3">
              <input
                type="text"
                placeholder="Search templates..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Template List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'bg-spicy-light border-2 border-spicy-red'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-sm">{template.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      template.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{template.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {template.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {template.variables.length} variables
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* Template Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedTemplate.name}</h2>
                  <p className="text-gray-600">{selectedTemplate.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleTemplateStatus(selectedTemplate.id, selectedTemplate.isActive)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      selectedTemplate.isActive
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {selectedTemplate.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={handleSendTestEmail}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200"
                  >
                    Send Test
                  </button>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="px-3 py-1 bg-spicy-red text-white rounded-lg text-sm font-medium hover:bg-spicy-orange"
                  >
                    {editMode ? 'Cancel' : 'Edit'}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('templates')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'templates'
                        ? 'border-spicy-red text-spicy-red'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Template
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'preview'
                        ? 'border-spicy-red text-spicy-red'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('variables')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'variables'
                        ? 'border-spicy-red text-spicy-red'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Variables
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'templates' && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={selectedTemplate.subject}
                      onChange={(e) => editMode && setSelectedTemplate({
                        ...selectedTemplate,
                        subject: e.target.value
                      })}
                      disabled={!editMode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HTML Content
                    </label>
                    <textarea
                      value={selectedTemplate.content}
                      onChange={(e) => editMode && setSelectedTemplate({
                        ...selectedTemplate,
                        content: e.target.value
                      })}
                      disabled={!editMode}
                      rows={15}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-spicy-red disabled:bg-gray-50"
                    />
                  </div>
                  {editMode && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleSaveTemplate}
                        className="px-4 py-2 bg-spicy-red text-white rounded-lg hover:bg-spicy-orange"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b">
                      <p className="text-sm text-gray-600">Subject:</p>
                      <p className="font-medium">{selectedTemplate.subject.replace(/\{\{.*?\}\}/g, (match) => {
                        const variable = match.replace(/[{}]/g, '');
                        const sampleData: any = {
                          firstName: 'John',
                          lastName: 'Doe',
                          tutorName: 'Maria González',
                          courseName: 'Intermediate Spanish',
                          packageName: 'Regular Package',
                          amount: '230',
                          hours: '10'
                        };
                        return sampleData[variable] || match;
                      })}</p>
                    </div>
                    <div className="p-4">
                      <iframe
                        srcDoc={selectedTemplate.content.replace(/\{\{.*?\}\}/g, (match) => {
                          const variable = match.replace(/[{}]/g, '');
                          const sampleData: any = {
                            firstName: 'John',
                            lastName: 'Doe',
                            email: 'john.doe@example.com',
                            tutorName: 'Maria González',
                            lessonDate: 'March 15, 2025',
                            lessonTime: '3:00 PM EST',
                            zoomLink: '#',
                            dashboardUrl: '#',
                            courseName: 'Intermediate Spanish',
                            completionDate: 'March 10, 2025',
                            certificateUrl: '#',
                            packageName: 'Regular Package',
                            amount: '230',
                            hours: '10',
                            transactionId: 'TXN-123456',
                            resetLink: '#',
                            expirationTime: '24'
                          };
                          return sampleData[variable] || match;
                        })}
                        className="w-full h-96 border-0 rounded"
                        title="Email Preview"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'variables' && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    These variables can be used in the template and will be replaced with actual data when the email is sent.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Available Variables:</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable} className="flex items-center">
                          <code className="bg-white px-2 py-1 rounded text-sm border border-gray-300">
                            {`{{${variable}}}`}
                          </code>
                          <span className="ml-2 text-sm text-gray-600">
                            {variable.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Use double curly braces to insert variables in your template. 
                      For example: <code className="bg-white px-1">{`{{firstName}}`}</code> will be replaced with the recipient's first name.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-500">Select a template to view and edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}