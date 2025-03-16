"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { images } from "../config/images"

const MotionH2 = motion.h2
const MotionDiv = motion.div

export default function OurStory() {
  return (
    <section id="our-story" className="py-24">
        <MotionH2
        className="text-5xl font-cormorant font-bold text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        >
        Our Love Story - A Divine Connection
        </MotionH2>
        <div className="max-w-4xl mx-auto">
        <MotionDiv
          className="flex flex-col md:flex-row items-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Image
            src={images.couple.story1 || "/placeholder.svg"}
            alt="Couple Photo 1"
            width={400}
            height={600}
            className="rounded-lg shadow-2xl mb-8 md:mb-0 md:mr-8 object-cover"
          />
          <div className="font-montserrat text-lg leading-relaxed">
            <p className="mb-4">
              Jermaine and Sarah first crossed paths at church, though at the time, neither knew the other was there. It
              was as if God was keeping them hidden from one another until the perfect moment arrived. Their first real
              connection came after a Beauty for Ashes event, when Jermaine approached Sarah and asked for her number.
            </p>
            <p>
              When they finally had their first proper conversation, it turned into a five- or six-hour exchange in the
              car—and they could've easily gone on for much longer. Neither of them was interested in dating for
              dating's sake, so they dove into meaningful discussions that covered everything from the serious—like
              finances and emotional triggers—to the fun—like hobbies, music, and playful banter. It felt as though they
              were discovering one another in a way only God could orchestrate.
            </p>
            </div>
          </MotionDiv>
            <MotionDiv
            className="flex flex-col md:flex-row-reverse items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >

          <Image
            src={images.couple.story2 || "/placeholder.svg"}
            alt="Couple Photo 2"
            width={400}
            height={600}
            className="rounded-lg shadow-2xl mb-8 md:mb-0 md:ml-8 object-cover"
          />
          <div className="font-montserrat text-lg leading-relaxed">
            <p className="mb-4">
              Above all, their conversations centered around faith and God's principles. Jermaine has always protected
              Sarah's heart with the care commanded in Ephesians 5:25, and he has challenged her to grow spiritually in
              ways she never anticipated. In return, Sarah has made it her mission to care for his emotions and
              well-being, as Proverbs 31:11-12 encourages: "The heart of her husband safely trusts her; So he will have
              no lack of gain. She does him good and not evil All the days of her life."
            </p>
            <p>
              Their relationship has been a beautiful journey of learning, laughing, and growing together in faith. They
              know without a doubt that God brought them together—not just for companionship, but for partnership in
              purpose. They are truly grateful for the path He's leading them down.
            </p>
            </div>
          </MotionDiv>
          </div>
        </section>
        )
      }

