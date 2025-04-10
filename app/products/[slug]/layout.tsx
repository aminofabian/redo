import { Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#5C7CFA'
};

export default function ResourceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 