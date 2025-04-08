import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Link as LinkIcon,
  ExternalLink,
  Copy,
  AlertCircle
} from 'lucide-react';
import { showToast } from '../../lib/toast';

// Variable type
interface Variable {
  id: string;
  name: string;
  key: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'user' | 'calculated';
  defaultValue?: string;
  options?: string[]; // For select type
  formula?: string; // For calculated type
  linkedVariables?: string[]; // IDs of variables this variable is linked to
  usedIn?: string[]; // IDs of documents this variable is used in
}

// Document type
interface Document {
  id: string;
  title: string;
  type: 'report' | 'form' | 'template';
}

interface DocumentVariableManagerProps {
  variables: Variable[];
  onVariablesChange: (variables: Variable[]) => void;
  documents?: Document[];
  onInsertVariable?: (variableKey: string) => void;
  readOnly?: boolean;
}

export default function DocumentVariableManager({
  variables,
  onVariablesChange,
  documents = [],
  onInsertVariable,
  readOnly = false
}: DocumentVariableManagerProps) {
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedVariables, setExpandedVariables] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // New variable template
  const newVariableTemplate: Variable = {
    id: '',
    name: '',
    key: '',
    description: '',
    type: 'text',
    defaultValue: '',
    options: [],
    formula: '',
    linkedVariables: [],
    usedIn: []
  };

  // Filter variables based on search and type
  const filteredVariables = variables.filter(variable => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!variable.name.toLowerCase().includes(query) && 
          !variable.key.toLowerCase().includes(query) && 
          !variable.description.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Type filter
    if (selectedType && variable.type !== selectedType) {
      return false;
    }
    
    return true;
  });

  const handleAddVariable = () => {
    if (readOnly) return;
    
    setEditingVariable({
      ...newVariableTemplate,
      id: `var-${Date.now()}`
    });
    setIsAdding(true);
    setValidationError(null);
  };

  const handleEditVariable = (variable: Variable) => {
    if (readOnly) return;
    
    setEditingVariable({ ...variable });
    setIsAdding(false);
    setValidationError(null);
  };

  const handleSaveVariable = () => {
    if (!editingVariable) return;
    
    // Validate variable
    if (!editingVariable.name.trim()) {
      setValidationError('Variable name is required');
      return;
    }
    
    if (!editingVariable.key.trim()) {
      setValidationError('Variable key is required');
      return;
    }
    
    // Check for duplicate keys
    const isDuplicateKey = variables.some(v => 
      v.id !== editingVariable.id && v.key === editingVariable.key
    );
    
    if (isDuplicateKey) {
      setValidationError('Variable key must be unique');
      return;
    }
    
    // Additional validation for specific types
    if (editingVariable.type === 'select' && (!editingVariable.options || editingVariable.options.length === 0)) {
      setValidationError('Select variables must have at least one option');
      return;
    }
    
    if (editingVariable.type === 'calculated' && !editingVariable.formula) {
      setValidationError('Calculated variables must have a formula');
      return;
    }
    
    // Update or add the variable
    if (isAdding) {
      onVariablesChange([...variables, editingVariable]);
      showToast('Variable added successfully', 'success');
    } else {
      onVariablesChange(
        variables.map(v => (v.id === editingVariable.id ? editingVariable : v))
      );
      showToast('Variable updated successfully', 'success');
    }
    
    // Reset state
    setEditingVariable(null);
    setIsAdding(false);
    setValidationError(null);
  };

  const handleDeleteVariable = (id: string) => {
    if (readOnly) return;
    
    if (confirm('Are you sure you want to delete this variable?')) {
      onVariablesChange(variables.filter(v => v.id !== id));
      showToast('Variable deleted successfully', 'success');
    }
  };

  const handleCancelEdit = () => {
    setEditingVariable(null);
    setIsAdding(false);
    setValidationError(null);
  };

  const toggleVariableExpand = (id: string) => {
    setExpandedVariables(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleInsertVariable = (key: string) => {
    if (onInsertVariable) {
      onInsertVariable(key);
      showToast(`Variable {{${key}}} inserted`, 'success');
    }
  };

  const handleCopyVariableKey = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`);
    showToast(`Variable key {{${key}}} copied to clipboard`, 'success');
  };

  const handleTypeFilter = (type: string | null) => {
    setSelectedType(type);
  };

  const generateVariableKey = (name: string) => {
    if (!name) return '';
    
    // Convert to snake_case
    return name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };

  const handleNameChange = (name: string) => {
    if (!editingVariable) return;
    
    // Only auto-generate key if it's a new variable or key is empty
    if (isAdding || !editingVariable.key) {
      setEditingVariable({
        ...editingVariable,
        name,
        key: generateVariableKey(name)
      });
    } else {
      setEditingVariable({
        ...editingVariable,
        name
      });
    }
  };

  return (
    <div className="bg-background rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Document Variables</h2>
        {!readOnly && (
          <button
            onClick={handleAddVariable}
            className="flex items-center px-3 py-1.5 bg-secondary text-white text-sm rounded-md hover:bg-primary"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Variable
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search variables..."
            className="block w-full pl-3 pr-3 py-2 border border-border rounded-md leading-5 bg-background placeholder-gray-500 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTypeFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              selectedType === null
                ? 'bg-accent text-primary'
                : 'bg-gray-100 text-text hover:bg-gray-200'
            }`}
          >
            All Types
          </button>
          {['text', 'number', 'date', 'boolean', 'select', 'calculated'].map(type => (
            <button
              key={type}
              onClick={() => handleTypeFilter(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                selectedType === type
                  ? 'bg-accent text-primary'
                  : 'bg-gray-100 text-text hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Variable Editor */}
      {editingVariable && (
        <div className="mb-6 p-4 border border-border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium">{isAdding ? 'Add New Variable' : 'Edit Variable'}</h3>
            <button
              onClick={handleCancelEdit}
              className="text-gray-500 hover:text-text"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {validationError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{validationError}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Variable Name
              </label>
              <input
                type="text"
                value={editingVariable.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                placeholder="e.g., Customer Name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Variable Key
              </label>
              <input
                type="text"
                value={editingVariable.key}
                onChange={(e) => setEditingVariable({ ...editingVariable, key: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                placeholder="e.g., customer_name"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is the key used in templates: {`{{${editingVariable.key || 'example'}}}`}
              </p>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-1">
                Description
              </label>
              <input
                type="text"
                value={editingVariable.description}
                onChange={(e) => setEditingVariable({ ...editingVariable, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                placeholder="Brief description of this variable"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Variable Type
              </label>
              <select
                value={editingVariable.type}
                onChange={(e) => setEditingVariable({ 
                  ...editingVariable, 
                  type: e.target.value as Variable['type'],
                  // Reset type-specific fields when changing type
                  options: e.target.value === 'select' ? editingVariable.options : [],
                  formula: e.target.value === 'calculated' ? editingVariable.formula : ''
                })}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select</option>
                <option value="user">User</option>
                <option value="calculated">Calculated</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Default Value
              </label>
              {editingVariable.type === 'boolean' ? (
                <select
                  value={editingVariable.defaultValue}
                  onChange={(e) => setEditingVariable({ ...editingVariable, defaultValue: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                >
                  <option value="">No default</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              ) : (
                <input
                  type={editingVariable.type === 'number' ? 'number' : editingVariable.type === 'date' ? 'date' : 'text'}
                  value={editingVariable.defaultValue || ''}
                  onChange={(e) => setEditingVariable({ ...editingVariable, defaultValue: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                  placeholder="Default value (optional)"
                />
              )}
            </div>
          </div>
          
          {/* Type-specific fields */}
          {editingVariable.type === 'select' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-text mb-1">
                Options
              </label>
              <div className="space-y-2">
                {(editingVariable.options || []).map((option, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(editingVariable.options || [])];
                        newOptions[index] = e.target.value;
                        setEditingVariable({ ...editingVariable, options: newOptions });
                      }}
                      className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      onClick={() => {
                        const newOptions = [...(editingVariable.options || [])];
                        newOptions.splice(index, 1);
                        setEditingVariable({ ...editingVariable, options: newOptions });
                      }}
                      className="ml-2 p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [...(editingVariable.options || []), ''];
                    setEditingVariable({ ...editingVariable, options: newOptions });
                  }}
                  className="text-sm text-secondary hover:text-primary"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}
          
          {editingVariable.type === 'calculated' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-text mb-1">
                Formula
              </label>
              <input
                type="text"
                value={editingVariable.formula || ''}
                onChange={(e) => setEditingVariable({ ...editingVariable, formula: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-secondary focus:border-secondary"
                placeholder="e.g., {{variable1}} + {{variable2}}"
              />
              <p className="mt-1 text-xs text-gray-500">
                Use variable keys in double curly braces for calculations
              </p>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-border text-text rounded-md hover:bg-gray-50 mr-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveVariable}
              className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-primary"
            >
              {isAdding ? 'Add Variable' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Variables List */}
      {filteredVariables.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text mb-1">No variables found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || selectedType
              ? 'Try adjusting your search or filters'
              : 'Add your first variable to get started'}
          </p>
          {!readOnly && (
            <button
              onClick={handleAddVariable}
              className="inline-flex items-center px-3 py-1.5 bg-secondary text-white text-sm rounded-md hover:bg-primary"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Variable
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVariables.map(variable => (
            <div 
              key={variable.id} 
              className="border border-border rounded-lg overflow-hidden"
            >
              <div 
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                onClick={() => toggleVariableExpand(variable.id)}
              >
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-3 ${
                    variable.type === 'text' ? 'bg-blue-500' :
                    variable.type === 'number' ? 'bg-green-500' :
                    variable.type === 'date' ? 'bg-yellow-500' :
                    variable.type === 'boolean' ? 'bg-red-500' :
                    variable.type === 'select' ? 'bg-secondary' :
                    variable.type === 'user' ? 'bg-indigo-500' :
                    'bg-orange-500' // calculated
                  }`}></span>
                  <div>
                    <div className="font-medium text-text">{variable.name}</div>
                    <div className="text-xs text-gray-500">
                      <code className="bg-gray-100 px-1 py-0.5 rounded">{{`{{${variable.key}}}`}}</code>
                      <span className="mx-1">•</span>
                      <span className="capitalize">{variable.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {onInsertVariable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsertVariable(variable.key);
                      }}
                      className="p-1.5 text-gray-500 hover:text-text mr-1"
                      title="Insert variable"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyVariableKey(variable.key);
                    }}
                    className="p-1.5 text-gray-500 hover:text-text mr-1"
                    title="Copy variable key"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {!readOnly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditVariable(variable);
                      }}
                      className="p-1.5 text-blue-500 hover:text-blue-700 mr-1"
                      title="Edit variable"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {!readOnly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVariable(variable.id);
                      }}
                      className="p-1.5 text-red-500 hover:text-red-700 mr-1"
                      title="Delete variable"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button className="p-1.5 text-gray-500">
                    {expandedVariables[variable.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedVariables[variable.id] && (
                <div className="p-4 bg-background">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Description</h4>
                      <p className="text-sm text-text">
                        {variable.description || 'No description provided'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Default Value</h4>
                      <p className="text-sm text-text">
                        {variable.defaultValue || 'No default value'}
                      </p>
                    </div>
                  </div>
                  
                  {variable.type === 'select' && variable.options && variable.options.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Options</h4>
                      <div className="flex flex-wrap gap-1">
                        {variable.options.map((option, index) => (
                          <span key={index} className="px-2 py-0.5 bg-gray-100 text-text text-xs rounded">
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {variable.type === 'calculated' && variable.formula && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Formula</h4>
                      <code className="block p-2 bg-gray-100 text-sm rounded overflow-x-auto">
                        {variable.formula}
                      </code>
                    </div>
                  )}
                  
                  {variable.linkedVariables && variable.linkedVariables.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Linked Variables</h4>
                      <div className="flex flex-wrap gap-1">
                        {variable.linkedVariables.map(linkedId => {
                          const linkedVar = variables.find(v => v.id === linkedId);
                          return linkedVar ? (
                            <span key={linkedId} className="inline-flex items-center px-2 py-0.5 bg-accent text-primary text-xs rounded">
                              <LinkIcon className="h-3 w-3 mr-1" />
                              {linkedVar.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {variable.usedIn && variable.usedIn.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Used In Documents</h4>
                      <div className="flex flex-wrap gap-1">
                        {variable.usedIn.map(docId => {
                          const doc = documents.find(d => d.id === docId);
                          return doc ? (
                            <span key={docId} className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              <FileText className="h-3 w-3 mr-1" />
                              {doc.title}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}