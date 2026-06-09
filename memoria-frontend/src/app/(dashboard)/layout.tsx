import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SocketProvider } from '@/components/providers/SocketProvider';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SocketProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <div className="lg:pl-64 flex flex-col min-h-screen">
            <TopBar />
            <main className="flex-1">
              <div className="py-6 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SocketProvider>
    </AuthGuard>
  );
}
