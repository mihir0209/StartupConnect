
"use client"; 

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, profileCompletionRequired, pendingFirebaseUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (profileCompletionRequired && pendingFirebaseUser) {
        if (pathname !== '/settings/profile-setup') {
          router.replace('/settings/profile-setup');
        }
      } else if (!user) { 
        // Only redirect to login if not already on auth pages and not in completion flow
        if (pathname !== '/login' && pathname !== '/signup' && !pathname.startsWith('/settings/profile-setup')) {
          router.replace('/login');
        }
      }
      // If user is present and not needing completion, they can access app routes
    }
  }, [user, isLoading, profileCompletionRequired, pendingFirebaseUser, router, pathname]);

  // Show loader if still loading, or if profile completion is required but not yet on the setup page
  if (isLoading || (profileCompletionRequired && pendingFirebaseUser && pathname !== '/settings/profile-setup') || (!user && !profileCompletionRequired && pathname !== '/login' && pathname !== '/signup')) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Allow profile setup page to render without full app layout if that's desired,
  // or include it in the layout. For now, let's assume it uses the AppLayout.
  // If user is null AND profileCompletionRequired is false, it means they should be on login/signup,
  // which are outside this layout.

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset> 
        <AppHeader />
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
