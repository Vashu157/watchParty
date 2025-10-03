"use client";

import React, { useState } from "react";
import Link from "next/link";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <span className="text-xl font-bold text-indigo-600 cursor-pointer">
                🎬 WatchParty
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-700 hover:text-indigo-600">
              Home
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600">
              Dashboard
            </Link>
            <Link href="/create-room" className="text-gray-700 hover:text-indigo-600">
              Create Room
            </Link>
            <Link href="/login" className="text-gray-700 hover:text-indigo-600">
              Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-indigo-600 focus:outline-none"
              suppressHydrationWarning={true}
            >
              {isOpen ? "✖" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          <Link
            href="/"
            className="block text-gray-700 hover:text-indigo-600"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="block text-gray-700 hover:text-indigo-600"
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/create-room"
            className="block text-gray-700 hover:text-indigo-600"
            onClick={() => setIsOpen(false)}
          >
            Create Room
          </Link>
          <Link
            href="/login"
            className="block text-gray-700 hover:text-indigo-600"
            onClick={() => setIsOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
