import { BookOpen, Briefcase, Shield, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import React, { useState } from 'react';
import { showToast } from '@/lib/toast';

const categories = [
    {
        id: 'academic',
        name: 'Academic',
        icon: <BookOpen className="h-5 w-5" />,
        description: 'Educational assessment templates for academic settings',
        subcategories: [
            { id: 'math', name: 'Mathematics' },
            { id: 'science', name: 'Science' },
            { id: 'history', name: 'History' },
            { id: 'language', name: 'Language' }
        ]
    },
    {
        id: 'professional',
        name: 'Professional Development',
        icon: <Briefcase className="h-5 w-5" />,
        description: 'Assessment templates for workplace skills and knowledge',
        subcategories: [
            { id: 'leadership', name: 'Leadership' },
            { id: 'technical', name: 'Technical Skills' },
            { id: 'soft-skills', name: 'Soft Skills' }
        ]
    },
    {
        id: 'compliance',
        name: 'Compliance Training',
        icon: <Shield className="h-5 w-5" />,
        description: 'Templates for regulatory and policy compliance assessments',
        subcategories: [
            { id: 'safety', name: 'Safety' },
            { id: 'security', name: 'Security' },
            { id: 'ethics', name: 'Ethics' }
        ]
    },
    {
        id: 'employee',
        name: 'Employee Assessment',
        icon: <Users className="h-5 w-5" />,
        description: 'Templates for evaluating employee performance and knowledge',
        subcategories: [
            { id: 'performance', name: 'Performance' },
            { id: 'knowledge', name: 'Knowledge Check' },
            { id: 'skill', name: 'Skill Evaluation' }
        ]
    }
];

// Audience levels
const audienceLevels = [
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' },
    { id: 'expert', name: 'Expert' },
    { id: 'all', name: 'All Levels' }
];


const TemplateForm = () => {
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: '',
        subcategory: '',
        audienceLevel: '',
        duration: 0,
        scoringMethod: '',
        passingScore: 0,
        certificateEnabled: false,
        analyticsEnabled: false,
        feedbackType: '',
        tags: [''],
        previewImage: '',
        popularity: 0,
        usageCount: 0,
    });
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [selectedAudience, setSelectedAudience] = useState('');


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? Number(value) : value;
        setForm({ ...form, [name]: val });
    };

    const handleTagChange = (index: number, value: string) => {
        const updatedTags = [...form.tags];
        updatedTags[index] = value;
        setForm({ ...form, tags: updatedTags });
    };

    const addTagField = () => {
        setForm({ ...form, tags: [...form.tags, ''] });
    };

    const handleToggle = (name: string) => {
        setForm({ ...form, [name]: !form[name as keyof typeof form] });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `template-images/${fileName}`;

        const { error } = await supabase.storage
            .from('template-images')
            .upload(filePath, file);

        if (error) {
            console.error('Image upload failed:', error.message);
            return;
        }

        const { data: publicUrlData } = supabase.storage
            .from('template-images')
            .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
            setForm({ ...form, previewImage: publicUrlData.publicUrl });
        }
    };


    const generateUniqueId = () => {
        const randomString = Math.random().toString(36).substring(2, 10); // Generates a short random string
        return `${form.category}-${form.subcategory}-${randomString}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Generate custom ID using category, subcategory, and a random string
        const customId = generateUniqueId();

        const templateData = {
            id: customId,
            title: form.title,
            description: form.description,
            category: form.category,
            subcategory: form.subcategory,
            audiencelevel: form.audienceLevel,
            duration: form.duration,
            scoringmethod: form.scoringMethod,
            passingscore: form.passingScore,
            certificateenabled: form.certificateEnabled,
            analyticsenabled: form.analyticsEnabled,
            feedbacktype: form.feedbackType,
            tags: form.tags,
            previewimage: form.previewImage,
            popularity: form.popularity,
            usagecount: form.usageCount,
            created_at: new Date().toISOString(),
            lastupdated: new Date().toISOString(),
        };

        try {
            const { error } = await supabase.from('templates').insert([templateData]);

            if (error) {
                console.error('Error inserting template:', error);
            } else {
                showToast('Template submitted successfully', 'success');
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        }
    };



    return (
        <div className="w-full mx-auto px-6 py-10 bg-gradient-to-br from-accent to-white rounded-3xl shadow-2xl">
            <h2 className="text-4xl font-bold text-center text-blue-800 mb-12"> Create a New Template</h2>

            <form onSubmit={handleSubmit} className="space-y-10 max-w-4xl mx-auto">
                {/* Section 1: Basic Info */}
                <CardSection title="Basic Info">
                    <Input label="Title" name="title" value={form.title} onChange={handleChange} />
                    <Textarea label="Description" name="description" value={form.description} onChange={handleChange} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                const categoryId = e.target.value;
                                setSelectedCategory(categoryId);
                                setForm((prev) => ({
                                    ...prev,
                                    category: categoryId,
                                    subcategory: '',
                                }));
                            }}
                            className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Select Category --</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {selectedCategory && (
                            <p className="text-sm text-gray-500 mt-1">
                                {categories.find((c) => c.id === selectedCategory)?.description}
                            </p>
                        )}
                    </div>

                    {selectedCategory && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                            <select
                                value={selectedSubcategory}
                                onChange={(e) => {
                                    const subId = e.target.value;
                                    setSelectedSubcategory(subId);
                                    setForm((prev) => ({ ...prev, subcategory: subId }));
                                }}
                                className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Select Subcategory --</option>
                                {categories
                                    .find((c) => c.id === selectedCategory)
                                    ?.subcategories.map((sub) => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Audience Level</label>
                        <select
                            value={selectedAudience}
                            onChange={(e) => {
                                const audience = e.target.value;
                                setSelectedAudience(audience);
                                setForm((prev) => ({ ...prev, audienceLevel: audience }));
                            }}
                            className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Select Audience Level --</option>
                            {audienceLevels.map((level) => (
                                <option key={level.id} value={level.id}>
                                    {level.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Input label="Duration (minutes)" name="duration" type="number" value={form.duration} onChange={handleChange} />
                </CardSection>

                {/* Section 2: Scoring & Feedback */}
                <CardSection title="Scoring & Feedback">
                    <Input label="Scoring Method" name="scoringMethod" value={form.scoringMethod} onChange={handleChange} />
                    <Input label="Passing Score (%)" name="passingScore" type="number" value={form.passingScore} onChange={handleChange} />
                    <Input label="Feedback Type" name="feedbackType" value={form.feedbackType} onChange={handleChange} />
                </CardSection>

                {/* Section 3: Toggles */}
                <CardSection title="Options">
                    <Toggle label="Enable Certificate" checked={form.certificateEnabled} onToggle={() => handleToggle('certificateEnabled')} />
                    <Toggle label="Enable Analytics" checked={form.analyticsEnabled} onToggle={() => handleToggle('analyticsEnabled')} />
                </CardSection>

                {/* Section 4: Tags */}
                <CardSection title="Tags">
                    {form.tags.map((tag, i) => (
                        <input
                            key={i}
                            value={tag}
                            onChange={(e) => handleTagChange(i, e.target.value)}
                            placeholder={`Tag ${i + 1}`}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm mb-2"
                        />
                    ))}
                    <button type="button" onClick={addTagField} className="text-blue-600 hover:underline text-sm">
                        + Add another tag
                    </button>
                </CardSection>

                {/* Section 5: Image Upload */}
                <CardSection title="Preview Image">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
                    />
                    {form.previewImage && (
                        <img
                            src={form.previewImage}
                            alt="Preview"
                            className="mt-4 rounded-xl w-36 h-36 object-cover mx-auto"
                        />
                    )}
                </CardSection>

                {/* Section 6: Extra Stats */}
                <CardSection title="Extra Info">
                    <Input label="Popularity (1–5)" name="popularity" type="number" step="0.1" value={form.popularity} onChange={handleChange} />
                    <Input label="Usage Count" name="usageCount" type="number" value={form.usageCount} onChange={handleChange} />
                </CardSection>

                {/* Submit Button */}
                <div className="text-center">
                    <button
                        type="submit"
                        className="bg-secondary text-white font-semibold text-lg px-10 py-3 rounded-xl hover:bg-primary transition"
                    >
                        Create Template
                    </button>
                </div>
            </form>
        </div>
    );


};

// --- Reusable UI Components ---
const Input = ({ label, name, value, onChange, type = 'text', step }: any) => (
    <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <input
            name={name}
            value={value}
            onChange={onChange}
            type={type}
            step={step}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
        />
    </div>
);

const Textarea = ({ label, name, value, onChange }: any) => (
    <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <textarea
            name={name}
            value={value}
            onChange={onChange}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
        />
    </div>
);

const Toggle = ({ label, checked, onToggle }: any) => (
    <label className="flex items-center space-x-3">
        <input type="checkbox" checked={checked} onChange={onToggle} className="w-4 h-4" />
        <span className="text-sm">{label}</span>
    </label>
);

const CardSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">{title}</h3>
        {children}
    </div>
);



export default TemplateForm;
