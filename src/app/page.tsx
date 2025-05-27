
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, isLoading, profileCompletionRequired, pendingFirebaseUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (profileCompletionRequired && pendingFirebaseUser) {
        router.replace('/settings/profile-setup');
      } else if (user) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, profileCompletionRequired, pendingFirebaseUser, router]);

  // Always show loader until redirection logic in useEffect completes
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
