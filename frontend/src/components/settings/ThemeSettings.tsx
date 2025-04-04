import React, { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import {
  Sun,
  Moon,
  Undo2,
  Save,
  Eye,
  Download,
  Upload,
  Check,
  X,
  Plus,
  Trash2,
  Copy,
  Camera,
} from "lucide-react";
import { defaultTheme, ThemeConfig, useTheme } from "../../lib/theme.tsx";
import { Button } from "../ui/Button.tsx";
import { supabase } from "../../lib/supabase.ts";
import { showToast } from "../../lib/toast.ts";
import { Card } from "../ui/Card.tsx";
import { Input } from "../ui/Input.tsx";
import { Progress } from "../ui/Progress.tsx";
import Cookies from "js-cookie";

interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  colors: ThemeConfig["colors"];
  fonts: ThemeConfig["fonts"];
  is_default: boolean;
  created_by: string | null;
  created_at: string;
}

interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

function ColorPickerPopover({
  color,
  onChange,
  onClose,
}: ColorPickerPopoverProps) {
  return (
    <div className="absolute z-10 mt-2 p-4 bg-white rounded-lg shadow-xl border border-border">
      <HexColorPicker color={color} onChange={onChange} />
      <div className="flex justify-end mt-4 space-x-2">
        <Button size="sm" variant="outline" icon={<X />} onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" icon={<Check />} onClick={onClose}>
          Apply
        </Button>
      </div>
    </div>
  );
}

export default function ThemeSettings() {
  const {
    theme: currentTheme,
    updateTheme,
    resetTheme,
    isDarkMode,
    toggleDarkMode,
    theme,
    setTheme,
    isSignOut,
  } = useTheme();
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(
    null
  );
  const [newPresetName, setNewPresetName] = useState("");
  const [showNewPresetForm, setShowNewPresetForm] = useState(false);


  useEffect(() => {
    loadPresets();
    setTheme(currentTheme);
    if (isSignOut) {
      setTheme(defaultTheme);
    }
  }, []);

  const loadPresets = async () => {
    try {
      const { data, error } = await supabase
        .from("theme_presets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPresets(data || []);
    } catch (error) {
      console.error("Error loading presets:", error);
      showToast("Failed to load theme presets", "error");
    }
  };

  const handleColorChange = (
    key: keyof ThemeConfig["colors"],
    value: string
  ) => {
    setTheme((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value,
      },
    }));
  };

  const handleFontChange = (key: keyof ThemeConfig["fonts"], value: string) => {
    setTheme((prev) => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [key]: value,
      },
    }));
  };

  const saveTheme = async () => {
    try {
      setSaving(true);

      Cookies.set("theme", JSON.stringify(theme), { expires: 365 });

      await updateTheme({ ...theme });

      showToast("Theme saved successfully", "success");
    } catch (error) {
      console.error("Error saving theme:", error);
      showToast("Failed to save theme", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveAsPreset = async () => {
    if (!newPresetName) {
      showToast("Please enter a preset name", "error");
      return;
    }

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from("theme_presets")
        .insert({
          name: newPresetName,
          colors: theme.colors,
          fonts: theme.fonts,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setPresets([...presets, data]);
      setNewPresetName("");
      setShowNewPresetForm(false);
      showToast("Theme preset saved successfully", "success");
    } catch (error) {
      console.error("Error saving preset:", error);
      showToast("Failed to save theme preset", "error");
    } finally {
      setSaving(false);
    }
  };
  const applyPreset = async (preset: ThemePreset) => {
    try {
      setActivePreset(preset.id);
      
      const presetTheme: ThemeConfig = {
        colors: preset.colors,
        fonts: preset.fonts,
        branding: {
          ...theme.branding,
          logo: theme.branding?.logo,
        },
      };

      setTheme(presetTheme);
      await updateTheme(presetTheme);
  
      showToast("Theme preset applied successfully", "success");
    } catch (error) {
      console.error("Error applying preset:", error);
      showToast("Failed to apply theme preset", "error");
    }
  };
  

  const deletePreset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this preset?")) return;

    try {
      const { error } = await supabase
        .from("theme_presets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPresets(presets.filter((p) => p.id !== id));
      showToast("Theme preset deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting preset:", error);
      showToast("Failed to delete theme preset", "error");
    }
  };

  const exportTheme = () => {
    const themeData = JSON.stringify(theme, null, 2);
    const blob = new Blob([themeData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `theme-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedTheme = JSON.parse(e.target?.result as string);
        setTheme(importedTheme);
        await updateTheme(importedTheme);
        showToast("Theme imported successfully", "success");
      } catch (error) {
        console.error("Error importing theme:", error);
        showToast("Failed to import theme", "error");
      }
    };
    reader.readAsText(file);
  };

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      const file = event.target.files[0];

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setTheme((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          logo: objectUrl,
        },
      }));

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("logo")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("logo").getPublicUrl(filePath);

      setTheme((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          logo: publicUrl,
        },
      }));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Error uploading image!");
    }
  }
  async function handleFaviconUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      const file = event.target.files[0];

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setTheme((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          favicon: objectUrl,
        },
      }));

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("favicon")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("favicon").getPublicUrl(filePath);

      setTheme((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          favicon: publicUrl,
        },
      }));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Error uploading image!");
    }
  }

  const handleLogoText = (text: string) => {
    setTheme((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        logoText: text,
      },
    }));
  };
  const handleTitleText = (text: string) => {
    setTheme((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        titleText: text,
      },
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Theme Settings</h2>
          <p className="text-gray-600">
            Customize the appearance of your quizzes
          </p>
        </div>
        <div className="flex items-center space-x-4 ml-5">
          <Button
            variant="outline"
            size="sm"
            icon={isDarkMode ? <Sun /> : <Moon />}
            onClick={toggleDarkMode}
          >
            {isDarkMode ? "Light" : "Dark"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Eye />}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? "Exit" : "Preview"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Download />}
            onClick={exportTheme}
          >
            Export
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" icon={<Upload />}>
              Import
            </Button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={importTheme}
            />
          </label>
          <Button
            variant="outline"
            size="sm"
            icon={<Undo2 />}
            onClick={resetTheme}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Save />}
            loading={saving}
            onClick={saveTheme}
          >
            Save
          </Button>
        </div>
      </div>

      <Card className="flex gap-10">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Upload Logo
          </label>
          <div className="mt-1 flex items-center space-x-4">
            {theme.branding?.logo ? (
              <label className="relative cursor-pointer group">
                {/* Logo Image */}
                <img
                  src={theme.branding.logo}
                  alt="Logo"
                  className="h-20 w-40"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                  <span className="text-white text-xs font-medium">
                    <Camera className="w-6 h-6" />
                  </span>
                </div>
                {/* Hidden File Input */}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e)}
                />
              </label>
            ) : (
              <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e)}
                />
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Favicon
          </label>
          <div className="mt-1 flex items-center space-x-4">
            {theme.branding?.favicon ? (
              <label className="relative cursor-pointer group">
                {/* Logo Image */}
                <img
                  src={theme.branding.favicon}
                  alt="Logo"
                  className="h-20 w-20"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                  <span className="text-white text-xs font-medium">
                    <Camera className="w-6 h-6" />
                  </span>
                </div>
                {/* Hidden File Input */}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFaviconUpload(e)}
                />
              </label>
            ) : (
              <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFaviconUpload(e)}
                />
              </label>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Logo Text
          </label>
          <div className="mt-1 flex items-center space-x-4">
            <Input
              value={theme.branding?.logoText}
              onChange={(e) => handleLogoText(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title Text
          </label>
          <div className="mt-1 flex items-center space-x-4">
            <Input
              value={theme.branding?.titleText}
              onChange={(e) => handleTitleText(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Color Settings */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Colors</h3>
          <div className="space-y-4">
            {Object.entries(theme.colors).map(([key, value]) => (
              <div key={key} className="relative">
                <label className="block text-sm font-medium mb-1 capitalize">
                  {key} Color
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setActiveColorPicker(
                        activeColorPicker === key ? null : key
                      )
                    }
                    className="w-10 h-10 rounded-lg border border-border"
                    style={{ backgroundColor: value as string }}
                  />
                  <Input
                    value={value}
                    onChange={(e) =>
                      handleColorChange(
                        key as keyof ThemeConfig["colors"],
                        e.target.value
                      )
                    }
                  />
                </div>
                {activeColorPicker === key && (
                  <ColorPickerPopover
                    color={value as string}
                    onChange={(color) =>
                      handleColorChange(
                        key as keyof ThemeConfig["colors"],
                        color
                      )
                    }
                    onClose={() => setActiveColorPicker(null)}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Typography Settings */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Typography</h3>
          <div className="space-y-4">
            {Object.entries(theme.fonts).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1 capitalize">
                  {key} Font
                </label>
                <select
                  value={value}
                  onChange={(e) =>
                    handleFontChange(
                      key as keyof ThemeConfig["fonts"],
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Inter, system-ui, sans-serif">Inter</option>
                  <option value="Roboto, system-ui, sans-serif">Roboto</option>
                  <option value="Poppins, system-ui, sans-serif">
                    Poppins
                  </option>
                  <option value="Open Sans, system-ui, sans-serif">
                    Open Sans
                  </option>
                  <option value="Monaco, monospace">Monaco</option>
                </select>
              </div>
            ))}

            <div className="mt-8">
              <h4 className="text-sm font-medium mb-2">Typography Preview</h4>
              <div className="p-4 rounded-lg border border-border">
                <h1
                  style={{ fontFamily: theme.fonts.heading }}
                  className="text-2xl font-bold mb-2"
                >
                  Sample Heading
                </h1>
                <p style={{ fontFamily: theme.fonts.body }}>
                  This is a sample paragraph showing how your content will look
                  with the selected fonts. The quick brown fox jumps over the
                  lazy dog.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Theme Presets */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold">Theme Presets</h3>
            <Button
              className="w-20"
              variant="outline"
              size="sm"
              icon={<Plus />}
              onClick={() => setShowNewPresetForm(true)}
            >
              New
            </Button>
          </div>

          {showNewPresetForm && (
            <div className="mb-4 p-4 border border-border rounded-lg">
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Preset name"
                className="mb-2"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<X />}
                  onClick={() => {
                    setShowNewPresetForm(false);
                    setNewPresetName("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Save />}
                  onClick={saveAsPreset}
                  loading={saving}
                >
                  Save Preset
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className={`p-4 rounded-lg border transition-colors ${
                  activePreset === preset.id
                    ? "border-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{preset.name}</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => applyPreset(preset)}
                      className="p-1 text-gray-600 hover:text-primary"
                      title="Apply preset"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setNewPresetName(`${preset.name} (Copy)`);
                        setTheme({
                          colors: preset.colors,
                          fonts: preset.fonts,
                        });
                        setShowNewPresetForm(true);
                      }}
                      className="p-1 text-gray-600 hover:text-primary"
                      title="Duplicate preset"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {!preset.is_default && (
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="p-1 text-gray-600 hover:text-red-600"
                        title="Delete preset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {Object.values(preset.colors).map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Preview Section */}
      {previewMode && (
        <Card className="mt-8">
          <h3 className="text-lg font-semibold mb-6">Live Preview</h3>

          <div className="space-y-8">
            {/* Quiz Header Preview */}
            <div className="rounded-lg overflow-hidden">
              <div
                className="p-6"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <h2
                  className="text-white text-2xl font-bold"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  Sample Quiz Title
                </h2>
                <p
                  className="text-white/80"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  This is how your quiz headers will appear
                </p>
              </div>
            </div>

            {/* Question Preview */}
            <div className="space-y-4">
              <div className="p-6 rounded-lg border border-border">
                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  Sample Question
                </h3>
                <p className="mb-6" style={{ fontFamily: theme.fonts.body }}>
                  What is the primary benefit of using a consistent brand
                  identity across marketing materials?
                </p>
                <div className="space-y-3">
                  {[
                    "Brand recognition",
                    "Customer trust",
                    "Market differentiation",
                    "All of the above",
                  ].map((option, i) => (
                    <button
                      key={i}
                      className="w-full text-left p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <span
                        className="flex items-center"
                        style={{ fontFamily: theme.fonts.body }}
                      >
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 mr-3">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {option}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress and Navigation Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Question 3 of 10
                </span>
                <span
                  className="text-sm"
                  style={{ fontFamily: theme.fonts.body }}
                >
                  Time remaining: 5:00
                </span>
              </div>
              <Progress value={30} max={100} />
              <div className="flex justify-between mt-6">
                <Button variant="outline">Previous</Button>
                <Button variant="primary">Next Question</Button>
              </div>
            </div>

            {/* Component Variations */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-medium mb-4">Button Variations</h4>
                <div className="space-y-4">
                  <Button variant="primary" className="w-full">
                    Primary Button
                  </Button>
                  <Button variant="secondary" className="w-full">
                    Secondary Button
                  </Button>
                  <Button variant="outline" className="w-full">
                    Outline Button
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-4">Form Elements</h4>
                <div className="space-y-4">
                  <Input placeholder="Text input" />
                  <select className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option>Dropdown select</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
