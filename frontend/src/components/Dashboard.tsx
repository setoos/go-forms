import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  FileText,
  FileQuestion,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import QuickActions from "./QuickActions";
import RecentActivity from "./RecentActivity";
import { useTheme } from "../lib/theme";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  changeLabel?: string;
  color: string;
}

function StatCard({
  title,
  value,
  icon,
  change,
  changeLabel,
  color,
}: StatCardProps) {
  return (
    <div className="bg-background rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}
        >
          {icon}
        </div>

        {change !== undefined && (
          <div
            className={`flex items-center text-sm ${
              change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {change >= 0 ? (
              <ArrowUpRight className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 mr-1" />
            )}
            <span>
              {Math.abs(change)}% {changeLabel || ""}
            </span>
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
  );
}



export default function Dashboard() {
  const navigate = useNavigate();
  const { loading, themeLoading } = useTheme();

  // Mock stats data
  const stats = [
    {
      title: "Total Quizzes",
      value: 24,
      icon: <FileQuestion className="h-6 w-6 text-white" />,
      change: 12,
      changeLabel: "this month",
      color: "bg-secondary",
    },
    {
      title: "Total Responses",
      value: 1842,
      icon: <Users className="h-6 w-6 text-white" />,
      change: 8.5,
      color: "bg-blue-600",
    },
    {
      title: "Avg. Completion Rate",
      value: "78%",
      icon: <CheckCircle className="h-6 w-6 text-white" />,
      change: 5.2,
      color: "bg-green-600",
    },
    {
      title: "Avg. Completion Time",
      value: "4m 32s",
      icon: <Clock className="h-6 w-6 text-white" />,
      change: -1.8,
      changeLabel: "faster",
      color: "bg-amber-600",
    },
  ];

  // Mock upcoming events
  const upcomingEvents = [
    {
      id: "1",
      title: "Marketing Assessment Deadline",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
      type: "deadline",
    },
    {
      id: "2",
      title: "Team Evaluation Survey Launch",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
      type: "launch",
    },
    {
      id: "3",
      title: "Quarterly Report Due",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days from now
      type: "deadline",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        {/* Upcoming Events */}
        <div className="bg-background rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Upcoming Events
          </h2>

          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-secondary" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-text">
                    {event.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(event.date, "MMMM d, yyyy")}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.type === "deadline"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {event.type === "deadline" ? "Deadline" : "Launch"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/admin/calendar")}
            className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-text bg-background hover:bg-gray-50"
          >
            View Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to format date
function format(date: Date, format: string): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}
