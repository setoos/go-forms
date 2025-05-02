import React, { useState } from 'react';
import { Form } from '../types/aiTypes';
import FormCard from '../components/Dashboard/FormCard';
import Button from '../components/ui/NewButton';
import { Plus, Search, BarChart4, ArrowUpDown, Filter, Trash2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'templates'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);
  
  // Sample forms data
  const [forms, setForms] = useState<Form[]>([
    {
      id: 'form-1',
      title: 'Customer Feedback Survey',
      description: 'A comprehensive survey to gather feedback about your products or services.',
      type: 'survey',
      evaluationMode: 'simple',
      questions: Array(5).fill(null).map((_, i) => ({
        id: `q${i+1}`,
        type: 'rating-scale',
        label: `Question ${i+1}`,
        required: i < 3
      })),
      createdAt: new Date('2023-11-10'),
      updatedAt: new Date('2023-11-15'),
      isTemplate: false,
      sharingEnabled: true,
      shareLink: 'https://goforms.ai/f/abc123'
    },
    {
      id: 'form-2',
      title: 'Job Application Form',
      description: 'Collect information from job candidates including experience and qualifications.',
      type: 'contact',
      evaluationMode: 'simple',
      questions: Array(8).fill(null).map((_, i) => ({
        id: `q${i+1}`,
        type: i < 4 ? 'short-text' : 'long-text',
        label: `Question ${i+1}`,
        required: i < 5
      })),
      createdAt: new Date('2023-10-25'),
      updatedAt: new Date('2023-10-28'),
      isTemplate: false,
      sharingEnabled: true,
      shareLink: 'https://goforms.ai/f/def456'
    },
    {
      id: 'form-3',
      title: 'Digital Marketing Quiz',
      description: 'Test knowledge of digital marketing concepts and strategies.',
      type: 'quiz',
      evaluationMode: 'simple',
      questions: Array(10).fill(null).map((_, i) => ({
        id: `q${i+1}`,
        type: 'multiple-choice',
        label: `Question ${i+1}`,
        required: true,
        options: ['Option A', 'Option B', 'Option C'],
        correctAnswer: 'Option A'
      })),
      createdAt: new Date('2023-09-15'),
      updatedAt: new Date('2023-09-18'),
      isTemplate: false,
      sharingEnabled: false
    },
    {
      id: 'form-4',
      title: 'Team Skills Assessment',
      description: 'Evaluate team members on key skills and identify training opportunities.',
      type: 'assessment',
      evaluationMode: 'ai-assisted',
      questions: Array(6).fill(null).map((_, i) => ({
        id: `q${i+1}`,
        type: i < 3 ? 'multiple-choice' : 'long-text',
        label: `Question ${i+1}`,
        required: true,
        aiPrompt: i >= 3 ? 'Evaluate response for critical thinking and problem solving ability' : undefined
      })),
      createdAt: new Date('2023-08-20'),
      updatedAt: new Date('2023-08-25'),
      isTemplate: true,
      sharingEnabled: true,
      shareLink: 'https://goforms.ai/f/ghi789'
    }
  ]);
  
  // Filter and sort forms
  const filteredAndSortedForms = React.useMemo(() => {
    let result = [...forms];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(form => 
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (activeFilter === 'templates') {
      result = result.filter(form => form.is_template);
    } else if (activeFilter === 'recent') {
      // Get forms from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result = result.filter(form => form.updated_at >= sevenDaysAgo);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.updated_at.getTime() - a.updated_at.getTime();
      } else if (sortBy === 'oldest') {
        return a.updated_at.getTime() - b.updated_at.getTime();
      } else if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
    
    return result;
  }, [forms, searchQuery, activeFilter, sortBy]);
  
  // Form actions
  const handleEditForm = (form: Form) => {
    window.location.href = `/edit/${form.id}`;
  };
  
  const handleDuplicateForm = (form: Form) => {
    const duplicatedForm: Form = {
      ...form,
      id: `form-${Date.now()}`,
      title: `${form.title} (Copy)`,
      created_at: new Date(),
      updated_at: new Date(),
      share_link: undefined
    };
    
    setForms([...forms, duplicatedForm]);
  };
  
  const handleDeleteForm = (form: Form) => {
    setFormToDelete(form);
    setShowConfirmDelete(true);
  };
  
  const confirmDelete = () => {
    if (formToDelete) {
      setForms(forms.filter(f => f.id !== formToDelete.id));
    }
    setShowConfirmDelete(false);
    setFormToDelete(null);
  };
  
  const handleShareForm = (form: Form) => {
    // In a real app, this would generate a sharing link if it doesn't exist
    console.log('Share form:', form.title);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Forms</h1>
            <p className="text-gray-600 mt-1">
              Manage, edit and share all your forms
            </p>
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              leftIcon={<BarChart4 size={16} />}
              onClick={() => window.location.href = '/analytics'}
            >
              Analytics
            </Button>
            <Button 
              variant="primary" 
              leftIcon={<Plus size={16} />}
              onClick={() => window.location.href = '/create'}
            >
              Create Form
            </Button>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex flex-1 flex-wrap gap-2">
            <Button
              variant={activeFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('all')}
              className="flex-shrink-0"
            >
              All Forms
            </Button>
            <Button
              variant={activeFilter === 'recent' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('recent')}
              className="flex-shrink-0"
            >
              Recent
            </Button>
            <Button
              variant={activeFilter === 'templates' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('templates')}
              className="flex-shrink-0"
            >
              Templates
            </Button>
            
            <div className="ml-auto flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedForms.length > 0 ? (
            filteredAndSortedForms.map(form => (
              <FormCard
                key={form.id}
                form={form}
                onEdit={handleEditForm}
                onDuplicate={handleDuplicateForm}
                onDelete={handleDeleteForm}
                onShare={handleShareForm}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-gray-200">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                <Filter size={24} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No forms found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? "No forms match your search criteria" 
                  : "You haven't created any forms yet"}
              </p>
              {searchQuery ? (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  leftIcon={<Plus size={16} />}
                  onClick={() => window.location.href = '/create'}
                >
                  Create Form
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showConfirmDelete && formToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Form</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{formToDelete.title}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center gap-4 mt-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  onClick={confirmDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;