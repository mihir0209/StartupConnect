
"use server";

import { z } from "zod";
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS } from "@/lib/constants";
import type { User, SignupFormData, ProfileData } from "@/lib/types"; // Removed specific profile types as ProfileData covers it
import { mockUsers } from "@/lib/mockData";

// These server actions are largely superseded by the mock AuthContext logic for a frontend-only prototype.
// They are kept minimal for structure but won't be the primary auth mechanism.

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1), // Simplified for mock
});

// This server action is not directly used by the LoginForm anymore,
// as LoginForm now uses AuthContext.loginWithEmailPassword.
// It's kept here for potential direct use or as a reference.
export async function loginUser(prevState: any, formData: FormData) {
  try {
    const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedFields.success) {
      return {
        type: "error" as const,
        message: "Invalid email or password format.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email } = validatedFields.data;
    const user = mockUsers.find(u => u.email === email); 

    if (user) { // Password check is omitted for mock
      return { type: "success" as const, message: "Login successful! (Mock)", user };
    } else {
      return { type: "error" as const, message: "Invalid email or password. (Mock)" };
    }
  } catch (error) {
    return { type: "error" as const, message: "An unexpected error occurred. (Mock)" };
  }
}

// This server action is not directly used by SignupFormWrapper anymore.
// SignupFormWrapper now uses AuthContext.signupWithEmailPassword.
// Kept for reference.
export async function signupUser(signupData: SignupFormData): Promise<{ type: "success"; message: string; user: User } | { type: "error"; message: string; errors?: any }> {
  
  if (!signupData.email || !signupData.password || !signupData.name || !signupData.role || !signupData.profileData) {
    return { type: "error", message: "Incomplete signup data (Mock)." };
  }

  if (mockUsers.some(u => u.email === signupData.email)) {
    return { type: "error", message: "User with this email already exists. (Mock)" };
  }

  const newUser: User = {
    id: `user${mockUsers.length + 1}${Date.now()}`,
    email: signupData.email,
    name: signupData.name,
    role: signupData.role,
    profile: {
        bio: signupData.profileData.bio || '',
        location: signupData.profileData.location || '',
        website: signupData.profileData.website || '',
        profilePictureUrl: signupData.profileData.profilePictureUrl || `https://placehold.co/100x100.png?text=${signupData.name?.[0] || 'U'}`,
        language: signupData.profileData.language || 'en',
        ...signupData.profileData // Spread the rest of the role-specific fields
    } as ProfileData,
    connections: [],
    connectionRequestsSent: [],
    connectionRequestsReceived: [],
    createdAt: new Date().toISOString(),
  };

  // In a real scenario, this would interact with a database.
  // For mock, we can add to the mockUsers array if it's exported as 'let'.
  // However, actions.ts usually doesn't mutate imported data directly for purity.
  // The AuthContext now handles adding to mockUsers.
  // mockUsers.push(newUser); 
  
  return { type: "success", message: "Signup successful! (Mock)", user: newUser };
}
