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
        Our Love Story
        </MotionH2>
        <div className="max-w-4xl mx-auto">
          <MotionDiv
            className="flex flex-col items-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="mx-auto mb-12">
              <Image
                src={images.couple.story1 || "/placeholder.svg"}
                alt="Jermaine and Sarah"
                width={500}
                height={700}
                className="rounded-lg shadow-2xl object-cover"
              />
            </div>
            <div className="font-montserrat text-lg leading-relaxed max-w-3xl">
              <p className="mb-4">
                Jermaine and Sarah first crossed paths at church—though neither realised the other had been there the whole time. Sarah was faithfully up front, while Jermaine held it down in the middle. Behind the scenes, Sarah's little sister was already plotting, quietly talking to Jermaine about her big sis and making casual introductions. Still, Sarah kept it cool (some might say stush!) and didn't make it easy.
              </p>
              <p className="mb-4">
                It wasn't until after a Beauty for Ashes event that Jermaine finally approached her properly. They chatted for a bit, and he asked for her number. Shortly after they met up and ended up talking for hours, and have spoken every day since.
              </p>
              <p className="mb-4">
                Their relationship has been built on faith, trust, and intentional love. Jermaine has protected Sarah's heart with the kind of care and love spoken of in Ephesians 5:25, and he's encouraged her spiritual growth in ways she never expected. In return, Sarah has been a safe place for his emotions and well-being, bringing peace and striving to reflect the heart of Proverbs 31:11-12.
              </p>
              <p>
                Together, they've built something beautiful—and this is just the beginning.
              </p>
            </div>
          </MotionDiv>
        </div>
    </section>
  )
}

