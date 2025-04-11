'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type ProductImage = {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary?: boolean;
};

interface ProductImageGalleryProps {
  images: ProductImage[];
  productTitle: string;
}

export default function ProductImageGallery({ images, productTitle }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleImageClick = (image: ProductImage, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
    setZoomLevel(1); // Reset zoom when opening a new image
  };

  const handleClose = () => {
    setSelectedImage(null);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setSelectedImage(images[nextIndex]);
    setZoomLevel(1); // Reset zoom
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    setSelectedImage(images[prevIndex]);
    setZoomLevel(1); // Reset zoom
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(Math.min(zoomLevel + 0.5, 3)); // Max zoom 3x
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(Math.max(zoomLevel - 0.5, 1)); // Min zoom 1x
  };

  // Main gallery display
  return (
    <>
      {/* Main product image */}
      <div 
        className="aspect-video relative rounded-md overflow-hidden border bg-gray-50 cursor-pointer transition-transform hover:shadow-lg hover:border-blue-300"
        onClick={() => images.length > 0 && handleImageClick(images[0], 0)}
      >
        {images.length > 0 ? (
          <Image 
            src={images.find(img => img.isPrimary)?.url || images[0].url}
            alt={images[0].alt || productTitle}
            fill
            className="object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No image available</p>
          </div>
        )}
        
        {images.length > 0 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
            Click to expand
          </div>
        )}
      </div>

      {/* Thumbnail gallery */}
      {images.length > 1 && (
        <div className="mt-4">
          <div className="grid grid-cols-4 gap-2">
            {images.map((image, index) => (
              <div 
                key={image.id} 
                className={`aspect-video relative rounded-md overflow-hidden border cursor-pointer ${
                  image.isPrimary ? 'ring-2 ring-blue-500' : 'hover:border-blue-300'
                }`}
                onClick={() => handleImageClick(image, index)}
              >
                <Image 
                  src={image.url}
                  alt={image.alt || productTitle}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
            onClick={handleClose}
          >
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
              onClick={handleClose}
            >
              <X size={24} />
            </button>

            {/* Navigation controls */}
            {images.length > 1 && (
              <>
                <button 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                  onClick={handlePrevious}
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                  onClick={handleNext}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Zoom controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              <button 
                className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
              >
                <ZoomOut size={24} />
              </button>
              <button 
                className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
              >
                <ZoomIn size={24} />
              </button>
            </div>

            {/* Image counter */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Main image */}
            <motion.div
              className="relative w-full h-full flex items-center justify-center"
              initial={{ scale: 1 }}
              animate={{ scale: zoomLevel }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Image 
                src={selectedImage.url}
                alt={selectedImage.alt || productTitle}
                width={1200}
                height={800}
                className="max-h-[90vh] max-w-[90vw] object-contain"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 