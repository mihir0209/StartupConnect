
"use client";

import type { User, ProfileData, BaseProfile, FounderProfile, UserRole as AppUserRole } from '@/lib/types';
import { UserRole } from '@/lib/constants';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { supabase } from '@/lib/supabaseClient';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmailPassword: (email: string, password: string, name: string, role: AppUserRole, profileData: Partial<ProfileData>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUserData: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true); // Set loading at the very start of auth state change processing
      try {
        if (firebaseUser) {
          const { data: userProfile, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', firebaseUser.uid)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: Row not found
            console.error("Error fetching user profile from Supabase:", fetchError);
            if (fetchError && typeof fetchError === 'object' && Object.keys(fetchError).length === 0) {
                console.warn("Supabase fetchError is an empty object. This usually indicates a problem with RLS (Row Level Security) policies on your 'users' table, an incorrect Supabase URL/Key, or network issues. Please check your Supabase project settings, RLS policies, and dashboard API logs.");
            }
            setUser(null);
          } else if (userProfile) {
            setUser(userProfile as User);
          } else { // User exists in Firebase Auth but not in Supabase DB (fetchError.code === 'PGRST116' or no error but no profile)
            const defaultProfileDetails: FounderProfile = {
              startupName: '',
              industry: INDUSTRIES[0], // Default to first industry
              fundingStage: FUNDING_STAGES[0], // Default to first funding stage
              bio: `Joined Nexus Startup!`,
              location: '',
              website: '',
              profilePictureUrl: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${(firebaseUser.displayName || 'U')?.[0]}`,
              language: 'en',
            };

            const newAppUser: Omit<User, 'createdAt'> & { created_at?: string } = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'New User',
              role: UserRole.Founder,
              profile: defaultProfileDetails,
              connections: [],
              connectionRequestsSent: [],
              connectionRequestsReceived: [],
            };

            const { data: createdUser, error: createError } = await supabase
              .from('users')
              .insert([newAppUser])
              .select()
              .single();

            if (createError) {
              console.error("Error creating new user profile in Supabase:", createError);
              setUser(null);
            } else {
              setUser(createdUser as User);
            }
          }
        } else { // No firebaseUser
          setUser(null);
        }
      } catch (e) { // Catch any other unexpected errors during this process
        console.error("Unexpected error during Firebase auth state processing or Supabase interaction:", e);
        setUser(null); // Ensure a clean state on unexpected failure
      } finally {
        setIsLoading(false); // Crucial to always set isLoading to false after processing
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    // isLoading state is managed by onAuthStateChanged
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      // Potentially set a global error state for UI feedback if needed
    }
  };

  const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // isLoading state is managed by onAuthStateChanged
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      console.error("Error during email/password sign-in:", error);
      return { success: false, error: error.message };
    }
  };

  const signupWithEmailPassword = async (
    email: string,
    password: string,
    name: string,
    role: AppUserRole,
    profileData: Partial<ProfileData>
  ): Promise<{ success: boolean; error?: string }> => {
    // isLoading state is managed by onAuthStateChanged
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: name });

      const newUserProfile: ProfileData = {
        ...(profileData as BaseProfile), // Cast to BaseProfile for common fields
        ...(role === UserRole.Founder && profileData as FounderProfile), // Add Founder specific if applicable
        // Ensure other role-specific profile data is handled similarly if needed
        profilePictureUrl: firebaseUser.photoURL || profileData.profilePictureUrl || `https://placehold.co/100x100.png?text=${name?.[0] || 'U'}`,
        language: profileData.language || 'en',
        bio: profileData.bio || '', // Ensure defaults for all BaseProfile fields
        location: profileData.location || '',
        website: profileData.website || '',
      };
      
      const newAppUserForSupabase: Omit<User, 'createdAt'| 'connections' | 'connectionRequestsSent' | 'connectionRequestsReceived'> & { created_at?: string, connections?: string[], connectionRequestsSent?: string[], connectionRequestsReceived?: string[] } = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: name,
        role: role,
        profile: newUserProfile,
        connections: [],
        connectionRequestsSent: [],
        connectionRequestsReceived: [],
      };

      const { error: createError } = await supabase
        .from('users')
        .insert([newAppUserForSupabase]);

      if (createError) {
        console.error("Error creating user profile in Supabase during signup:", createError);
        return { success: false, error: createError.message };
      }
      return { success: true };
    } catch (error: any) {
      console.error("Error during email/password sign-up:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
        console.error("Error during sign out: ", error);
    } finally {
        setIsLoading(false);
    }
  };

  const updateUserInContext = async (updatedUserData: Partial<User>) => {
    if (user && user.id) {
      // Construct payload carefully to avoid sending undefined fields
      const updatePayload: any = {};
      if (updatedUserData.name !== undefined) updatePayload.name = updatedUserData.name;
      if (updatedUserData.role !== undefined) updatePayload.role = updatedUserData.role;
      if (updatedUserData.profile !== undefined) updatePayload.profile = updatedUserData.profile;
      if (updatedUserData.connections !== undefined) updatePayload.connections = updatedUserData.connections;
      if (updatedUserData.connectionRequestsSent !== undefined) updatePayload.connectionRequestsSent = updatedUserData.connectionRequestsSent;
      if (updatedUserData.connectionRequestsReceived !== undefined) updatePayload.connectionRequestsReceived = updatedUserData.connectionRequestsReceived;

      if (Object.keys(updatePayload).length === 0) {
        console.warn("updateUserInContext called with no actual data to update.");
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating user profile in Supabase:", error);
      } else if (data) {
        setUser(data as User);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      loginWithGoogle,
      loginWithEmailPassword,
      signupWithEmailPassword,
      logout,
      updateUserInContext,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Dummy constants for industries and funding stages if not imported elsewhere in this file
// These should ideally come from your constants file.
const INDUSTRIES = ["B2B SaaS", "EdTech", "Climate Tech", "FinTech", "HealthTech"];
const FUNDING_STAGES = ["Pre-seed", "Seed", "Series A"];
