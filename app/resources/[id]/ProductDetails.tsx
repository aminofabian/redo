"use client";

import { useState } from "react";
import { Star, BookOpen, Clock, Users, ChevronLeft, ChevronRight, Heart, Share2, ChevronRight as ChevronRightIcon, Shield, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { nursingResources } from "@/lib/data";

const productGalleries: Record<string, string[]> = {
  "nclex-rn-complete-prep-package": [
    "/categories/sincerely-media--IIIr1Hu6aY-unsplash.jpg",
    "/categories/element5-digital-OyCl7Y4y0Bk-unsplash.jpg",
    "/categories/paul-felberbauer-QL7iY3G24z4-unsplash.jpg",
    "/categories/marissa-grootes-flRm0z3MEoA-unsplash.jpg",
  ],
  "fundamentals-of-nursing-study-guide": [
    "/categories/hush-naidoo-jade-photography-eKNswc0Qxz8-unsplash.jpg",
    "/categories/national-cancer-institute-NFvdKIhxYlU-unsplash.jpg",
    "/categories/owen-beard-DK8jXx1B-1c-unsplash.jpg",
    "/categories/tony-luginsland-qS1bDAxxAYg-unsplash.jpg",
  ],
  "specialized-medical-surgical-nursing-test-preparation": [
    "/categories/national-cancer-institute-NFvdKIhxYlU-unsplash.jpg",
    "/categories/fahrul-azmi-cFUZ-6i83vs-unsplash.jpg",
    "/categories/julia-taubitz-6JUYocDPaZo-unsplash.jpg",
    "/categories/alexander-grey-eMP4sYPJ9x0-unsplash.jpg",
  ],
};

const productDescriptions: Record<string, string> = {
  "nclex-rn-complete-prep-package": "Our comprehensive NCLEX-RN preparation package includes over 2000 practice questions, detailed explanations, and performance tracking. Perfect for nursing students preparing for their licensure examination.",
  "fundamentals-of-nursing-study-guide": "Master the core concepts of nursing with our comprehensive fundamentals guide. Covers patient care, clinical procedures, and essential nursing theory with real-world examples and case studies.",
  "specialized-medical-surgical-nursing-test-preparation": "Specialized Medical-Surgical nursing test preparation with focus on adult health nursing, critical thinking skills, and NCLEX-style questions. Includes detailed rationales and study strategies.",
};

export default function ProductDetails({ params }: { params: { id: string } }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const resourceId = params.id;
  const resource = nursingResources.find(r => r.id === resourceId);

  if (!resource) {
    return <div>Resource not found</div>;
  }

  const images = productGalleries[resourceId as keyof typeof productGalleries];
  const description = productDescriptions[resourceId as keyof typeof productDescriptions];

  const features = [
    { icon: BookOpen, title: "Study Material", description: resource.type === "Practice Tests" ? `${resource.questions}` : `${resource.chapters || "15+ Chapters"}` },
    { icon: Clock, title: "Duration", description: resource.duration },
    { icon: Users, title: "Expert Support", description: "24/7 instructor assistance" },
    { icon: Star, title: "Certificate", description: "Course completion certificate" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/" className="text-muted-foreground hover:text-primary">Home</Link>
        <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
        <Link href="/resources" className="text-muted-foreground hover:text-primary">Resources</Link>
        <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-primary truncate">{resource.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2">
          {/* Image Gallery */}
          <div className="relative rounded-lg overflow-hidden mb-4">
            <img
              src={images[selectedImage]}
              alt={resource.title}
              className="w-full aspect-video object-cover"
            />
            <button
              onClick={() => setSelectedImage(prev => (prev - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedImage(prev => (prev + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Thumbnail Gallery */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`rounded-lg overflow-hidden border-2 ${
                  selectedImage === idx ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img src={img} alt="" className="w-full aspect-video object-cover" />
              </button>
            ))}
          </div>

          {/* Course Details */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Course Overview</h2>
              <p className="text-muted-foreground">{description}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">What's Included</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Pricing and Actions */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{resource.rating}</span>
                <span className="text-muted-foreground">({resource.reviews} reviews)</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <div className="text-3xl font-bold">${resource.price}</div>
                <div className="text-sm text-muted-foreground">
                  or ${resource.monthlyPrice}/mo with payment plan
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>{resource.duration}</span>
              </div>

              {resource.questions && (
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>{resource.questions}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button className="w-full">Enroll Now</Button>
              <Button variant="outline" className="w-full">Add to Cart</Button>
            </div>

            {/* Contact Section */}
            <div className="mt-8 border-t pt-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-primary mb-2">Have Questions?</h3>
                <p className="text-sm text-muted-foreground">
                  Our nursing education specialists are here to help you choose the right study materials for your NCLEX preparation.
                </p>
              </div>

              <form className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1">
                    Message (Optional)
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    placeholder="I'm interested in NCLEX preparation materials..."
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <Button className="w-full bg-gradient-to-r from-primary to-primary/80">
                  Get Study Recommendations
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <span>Access to 2000+ practice questions</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <span>Instant digital delivery</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <span>Used by 50,000+ nursing students</span>
                </div>
              </div>
            </div>

            {/* Add a trust banner */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>30-Day Money Back</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Instant Download</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 