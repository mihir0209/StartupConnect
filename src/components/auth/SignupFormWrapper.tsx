
"use client";

import type { SignupStep, SignupFormData } from "@/lib/types";
import { UserRole, APP_NAME } from "@/lib/constants";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { SignupStep1Credentials } from "./SignupStep1Credentials";
import { SignupStep2Role } from "./SignupStep2Role";
import { SignupStep3Profile } from "./SignupStep3Profile";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

const BANNER_URL = "https://i.ibb.co/mrFXb2jD/Screenshot-2025-05-27-155445.png";

export function SignupFormWrapper() {
  const router = useRouter();
  const { signupWithEmailPassword: contextSignup, user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<SignupStep>(1);
  const [formData, setFormData] = useState<SignupFormData>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation states
  const [showCard, setShowCard] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showFormElements, setShowFormElements] = useState(false); // For the progress bar and form content

  useEffect(() => {
    const timer0 = setTimeout(() => setShowCard(true), 50);
    const timer1 = setTimeout(() => setShowBanner(true), 300); 
    const timer2 = setTimeout(() => setShowTitle(true), 800); 
    const timer3 = setTimeout(() => setShowDescription(true), 1300);
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

    const result = await contextSignup(
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

  const stepTitles = {
    1: "Create Your Account",
    2: "Select Your Role",
    3: "Complete Your Profile"
  };
  const welcomeTitle = `Join ${APP_NAME}!`;

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
          style={{ transitionDelay: showBanner ? '0ms' : '0ms' }}
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
        <CardHeader className="space-y-1 text-center pt-6">
          <div className={`flex justify-center mb-4 transition-all duration-700 ease-out ${showTitle ? "opacity-100 scale-125" : "opacity-0 scale-100"}`}>
            <Logo type="full" size="lg"/>
          </div>
          <CardTitle
            className={`text-2xl transition-all duration-1000 ease-out ${showTitle ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-5"}`}
          >
            {welcomeTitle}
          </CardTitle>
          <CardDescription
            className={`transition-opacity duration-700 ease-in-out ${showDescription ? "opacity-100" : "opacity-0"}`}
          >
            {currentStep === 1 && "Let's get started with your basic information."}
            {currentStep === 2 && "Choose the role that best describes you in the startup ecosystem."}
            {currentStep === 3 && `Please provide details for your ${formData.role || 'selected'} profile.`}
          </CardDescription>
        </CardHeader>
        <CardContent
            className={`transition-opacity duration-700 ease-in-out ${showFormElements ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: showFormElements ? '0ms' : '0ms' }}
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
            style={{ transitionDelay: showFormElements ? '0ms' : '0ms' }}
        >
          <p className="text-sm text-muted-foreground">
            Already have an account? <Link href="/login" legacyBehavior><a className="font-medium text-primary hover:underline">Log In</a></Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
