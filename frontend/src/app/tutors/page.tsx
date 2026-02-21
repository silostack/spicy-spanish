'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '../components/MainLayout';
import api from '../utils/api';

interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  tutorExperience?: string;
  profilePicture?: string;
}

// Fallback hardcoded tutors shown when the API is unreachable
const fallbackTutors: Tutor[] = [
  {
    id: 'fallback-1',
    firstName: 'Maria',
    lastName: 'Gonzalez',
    bio: 'Native Colombian tutor specializing in conversational Spanish and business communication. I love helping students gain confidence in real-world Spanish conversations.',
    tutorExperience: 'Conversational Spanish - 8 years experience',
    profilePicture: undefined,
  },
  {
    id: 'fallback-2',
    firstName: 'Carlos',
    lastName: 'Rodriguez',
    bio: 'Expert in business Spanish and professional communication. I help professionals excel in Spanish-speaking business environments.',
    tutorExperience: 'Business Spanish - 6 years experience',
    profilePicture: undefined,
  },
  {
    id: 'fallback-3',
    firstName: 'Ana Lucia',
    lastName: 'Mendez',
    bio: 'Patient and enthusiastic teacher specializing in beginners. I make learning Spanish fun and accessible for everyone!',
    tutorExperience: 'Spanish for Beginners - 10 years experience',
    profilePicture: undefined,
  },
];

export default function Tutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const response = await api.get('/auth/public-tutors');
        const data = response.data;
        setTutors(data.length > 0 ? data : fallbackTutors);
      } catch (error) {
        console.error('Failed to fetch tutors:', error);
        setTutors(fallbackTutors);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTutors();
  }, []);

  const filteredTutors = tutors.filter(tutor => {
    const name = `${tutor.firstName} ${tutor.lastName}`.toLowerCase();
    const bio = (tutor.bio || '').toLowerCase();
    const experience = (tutor.tutorExperience || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || bio.includes(query) || experience.includes(query);
  });

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-spicy-light to-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-spicy-dark text-center mb-8">
            Meet Our <span className="text-spicy-red">Expert Tutors</span>
          </h1>
          <p className="text-lg md:text-xl text-center max-w-3xl mx-auto">
            Learn from native Colombian Spanish speakers who are passionate about teaching and helping you achieve your language goals.
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <div className="w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search tutors..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tutors Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spicy-red"></div>
            </div>
          ) : filteredTutors.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-gray-600">No tutors found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTutors.map(tutor => (
                <div key={tutor.id} className="card hover:shadow-xl transition-shadow">
                  <div className="relative h-48 bg-gradient-to-br from-spicy-light to-spicy-yellow rounded-t-lg flex items-center justify-center">
                    {tutor.profilePicture ? (
                      <Image
                        src={tutor.profilePicture}
                        alt={`${tutor.firstName} ${tutor.lastName}`}
                        width={128}
                        height={128}
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-spicy-red">
                        {tutor.firstName.charAt(0)}{tutor.lastName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{tutor.firstName} {tutor.lastName}</h3>

                    {tutor.tutorExperience && (
                      <p className="text-spicy-red font-medium mb-2">{tutor.tutorExperience}</p>
                    )}

                    {tutor.bio && (
                      <p className="text-gray-700 mb-4 line-clamp-3">{tutor.bio}</p>
                    )}

                    <Link href="/register" className="btn-primary w-full text-center block">
                      Book a Lesson
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Our Tutors */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Why Choose Our Tutors?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">&#x1F1E8;&#x1F1F4;</div>
              <h3 className="font-bold mb-2">Native Colombian Speakers</h3>
              <p className="text-gray-700">Clear, neutral accent ideal for learning</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">&#x1F393;</div>
              <h3 className="font-bold mb-2">Certified & Experienced</h3>
              <p className="text-gray-700">Professional educators with proven track records</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">&#x1F4A1;</div>
              <h3 className="font-bold mb-2">Personalized Approach</h3>
              <p className="text-gray-700">Lessons tailored to your goals and learning style</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">&#x1F31F;</div>
              <h3 className="font-bold mb-2">Passionate Teachers</h3>
              <p className="text-gray-700">Enthusiastic about sharing language and culture</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-spicy-red text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Start Learning with the Best</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join Spicy Spanish today and begin your personalized Spanish learning journey with our expert tutors.
          </p>
          <Link href="/register" className="bg-white text-spicy-red font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors">
            Get Started Now
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
