"use server";

import { z } from "zod";
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS } from "@/lib/constants";
import type { User, SignupFormData, FounderProfile, InvestorProfile, ExpertProfile, ProfileData } from "@/lib/types";
import { mockUsers } from "@/lib/mockData";

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
  industry: z.string().refine(val => INDUSTRIES.includes(val), "Invalid industry"),
  fundingStage: z.string().refine(val => FUNDING_STAGES.includes(val), "Invalid funding stage"),
  traction: z.string().optional(),
  needs: z.string().optional(),
});

const InvestorProfileSchema = BaseProfileSchema.extend({
  investmentFocus: z.array(z.string().refine(val => INDUSTRIES.includes(val), "Invalid industry")).min(1, "At least one investment focus is required"),
  fundingRange: z.string().optional(),
  portfolioHighlights: z.string().optional(),
  fundSize: z.string().optional(), // For VCs
  preferredFundingStages: z.array(z.string().refine(val => FUNDING_STAGES.includes(val), "Invalid funding stage")).optional(), // For VCs
});

const ExpertProfileSchema = BaseProfileSchema.extend({
  areaOfExpertise: z.string().refine(val => EXPERTISE_AREAS.includes(val), "Invalid expertise area"),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience cannot be negative"),
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
    // In a real app, you'd query your database and verify the password hash.
    const user = mockUsers.find(u => u.email === email); // Password check omitted for mock

    if (user) {
      // In a real app, you'd set up a session (e.g., via cookies or JWT)
      return { type: "success", message: "Login successful!", user };
    } else {
      return { type: "error", message: "Invalid email or password." };
    }
  } catch (error) {
    return { type: "error", message: "An unexpected error occurred." };
  }
}

export async function signupUser(signupData: SignupFormData): Promise<{ type: "success"; message: string; user: User } | { type: "error"; message: string; errors?: any }> {
  // This server action combines all steps for simplicity of mock data handling.
  // In a real app, each step might have its own validation and temporary storage.
  
  // Validate step 1 data (assuming it's part of signupData)
  const step1Validation = SignupStep1Schema.safeParse({
    name: signupData.name,
    email: signupData.email,
    password: signupData.password,
  });
  if (!step1Validation.success) {
    return { type: "error", message: "Invalid credentials.", errors: step1Validation.error.flatten().fieldErrors };
  }

  // Validate step 2 data
  if (!signupData.role || !Object.values(UserRole).includes(signupData.role)) {
     return { type: "error", message: "Invalid role selected." };
  }
  
  // Validate step 3 data (profile) based on role
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
      return { type: "error", message: "Invalid user role for profile." };
  }

  if (!profileValidation.success) {
    return { type: "error", message: "Invalid profile information.", errors: profileValidation.error.flatten().fieldErrors };
  }
  
  const { name, email } = step1Validation.data;
  
  // Check if user already exists
  if (mockUsers.some(u => u.email === email)) {
    return { type: "error", message: "User with this email already exists." };
  }

  const newUser: User = {
    id: `user${mockUsers.length + 1}`,
    email,
    name,
    role: signupData.role,
    profile: profileValidation.data as ProfileData, // Cast as ProfileData, validated above
    connections: [],
    connectionRequestsSent: [],
    connectionRequestsReceived: [],
    createdAt: new Date().toISOString(),
  };

  mockUsers.push(newUser);
  
  return { type: "success", message: "Signup successful!", user: newUser };
}
