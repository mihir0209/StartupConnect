"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { loginUser } from "@/lib/actions/auth.actions";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, LogIn } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} aria-disabled={pending}>
      {pending ? "Logging in..." : "Login"}
      <LogIn className="ml-2 h-4 w-4" />
    </Button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const { login: contextLogin, user } = useAuth(); // AuthContext login
  const initialState = { message: null, errors: {}, type: "" };
  const [state, dispatch] = useActionState(loginUser, initialState);

  useEffect(() => {
    if (state?.type === "success" && state.user) {
      contextLogin(state.user.email, state.user.id).then(() => { // Use context login
        router.push('/home');
      });
    }
  }, [state, router, contextLogin]);

  useEffect(() => { // Redirect if already logged in
    if (user) {
      router.replace('/home');
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-4">
            {state?.type === "error" && state.message && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="name@example.com" required 
                     aria-describedby="email-error" />
              {state?.errors?.email && <p id="email-error" className="text-sm text-destructive">{state.errors.email[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required 
                     aria-describedby="password-error" />
              {state?.errors?.password && <p id="password-error" className="text-sm text-destructive">{state.errors.password[0]}</p>}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground">
                Forgot your password? <Link href="/forgot-password" legacyBehavior><a className="font-medium text-primary hover:underline">Reset it here</a></Link>
            </p>
            <p className="text-sm text-muted-foreground">
            Don&apos;t have an account? <Link href="/signup" legacyBehavior><a className="font-medium text-primary hover:underline">Sign Up</a></Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
