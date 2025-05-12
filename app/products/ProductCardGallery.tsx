'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ProductImageProps = {
  images: Array<{
    id: string;
    url: string;
    alt?: string | null;
    isPrimary?: boolean;
  }>;
  title: string;
  className?: string;
  aspectRatio?: 'square' | 'video';
  priority?: boolean;
};

export default function ProductCardGallery({ 
  images, 
  title, 
  className = '', 
  aspectRatio = 'square',
  priority = false
}: ProductImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Start with primary image if available
  useEffect(() => {
    const primaryIndex = images.findIndex(img => img.isPrimary);
    if (primaryIndex !== -1) {
      setCurrentIndex(primaryIndex);
    }
  }, [images]);

  // If no images, use placeholder
  if (!images.length) {
    return (
      <div 
        className={`relative ${className} ${aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'} bg-gray-100 flex items-center justify-center`}
      >
        <span className="text-gray-400">No image</span>
      </div>
    );
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((currentIndex + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((currentIndex - 1 + images.length) % images.length);
  };

  return (
    <div 
      className={`relative ${className} ${aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'} bg-gray-100 overflow-hidden`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <img
        src={images[currentIndex]?.url || '/placeholder-image.jpg'}
        alt={images[currentIndex]?.alt || title}
        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        loading={priority ? "eager" : "lazy"}
      />
      
      {/* Only show arrows when hovering and there are multiple images */}
      {isHovering && images.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}
