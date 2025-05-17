"use client";

import { revalidatePath } from 'next/cache';
import { useRouter } from 'next/navigation';

export default function RefreshButton() {
  const router = useRouter();
  
  return (
    <button 
      className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
      onClick={() => {
        router.refresh();
      }}
    >
      Refresh
    </button>
  );
} 