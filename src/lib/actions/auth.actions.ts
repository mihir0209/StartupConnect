"use server";

import { z } from "zod";
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS } from "@/lib/constants";
import type { User, SignupFormData, FounderProfile, InvestorProfile, ExpertProfile, ProfileData } from "@/lib/types";
import { mockUsers } from "@/lib/mockData";

// NOTE: With Firebase Authentication, these server actions for direct email/password login and signup
// will likely be refactored or removed. User creation and profile management will predominantly occur
// after a successful Firebase Auth event (e.g., Google Sign-In), interacting directly with Firestore.
// For now, they are kept but will be largely bypassed by the Google Sign-In flow.

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const SignupStep1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const SignupStep2Schema = z.object({
  role: z.nativeEnum(UserRole),
});

// Dynamic schema based on role would be complex here, so we'll validate specific fields
const BaseProfileSchema = z.object({
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  profilePictureUrl: z.string().url().optional().or(z.literal('')),
  language: z.string().optional(),
});

const FounderProfileSchema = BaseProfileSchema.extend({
  startupName: z.string().min(1, "Startup name is required"),
  industry: z.string().refine(val => INDUSTRIES.includes(val) || val === '', "Invalid industry").optional(),
  fundingStage: z.string().refine(val => FUNDING_STAGES.includes(val) || val === '', "Invalid funding stage").optional(),
  traction: z.string().optional(),
  needs: z.string().optional(),
});

const InvestorProfileSchema = BaseProfileSchema.extend({
  investmentFocus: z.array(z.string().refine(val => INDUSTRIES.includes(val), "Invalid industry")).min(1, "At least one investment focus is required").optional(),
  fundingRange: z.string().optional(),
  portfolioHighlights: z.string().optional(),
  fundSize: z.string().optional(), // For VCs
  preferredFundingStages: z.array(z.string().refine(val => FUNDING_STAGES.includes(val), "Invalid funding stage")).optional(), // For VCs
});

const ExpertProfileSchema = BaseProfileSchema.extend({
  areaOfExpertise: z.string().refine(val => EXPERTISE_AREAS.includes(val) || val === '', "Invalid expertise area").optional(),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience cannot be negative").optional(),
  servicesOffered: z.string().optional(),
});


export async function loginUser(prevState: any, formData: FormData) {
  try {
    const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedFields.success) {
      return {
        type: "error",
        message: "Invalid email or password format.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email, password } = validatedFields.data;
    // This mock login is now largely superseded by Firebase Auth.
    const user = mockUsers.find(u => u.email === email); 

    if (user) {
      return { type: "success", message: "Login successful! (Mock)", user };
    } else {
      return { type: "error", message: "Invalid email or password. (Mock)" };
    }
  } catch (error) {
    return { type: "error", message: "An unexpected error occurred. (Mock)" };
  }
}

export async function signupUser(signupData: SignupFormData): Promise<{ type: "success"; message: string; user: User } | { type: "error"; message: string; errors?: any }> {
  // This mock signup is now largely superseded by Firebase Auth & Firestore profile creation.
  const step1Validation = SignupStep1Schema.safeParse({
    name: signupData.name,
    email: signupData.email,
    password: signupData.password,
  });
  if (!step1Validation.success) {
    return { type: "error", message: "Invalid credentials. (Mock)", errors: step1Validation.error.flatten().fieldErrors };
  }
  // ... (rest of mock logic, will be removed/refactored later)
  if (!signupData.role || !Object.values(UserRole).includes(signupData.role)) {
     return { type: "error", message: "Invalid role selected. (Mock)" };
  }
  
  let profileValidation;
   const profilePayload = { ...signupData.profileData, profilePictureUrl: signupData.profileData?.profilePictureUrl || `https://placehold.co/100x100.png?text=${signupData.name?.[0] || 'U'}` };


  switch (signupData.role) {
    case UserRole.Founder:
      profileValidation = FounderProfileSchema.safeParse(profilePayload);
      break;
    case UserRole.AngelInvestor:
    case UserRole.VC:
      profileValidation = InvestorProfileSchema.safeParse(profilePayload);
      break;
    case UserRole.IndustryExpert:
      profileValidation = ExpertProfileSchema.safeParse(profilePayload);
      break;
    default:
      return { type: "error", message: "Invalid user role for profile. (Mock)" };
  }

  if (!profileValidation.success) {
    return { type: "error", message: "Invalid profile information. (Mock)", errors: profileValidation.error.flatten().fieldErrors };
  }
  
  const { name, email } = step1Validation.data;
  
  if (mockUsers.some(u => u.email === email)) {
    return { type: "error", message: "User with this email already exists. (Mock)" };
  }

  const newUser: User = {
    id: `user${mockUsers.length + 1}`,
    email,
    name,
    role: signupData.role,
    profile: profileValidation.data as ProfileData,
    connections: [],
    connectionRequestsSent: [],
    connectionRequestsReceived: [],
    createdAt: new Date().toISOString(),
  };

  mockUsers.push(newUser);
  
  return { type: "success", message: "Signup successful! (Mock)", user: newUser };
}
