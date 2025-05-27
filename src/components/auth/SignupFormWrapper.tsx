
"use client";

import type { SignupStep, SignupFormData, User, ProfileData } from "@/lib/types";
import { UserRole } from "@/lib/constants";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export function SignupFormWrapper() {
  const router = useRouter();
  const { signupWithEmailPassword: contextSignup, user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<SignupStep>(1);
  const [formData, setFormData] = useState<SignupFormData>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Use the signup method from AuthContext
    const result = await contextSignup(
      finalData.email,
      finalData.password,
      finalData.name,
      finalData.role,
      finalData.profileData
    );

    if (result.success && result.user) {
      // AuthContext will set the user, useEffect will redirect
      // router.push('/home'); // Handled by useEffect
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

  if (authLoading && !user) { 
    return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-2">Setting up your account...</p>
        </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo type="full" size="lg"/>
          </div>
          <CardTitle className="text-2xl">{stepTitles[currentStep]}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Let's get started with your basic information."}
            {currentStep === 2 && "Choose the role that best describes you in the startup ecosystem."}
            {currentStep === 3 && `Please provide details for your ${formData.role || 'selected'} profile.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
         <CardFooter className="flex flex-col items-center space-y-2 pt-4">
           <p className="text-sm text-muted-foreground">
             Already have an account? <Link href="/login" legacyBehavior><a className="font-medium text-primary hover:underline">Log In</a></Link>
           </p>
        </CardFooter>
      </Card>
    </div>
  );
}
