'use client';

import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '../components/MainLayout';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  imagePosition?: string;
  bio: string[];
  education?: string[];
  languages?: string;
  social?: { facebook?: string; instagram?: string };
}

const teamMembers: TeamMember[] = [
  {
    name: 'Carla Diaz',
    role: 'Founder, CEO & Lead Spanish Trainer',
    image: '/images/team/carla.png',
    social: {
      facebook: 'https://www.facebook.com/spicyspanish',
      instagram: 'https://www.instagram.com/spicyspanish_',
    },
    bio: [
      'Venezuelan-born petroleum engineer who discovered her passion for teaching Spanish after moving to Colombia. Founded "Spanish with Carla" in 2016, which evolved into Spicy Spanish in 2020.',
      'Having instructed hundreds of students worldwide, Carla participated in the Wone Internship Placement in Barcelona (2019), where she taught introductory Spanish to international students from Hong Kong.',
      'Carla combines linguistic expertise with cultural insights, creating an immersive and effective learning experience.',
    ],
  },
  {
    name: 'Melisa Arredondo Montoya',
    role: 'Senior Spanish Trainer',
    image: '/images/team/melisa.jpg',
    imagePosition: '25% 20%',
    bio: [
      'From Medell\u00edn, Colombia, Melisa — known as "la paisita" — has been teaching Spanish since 2017.',
      'She is known for her creative methods that simplify complex grammar concepts through real-life examples and vivid imagery. Passionate about cultural exchange, Melisa makes every lesson both educational and engaging.',
    ],
    education: [
      "Bachelor's in Spanish, University of Antioquia",
      'Diploma in Spanish as a Foreign Language Pedagogy, Caro y Cuervo Institute',
      "Pursuing Master's in Reading and Writing, EAFIT University",
    ],
  },
  {
    name: 'Stephanie Gil',
    role: 'Senior Spanish Trainer',
    image: '/images/team/stephanie.jpg',
    bio: [
      'A Colombian native, Stephanie has been teaching since 2017 and brings a unique background in media production for TV and radio.',
      'Having taught in public schools, community programs, and online/face-to-face settings since 2019, Stephanie infuses her lessons with Colombian culture and community service perspectives.',
    ],
    education: [
      "Bachelor's in English-Spanish, Pontificia Bolivariana University",
      'Diploma in Teaching Spanish as a Foreign Language',
      "Pursuing Master's in Didactics of Spanish as a Second/Foreign Language",
    ],
    languages: 'English, Spanish, basic German, Latin, Greek',
  },
  {
    name: 'Vanessa Chavez',
    role: 'Senior Spanish Trainer',
    image: '/images/team/vanessa.webp',
    bio: [
      'Vanessa has been teaching Spanish since 2013 and holds a degree in Spanish from the University of Antioquia.',
      'She has taught at Benkos Bioho pre-university, Preu PCN, and Toucan Spanish School (2018–2020). Vanessa is known for her creative use of multimedia resources — songs, interviews, and books — and facilitates language exchanges with native speakers.',
    ],
    education: ['Degree in Spanish, University of Antioquia'],
  },
  {
    name: 'Mauren Araya',
    role: 'Spanish Trainer',
    image: '/images/team/mauren.webp',
    bio: [
      'From Costa Rica, Mauren has been teaching since 2021 and joined Spicy Spanish in 2022.',
      'She prioritizes enjoyment and dynamic learning, creating a safe and engaging environment where students thrive. Self-motivated and adaptable, her teaching style evolves with each student\u2019s needs, and she brings authentic Costa Rican cultural insights to every lesson.',
    ],
  },
  {
    name: 'Daniela Gait\u00e1n',
    role: 'Spanish Trainer',
    image: '/images/team/daniela.jpg',
    bio: [
      'From Bogot\u00e1, Colombia, Daniela has been teaching since 2022. Bilingual in Spanish and English with two years living in Canada, she brings a global perspective to her lessons.',
      'Currently pursuing a Marketing and Business degree at the University of Palermo, Daniela integrates business perspectives into language instruction — particularly valuable for business Spanish students.',
    ],
    languages: 'Spanish, English, planning to learn French',
  },
];

export default function OurTeam() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-spicy-light to-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-spicy-dark text-center mb-6">
            Meet Our <span className="text-spicy-red">Team</span>
          </h1>
          <p className="text-lg md:text-xl text-center max-w-3xl mx-auto text-gray-700">
            Our passionate team of native Spanish speakers brings years of teaching experience,
            cultural knowledge, and creative methods to help you achieve your language goals.
          </p>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-16">
            {teamMembers.map((member, index) => (
              <div
                key={member.name}
                className={`flex flex-col ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } gap-8 items-center`}
              >
                {/* Photo */}
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                      style={member.imagePosition ? { objectPosition: member.imagePosition } : undefined}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="w-full md:w-2/3">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-spicy-dark mb-1">
                    {member.name}
                  </h2>
                  <p className="text-spicy-red font-semibold text-lg mb-2">{member.role}</p>

                  {member.social && (
                    <div className="flex gap-3 mb-4">
                      {member.social.facebook && (
                        <a
                          href={member.social.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-[#1877F2] transition-colors"
                          aria-label="Facebook"
                        >
                          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </a>
                      )}
                      {member.social.instagram && (
                        <a
                          href={member.social.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-[#E4405F] transition-colors"
                          aria-label="Instagram"
                        >
                          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 text-gray-700 leading-relaxed">
                    {member.bio.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>

                  {member.education && (
                    <div className="mt-4">
                      <h3 className="font-bold text-spicy-dark mb-2">Education</h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        {member.education.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {member.languages && (
                    <p className="mt-3 text-gray-600">
                      <span className="font-semibold text-spicy-dark">Languages:</span>{' '}
                      {member.languages}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-spicy-red text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Start Learning with Us</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join Spicy Spanish today and begin your personalized Spanish learning journey with our
            expert team.
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
