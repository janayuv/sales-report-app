import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import type { Page } from '../types/navigation';
import { SidebarProvider } from './ui/sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentPage,
  onPageChange,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      // Auto-close sidebar on mobile
      if (width < 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const handleSidebarToggle = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <Header onSidebarToggle={handleSidebarToggle} />

        {/* Main content area with sidebar */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={handleSidebarClose}
            currentPage={currentPage}
            onPageChange={onPageChange}
          />

          {/* Main content */}
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </SidebarProvider>
  );
};
