import HomeClient from "@/components/HomeClient";
import prisma from "@/lib/db";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
    },
    include: {
      images: true,
      categories: {
        include: {
          category: true
        }
      }
    },
    take: 6,
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeClient initialProducts={products} />
    </Suspense>
  );
}
