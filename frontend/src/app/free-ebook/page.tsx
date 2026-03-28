'use client';

import { useState } from 'react';
import MainLayout from '../components/MainLayout';
import api from '../utils/api';

export default function FreeEbook() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await api.post('/ebook/subscribe', { email });
      setSubmitStatus('success');
      setEmail('');
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-spicy-light to-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-spicy-red font-semibold text-lg mb-4">Free Download</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-spicy-dark mb-6">
              The Digital Nomad <span className="text-spicy-red">Spanish</span> Survival Guide
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Master Spanish for business and life in Latin America. Get the exact phrases, strategies, and cultural insights used by our students to go from confused tourists to confident locals.
            </p>

            {/* Email Form */}
            {submitStatus === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 max-w-lg mx-auto">
                <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-green-800 mb-2">Check your inbox!</h3>
                <p className="text-green-700">We&apos;ve sent the download link to your email.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-5 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-spicy-red text-base"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Get Free Guide'}
                  </button>
                </div>
                {submitStatus === 'error' && (
                  <p className="text-red-600 text-sm mt-3">Something went wrong. Please try again.</p>
                )}
                <p className="text-sm text-gray-500 mt-3">No spam, ever. We&apos;ll only send you the download link.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* What's Inside Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-spicy-dark text-center mb-4">
            What&apos;s Inside the Guide
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            49 pages of practical Spanish for professionals living in Colombia — no textbook fluff, just what you actually need.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="card">
              <div className="bg-spicy-light w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-spicy-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-spicy-dark mb-2">Why Spanish Is Your Competitive Advantage</h3>
              <p className="text-gray-600 text-sm">500 million speakers are making deals and building relationships — learn why speaking their language changes everything.</p>
            </div>

            <div className="card">
              <div className="bg-spicy-light w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-spicy-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-spicy-dark mb-2">The CRASH Method — Learn 5x Faster</h3>
              <p className="text-gray-600 text-sm">Our proven method that helps busy professionals pick up conversational Spanish in record time.</p>
            </div>

            <div className="card">
              <div className="bg-spicy-light w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-spicy-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-spicy-dark mb-2">30 Essential Business Phrases</h3>
              <p className="text-gray-600 text-sm">The exact phrases you need for meetings, negotiations, and networking in Spanish-speaking markets.</p>
            </div>

            <div className="card">
              <div className="bg-spicy-light w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-spicy-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-spicy-dark mb-2">Medellín Survival Spanish</h3>
              <p className="text-gray-600 text-sm">Local slang, cultural context, and practical phrases tested in real everyday situations.</p>
            </div>

            <div className="card">
              <div className="bg-spicy-light w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-spicy-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-spicy-dark mb-2">90-Day Fluency Roadmap</h3>
              <p className="text-gray-600 text-sm">A step-by-step plan to go from beginner to conversationally fluent in just three months.</p>
            </div>

            <div className="card">
              <div className="bg-spicy-light w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-spicy-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-spicy-dark mb-2">Mistakes That Kill Your Credibility</h3>
              <p className="text-gray-600 text-sm">Common errors that make you sound unprofessional — and how to avoid them from day one.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes It Different */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-spicy-dark text-center mb-12">
              This Guide Is <span className="text-spicy-red">Different</span>
            </h2>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-spicy-red text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-spicy-dark mb-1">Written by real Spanish teachers</h3>
                  <p className="text-gray-600">Created by native tutors who teach foreigners every single day and know exactly where people get stuck.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-spicy-red text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-spicy-dark mb-1">Tested in real situations</h3>
                  <p className="text-gray-600">Every phrase has been tested in real Medellín situations — ordering food, closing deals, making friends.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-spicy-red text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-spicy-dark mb-1">Focused on what you actually need</h3>
                  <p className="text-gray-600">No boring grammar drills. Just practical, high-impact Spanish for busy professionals who want results fast.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-spicy-red text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-spicy-dark mb-1">Designed for digital nomads and professionals</h3>
                  <p className="text-gray-600">Built specifically for international professionals living or working in Latin America.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-spicy-dark text-center mb-12">
            What Our Students Say
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="card">
              <p className="text-gray-700 mb-4 italic">&ldquo;Before Spanish, agents showed me overpriced tourist properties. After: I negotiated directly with owners and saved $40K on my first purchase.&rdquo;</p>
              <p className="font-bold text-spicy-dark">Sarah</p>
              <p className="text-sm text-gray-500">Real Estate Investor</p>
            </div>

            <div className="card">
              <p className="text-gray-700 mb-4 italic">&ldquo;My client base grew 300% once I could pitch in Spanish. Colombian companies prefer working with someone who speaks their language.&rdquo;</p>
              <p className="font-bold text-spicy-dark">Mike</p>
              <p className="text-sm text-gray-500">Tech Consultant</p>
            </div>

            <div className="card">
              <p className="text-gray-700 mb-4 italic">&ldquo;I landed my biggest contract ever ($50K) because I was the only bidder who presented in fluent Spanish.&rdquo;</p>
              <p className="font-bold text-spicy-dark">Emma</p>
              <p className="text-sm text-gray-500">Digital Marketing</p>
            </div>

            <div className="card">
              <p className="text-gray-700 mb-4 italic">&ldquo;I was able to buy my first property in Cartagena with a great deal, just because I&apos;m talking Spanish properly now.&rdquo;</p>
              <p className="font-bold text-spicy-dark">Mark</p>
              <p className="text-sm text-gray-500">Startup Programmer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-spicy-dark to-spicy-red">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Ready to Start Your Spanish Journey?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Get your free guide now — and when you&apos;re ready for personalized lessons, our native tutors are here to help.
          </p>

          {submitStatus === 'success' ? (
            <p className="text-white text-lg font-semibold">Your guide is on its way — check your email!</p>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-5 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-spicy-orange text-base"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white text-spicy-red font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isSubmitting ? 'Sending...' : 'Get Free Guide'}
                </button>
              </div>
              {submitStatus === 'error' && (
                <p className="text-white/80 text-sm mt-3">Something went wrong. Please try again.</p>
              )}
            </form>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
