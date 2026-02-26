import Image from 'next/image';
import Link from 'next/link';
import MainLayout from './components/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-spicy-light to-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-spicy-dark leading-tight mb-4">
                Learn Spanish <span className="text-spicy-red">with Energy and Fun!</span>
              </h1>
              <p className="text-lg md:text-xl mb-8">
                Join Spicy Spanish for interactive, engaging lessons from expert tutors. Your journey to Spanish 
                fluency starts here!
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/register" className="btn-primary text-center">
                  Get Started
                </Link>
                <Link href="/packages" className="btn-secondary text-center">
                  View Packages
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="relative h-80 md:h-96 w-full rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="/images/home_page_hero.png"
                  alt="Students learning Spanish"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Why Choose Spicy Spanish?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="bg-spicy-light p-4 inline-block rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-10 w-10 text-spicy-red"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Expert Colombian Tutors</h3>
              <p className="text-gray-700">
                Learn from native Spanish speakers from Colombia, known for their clear and neutral accents.
              </p>
            </div>

            <div className="card text-center">
              <div className="bg-spicy-light p-4 inline-block rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-10 w-10 text-spicy-red"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Flexible Scheduling</h3>
              <p className="text-gray-700">
                Book classes that fit your busy lifestyle with our easy-to-use scheduling system.
              </p>
            </div>

            <div className="card text-center">
              <div className="bg-spicy-light p-4 inline-block rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-10 w-10 text-spicy-red"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Personalized Curriculum</h3>
              <p className="text-gray-700">
                Custom lessons designed to meet your specific goals and interests in learning Spanish.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-spicy-red text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Ready to Start Your Spanish Journey?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join Spicy Spanish today and begin your adventure into the exciting world of Spanish language and culture!
          </p>
          <Link href="/register" className="bg-white text-spicy-red font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors">
            Sign Up Now
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-spicy-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">What Our Students Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
                <div>
                  <h3 className="font-bold">Sarah Johnson</h3>
                  <p className="text-sm text-gray-600">Student - 6 months</p>
                </div>
              </div>
              <p className="text-gray-700">
                &ldquo;Spicy Spanish has transformed my language learning experience. The tutors are engaging and the
                curriculum is perfectly tailored to my goals. ¡Muy recomendado!&rdquo;
              </p>
            </div>

            <div className="card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
                <div>
                  <h3 className="font-bold">Michael Rodriguez</h3>
                  <p className="text-sm text-gray-600">Student - 1 year</p>
                </div>
              </div>
              <p className="text-gray-700">
                &ldquo;The flexibility of scheduling and the expertise of the tutors have made learning Spanish enjoyable
                and effective. I&apos;ve improved significantly in just a few months.&rdquo;
              </p>
            </div>

            <div className="card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
                <div>
                  <h3 className="font-bold">Emily Chen</h3>
                  <p className="text-sm text-gray-600">Student - 3 months</p>
                </div>
              </div>
              <p className="text-gray-700">
                &ldquo;As a beginner, I was nervous about starting Spanish lessons, but the tutors at Spicy Spanish made me
                feel comfortable and confident from day one. Now I look forward to every class!&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}