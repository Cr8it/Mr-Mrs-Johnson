"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import Link from "next/link"

const MotionH2 = motion.h2
const MotionDiv = motion.div

interface QuestionProps {
  question: string
  answer: React.ReactNode
}

const AccordionItem = ({ question, answer }: QuestionProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        className="w-full py-6 flex justify-between items-center text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h3 className="font-cormorant text-2xl font-medium">{question}</h3>
        <ChevronDown
          className={`h-5 w-5 text-gold transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ 
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
          marginBottom: isOpen ? 16 : 0
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="font-montserrat text-lg leading-relaxed pb-2 text-white/80">
          {answer}
        </div>
      </motion.div>
    </div>
  )
}

export default function QandA() {
  const questions = [
    {
      question: "When is the RSVP deadline?",
      answer: "Sunday 22nd June 2025"
    },
    {
      question: "Can I bring a plus 1?",
      answer: "Only named invitees will be able to attend. As much as we love your little ones, this also includes children."
    },
    {
      question: "Is there parking?",
      answer: "There is ample free parking on site"
    },
    {
      question: "Is there a bar?",
      answer: "There is a cashless bar so leave the coin purse at home 🤭"
    },
    {
      question: "Do you have a wedding registry?",
      answer: (
        <>
          Yes! Monetary gifts can be made using the{" "}
          <Link 
            href="https://paypal.me/sairwedsjay?country.x=GB&locale.x=en_GB" 
            className="text-gold hover:text-gold/80 underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            PayPal link
          </Link>
          {" "}in our Registry section.
        </>
      )
    }
  ]

  return (
    <section id="qanda" className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionH2
          className="text-5xl font-cormorant font-bold text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Q&A
        </MotionH2>
        
        <MotionDiv
          className="bg-black/30 border border-white/10 hover:border-gold/30 rounded-2xl p-8 transition-all duration-300 hover:bg-black/40 hover:shadow-xl hover:shadow-gold/5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="divide-y divide-white/10">
            {questions.map((q, index) => (
              <AccordionItem 
                key={index}
                question={q.question} 
                answer={q.answer} 
              />
            ))}
          </div>
        </MotionDiv>
      </div>
    </section>
  )
} 