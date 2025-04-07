import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navigation from "./Navigation";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useAuth } from "../lib/auth";

export default function DashboardLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Determine if we should show the sidebar based on the current route
  const showSidebar =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/forms") ||
    location.pathname.startsWith("/settings");

  // Don't show sidebar on the home page or auth pages
  const isHomePage = location.pathname === "/";
  const isAuthPage = location.pathname === "/auth";
  const isResultsPage =
    location.pathname === "/results" ||
    location.pathname === "/results/success";
  const isQuizPage = location.pathname.startsWith("/quiz/");

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Determine if we should show the footer
  const showFooter = isHomePage || isResultsPage;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />

      <div className="flex flex-1 relative">
        {/* Mobile sidebar backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar */}
        {user && (
          <div
            className={`fixed md:sticky top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-screen z-30 transform transition-transform duration-300 ease-in-out ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }`}
          >
            <Sidebar />
          </div>
        )}

        {/* Sidebar toggle button for mobile */}
        {showSidebar &&
          !isHomePage &&
          !isAuthPage &&
          !isQuizPage &&
          !isResultsPage && (
            <button
              className="fixed bottom-4 left-4 md:hidden z-40 bg-secondary text-white p-3 rounded-full shadow-lg"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          )}

        {/* Main content */}
        <main
          className={`flex-1 ${
            showSidebar &&
            !isHomePage &&
            !isAuthPage &&
            !isQuizPage &&
            !isResultsPage
              ? ""
              : ""
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}
