"use client";

import type { SignupStep, SignupFormData, User } from "@/lib/types";
import { UserRole } from "@/lib/constants";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signupUser } from "@/lib/actions/auth.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { SignupStep1Credentials } from "./SignupStep1Credentials";
import { SignupStep2Role } from "./SignupStep2Role";
import { SignupStep3Profile } from "./SignupStep3Profile";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export function SignupFormWrapper() {
  const router = useRouter();
  const { signup: contextSignup, user, isLoading: authLoading } = useAuth();
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

    // Basic validation before calling server action
    if (!finalData.email || !finalData.password || !finalData.name || !finalData.role) {
        setError("Some required information is missing from previous steps.");
        setIsSubmitting(false);
        return;
    }

    const result = await signupUser(finalData);

    if (result.type === "success") {
      await contextSignup(result.user); // Use AuthContext to set user
      router.push('/home');
    } else {
      setError(result.message + (result.errors ? ` Details: ${JSON.stringify(result.errors)}` : ''));
    }
    setIsSubmitting(false);
  };

  const progressValue = (currentStep / 3) * 100;
  
  const stepTitles = {
    1: "Create Your Account",
    2: "Select Your Role",
    3: "Complete Your Profile"
  };

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl">{stepTitles[currentStep]}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Let's get started with your basic information."}
            {currentStep === 2 && "Choose the role that best describes you in the startup ecosystem."}
            {currentStep === 3 && `Please provide details for your ${formData.role} profile.`}
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
