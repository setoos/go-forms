import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  UserCog, 
  Bell, 
  Lock, 
  Shield, 
  Palette, 
  DollarSign
} from 'lucide-react';
import { Card } from '../ui/Card';
import ThemeSettings from './ThemeSettings';
import BillingSettings from './BillingSettings';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  end?: boolean;
  onClick?: () => void;
}

function SidebarLink({ to, icon, children, end = false, onClick }: SidebarLinkProps) {
  const location = useLocation();
  const isActive = end 
    ? location.pathname === to
    : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`
        flex items-center px-4 py-2 text-sm font-medium rounded-lg
        ${
          isActive
            ? "bg-purple-100 text-purple-900"
            : "text-gray-600 hover:bg-purple-50 hover:text-purple-900"
        }
      `}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: `h-5 w-5 mr-3 ${isActive ? "text-purple-600" : "text-gray-400"}`
      })}
      {children}
    </Link>
  );
}

const tabs = [
  { id: 'account', label: 'Account', icon: <UserCog /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell /> },
  { id: 'privacy', label: 'Privacy', icon: <Lock /> },
  { id: 'security', label: 'Security', icon: <Shield /> },
  { id: 'theme', label: 'Theme', icon: <Palette /> },
  { id: 'billing', label: 'Billing & Usage', icon: <DollarSign /> }
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
              {tabs.map((tab) => (
                <SidebarLink
                  key={tab.id}
                  to={`/settings/${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  icon={tab.icon}
                >
                  {tab.label}
                </SidebarLink>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'theme' ? (
            <ThemeSettings />
          ) : activeTab === 'billing' ? (
            <BillingSettings />
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