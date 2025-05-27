
"use client";

import type { SignupStep, SignupFormData, UserRole as AppUserRole } from "@/lib/types";
import { UserRole, APP_NAME } from "@/lib/constants";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
// Logo import removed as it's no longer used in the header
import { SignupStep1Credentials } from "./SignupStep1Credentials";
import { SignupStep2Role } from "./SignupStep2Role";
import { SignupStep3Profile } from "./SignupStep3Profile";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

const BANNER_URL = "https://i.ibb.co/mrFXb2jD/Screenshot-2025-05-27-155445.png";

const getDescriptionForStep = (step: SignupStep, role?: AppUserRole): string => {
  if (step === 1) return "Let's get started with your basic information.";
  if (step === 2) return "Choose the role that best describes you in the startup ecosystem.";
  if (step === 3) return `Please provide details for your ${role || 'selected'} profile.`;
  return "";
};

export function SignupFormWrapper() {
  const router = useRouter();
  const { signupWithEmailPassword, user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<SignupStep>(1);
  const [formData, setFormData] = useState<SignupFormData>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation states
  const [showCard, setShowCard] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [startTypingDescription, setStartTypingDescription] = useState(false);
  const [typedDescription, setTypedDescription] = useState("");
  const [descriptionKey, setDescriptionKey] = useState(0); // To reset typing effect
  const [showFormElements, setShowFormElements] = useState(false);

  const fullDescription = getDescriptionForStep(currentStep, formData.role);
  const welcomeTitle = `Join ${APP_NAME}!`;

  useEffect(() => {
    const timer0 = setTimeout(() => setShowCard(true), 50);
    const timer1 = setTimeout(() => setShowBanner(true), 250);
    const timer2 = setTimeout(() => setShowTitle(true), 700);
    const timer3 = setTimeout(() => {
      setTypedDescription(""); // Reset before starting
      setDescriptionKey(k => k + 1); // Ensure effect re-runs
      setStartTypingDescription(true);
    }, 1200);
    const timer4 = setTimeout(() => setShowFormElements(true), 1700);

    return () => {
      clearTimeout(timer0);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  useEffect(() => {
    // Reset and restart typing animation when currentStep or fullDescription changes
    setTypedDescription("");
    setDescriptionKey(prev => prev + 1); // This key change will trigger the typing useEffect
  }, [currentStep, fullDescription]);


  useEffect(() => {
    let typingTimer: NodeJS.Timeout;
    if (startTypingDescription && typedDescription.length < fullDescription.length) {
      typingTimer = setTimeout(() => {
        setTypedDescription(fullDescription.substring(0, typedDescription.length + 1));
      }, 50); // Adjust typing speed
    }
    return () => clearTimeout(typingTimer);
  }, [typedDescription, startTypingDescription, fullDescription, descriptionKey]); // descriptionKey ensures re-trigger

  useEffect(() => {
    if (user && !authLoading) {
      router.replace('/home');
    }
  }, [user, authLoading, router]);

  const handleNextStep1 = (data: Partial<SignupFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
    setError(null);
  };

  const handleNextStep2 = (data: Partial<SignupFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
    setError(null);
  };

  const handleBack = () => {
    setCurrentStep(prev => (prev > 1 ? prev - 1 : 1) as SignupStep);
    setError(null);
  };

  const handleComplete = async (data: Partial<SignupFormData>) => {
    setIsSubmitting(true);
    setError(null);
    const finalData = { ...formData, ...data };
    setFormData(finalData);

    if (!finalData.email || !finalData.password || !finalData.name || !finalData.role || !finalData.profileData) {
      setError("All information is required to complete signup.");
      setIsSubmitting(false);
      return;
    }

    const result = await signupWithEmailPassword(
      finalData.email,
      finalData.password,
      finalData.name,
      finalData.role,
      finalData.profileData
    );

    if (result.success && result.user) {
      // AuthContext will set the user, useEffect will redirect
    } else {
      setError(result.error || "An unknown error occurred during signup.");
    }
    setIsSubmitting(false);
  };

  const progressValue = (currentStep / 3) * 100;

  if (authLoading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-2">Setting up your account...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 overflow-hidden">
      <Card 
        className={`w-full max-w-lg shadow-xl overflow-hidden transition-opacity duration-500 ease-in-out ${showCard ? "opacity-100" : "opacity-0"}`}
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
            {welcomeTitle}
          </CardTitle>
          <CardDescription
            className={`transition-opacity duration-300 ease-in-out min-h-[40px] ${startTypingDescription ? "opacity-100" : "opacity-0"}`} // Increased min-h for longer descriptions
          >
            {typedDescription}
            {(startTypingDescription && typedDescription.length < fullDescription.length) && <span className="animate-ping">|</span>} {/* Blinking cursor */}
          </CardDescription>
        </CardHeader>
        <CardContent
            className={`transition-opacity duration-700 ease-in-out ${showFormElements ? "opacity-100" : "opacity-0"}`}
        >
          <Progress value={progressValue} className="mb-6 h-2" />
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Signup Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {currentStep === 1 && <SignupStep1Credentials onNext={handleNextStep1} defaultValues={formData} />}
          {currentStep === 2 && <SignupStep2Role onNext={handleNextStep2} onBack={handleBack} defaultValues={formData} />}
          {currentStep === 3 && formData.role && (
            <SignupStep3Profile
              onComplete={handleComplete}
              onBack={handleBack}
              role={formData.role}
              defaultValues={formData}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
        <CardFooter 
            className={`flex flex-col items-center space-y-2 pt-4 transition-opacity duration-700 ease-in-out ${showFormElements ? "opacity-100" : "opacity-0"}`}
        >
          <p className="text-sm text-muted-foreground">
            Already have an account? <Link href="/login" legacyBehavior><a className="font-medium text-primary hover:underline">Log In</a></Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
