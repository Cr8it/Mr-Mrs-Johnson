"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useState, useEffect } from "react"

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  type: 'bridesmaid' | 'groomsman';
  order: number;
}

export default function DreamTeam() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/admin/bridal-party');
        const data = await response.json();
        if (data) {
          setTeamMembers(data);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };
    fetchTeamMembers();
  }, []);

  // Separate and sort bridesmaids and groomsmen
  const bridesmaids = teamMembers
    .filter(member => member.type === 'bridesmaid')
    .sort((a, b) => a.order - b.order);

  const groomsmen = teamMembers
    .filter(member => member.type === 'groomsman')
    .sort((a, b) => a.order - b.order);

  // Combine sorted lists
  const sortedMembers = [...bridesmaids, ...groomsmen];

  return (
    <section id="dream-team" className="py-24">
      <motion.h2
        className="text-5xl font-cormorant font-bold text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        The Dream Team
      </motion.h2>
      <p className="text-center mb-12 font-montserrat text-xl">
        Meet our lovely family and friends who will be by the side of the bride and groom on the big day.
      </p>
      {!teamMembers.length ? (
        <div className="text-center py-12">
          <p className="text-white/60">Loading team members...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sortedMembers.map((member, index) => (
            <motion.div
              key={member.id}
              className="bg-white bg-opacity-5 p-6 rounded-lg shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="relative w-40 h-40 mx-auto mb-4">
                <Image
                  src={member.imageUrl}
                  alt={member.name}
                  fill
                  className={`rounded-full object-cover border-4 ${
                    imageErrors[member.id] ? 'border-red-500' : 'border-gold'
                  }`}
                  onError={() => setImageErrors(prev => ({ ...prev, [member.id]: true }))}
                />
              </div>
              <h3 className="text-xl font-cormorant font-semibold text-center mb-2">{member.name}</h3>
              <p className="text-center text-gold mb-3 font-montserrat text-sm">{member.role}</p>
              <p className="text-center font-montserrat text-sm">{member.description}</p>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}

