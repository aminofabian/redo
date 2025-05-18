import { redirect } from 'next/navigation';

export default function StorePage() {
  // Redirect to the products page which has the same functionality
  // This is a simple way to handle the missing "/store" route referenced in quick-actions
  redirect('/products');
}
