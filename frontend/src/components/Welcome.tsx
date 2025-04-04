import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Brain,
  ArrowRight,
  BarChart3,
  Target,
  Users,
  Star,
  ArrowUpRight,
} from "lucide-react";
import React from "react";
import { useTheme } from "../lib/theme.tsx";

export default function Welcome() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  console.log("welcomeTheme", theme);
  

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>
          {theme.branding?.titleText
            ? `${theme.branding.titleText} | Home`
            : "goForm | Home"}
        </title>
        <meta name="description" content="Your SEO description here" />
      </Helmet>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary via-secondary to-primary text-text">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=2070')] bg-cover bg-center mix-blend-overlay opacity-20 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Your Marketing Strategy with Data-Driven Insights
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-accent">
              Get a comprehensive assessment of your marketing performance and
              unlock actionable strategies for growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/quiz/sample")}
                className="px-8 py-4 bg-background text-primary rounded-lg font-semibold hover:bg-accent transition-colors flex items-center justify-center"
              >
                Take Free Assessment
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                className="px-8 py-4 bg-primary text-white hover:text-text rounded-lg font-semibold hover:bg-accent transition-colors flex items-center justify-center"
                onClick={() => navigate("/auth")}
              >
                Create Account
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">
              Unlock Your Marketing Potential
            </h2>
            <p className="text-xl text-text">
              Get actionable insights and personalized recommendations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-accent rounded-xl p-8 hover:bg-accent transition-colors">
              <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-text" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Performance Analysis
              </h3>
              <p className="text-gray-600">
                Get detailed insights into your marketing metrics and understand
                what's working and what needs improvement.
              </p>
            </div>

            <div className="bg-accent rounded-xl p-8 hover:bg-accent transition-colors">
              <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-text" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Strategic Recommendations
              </h3>
              <p className="text-gray-600">
                Receive personalized recommendations to optimize your marketing
                strategy and achieve better results.
              </p>
            </div>

            <div className="bg-accent rounded-xl p-8 hover:bg-accent transition-colors">
              <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-text" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Audience Insights</h3>
              <p className="text-gray-600">
                Understand your target audience better with comprehensive
                demographic and behavioral analysis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Process */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">
              Get your personalized marketing assessment in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Take Assessment",
                description:
                  "Complete our comprehensive marketing assessment questionnaire",
              },
              {
                step: "2",
                title: "Get Analysis",
                description:
                  "Receive detailed analysis of your marketing performance",
              },
              {
                step: "3",
                title: "Implement Changes",
                description:
                  "Follow actionable recommendations to improve your strategy",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-background p-8 rounded-lg shadow-sm"
              >
                <div className="flex items-center mb-4">
                  <span className="w-8 h-8 bg-secondary text-text rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </span>
                  <div className="h-1 flex-1 bg-accent ml-4"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of marketers who've improved their strategy with
              our assessment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-accent p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "The marketing assessment provided invaluable insights that
                  helped us optimize our strategy and increase ROI
                  significantly."
                </p>
                <div className="flex items-center">
                  <img
                    src={`https://i.pravatar.cc/40?img=${i}`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <p className="font-medium text-text">Marketing Director</p>
                    <p className="text-sm text-gray-500">Tech Company</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-background py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Marketing Strategy?
          </h2>
          <p className="text-xl text-accent mb-8">
            Take our free assessment and get personalized recommendations to
            improve your marketing performance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="px-8 py-4 bg-background text-primary rounded-lg font-semibold hover:bg-accent transition-colors"
              onClick={() => navigate("/quiz/sample")}
            >
              Start Free Assessment
            </button>
            <button
              className="px-8 py-4 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary transition-colors"
              onClick={() => navigate("/auth")}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center text-white mb-4">
                <Brain className="w-8 h-8 mr-2" />
                <span className="text-xl font-bold">Vidoora</span>
              </div>
              <p className="text-sm">
                Transform your marketing strategy with data-driven insights and
                personalized recommendations.
              </p>
            </div>
            {["Product", "Company", "Resources"].map((section) => (
              <div key={section}>
                <h4 className="text-white font-medium mb-4">{section}</h4>
                <ul className="space-y-2">
                  {["Features", "Pricing", "About", "Blog"].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm">
            <p>
              &copy; {new Date().getFullYear()} Vidoora. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
