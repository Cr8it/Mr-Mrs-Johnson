"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface GalleryImage {
  id: string
  url: string
  alt: string
}

const MotionH2 = motion.h2
const MotionDiv = motion.div

export default function PhotoGallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const displayedImages = showAll ? images : images.slice(0, 6)
  const hasMoreImages = images.length > 6

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/admin/gallery')
        const data = await response.json()
        if (data.success) {
          setImages(data.images)
        }
      } catch (error) {
        console.error('Error fetching images:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image)
  }

  const handleClose = () => {
    setSelectedImage(null)
  }

  if (loading) {
    return (
      <section id="photo-gallery" className="py-24">
        <MotionH2
          className="text-5xl font-cormorant font-bold text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Our Journey in Pictures
        </MotionH2>
        <div className="text-center text-gray-500">Loading gallery...</div>
      </section>
    )
  }

  return (
    <section id="photo-gallery" className="py-24">
      <MotionH2
        className="text-5xl font-cormorant font-bold text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        Our Journey in Pictures
      </MotionH2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedImages.map((image, index) => (
          <MotionDiv
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="cursor-pointer aspect-[4/3] relative"
            onClick={() => handleImageClick(image)}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              className="rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 object-cover"
            />
          </MotionDiv>
        ))}
      </div>

      {hasMoreImages && (
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-3 bg-gold text-white rounded-lg font-montserrat text-sm transition-transform hover:scale-105"
          >
            {showAll ? 'Show Less' : `See More (${images.length - 6} more)`}
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedImage && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={handleClose}
          >
            <MotionDiv
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-5xl w-full aspect-[4/3]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage.url}
                alt={selectedImage.alt}
                fill
                className="rounded-lg object-contain"
              />
              <button
                className="absolute top-4 right-4 text-white text-4xl hover:text-gold transition-colors"
                onClick={handleClose}
              >
                &times;
              </button>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </section>
  )
} 