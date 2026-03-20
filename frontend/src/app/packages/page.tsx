'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '../components/MainLayout';
import api from '../utils/api';

interface Package {
  id: string;
  name: string;
  description: string;
  hours: number;
  priceUsd: number;
  isActive: boolean;
}

const defaultPackages: Package[] = [
  {
    id: '1',
    name: 'Basic Package',
    description: 'A great way to get started with personalized Spanish lessons.',
    hours: 5,
    priceUsd: 143,
    isActive: true,
  },
  {
    id: '2',
    name: 'Standard Package',
    description: 'Our most popular option for consistent progress.',
    hours: 10,
    priceUsd: 264,
    isActive: true,
  },
  {
    id: '3',
    name: 'Premium Package',
    description: 'For dedicated learners ready to accelerate their fluency.',
    hours: 20,
    priceUsd: 462,
    isActive: true,
  },
  {
    id: '4',
    name: 'Premium Plus',
    description: 'The ultimate immersive experience — 3 months of intensive Spanish.',
    hours: 90,
    priceUsd: 1836,
    isActive: true,
  },
];

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/packages/active');
      setPackages(response.data);
    } catch {
      setPackages(defaultPackages);
    } finally {
      setLoading(false);
    }
  };

  const isPopular = (pkg: Package) => pkg.name === 'Premium Package';

  const isBestValue = (pkg: Package) => pkg.name === 'Premium Plus';

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-spicy-red"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-spicy-light to-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-spicy-dark text-center mb-6">
            Customizable <span className="text-spicy-red">Packages</span>
          </h1>
          <p className="text-lg md:text-xl text-center max-w-3xl mx-auto">
            Select the number of classes that fit your goals and schedule. All packages include personalized instruction from native Spanish-speaking tutors.
          </p>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`card relative flex flex-col ${
                  isPopular(pkg)
                    ? 'border-2 border-spicy-red ring-2 ring-spicy-red ring-opacity-20'
                    : isBestValue(pkg)
                      ? 'border-2 border-spicy-orange ring-2 ring-spicy-orange ring-opacity-20'
                      : ''
                }`}
              >
                {isPopular(pkg) && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-spicy-red text-white px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                {isBestValue(pkg) && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-spicy-orange text-white px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                      BEST VALUE
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-spicy-dark">
                      ${pkg.priceUsd.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">
                    {pkg.hours} hours of lessons
                  </p>
                  <p className="text-gray-600 mb-6 flex-1">{pkg.description}</p>

                  <Link
                    href="/register"
                    className={`w-full text-center block ${
                      isPopular(pkg) ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    Purchase Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Options */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Flexible Delivery Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="card text-center">
              <div className="bg-spicy-light p-4 inline-block rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  width="40"
                  height="40"
                  className="text-spicy-red"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Online Lessons</h3>
              <p className="text-gray-700">
                Learn from anywhere in the world with live video sessions. All you need is an internet connection.
              </p>
            </div>
            <div className="card text-center">
              <div className="bg-spicy-light p-4 inline-block rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  width="40"
                  height="40"
                  className="text-spicy-red"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Face-to-Face in Medellin</h3>
              <p className="text-gray-700">
                Visiting or living in Medellin? Meet your tutor in person for an immersive learning experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Tailored to Your Level & Goals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="card text-center">
              <div className="bg-spicy-light p-4 inline-block rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  width="40"
                  height="40"
                  className="text-spicy-red"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Speaking</h3>
              <p className="text-gray-700">
                Build confidence with conversation practice tailored to real-life situations.
              </p>
            </div>
            <div className="card text-center">
              <div className="bg-spicy-light p-4 inline-block rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  width="40"
                  height="40"
                  className="text-spicy-red"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Reading</h3>
              <p className="text-gray-700">
                Develop comprehension skills with authentic Spanish texts and materials.
              </p>
            </div>
            <div className="card text-center">
              <div className="bg-spicy-light p-4 inline-block rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  width="40"
                  height="40"
                  className="text-spicy-red"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Writing</h3>
              <p className="text-gray-700">
                Master written Spanish with guided exercises and personalized feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="card">
              <h3 className="font-bold mb-2">How long are the lessons?</h3>
              <p className="text-gray-700">
                Each lesson is a 1-hour session. You can schedule them at times that work best for you.
              </p>
            </div>
            <div className="card">
              <h3 className="font-bold mb-2">Do the hours expire?</h3>
              <p className="text-gray-700">
                Hours are valid for 6 months from the date of purchase, giving you plenty of flexibility to complete your lessons.
              </p>
            </div>
            <div className="card">
              <h3 className="font-bold mb-2">Can I choose my tutor?</h3>
              <p className="text-gray-700">
                Yes! You can browse our team of tutors and select the one that best fits your learning style and schedule.
              </p>
            </div>
            <div className="card">
              <h3 className="font-bold mb-2">What if I need to reschedule?</h3>
              <p className="text-gray-700">
                We understand life happens. You can reschedule a lesson up to 24 hours before the scheduled time at no extra cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-spicy-red text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Ready to Start Learning Spanish?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Choose a package and begin your journey with our expert Colombian tutors today.
          </p>
          <Link
            href="/register"
            className="bg-white text-spicy-red font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
