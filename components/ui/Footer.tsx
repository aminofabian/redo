"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import LogoDark from "./LogoDark";

const Footer = () => {
  return (
    <footer className="bg-[#0f1824] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Newsletter Section */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-white mb-2">
            Keep learning all year round!
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Subscribe to our newsletter to find study inspiration in your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
            <input
              type="text"
              placeholder="Full Name*"
              className="flex-1 px-4 py-2 bg-[#1c2531] border border-gray-700 rounded text-sm focus:outline-none focus:border-[#5d8e9a]"
            />
            <input
              type="email"
              placeholder="Email ID*"
              className="flex-1 px-4 py-2 bg-[#1c2531] border border-gray-700 rounded text-sm focus:outline-none focus:border-[#5d8e9a]"
            />
            <button className="px-6 py-2 bg-yellow-400 text-gray-900 rounded text-sm font-medium hover:bg-yellow-300 transition-colors">
              Subscribe
            </button>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-t border-gray-800">
          <div>
            <h4 className="text-white font-semibold mb-4">Discover us</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/reviews" className="hover:text-white">Student Reviews</Link></li>
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/team" className="hover:text-white">Our Team</Link></li>
              <li><Link href="/partners" className="hover:text-white">Study Partners</Link></li>
              <li><Link href="/careers" className="hover:text-white">Careers <span className="text-yellow-400 text-xs">We&apos;re Hiring!</span></Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link href="/feedback" className="hover:text-white">Leave Your Feedback</Link></li>
              <li><Link href="/guide" className="hover:text-white">How To Study</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/deals" className="hover:text-white">Study Deals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/status" className="hover:text-white">Study Status</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/podcasts" className="hover:text-white">Podcasts</Link></li>
              <li><Link href="/videos" className="hover:text-white">Video Resources</Link></li>
              <li><Link href="/planner" className="hover:text-white">Study Planner</Link></li>
            </ul>
          </div>

          <div>
            <LogoDark className="mb-4" />
            <div className="flex items-center gap-2 text-sm mb-2">
              <Phone size={16} />
              <a href="tel:+1234567890" className="hover:text-white">1800 22 7979</a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail size={16} />
              <a href="mailto:support@rnstudent.com" className="hover:text-white">support@rnstudent.com</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 text-xs text-gray-400">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              © {new Date().getFullYear()} RNStudent. All Rights Reserved.
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white">Terms & Conditions</Link>
              <Link href="/sitemap" className="hover:text-white">Site Map</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 