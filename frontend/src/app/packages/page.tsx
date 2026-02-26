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

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/packages/active');
      setPackages(response.data);
    } catch (error) {
      // Fallback to default packages if backend fails
      const defaultPackages: Package[] = [
        {
          id: '1',
          name: 'Starter Package',
          description: 'Perfect for beginners wanting to try out our Spanish lessons.',
          hours: 4,
          priceUsd: 49,
          isActive: true
        },
        {
          id: '2',
          name: 'Popular Package',
          description: 'Our most popular package for consistent learning.',
          hours: 8,
          priceUsd: 89,
          isActive: true
        },
        {
          id: '3',
          name: 'Intensive Package',
          description: 'For serious learners who want to progress quickly.',
          hours: 16,
          priceUsd: 159,
          isActive: true
        },
        {
          id: '4',
          name: 'Premium Package',
          description: 'Maximum flexibility and value for dedicated students.',
          hours: 32,
          priceUsd: 299,
          isActive: true
        }
      ];
      setPackages(defaultPackages);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (basePrice: number) => {
    if (billingPeriod === 'yearly') {
      return Math.floor(basePrice * 10); // 2 months free on yearly
    }
    return basePrice;
  };

  const getFeatures = (pkg: Package) => {
    const baseFeatures = [
      `${pkg.hours} one-on-one lessons`,
      '45-minute sessions',
      'Personalized curriculum',
      'Progress tracking',
      'Email support'
    ];

    if (pkg.hours >= 8) {
      baseFeatures.push('Priority scheduling');
      baseFeatures.push('Homework assignments');
    }
    
    if (pkg.hours >= 16) {
      baseFeatures.push('24/7 chat support');
      baseFeatures.push('Cultural workshops access');
      baseFeatures.push('DELE exam preparation');
    }
    
    if (pkg.hours >= 32) {
      baseFeatures.push('Dedicated account manager');
      baseFeatures.push('Custom learning materials');
      baseFeatures.push('Conversation practice groups');
    }

    return baseFeatures;
  };

  const isPopular = (pkg: Package) => {
    return pkg.hours === 8; // 8-hour package is most popular
  };

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
          <h1 className="text-4xl md:text-5xl font-display font-bold text-spicy-dark text-center mb-8">
            Choose Your <span className="text-spicy-red">Learning Package</span>
          </h1>
          <p className="text-lg md:text-xl text-center max-w-3xl mx-auto mb-8">
            Flexible packages designed to fit your schedule and learning goals. All packages include access to our expert Colombian tutors.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-4">
            <span className={`font-medium ${billingPeriod === 'monthly' ? 'text-spicy-dark' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-16 h-8 bg-gray-300 rounded-full transition-colors duration-300 focus:outline-none"
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  billingPeriod === 'yearly' ? 'translate-x-8 bg-spicy-red' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`font-medium ${billingPeriod === 'yearly' ? 'text-spicy-dark' : 'text-gray-500'}`}>
              Yearly
              <span className="ml-2 text-sm text-green-600 font-bold">Save 17%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`card relative ${
                  isPopular(pkg) ? 'border-2 border-spicy-red ring-2 ring-spicy-red ring-opacity-20' : ''
                }`}
              >
                {isPopular(pkg) && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-spicy-red text-white px-4 py-1 rounded-full text-sm font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-spicy-dark">
                      ${getPrice(pkg.priceUsd)}
                    </span>
                    <span className="text-gray-600">
                      /{billingPeriod === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{pkg.hours} hours per month</p>
                  <p className="text-gray-600 mb-6">{pkg.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {getFeatures(pkg).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href="/register"
                    className={`w-full text-center block ${
                      isPopular(pkg) ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">All Packages Include</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl mb-4">👨‍🏫</div>
              <h3 className="font-bold mb-2">Expert Tutors</h3>
              <p className="text-gray-700">Native Colombian Spanish speakers with teaching certifications</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="font-bold mb-2">Mobile App Access</h3>
              <p className="text-gray-700">Learn on the go with our mobile app for iOS and Android</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold mb-2">Progress Tracking</h3>
              <p className="text-gray-700">Monitor your improvement with detailed progress reports</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🗓️</div>
              <h3 className="font-bold mb-2">Flexible Scheduling</h3>
              <p className="text-gray-700">Book lessons that fit your schedule with easy rescheduling</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="font-bold mb-2">Community Access</h3>
              <p className="text-gray-700">Join our student community for practice and support</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-bold mb-2">Personalized Learning</h3>
              <p className="text-gray-700">Curriculum tailored to your goals and learning style</p>
            </div>
          </div>
        </div>
      </section>

      {/* Money Back Guarantee */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-spicy-light to-spicy-yellow rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-display font-bold mb-4">30-Day Money Back Guarantee</h2>
            <p className="text-lg max-w-2xl mx-auto mb-8">
              We&apos;re confident you&apos;ll love learning with Spicy Spanish. If you&apos;re not completely satisfied within your first 30 days, we&apos;ll give you a full refund. No questions asked.
            </p>
            <Link href="/register" className="btn-primary">
              Start Risk-Free Today
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="card">
              <h3 className="font-bold mb-2">Can I switch packages anytime?</h3>
              <p className="text-gray-700">
                Yes! You can upgrade or downgrade your package at any time. Changes will take effect at the start of your next billing cycle.
              </p>
            </div>
            <div className="card">
              <h3 className="font-bold mb-2">What happens to unused lessons?</h3>
              <p className="text-gray-700">
                Unused lessons roll over for up to 2 months, giving you flexibility if you need to take a break or have a busy schedule.
              </p>
            </div>
            <div className="card">
              <h3 className="font-bold mb-2">Can I pause my subscription?</h3>
              <p className="text-gray-700">
                Absolutely! You can pause your subscription for up to 3 months per year without losing your progress or tutor preferences.
              </p>
            </div>
            <div className="card">
              <h3 className="font-bold mb-2">Do you offer group lessons?</h3>
              <p className="text-gray-700">
                Yes, we offer group lessons for teams and organizations. Contact our sales team to learn about group rates and custom packages.
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
            Join thousands of students who are achieving their Spanish language goals with Spicy Spanish.
          </p>
          <Link href="/register" className="bg-white text-spicy-red font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors">
            Choose Your Package
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}