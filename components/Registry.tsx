"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Heart, Gift } from "lucide-react"

const MotionH2 = motion.h2
const MotionDiv = motion.div
const MotionP = motion.p

export default function Registry() {
  return (
    <section id="registry" className="py-32 relative">
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Decorative elements */}
        <div className="absolute -left-4 md:-left-12 top-1/4 w-8 h-8 opacity-20">
          <Heart className="w-full h-full text-gold" />
        </div>
        <div className="absolute -right-4 md:-right-12 top-1/2 w-8 h-8 opacity-20">
          <Gift className="w-full h-full text-gold" />
        </div>
        
        <MotionH2
          className="text-5xl font-cormorant font-bold text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Registry
        </MotionH2>
        
        <MotionDiv
          className="text-center space-y-6 relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {/* Decorative line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-12 bg-gradient-to-b from-transparent via-gold/50 to-transparent"></div>
          
          <MotionP className="font-montserrat text-lg leading-relaxed">
            We're so grateful to have you share this precious moment with us, and your presence at our wedding is the gift.
          </MotionP>
          <MotionP className="font-montserrat text-lg leading-relaxed">
            However, for those of you who do wish to bless us with a monetary contribution we will not block that blessing 🙌🏾
          </MotionP>
          <MotionP className="font-montserrat text-lg leading-relaxed mb-10">
            Thank you for your love and support 💕
          </MotionP>
          
          <MotionDiv
            className="bg-black/30 border border-white/10 hover:border-gold/30 rounded-2xl p-8 transition-all duration-300 hover:bg-black/40 hover:shadow-xl hover:shadow-gold/5 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link 
              href="https://paypal.me/sairwedsjay?country.x=GB&locale.x=en_GB"
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#0070ba] flex items-center justify-center mb-4 group-hover:shadow-md group-hover:shadow-gold/20 transition-all">
                  <span className="text-white font-bold text-2xl">PP</span>
                </div>
                <span className="text-2xl font-cormorant font-semibold text-white group-hover:text-gold transition-colors">
                  PayPal Gift
                </span>
              </div>
              <div className="mt-4 font-montserrat text-sm text-white/80 group-hover:text-white transition-colors">
                Click here to send a gift via PayPal
              </div>
            </Link>
          </MotionDiv>
        </MotionDiv>
      </div>
    </section>
  )
} 