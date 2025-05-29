
"use client"; 

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, profileCompletionRequired, pendingNewUserInfo } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (profileCompletionRequired && pendingNewUserInfo) { 
        if (pathname !== '/settings/profile-setup') {
          router.replace('/settings/profile-setup');
        }
      } else if (!user) { 
        if (pathname !== '/login' && pathname !== '/signup' && !pathname.startsWith('/settings/profile-setup')) {
          router.replace('/login');
        }
      }
    }
  }, [user, isLoading, profileCompletionRequired, pendingNewUserInfo, router, pathname]);

  if (isLoading || (profileCompletionRequired && pendingNewUserInfo && pathname !== '/settings/profile-setup') || (!user && !profileCompletionRequired && pathname !== '/login' && pathname !== '/signup')) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset> 
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto"> {/* Applied styles directly here */}
          <AppHeader /> {/* Moved AppHeader inside the scrollable content area if it shouldn't be sticky over sidebar */}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

    
