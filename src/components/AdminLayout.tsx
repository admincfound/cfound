import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <main className="pt-6">
        {children}
      </main>
    </div>
  );
}