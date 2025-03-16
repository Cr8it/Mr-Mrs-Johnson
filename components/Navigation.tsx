"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Menu, X } from "lucide-react"

const MotionNav = motion.nav
const MotionLi = motion.li
const MotionDiv = motion.div

interface NavigationProps {
  onRSVPClick: () => void;
}

export default function Navigation({ onRSVPClick }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: "smooth" })
      setIsMobileMenuOpen(false)
    }
  }

  const handleRSVPClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRSVPClick();
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { name: "Our Story", href: "#our-story" },
    { name: "Schedule", href: "#schedule" },
    { name: "Dream Team", href: "#dream-team" },
    { name: "Photo Gallery", href: "#photo-gallery" },
    { name: "RSVP", href: "#", onClick: handleRSVPClick }
  ]

  return (
    <MotionNav
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
        ? "bg-black/90 py-4 shadow-lg" 
        : "bg-gradient-to-b from-black/50 to-transparent py-6"
        }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="font-cormorant text-2xl font-bold tracking-wider"
          >
            S & J
          </Link>

            {/* Desktop Menu */}
            <ul className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <MotionLi
              key={item.name}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              >
              <Link
                href={item.href}
                className="font-montserrat text-sm tracking-wider hover:text-gold transition-all relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-0 after:bg-gold after:transition-all hover:after:w-full"
                onClick={(e) => item.onClick ? item.onClick(e) : handleClick(e, item.href)}
              >
                {item.name}
              </Link>
              </MotionLi>
            ))}
            </ul>


          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
                className="md:hidden bg-black/95 mt-4 rounded-lg border border-white/10"
            >
              <div className="py-4 px-4">
                <ul className="flex flex-col space-y-4">
                  {navItems.map((item) => (
                  <li key={item.name}>
                    <Link
                    href={item.href}
                    className="font-montserrat text-sm tracking-wider block py-2 hover:text-gold transition-colors"
                    onClick={(e) => item.onClick ? item.onClick(e) : handleClick(e, item.href)}
                    >
                    {item.name}
                    </Link>
                  </li>
                  ))}
                </ul>

              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </MotionNav>
  );
}

