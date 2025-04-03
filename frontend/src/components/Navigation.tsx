import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Home,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  User,
  ChevronDown,
  PlusCircle,
  Menu,
  X,
  UserCog,
  Bell,
  Lock,
  Shield,
  FileEdit,
  ClipboardList,
  LayoutTemplate,
  Award,
  Mail,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  FileQuestion
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  end?: boolean;
  onClick?: () => void;
}

function NavLink({ to, icon, children, end = false, onClick }: NavLinkProps) {
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
          ? "bg-purple-100 text-purple-900"
          : "text-gray-600 hover:bg-purple-50 hover:text-purple-900"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: cn(
          "h-5 w-5 mr-3",
          isActive ? "text-purple-600" : "text-gray-400"
        )
      })}
      {children}
    </Link>
  );
}

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
      navigate('/');
      setIsOpen(false);
    }
  };

  const settingsMenuItems = [
    { label: 'Account Settings', icon: UserCog, path: '/settings/account' },
    { label: 'Notifications', icon: Bell, path: '/settings/notifications' },
    { label: 'Privacy', icon: Lock, path: '/settings/privacy' },
    { label: 'Security', icon: Shield, path: '/settings/security' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <User className="h-5 w-5 text-purple-600" />
        <span className="text-sm font-medium hidden sm:inline">{user.email}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1" role="menu">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500">Logged in</p>
              </div>

              <div className="py-1">
                {settingsMenuItems.map(({ label, icon: Icon, path }) => (
                  <Link
                    key={path}
                    to={path}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4 mr-3 text-gray-400" />
                    {label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-gray-100">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Navigation() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Define main navigation items
  const mainNavItems = [
    { path: '/', label: 'Home', icon: <Home />, end: true },
    { path: '/admin/quizzes', label: 'My Quizzes', icon: <FileQuestion /> },
    { path: '/admin/analytics', label: 'Analytics', icon: <BarChart3 /> }
  ];

  // Define template navigation items
  const templateNavItems = [
    { path: '/templates', label: 'Quiz Templates', icon: <FileText /> },
    { path: '/admin/templates', label: 'Report Templates', icon: <FileEdit /> },
    // { path: '/forms/templates', label: 'Form Templates', icon: <ClipboardList /> }
  ];

  // Define form category navigation items
  const formCategoryItems = [
    { path: '/forms/categories/lead-magnet', label: 'Lead Magnets', icon: <Mail /> },
    { path: '/forms/categories/hr', label: 'HR Forms', icon: <Users /> },
    { path: '/forms/categories/academic', label: 'Academic Quizzes', icon: <GraduationCap /> },
    { path: '/forms/categories/certificate', label: 'Certificates', icon: <Award /> }
  ];

  // Check if we're in the forms section
  const isFormsSection = location.pathname.startsWith('/forms');

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-gray-900 hover:text-purple-600">
              <Brain className="h-8 w-8 text-purple-600" />
              <span className="ml-2 text-xl font-bold">GoForms</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              {/* Main Navigation */}
              {mainNavItems.map(item => (
                <NavLink key={item.path} to={item.path} icon={item.icon} end={item.end}>
                  {item.label}
                </NavLink>
              ))}

              {/* Template Navigation */}
              <div className="relative group">
                <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-purple-50 hover:text-purple-900">
                  <LayoutTemplate className="h-5 w-5 mr-3 text-gray-400" />
                  Templates
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {templateNavItems.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {React.cloneElement(item.icon as React.ReactElement, {
                          className: "h-4 w-4 mr-3 text-gray-400"
                        })}
                        {item.label}
                      </Link>
                    ))}
                    
                    {/* Form Categories Submenu */}
                    {isFormsSection && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-4 py-1 text-xs font-semibold text-gray-500">
                          FORM CATEGORIES
                        </div>
                        {formCategoryItems.map(item => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {React.cloneElement(item.icon as React.ReactElement, {
                              className: "h-4 w-4 mr-3 text-gray-400"
                            })}
                            {item.label}
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Link
                to="/admin/quizzes/new"
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Quiz
              </Link>
            </div>
          )}

          {/* User Menu and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <UserMenu />
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="flex items-center px-4 py-2 text-sm font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
            {/* Main Navigation */}
            {mainNavItems.map(item => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                icon={item.icon} 
                end={item.end} 
                onClick={closeMobileMenu}
              >
                {item.label}
              </NavLink>
            ))}

            {/* Template Navigation */}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="px-4 py-1 text-xs font-semibold text-gray-500">
                TEMPLATES
              </div>
              {templateNavItems.map(item => (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  icon={item.icon} 
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Form Categories */}
            {isFormsSection && (
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="px-4 py-1 text-xs font-semibold text-gray-500">
                  FORM CATEGORIES
                </div>
                {formCategoryItems.map(item => (
                  <NavLink 
                    key={item.path} 
                    to={item.path} 
                    icon={item.icon} 
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}

            <Link
              to="/admin/quizzes/new"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              onClick={closeMobileMenu}
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Quiz
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}