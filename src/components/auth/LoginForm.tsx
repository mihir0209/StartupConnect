
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Chrome, Linkedin, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_NAME } from "@/lib/constants";

const BANNER_URL = "https://i.ibb.co/mrFXb2jD/Screenshot-2025-05-27-155445.png";
const LOGIN_DESCRIPTION = `Sign in to access ${APP_NAME}.`;

export function LoginForm() {
  const router = useRouter();
  const { loginWithGoogle, loginWithEmailPassword, loginWithLinkedIn, user, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);

  // Animation states
  const [showCard, setShowCard] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [startTypingDescription, setStartTypingDescription] = useState(false);
  const [typedDescription, setTypedDescription] = useState("");
  const [showFormElements, setShowFormElements] = useState(false);

  useEffect(() => {
    const timer0 = setTimeout(() => setShowCard(true), 50);
    const timer1 = setTimeout(() => setShowBanner(true), 250); // Banner starts after card
    const timer2 = setTimeout(() => setShowTitle(true), 700); // Title after banner starts
    const timer3 = setTimeout(() => setStartTypingDescription(true), 1200); // Description typing starts after title
    const timer4 = setTimeout(() => setShowFormElements(true), 1700); // Form elements while description is typing

    return () => {
      clearTimeout(timer0);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  useEffect(() => {
    if (startTypingDescription && typedDescription.length < LOGIN_DESCRIPTION.length) {
      const typingTimer = setTimeout(() => {
        setTypedDescription(LOGIN_DESCRIPTION.substring(0, typedDescription.length + 1));
      }, 50); // Adjust typing speed (milliseconds per character)
      return () => clearTimeout(typingTimer);
    }
  }, [typedDescription, startTypingDescription]);

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/home');
    }
  }, [user, authLoading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsEmailLoading(true);
    const result = await loginWithEmailPassword(email, password);
    if (!result.success) {
      setError(result.error || "Login failed. Please check your credentials.");
    }
    setIsEmailLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(result.error || "Google Sign-In failed.");
    }
    setIsGoogleLoading(false);
  };
  
  const handleLinkedInLogin = async () => {
    setError(null);
    setIsLinkedInLoading(true);
    const result = await loginWithLinkedIn();
    if (!result.success) {
      setError(result.error || "LinkedIn Sign-In failed.");
    }
    setIsLinkedInLoading(false);
  };

  if (authLoading && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-2">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 overflow-hidden">
      <Card 
        className={`w-full max-w-md shadow-xl overflow-hidden transition-opacity duration-500 ease-in-out ${showCard ? "opacity-100" : "opacity-0"}`}
      >
        <div
          className={`relative w-full h-28 transition-opacity duration-1000 ease-in-out ${showBanner ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={BANNER_URL}
            alt={`${APP_NAME} Banner`}
            fill
            className="object-cover"
            priority
            data-ai-hint="brand banner"
          />
        </div>

        <CardHeader className="space-y-2 text-center pt-6">
          {/* Logo removed from here */}
          <CardTitle
            className={`text-3xl font-bold transition-all duration-1000 ease-out ${showTitle ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-5"}`}
          >
            Welcome!
          </CardTitle>
          <CardDescription
            className={`transition-opacity duration-300 ease-in-out min-h-[20px] ${startTypingDescription ? "opacity-100" : "opacity-0"}`}
          >
            {typedDescription}
            <span className="animate-ping">|</span> {/* Blinking cursor */}
          </CardDescription>
        </CardHeader>
        <CardContent
          className={`space-y-4 transition-opacity duration-700 ease-in-out ${showFormElements ? "opacity-100" : "opacity-0"}`}
        >
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isEmailLoading || isGoogleLoading || isLinkedInLoading || authLoading}
            >
              {isEmailLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Sign In with Email
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full"
            disabled={isGoogleLoading || isEmailLoading || isLinkedInLoading || authLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="mr-2 h-4 w-4" />
            )}
            Sign in with Google
          </Button>
          <Button
            onClick={handleLinkedInLogin}
            variant="outline"
            className="w-full"
            disabled={isLinkedInLoading || isGoogleLoading || isEmailLoading || authLoading}
          >
            {isLinkedInLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Linkedin className="mr-2 h-4 w-4 text-[#0077B5]" />
            )}
            Sign in with LinkedIn
          </Button>
        </CardContent>
        <CardFooter 
            className={`flex flex-col space-y-2 text-center transition-opacity duration-700 ease-in-out ${showFormElements ? "opacity-100" : "opacity-0"}`}
        >
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account? <Link href="/signup" legacyBehavior><a className="font-medium text-primary hover:underline">Sign Up</a></Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
