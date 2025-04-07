import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  BarChart3, 
  Settings, 
  FileQuestion, 
  // ClipboardList, 
  LayoutTemplate, 
  // Mail, 
  Users, 
  // GraduationCap, 
  // Award, 
  ChevronRight, 
  ChevronDown,
  FileEdit,
  Home,
  BookOpen,
  Briefcase,
  Shield,
  Inbox
} from 'lucide-react';
import { cn } from '../lib/utils';

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
      className={cn(
        "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors",
        isActive
          ? "bg-accent text-primary"
          : "text-gray-600 hover:bg-accent hover:text-primary"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: cn(
          "h-5 w-5 mr-3",
          isActive ? "text-secondary" : "text-gray-400"
        )
      })}
      {children}
    </Link>
  );
}

interface SidebarGroupProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function SidebarGroup({ title, icon, children, defaultOpen = true }: SidebarGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
      >
        <div className="flex items-center">
          {icon && React.cloneElement(icon as React.ReactElement, {
            className: "h-5 w-5 mr-3 text-gray-400"
          })}
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      <div className={`mt-1 ml-3 pl-3 border-l border-border space-y-1 ${isOpen ? 'block' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  
  // Check if we're in the forms section
  // const isFormsSection = location.pathname.startsWith('/forms');
  
  // Check if we're in the templates section
  const isTemplatesSection = location.pathname.startsWith('/templates');
  
  // Check if we're in the admin section
  const isAdminSection = location.pathname.startsWith('/admin');
  
  return (
    <div className="w-64 h-full bg-background border-r border-border overflow-y-auto">
      <div className="p-4">
        <div className="space-y-1">
          {/* Main Navigation */}
          <SidebarLink to="/" icon={<Home />} end>
            Dashboard
          </SidebarLink>
          <SidebarLink to="/admin/quizzes" icon={<FileQuestion />}>
            My GoForms
          </SidebarLink>
          <SidebarLink to="/admin/submissions" icon={<Inbox />}>
            Submissions
          </SidebarLink>
          <SidebarLink to="/admin/analytics" icon={<BarChart3 />}>
            Analytics
          </SidebarLink>
          
          {/* Templates Section */}
          <SidebarGroup 
            title="Templates" 
            icon={<LayoutTemplate />} 
            // defaultOpen={isAdminSection || isFormsSection || isTemplatesSection}
            defaultOpen={isAdminSection || isTemplatesSection}
          >
            <SidebarLink to="/templates" icon={<FileText />}>
            GoForm Templates
            </SidebarLink>
            <SidebarLink to="/admin/templates" icon={<FileEdit />}>
              Report Templates
            </SidebarLink>
            {/* <SidebarLink to="/forms/templates" icon={<ClipboardList />}>
              Form Templates
            </SidebarLink> */}
          </SidebarGroup>
          
          {/* Quiz Template Categories */}
          {isTemplatesSection && (
            <SidebarGroup title="GoForm Categories" defaultOpen={true}>
              <SidebarLink to="/templates/category/academic" icon={<BookOpen />}>
                Academic
              </SidebarLink>
              <SidebarLink to="/templates/category/professional" icon={<Briefcase />}>
                Professional
              </SidebarLink>
              <SidebarLink to="/templates/category/compliance" icon={<Shield />}>
                Compliance
              </SidebarLink>
              <SidebarLink to="/templates/category/employee" icon={<Users />}>
                Employee
              </SidebarLink>
            </SidebarGroup>
          )}
          
          {/* Form Categories
          {isFormsSection && (
            <SidebarGroup title="Form Categories" defaultOpen={true}>
              <SidebarLink to="/forms/categories/lead-magnet" icon={<Mail />}>
                Lead Magnets
              </SidebarLink>
              <SidebarLink to="/forms/categories/hr" icon={<Users />}>
                HR Forms
              </SidebarLink>
              <SidebarLink to="/forms/categories/academic" icon={<GraduationCap />}>
                Academic Quizzes
              </SidebarLink>
              <SidebarLink to="/forms/categories/certificate" icon={<Award />}>
                Certificates
              </SidebarLink>
            </SidebarGroup>
          )} */}
          
          {/* Settings */}
          <SidebarLink to="/settings/account" icon={<Settings />}>
            Settings
          </SidebarLink>
        </div>
      </div>
    </div>
  );
}