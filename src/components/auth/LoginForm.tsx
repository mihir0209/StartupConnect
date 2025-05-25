"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { LogIn, Chrome } from "lucide-react"; // Using Chrome icon for Google
import { Loader2 } from "lucide-react";


export function LoginForm() {
  const router = useRouter();
  const { loginWithGoogle, user, isLoading } = useAuth();

  useEffect(() => {
    if (user && !isLoading) {
      // Check if it's a new user (e.g. by checking if profile is complete)
      // For now, just redirect to home.
      // Later, you might redirect new users to a profile completion page.
      // Example: if (user.profile.startupName === '') router.push('/complete-profile');
      router.push('/home');
    }
  }, [user, isLoading, router]);

  if (isLoading && !user) { // Show loader only if not yet logged in but loading
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If already logged in (e.g. page reloaded while user is authenticated), useEffect will redirect.
  // Avoid showing login form if user object exists.
  if (user && !isLoading) {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-2">Redirecting...</p>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl">Welcome!</CardTitle>
          <CardDescription>Sign in to access Nexus Startup.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={loginWithGoogle} 
            className="w-full bg-primary hover:bg-primary/90" 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="mr-2 h-4 w-4" /> // Using Chrome icon as a stand-in for Google
            )}
            Sign in with Google
          </Button>
          <p className="text-xs text-center text-muted-foreground pt-2">
            The email/password login and signup flow will be re-evaluated.
            For now, please use Google Sign-In.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground">
            Don&apos;t have an account? Signing in with Google will create one for you.
            </p>
             <p className="text-sm text-muted-foreground">
            Need to create a new account with email? <Link href="/signup" legacyBehavior><a className="font-medium text-primary hover:underline">Sign Up (Legacy)</a></Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
