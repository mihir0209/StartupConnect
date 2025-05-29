
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, isLoading, profileCompletionRequired, pendingNewUserInfo } = useAuth(); // Renamed pendingFirebaseUser
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (profileCompletionRequired && pendingNewUserInfo) { // Use renamed variable
        router.replace('/settings/profile-setup');
      } else if (user) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, profileCompletionRequired, pendingNewUserInfo, router]); // Use renamed variable

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

    