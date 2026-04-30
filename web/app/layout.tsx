import type { Metadata } from 'next';
import './globals.css';

// Removed TerminalOS as it is now integrated into Workspace3D via texture

export const metadata: Metadata = {
  title: 'Marc Saad-Hadidi | Software Engineering Portfolio',
  description: 'Interactive portfolio of Marc Saad-Hadidi, software engineering student in Montreal.',
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
