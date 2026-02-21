'use client';

import Link from 'next/link';
import MainLayout from '../components/MainLayout';

export default function TermsOfService() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-spicy-light to-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-spicy-dark text-center mb-4">
            Terms of <span className="text-spicy-red">Service</span>
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

            {/* Terms of Use */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">1. Terms of Use</h2>
              <p className="text-gray-700 mb-4">
                Welcome to Spicy Spanish. By accessing and using our website and services, you accept and agree to be
                bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
              <p className="text-gray-700">
                These terms apply to all visitors, users, students, and tutors who access or use our platform. We reserve
                the right to update or modify these terms at any time without prior notice. Your continued use of the
                platform after any changes constitutes acceptance of the updated terms.
              </p>
            </div>

            {/* Services Description */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">2. Services Description</h2>
              <p className="text-gray-700 mb-4">
                Spicy Spanish provides an online language learning platform that connects students with qualified Spanish
                tutors for personalized lessons. Our services include one-on-one tutoring sessions, group classes, course
                materials, scheduling tools, and progress tracking.
              </p>
              <p className="text-gray-700">
                All lessons are conducted online through our platform. We strive to provide high-quality instruction, but
                we do not guarantee specific learning outcomes, as language acquisition depends on individual effort,
                consistency, and other factors beyond our control.
              </p>
            </div>

            {/* User Accounts */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                To access certain features of our platform, you must create an account. You are responsible for
                maintaining the confidentiality of your account credentials and for all activities that occur under your
                account.
              </p>
              <p className="text-gray-700 mb-4">
                You agree to provide accurate, current, and complete information during the registration process and to
                update such information to keep it accurate. We reserve the right to suspend or terminate accounts that
                contain inaccurate or incomplete information.
              </p>
              <p className="text-gray-700">
                You must be at least 18 years of age to create an account. If you are under 18, you may only use our
                services with the involvement and consent of a parent or legal guardian.
              </p>
            </div>

            {/* Payment Terms */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">4. Payment Terms</h2>
              <p className="text-gray-700 mb-4">
                Payment for our services is processed through third-party payment providers, including Stripe for credit
                card payments and Solana for cryptocurrency payments. By making a payment, you agree to the terms and
                conditions of the applicable payment provider.
              </p>
              <p className="text-gray-700 mb-4">
                All prices are listed in US Dollars unless otherwise stated. Prices are subject to change, but any
                changes will not affect lesson packages that have already been purchased. Payments are due at the time of
                purchase.
              </p>
              <p className="text-gray-700">
                We do not store your complete payment information on our servers. All payment data is handled securely by
                our payment processing partners in accordance with industry standards.
              </p>
            </div>

            {/* Cancellation Policy */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">5. Cancellation Policy</h2>
              <p className="text-gray-700 mb-4">
                Students may cancel or reschedule a lesson up to 24 hours before the scheduled start time without
                penalty. Cancellations made less than 24 hours before the lesson may result in the lesson being marked as
                completed and deducted from your package.
              </p>
              <p className="text-gray-700 mb-4">
                If a tutor cancels a lesson, the lesson will be rescheduled at no additional cost to the student, or a
                credit will be applied to the student&apos;s account.
              </p>
              <p className="text-gray-700">
                Refund requests for unused lesson packages must be submitted within 30 days of purchase. Refunds are
                issued at our discretion and may be subject to a processing fee. Partially used packages may be eligible
                for a prorated refund.
              </p>
            </div>

            {/* Intellectual Property */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                All content on the Spicy Spanish platform, including but not limited to text, graphics, logos, images,
                course materials, and software, is the property of Spicy Spanish or its content creators and is protected
                by applicable intellectual property laws.
              </p>
              <p className="text-gray-700">
                You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise
                exploit any of our content without our prior written consent. Course materials provided during lessons are
                for your personal, non-commercial use only.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the fullest extent permitted by law, Spicy Spanish shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages arising out of or relating to your use of our services.
              </p>
              <p className="text-gray-700">
                Our total liability for any claim arising out of or relating to these terms or our services shall not
                exceed the amount you have paid to us in the twelve (12) months preceding the claim. This limitation
                applies regardless of the theory of liability.
              </p>
            </div>

            {/* Governing Law */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">8. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction
                in which Spicy Spanish operates, without regard to its conflict of law provisions.
              </p>
              <p className="text-gray-700">
                Any disputes arising from these terms or your use of our services shall be resolved through binding
                arbitration in accordance with the rules of the applicable arbitration association, unless otherwise
                required by law.
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-display font-bold text-spicy-dark mb-4">9. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions or concerns about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-1"><span className="font-semibold">Email:</span> legal@spicyspanish.com</p>
                <p className="text-gray-700 mb-1"><span className="font-semibold">Support:</span> support@spicyspanish.com</p>
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
