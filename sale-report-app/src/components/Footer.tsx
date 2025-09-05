import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-background/80 backdrop-blur">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 Sales Report App. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button className="hover:text-foreground transition-colors">
              Privacy Policy
            </button>
            <button className="hover:text-foreground transition-colors">
              Terms of Service
            </button>
            <button className="hover:text-foreground transition-colors">
              Support
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
