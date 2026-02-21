'use client';

import Link from 'next/link';
import MainLayout from '../components/MainLayout';

export default function PrivacyPolicy() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-spicy-light to-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-spicy-dark text-center mb-4">
            Privacy <span className="text-spicy-red">Policy</span>
          </h1>
          <p className="text-lg text-center text-gray-600">
            Last updated: February 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-12">

            <div>
              <p className="text-gray-700">
                At Spicy Spanish, we are committed to protecting your privacy and ensuring the security of your personal
                information. This Privacy Policy explains how we collect, use, store, and share your data when you use our
                platform and services. By using Spicy Spanish, you consent to the practices described in this policy.
              </p>
            </div>

            {/* Information We Collect */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We collect information that you provide directly to us when you create an account, book lessons, make
                payments, or contact our support team. This includes your name, email address, phone number, language
                proficiency level, and scheduling preferences.
              </p>
              <p className="text-gray-700 mb-4">
                We also automatically collect certain technical information when you visit our platform, including your IP
                address, browser type, operating system, referring URLs, and information about how you interact with our
                website, such as pages visited and time spent on each page.
              </p>
              <p className="text-gray-700">
                When you participate in lessons, we may collect information related to your learning progress, lesson
                attendance, tutor feedback, and assessment results to help personalize your learning experience.
              </p>
            </div>

            {/* How We Use Your Information */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use your personal information to provide and improve our services, including scheduling lessons,
                matching you with appropriate tutors, processing payments, and tracking your learning progress. Your data
                helps us personalize your experience and deliver relevant content.
              </p>
              <p className="text-gray-700 mb-4">
                We may also use your information to communicate with you about your account, send lesson reminders,
                provide customer support, and notify you of updates to our services or policies. With your consent, we may
                send you promotional materials and newsletters about new courses or features.
              </p>
              <p className="text-gray-700">
                We use aggregated, anonymized data to analyze usage trends, improve our platform, and develop new
                features. This data cannot be used to identify individual users.
              </p>
            </div>

            {/* Data Storage */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">3. Data Storage</h2>
              <p className="text-gray-700 mb-4">
                Your personal information is stored on secure servers with industry-standard encryption and access
                controls. We use PostgreSQL databases with encrypted connections to store your account data, lesson
                history, and progress records.
              </p>
              <p className="text-gray-700 mb-4">
                We retain your personal data for as long as your account is active or as needed to provide you with our
                services. If you choose to close your account, we will delete or anonymize your personal data within 90
                days, except where retention is required by law or for legitimate business purposes.
              </p>
              <p className="text-gray-700">
                We implement appropriate technical and organizational measures to protect your data against unauthorized
                access, alteration, disclosure, or destruction. However, no method of transmission over the internet is
                completely secure, and we cannot guarantee absolute security.
              </p>
            </div>

            {/* Third-Party Services */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">4. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                We use trusted third-party services to operate our platform. These partners have their own privacy
                policies, and we encourage you to review them:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg mb-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-spicy-dark mb-1">Stripe</h3>
                  <p className="text-gray-700">
                    We use Stripe to process credit card payments. Stripe collects and processes your payment information
                    directly and does not share your full card details with us. Stripe&apos;s privacy policy is available at{' '}
                    <a
                      href="https://stripe.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-spicy-red hover:text-spicy-orange underline"
                    >
                      stripe.com/privacy
                    </a>.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-spicy-dark mb-1">Google Calendar</h3>
                  <p className="text-gray-700">
                    We integrate with Google Calendar to manage lesson scheduling and availability. When you connect your
                    Google Calendar, we access only the data necessary to schedule and manage your lessons. Google&apos;s
                    privacy policy is available at{' '}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-spicy-red hover:text-spicy-orange underline"
                    >
                      policies.google.com/privacy
                    </a>.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-spicy-dark mb-1">Solana</h3>
                  <p className="text-gray-700">
                    We accept cryptocurrency payments through the Solana blockchain. Transactions on the Solana network
                    are publicly visible on the blockchain. We do not control or have access to your cryptocurrency wallet
                    beyond processing the transaction.
                  </p>
                </div>
              </div>
              <p className="text-gray-700">
                We do not sell, rent, or trade your personal information to third parties for marketing purposes. We may
                share anonymized, aggregate data with partners for analytics and service improvement.
              </p>
            </div>

            {/* Your Rights */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">5. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                You have the right to access, correct, or delete your personal information at any time. You can update
                most of your account information directly through your dashboard settings. For other requests, please
                contact our support team.
              </p>
              <p className="text-gray-700 mb-4">
                You may request a copy of all personal data we hold about you in a portable, machine-readable format. You
                also have the right to restrict or object to certain types of data processing, and to withdraw consent for
                optional data collection at any time.
              </p>
              <p className="text-gray-700">
                If you are located in the European Economic Area (EEA), you have additional rights under the General Data
                Protection Regulation (GDPR), including the right to lodge a complaint with a supervisory authority. If
                you are a California resident, you may have additional rights under the California Consumer Privacy Act
                (CCPA).
              </p>
            </div>

            {/* Cookie Policy */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">6. Cookie Policy</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to enhance your experience on our platform. Cookies are
                small data files stored on your device that help us remember your preferences, understand how you use our
                site, and improve our services.
              </p>
              <p className="text-gray-700 mb-4">
                We use essential cookies that are necessary for the platform to function properly, including
                authentication tokens and session management. We also use analytics cookies to understand usage patterns
                and improve our platform. These analytics cookies collect anonymized data only.
              </p>
              <p className="text-gray-700">
                You can control cookie settings through your browser preferences. Please note that disabling certain
                cookies may limit your ability to use some features of our platform, such as staying logged in or
                remembering your language preferences.
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">7. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
                please contact us at:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-1"><span className="font-semibold">Privacy Team:</span> privacy@spicyspanish.com</p>
                <p className="text-gray-700 mb-1"><span className="font-semibold">General Support:</span> support@spicyspanish.com</p>
                <p className="text-gray-700">
                  You may also reach us through our{' '}
                  <Link href="/contact" className="text-spicy-red hover:text-spicy-orange underline">
                    Contact Page
                  </Link>.
                </p>
              </div>
            </div>

          </div>

          {/* Back to Home */}
          <div className="mt-16 text-center">
            <Link
              href="/"
              className="inline-block bg-spicy-red text-white font-bold py-3 px-8 rounded-full hover:bg-spicy-orange transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
