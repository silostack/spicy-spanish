'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '../components/MainLayout';

const tutors = [
  {
    id: 1,
    name: 'Maria González',
    image: '/images/tutor1.jpg',
    specialty: 'Conversational Spanish',
    experience: '8 years',
    rating: 4.9,
    reviews: 142,
    bio: 'Native Colombian tutor specializing in conversational Spanish and business communication. I love helping students gain confidence in real-world Spanish conversations.',
    languages: ['Spanish (Native)', 'English (Fluent)'],
    availability: 'Mon-Fri, 9am-5pm EST'
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    image: '/images/tutor2.jpg',
    specialty: 'Business Spanish',
    experience: '6 years',
    rating: 4.8,
    reviews: 98,
    bio: 'Expert in business Spanish and professional communication. I help professionals excel in Spanish-speaking business environments.',
    languages: ['Spanish (Native)', 'English (Advanced)', 'Portuguese (Basic)'],
    availability: 'Flexible schedule'
  },
  {
    id: 3,
    name: 'Ana Lucia Mendez',
    image: '/images/tutor3.jpg',
    specialty: 'Spanish for Beginners',
    experience: '10 years',
    rating: 5.0,
    reviews: 256,
    bio: 'Patient and enthusiastic teacher specializing in beginners. I make learning Spanish fun and accessible for everyone!',
    languages: ['Spanish (Native)', 'English (Fluent)'],
    availability: 'All days, flexible hours'
  },
  {
    id: 4,
    name: 'Diego Martinez',
    image: '/images/tutor4.jpg',
    specialty: 'DELE Preparation',
    experience: '7 years',
    rating: 4.9,
    reviews: 87,
    bio: 'DELE certified examiner with extensive experience preparing students for Spanish proficiency exams.',
    languages: ['Spanish (Native)', 'English (Advanced)', 'French (Intermediate)'],
    availability: 'Tue-Sat, 10am-7pm EST'
  },
  {
    id: 5,
    name: 'Isabella Torres',
    image: '/images/tutor5.jpg',
    specialty: 'Spanish Literature & Culture',
    experience: '5 years',
    rating: 4.7,
    reviews: 63,
    bio: 'Literature enthusiast who brings Spanish culture alive through stories, poetry, and cultural discussions.',
    languages: ['Spanish (Native)', 'English (Fluent)', 'Italian (Basic)'],
    availability: 'Mon-Thu, 2pm-8pm EST'
  },
  {
    id: 6,
    name: 'Javier Morales',
    image: '/images/tutor6.jpg',
    specialty: 'Medical Spanish',
    experience: '9 years',
    rating: 4.8,
    reviews: 74,
    bio: 'Specialized in medical Spanish for healthcare professionals. Former medical interpreter with real-world experience.',
    languages: ['Spanish (Native)', 'English (Fluent)'],
    availability: 'Weekdays, evening sessions available'
  }
];

export default function Tutors() {
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const specialties = ['All', 'Conversational Spanish', 'Business Spanish', 'Spanish for Beginners', 'DELE Preparation', 'Spanish Literature & Culture', 'Medical Spanish'];

  const filteredTutors = tutors.filter(tutor => {
    const matchesSpecialty = selectedSpecialty === 'All' || tutor.specialty === selectedSpecialty;
    const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tutor.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tutor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
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
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search tutors..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-spicy-red"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {specialties.map(specialty => (
                <button
                  key={specialty}
                  onClick={() => setSelectedSpecialty(specialty)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    selectedSpecialty === specialty
                      ? 'bg-spicy-red text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tutors Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTutors.map(tutor => (
              <div key={tutor.id} className="card hover:shadow-xl transition-shadow">
                <div className="relative h-48 bg-gradient-to-br from-spicy-light to-spicy-yellow rounded-t-lg flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center text-4xl">
                    👨‍🏫
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{tutor.name}</h3>
                  <p className="text-spicy-red font-medium mb-2">{tutor.specialty}</p>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <span>📚 {tutor.experience}</span>
                    <span>⭐ {tutor.rating} ({tutor.reviews} reviews)</span>
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-3">{tutor.bio}</p>
                  
                  <div className="mb-4">
                    <p className="font-semibold text-sm mb-1">Languages:</p>
                    <p className="text-sm text-gray-600">{tutor.languages.join(', ')}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="font-semibold text-sm mb-1">Availability:</p>
                    <p className="text-sm text-gray-600">{tutor.availability}</p>
                  </div>
                  
                  <Link href="/register" className="btn-primary w-full text-center">
                    Book a Lesson
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Our Tutors */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Why Choose Our Tutors?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🇨🇴</div>
              <h3 className="font-bold mb-2">Native Colombian Speakers</h3>
              <p className="text-gray-700">Clear, neutral accent ideal for learning</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="font-bold mb-2">Certified & Experienced</h3>
              <p className="text-gray-700">Professional educators with proven track records</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="font-bold mb-2">Personalized Approach</h3>
              <p className="text-gray-700">Lessons tailored to your goals and learning style</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🌟</div>
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