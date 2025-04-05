export interface NursingResource {
  id: string;
  title: string;
  rating: number;
  reviews: number;
  type: string;
  duration: string;
  questions?: string;
  chapters?: string;
  price: number;
  monthlyPrice: number;
  image: string;
  tags: string[];
}

export const nursingResources: NursingResource[] = [
  {
    id: "nclex-rn-complete-prep-package",
    title: "NCLEX-RN Complete Prep Package",
    rating: 4.8,
    reviews: 156,
    type: "Practice Tests",
    duration: "6 months access",
    questions: "2000+ Questions",
    price: 199,
    monthlyPrice: 33,
    image: "/categories/sincerely-media--IIIr1Hu6aY-unsplash.jpg",
    tags: ["NCLEX-RN", "Premium"]
  },
  {
    id: "fundamentals-of-nursing-study-guide",
    title: "Fundamentals of Nursing Study Guide",
    rating: 4.9,
    reviews: 89,
    type: "Study Material",
    duration: "Lifetime access",
    chapters: "15 Chapters",
    price: 149,
    monthlyPrice: 25,
    image: "/categories/hush-naidoo-jade-photography-eKNswc0Qxz8-unsplash.jpg",
    tags: ["Fundamentals", "Bestseller"]
  },
  // ... copy all other resources from your original file
]; 