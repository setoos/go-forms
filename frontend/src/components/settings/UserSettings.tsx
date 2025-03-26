import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { UserCog, Bell, Lock, Shield, Palette } from 'lucide-react';
import { Card } from "../ui/Card.tsx";
import ThemeSettings from "./ThemeSettings.tsx";

const tabs = [
  { id: 'account', label: 'Account', icon: UserCog },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'theme', label: 'Theme', icon: Palette },
];

export default function UserSettings() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname.split('/')[2] || 'account'
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex space-x-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Card className="sticky top-8">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={`/settings/${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center px-4 py-2 text-sm font-medium rounded-lg
                      ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'theme' ? (
            <ThemeSettings />
          ) : (
            <Card>
              <h2 className="text-2xl font-bold mb-6">{
                tabs.find(tab => tab.id === activeTab)?.label
              }</h2>
              <p className="text-gray-600">
                This section is under development. Please check back later.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}