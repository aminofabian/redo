'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, ChevronsLeft, ChevronsRight } from 'lucide-react';
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

// Separate component for the lightbox thumbnails to avoid conditional hook issues
const LightboxThumbnails = ({ 
  images, 
  currentIndex, 
  onThumbnailClick 
}: { 
  images: ProductImage[]; 
  currentIndex: number; 
  onThumbnailClick: (index: number, image: ProductImage) => void 
}) => {
  // Using useMemo to prevent unnecessary re-renders
  return useMemo(() => {
    if (images.length <= 1) return null;
    
    return (
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] p-2 bg-black bg-opacity-40 rounded-lg backdrop-blur-sm">
        {images.map((image, index) => (
          <div 
            key={`lightbox-thumb-${image.id}`}
            className={`w-16 h-12 relative rounded-md overflow-hidden cursor-pointer transition-opacity duration-200 ${
              currentIndex === index ? 'ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onThumbnailClick(index, image);
            }}
          >
            <Image 
              src={image.url}
              alt={image.alt || `Thumbnail ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
    );
  }, [images, currentIndex, onThumbnailClick]);
};

export default function ProductImageGallery({ images, productTitle }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);

  // Function to check if scrolling controls should be visible (with debounce built-in)
  const checkScrollControls = useCallback(() => {
    if (thumbnailsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = thumbnailsContainerRef.current;
      // Add a buffer to prevent flickering when near boundaries
      const hasLeftScroll = scrollLeft > 10;
      const hasRightScroll = scrollLeft < scrollWidth - clientWidth - 20; // Increased buffer
      
      // Only update state if values actually changed (prevents unnecessary rerenders)
      if (hasLeftScroll !== showLeftScroll) {
        setShowLeftScroll(hasLeftScroll);
      }
      if (hasRightScroll !== showRightScroll) {
        setShowRightScroll(hasRightScroll);
      }
    }
  }, [showLeftScroll, showRightScroll]);
  
  // Debounced version of scroll check
  const debouncedScrollCheck = useCallback(() => {
    // Using setTimeout as a simple debounce mechanism
    clearTimeout((thumbnailsContainerRef.current as any)?.scrollTimer);
    (thumbnailsContainerRef.current as any).scrollTimer = setTimeout(() => {
      checkScrollControls();
    }, 100); // 100ms debounce
  }, [checkScrollControls]);

  // Initialize scroll controls check
  useEffect(() => {
    checkScrollControls();
    window.addEventListener('resize', debouncedScrollCheck);
    return () => {
      window.removeEventListener('resize', debouncedScrollCheck);
      clearTimeout((thumbnailsContainerRef.current as any)?.scrollTimer);
    };
  }, [debouncedScrollCheck, images]);

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

    // Scroll the thumbnail into view
    scrollToThumbnail(nextIndex);
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    setSelectedImage(images[prevIndex]);
    setZoomLevel(1); // Reset zoom

    // Scroll the thumbnail into view
    scrollToThumbnail(prevIndex);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(Math.min(zoomLevel + 0.5, 3)); // Max zoom 3x
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(Math.max(zoomLevel - 0.5, 1)); // Min zoom 1x
  };

  // Scroll the thumbnails container
  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (!thumbnailsContainerRef.current) return;
    
    const scrollAmount = thumbnailsContainerRef.current.clientWidth / 2;
    const newScrollLeft = direction === 'left' 
      ? thumbnailsContainerRef.current.scrollLeft - scrollAmount
      : thumbnailsContainerRef.current.scrollLeft + scrollAmount;
    
    thumbnailsContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
    
    // Update scroll controls after scrolling
    setTimeout(checkScrollControls, 300);
  };

  // Scroll to make a specific thumbnail visible
  const scrollToThumbnail = (index: number) => {
    if (!thumbnailsContainerRef.current) return;
    
    const thumbnailElements = thumbnailsContainerRef.current.querySelectorAll('.thumbnail-item');
    if (index >= 0 && index < thumbnailElements.length) {
      const thumbnail = thumbnailElements[index] as HTMLElement;
      const containerLeft = thumbnailsContainerRef.current.scrollLeft;
      const containerRight = containerLeft + thumbnailsContainerRef.current.clientWidth;
      const thumbnailLeft = thumbnail.offsetLeft;
      const thumbnailRight = thumbnailLeft + thumbnail.offsetWidth;
      
      if (thumbnailLeft < containerLeft) {
        thumbnailsContainerRef.current.scrollTo({
          left: thumbnailLeft - 10,
          behavior: 'smooth'
        });
      } else if (thumbnailRight > containerRight) {
        thumbnailsContainerRef.current.scrollTo({
          left: thumbnailRight - thumbnailsContainerRef.current.clientWidth + 10,
          behavior: 'smooth'
        });
      }
      
      setTimeout(checkScrollControls, 300);
    }
  };

  // Main gallery display
  return (
    <div className="product-gallery-container">
      {/* Main product image with enhanced overlay effects */}
      <div 
        className="aspect-video relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer group transition-all duration-300 hover:shadow-xl hover:border-blue-500"
        onClick={() => images.length > 0 && handleImageClick(images[0], 0)}
      >
        {images.length > 0 ? (
          <>
            <Image 
              src={images.find(img => img.isPrimary)?.url || images[0].url}
              alt={images[0].alt || productTitle}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Enhanced text overlay with product title */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Product title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <h3 className="text-white font-medium text-lg mb-1 drop-shadow-md">{productTitle}</h3>
              <p className="text-white/80 text-sm truncate max-w-full drop-shadow-md">Click to view all {images.length} images</p>
            </div>
            
            {/* Preview indicator with subtle animation */}
            <div className="absolute top-3 right-3 bg-blue-600 bg-opacity-80 text-white text-xs px-3 py-1 rounded-full shadow-lg backdrop-blur-sm transform scale-90 group-hover:scale-100 opacity-70 group-hover:opacity-100 transition-all duration-300">
              <span>View Gallery</span>
            </div>
            
            {/* Subtle image counter badge */}
            {images.length > 1 && (
              <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm transform group-hover:scale-110 transition-transform duration-300">
                {images.length} images
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No image available</p>
          </div>
        )}
        
        {/* Removed redundant indicator as we've added a better one above */}
      </div>

      {/* Enhanced thumbnail gallery with scroll controls */}
      {images.length > 1 && (
        <div className="mt-4 relative bg-gradient-to-r from-gray-50 via-white to-gray-50 p-1 rounded-lg border border-gray-100 shadow-sm">
          {/* Left scroll button - with enhanced visibility and hover effect */}
          <motion.button 
            className={`absolute -left-2 top-1/2 transform -translate-y-1/2 z-10 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md rounded-full p-2.5 transition-opacity duration-300 hover:scale-110 ${showLeftScroll ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => scrollThumbnails('left')}
            aria-label="Scroll left"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: -5 }}
            animate={{ x: showLeftScroll ? 0 : -5 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronsLeft size={22} className="text-white drop-shadow-sm" />
          </motion.button>
          
          {/* Thumbnails container - scrollable with enhanced styling */}
          <div 
            ref={thumbnailsContainerRef}
            className="flex overflow-x-auto gap-3 py-3 px-2 scrollbar-hide snap-x scroll-px-4 mask-gradient-x"
            onScroll={debouncedScrollCheck}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {images.map((image, index) => (
              <div 
                key={image.id} 
                className={`thumbnail-item flex-shrink-0 w-28 aspect-video relative rounded-md overflow-hidden snap-start cursor-pointer transform transition-all duration-200 ${
                  currentIndex === index 
                    ? 'ring-2 ring-blue-500 shadow-md scale-105 z-10' 
                    : 'border border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-105'
                }`}
                onClick={() => handleImageClick(image, index)}
              >
                <Image 
                  src={image.url}
                  alt={image.alt || `${productTitle} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {/* Text indicator for each thumbnail */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-1/2 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                
                {image.isPrimary ? (
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center">
                    <span className="text-white text-[10px] bg-blue-500 px-1.5 py-0.5 rounded-sm font-medium">Primary</span>
                  </div>
                ) : (
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center">
                    <span className="text-white/0 hover:text-white/90 text-[10px] px-1 py-0.5 transition-colors duration-200">{index + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Right scroll button - with enhanced visibility and hover effect */}
          <motion.button 
            className={`absolute -right-2 top-1/2 transform -translate-y-1/2 z-10 bg-gradient-to-l from-blue-600 to-blue-500 text-white shadow-md rounded-full p-2.5 transition-opacity duration-300 hover:scale-110 ${showRightScroll ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => scrollThumbnails('right')}
            aria-label="Scroll right"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: 5 }}
            animate={{ x: showRightScroll ? 0 : 5 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronsRight size={22} className="text-white drop-shadow-sm" />
          </motion.button>
          
          {/* Thumbnails counter badge */}
          <div className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
            {images.length} images
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
            className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
            onClick={handleClose}
          >
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-30 transition-colors backdrop-blur-sm"
              onClick={handleClose}
            >
              <X size={24} />
            </button>

            {/* Image count indicator - more visible and styled */}
            <div className="absolute top-4 left-4 bg-white bg-opacity-20 text-white px-3 py-1 rounded-full backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Navigation controls - enhanced and more visible */}
            {images.length > 1 && (
              <>
                <motion.button 
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-blue-500/30 transition-all backdrop-blur-sm"
                  onClick={handlePrevious}
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronLeft size={30} className="drop-shadow-md" />
                </motion.button>
                <motion.button 
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-blue-500/30 transition-all backdrop-blur-sm"
                  onClick={handleNext}
                  whileHover={{ scale: 1.1, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronRight size={30} className="drop-shadow-md" />
                </motion.button>
              </>
            )}

            {/* Zoom controls - more visible */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              <motion.button 
                className="bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-30 transition-colors backdrop-blur-sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ZoomOut size={24} />
              </motion.button>
              <motion.button 
                className="bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-30 transition-colors backdrop-blur-sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ZoomIn size={24} />
              </motion.button>
            </div>

            {/* Main image with zoom */}
            <motion.div
              className="relative w-full h-full flex items-center justify-center"
              initial={{ scale: 1 }}
              animate={{ scale: zoomLevel }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="relative">
                <Image 
                  src={selectedImage.url}
                  alt={selectedImage.alt || productTitle}
                  width={1200}
                  height={800}
                  className="max-h-[90vh] max-w-[90vw] object-contain"
                  priority
                />
                
                {/* Image caption/title overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-10 pb-4 px-6 opacity-70 hover:opacity-100 transition-opacity duration-300">
                  <h3 className="text-white font-medium text-lg">{productTitle}</h3>
                  <p className="text-white/90 text-sm">{selectedImage.alt || `Image ${currentIndex + 1} of ${images.length}`}</p>
                </div>
              </div>
            </motion.div>
            
            {/* Thumbnail navigation in lightbox using the separate component */}
            <LightboxThumbnails 
              images={images}
              currentIndex={currentIndex}
              onThumbnailClick={(index, image) => {
                setCurrentIndex(index);
                setSelectedImage(image);
                setZoomLevel(1);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Custom CSS for hiding scrollbars and creating scroll gradient mask */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Create gradient mask effect for thumbnail scrolling */
        .mask-gradient-x {
          mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
        }
      `}</style>
    </div>
  );
}