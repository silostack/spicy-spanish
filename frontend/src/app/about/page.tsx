import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '../components/MainLayout';

export default function About() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-spicy-light to-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-spicy-dark text-center mb-8">
            About <span className="text-spicy-red">Spicy Spanish</span>
          </h1>
          <p className="text-lg md:text-xl text-center max-w-3xl mx-auto">
            Your gateway to mastering Spanish through engaging, personalized lessons with native Colombian tutors.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-display font-bold mb-6">Our Story</h2>
              <p className="text-gray-700 mb-4">
                Spicy Spanish was founded with a simple mission: to make learning Spanish an exciting and enjoyable 
                experience for everyone. We believe that language learning should be more than just memorizing 
                vocabulary and grammar rules – it should be a journey into a rich culture and a gateway to new 
                opportunities.
              </p>
              <p className="text-gray-700 mb-4">
                Our team of experienced Colombian tutors brings authentic language expertise and cultural insights 
                to every lesson. Colombia is known for having one of the clearest and most neutral Spanish accents 
                in Latin America, making our tutors ideal guides for your Spanish learning journey.
              </p>
              <p className="text-gray-700">
                Since our founding, we've helped hundreds of students achieve their Spanish language goals, from 
                complete beginners to advanced speakers looking to perfect their fluency.
              </p>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden shadow-xl">
              <div className="bg-gradient-to-br from-spicy-red to-spicy-yellow h-full w-full flex items-center justify-center">
                <span className="text-white text-6xl">🌶️</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3">Personalized Learning</h3>
              <p className="text-gray-700">
                Every student is unique, and so is our approach. We tailor our lessons to match your learning style, 
                goals, and interests, ensuring you get the most out of every session.
              </p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-3">Cultural Immersion</h3>
              <p className="text-gray-700">
                Language is culture. Our lessons go beyond grammar and vocabulary to include real-world contexts, 
                cultural insights, and practical conversations that prepare you for authentic interactions.
              </p>
            </div>
            <div className="card">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="text-xl font-bold mb-3">Student Success</h3>
              <p className="text-gray-700">
                Your success is our success. We're committed to providing the support, resources, and encouragement 
                you need to achieve your Spanish language goals and unlock new opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">The Spicy Spanish Method</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start">
                <div className="bg-spicy-red text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold mb-2">Assessment & Goal Setting</h3>
                  <p className="text-gray-700">
                    We start by understanding your current level and defining clear, achievable goals for your Spanish journey.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-spicy-red text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold mb-2">Customized Curriculum</h3>
                  <p className="text-gray-700">
                    Our tutors create a personalized learning plan that aligns with your objectives and learning style.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-spicy-red text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold mb-2">Interactive Lessons</h3>
                  <p className="text-gray-700">
                    Engage in dynamic, conversation-focused lessons that make learning Spanish fun and practical.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-spicy-red text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-bold mb-2">Continuous Progress Tracking</h3>
                  <p className="text-gray-700">
                    Regular assessments and feedback ensure you're always moving forward toward fluency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-spicy-red text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Ready to Start Your Spanish Journey?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join the Spicy Spanish community today and discover how fun and effective learning Spanish can be!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-white text-spicy-red font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors">
              Get Started Today
            </Link>
            <Link href="/packages" className="border-2 border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white hover:text-spicy-red transition-colors">
              View Our Packages
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}