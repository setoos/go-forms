import React, { useState } from "react";
import { Link } from "react-router-dom";
import ChatInterface from "../components/CreateForm/ChatInterface";
import FormPreview from "../components/FormBuilder/FormPreview";
import GoStudio from "../components/FormBuilder/GoStudio";
import GoImpact from "../components/FormBuilder/GoImpact";
import {
  ArrowLeft,
  Eye,
  Save,
  Settings,
  Share,
  MessageSquare,
  Wand2,
  FileText,
} from "lucide-react";
import Button from "../components/ui/NewButton";
import { Form } from "../types/aiTypes";
import { useFormStore } from "../store/formStore";

const CreatePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "chat" | "studio" | "impact" | "preview"
  >("chat");
  const { createForm } = useFormStore();

  const [formData, setFormData] = useState<Form>({
    id: crypto.randomUUID(),
    title: "New Form",
    description: "Created with goForms.ai",
    type: "survey",
    tier: "learn",
    evaluation_mode: "simple",
    questions: [],
    settings: {
      requireIdentity: false,
      enableBranching: false,
      enableScoring: false,
      enableAI: false,
      enableVoice: true,
      enableWebhooks: true,
    },
    analytics: {
      views: 0,
      submissions: 0,
      completionRate: 0,
    },
    outputs: [],
    created_at: new Date(),
    updated_at: new Date(),
    is_template: false,
    sharing_enabled: false,
  });

  const handleFormGenerated = (generatedForm: Form) => {
    setFormData({
      ...formData,
      ...generatedForm,
      updated_at: new Date(),
    });
    setActiveTab("studio");
  };

  const handleFormUpdate = (updatedForm: Form) => {
    setFormData({
      ...updatedForm,
      updated_at: new Date(),
    });
  };

  const handleSave = async () => {
    try {
      await createForm(formData);
      // Navigate to dashboard or show success message
    } catch (error) {
      console.error("Error saving form:", error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Create New Form
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Eye size={16} />}
                onClick={() => setActiveTab("preview")}
              >
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings size={16} />}
              >
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Share size={16} />}
              >
                Share
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Save size={16} />}
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`pb-4 px-1 flex items-center space-x-2 ${
                    activeTab === "chat"
                      ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                      : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <MessageSquare size={16} />
                  <span>AI Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab("studio")}
                  className={`pb-4 px-1 flex items-center space-x-2 ${
                    activeTab === "studio"
                      ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                      : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Wand2 size={16} />
                  <span>Form Studio</span>
                </button>
                <button
                  onClick={() => setActiveTab("impact")}
                  className={`pb-4 px-1 flex items-center space-x-2 ${
                    activeTab === "impact"
                      ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                      : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <FileText size={16} />
                  <span>Output Editor</span>
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`pb-4 px-1 flex items-center space-x-2 ${
                    activeTab === "preview"
                      ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                      : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Eye size={16} />
                  <span>Preview</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="h-[calc(100vh-16rem)] overflow-y-auto">
          {activeTab === "chat" && (
            <ChatInterface onFormGenerated={handleFormGenerated} />
          )}

          {activeTab === "studio" && (
            <GoStudio
              form={formData}
              onUpdate={handleFormUpdate}
              onSave={handleSave}
            />
          )}

          {activeTab === "impact" && (
            <GoImpact
              form={formData}
              onUpdate={handleFormUpdate}
              onSave={handleSave}
            />
          )}

          {activeTab === "preview" && <FormPreview form={formData} />}
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
