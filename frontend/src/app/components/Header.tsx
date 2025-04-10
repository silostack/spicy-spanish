'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/spicy_spanish_logo.png"
            alt="Spicy Spanish Logo"
            width={140}
            height={60}
            className="h-12 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          <Link href="/" className="text-spicy-dark hover:text-spicy-red font-medium">
            Home
          </Link>
          <Link href="/about" className="text-spicy-dark hover:text-spicy-red font-medium">
            About
          </Link>
          <Link href="/tutors" className="text-spicy-dark hover:text-spicy-red font-medium">
            Tutors
          </Link>
          <Link href="/contact" className="text-spicy-dark hover:text-spicy-red font-medium">
            Contact
          </Link>
        </nav>

        <div className="hidden md:flex space-x-4">
          <Link href="/login" className="text-spicy-dark hover:text-spicy-red font-medium">
            Log In
          </Link>
          <Link href="/register" className="btn-primary">
            Register
          </Link>
        </div>

        {/* Mobile Navigation */}
        <button
          className="md:hidden text-spicy-dark"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-6 w-6"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white py-4 px-4 shadow-lg">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/"
              className="text-spicy-dark hover:text-spicy-red font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-spicy-dark hover:text-spicy-red font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/tutors"
              className="text-spicy-dark hover:text-spicy-red font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Tutors
            </Link>
            <Link
              href="/contact"
              className="text-spicy-dark hover:text-spicy-red font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="pt-4 flex flex-col space-y-2">
              <Link
                href="/login"
                className="text-spicy-dark hover:text-spicy-red font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="btn-primary text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}