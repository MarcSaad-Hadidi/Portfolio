import type { Metadata } from 'next';
import './globals.css';
import Workspace3D from '@/components/Workspace3D';

// Removed TerminalOS as it is now integrated into Workspace3D via texture

export const metadata: Metadata = {
  title: 'John Doe | Creative Developer',
  description: 'Interactive Portfolio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black overflow-hidden h-screen w-screen text-white">
        {children}
      </body>
    </html>
  );
}
