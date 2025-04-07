import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";
import StratejiLogo from "../../public/strateji.svg";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();
  const { user } = useAuth();

  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#" },
        { label: "Pricing", href: "#" },
        { label: "Templates", href: "/forms/templates" },
        { label: "Integrations", href: "#" },
        { label: "API", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Guides", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Support Center", href: "#" },
        { label: "Webinars", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Contact Us", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            {theme.branding?.logo && user ? (
              <Link to="/" className="flex items-center">
                <img
                  src={theme.branding.logo}
                  alt="Logo"
                  className="h-10 w-auto"
                />
                <span className="ml-2 text-xl font-bold">GoForms</span>
              </Link>
            ) : (
              <Link
                to="/"
                className="flex items-center"
              >
                <span className="ml-2 text-xl font-bold">GoForms</span>
              </Link>
            )}
            <p className="text-gray-400 mb-6 max-w-md">
              Professional form and GoForm templates for every purpose. Create
              beautiful, responsive forms and assessments in minutes.
            </p>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-secondary mr-3" />
                <a
                  href="mailto:info@goforms.ai"
                  className="text-gray-400 hover:text-white"
                >
                  info@goforms.ai
                </a>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-secondary mr-3" />
                <a
                  href="tel:+1234567890"
                  className="text-gray-400 hover:text-white"
                >
                  +1 (234) 567-890
                </a>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-secondary mr-3" />
                <span className="text-gray-400">
                  123 Form Street, Template City, TC 12345
                </span>
              </div>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} GoForms. All rights reserved.| Proudly Owned by
            Setoo Solutions
          </p>

          <div className="flex space-x-4">
            <div className="my-auto flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <img
                  src=" https://www.setoo.co/_next/static/media/logo-white.5de2be34.svg"
                  alt=""
                  className="size-16"
                />
                <span className="sr-only">Setoo</span>
              </a>{" "}
              <a href="#" className="text-gray-400 hover:text-white">
                <img src={StratejiLogo} alt="" className="size-16" />
                <span className="sr-only">StrateJi</span>
              </a>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-5 my-auto">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
