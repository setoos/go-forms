import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Brain,
  Home,
  FileText,
  BarChart3,
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
  Palette,
  CheckCircle
} from "lucide-react";
import { useAuth } from "../lib/auth.tsx";
import { cn } from "../lib/utils.ts";
import { applyTheme, defaultTheme, useTheme } from "../lib/theme.tsx";
import Cookies from "js-cookie";

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
        "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors group",
        isActive
          ? "bg-accent text-primary"
          : "text-text hover:bg-accent hover:text-primary"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: cn(
          "h-5 w-5 mr-3",
          isActive ? "text-primary" : "text-text group-hover:text-primary"
        ),
      })}
      {children}
    </Link>
  );
}

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { setIsSignOut, isDarkMode } = useTheme();

  if (!user) return null;

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      Cookies.remove("theme");
      applyTheme(defaultTheme, isDarkMode);
      await signOut();
      setIsSignOut(true);
      navigate("/");
      setIsOpen(false);
    }
  };

  const settingsMenuItems = [
    { label: "Account Settings", icon: UserCog, path: "/settings/account" },
    // { label: "Notifications", icon: Bell, path: "/settings/notifications" },
    // { label: "Privacy", icon: Lock, path: "/settings/privacy" },
    // { label: "Security", icon: Shield, path: "/settings/security" },
    { label: "theme", icon: Palette , path: "/settings/theme" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-text focus:outline-none"
      >
        <User className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium hidden sm:inline">
          {user.email}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-background ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1" role="menu">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-medium text-text">{user.email}</p>
                <p className="text-xs text-text">Logged in</p>
              </div>

              <div className="py-1">
                {settingsMenuItems.map(({ label, icon: Icon, path }) => (
                  <Link
                    key={path}
                    to={path}
                    className="flex items-center px-4 py-2 text-sm text-text hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4 mr-3 text-text" />
                    {label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-border">
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
  const { theme } = useTheme();

  console.log("navigationTheme", theme);
  

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const { isSignOut } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center text-text hover:text-secondary"
            >
              {theme.branding?.logo && !isSignOut ? (
                <img
                  src={theme.branding?.logo}
                  alt="Logo"
                  className="w-auto h-8"
                />
              ) : (
                <>
                  <Brain className="h-8 w-8 text-secondary" />{" "}
                  <span className="ml-2 text-xl font-bold">Vidoora</span>
                </>
              )}
              {theme.branding?.logoText &&  !isSignOut &&(
                <span className="ml-2 text-xl font-bold">
                  {theme.branding?.logoText}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              <NavLink to="/" icon={<Home />} end>
                Home
              </NavLink>
              <NavLink to="/admin/quizzes" icon={<FileText />}>
                My Quizzes
              </NavLink>
              <NavLink to="/admin/analytics" icon={<BarChart3 />}>
                Analytics
              </NavLink>
              <NavLink to="/admin/submissions" icon={<CheckCircle />}>
                Submissions
              </NavLink>
              <Link
                to="/admin/quizzes/new"
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary transition-colors"
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
                  className="md:hidden p-2 rounded-lg text-text hover:bg-gray-100 focus:outline-none"
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
                className="flex items-center px-4 py-2 text-sm font-medium text-secondary border border-secondaryrounded-lg hover:bg-accent transition-colors"
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
            isMobileMenuOpen
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
            <NavLink to="/" icon={<Home />} end onClick={closeMobileMenu}>
              Home
            </NavLink>
            <NavLink
              to="/admin/quizzes"
              icon={<FileText />}
              onClick={closeMobileMenu}
            >
              My Quizzes
            </NavLink>
            <NavLink
              to="/admin/analytics"
              icon={<BarChart3 />}
              onClick={closeMobileMenu}
            >
              Analytics
            </NavLink>
            <Link
              to="/admin/quizzes/new"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary transition-colors"
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
