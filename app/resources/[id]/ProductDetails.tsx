"use client";

import { useState } from "react";
import { Star, BookOpen, Clock, Users, ChevronLeft, ChevronRight, Heart, Share2, ChevronRight as ChevronRightIcon, Shield, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ProductProps = {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    monthlyPrice: number;
    rating: string;
    reviews: number;
    type: string;
    duration: string;
    tags: string[];
    images: string[];
    questions?: string;
    chapters?: string;
  }
};

export default function ProductDetails({ product }: ProductProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const features = [
    { icon: BookOpen, title: "Study Material", description: product.type === "Practice Tests" ? `${product.questions}` : `${product.chapters || "15+ Chapters"}` },
    { icon: Clock, title: "Duration", description: product.duration },
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
        <span className="text-primary truncate">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2">
          {/* Image Gallery */}
          <div className="relative rounded-lg overflow-hidden mb-4">
            <img
              src={product.images[selectedImage]}
              alt={product.title}
              className="w-full aspect-video object-cover"
            />
            <button
              onClick={() => setSelectedImage(prev => (prev - 1 + product.images.length) % product.images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedImage(prev => (prev + 1) % product.images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Thumbnail Gallery */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {product.images.map((img, idx) => (
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
              <p className="text-muted-foreground">{product.description}</p>
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
                <span className="font-semibold">{product.rating}</span>
                <span className="text-muted-foreground">({product.reviews} reviews)</span>
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
                <div className="text-3xl font-bold">${product.price}</div>
                <div className="text-sm text-muted-foreground">
                  or ${product.monthlyPrice}/mo with payment plan
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>{product.duration}</span>
              </div>

              {product.questions && (
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>{product.questions}</span>
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