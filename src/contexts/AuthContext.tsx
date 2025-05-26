
"use client";

import type { User, ProfileData, BaseProfile, FounderProfile, UserRole as AppUserRole } from '@/lib/types';
import { UserRole } from '@/lib/constants';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, googleProvider } from '@/lib/firebase'; // db removed from here
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
// Firestore imports (doc, getDoc, setDoc, serverTimestamp) are removed

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmailPassword: (email: string, password: string, name: string, role: AppUserRole, profileData: Partial<ProfileData>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUserData: Partial<User>) => Promise<void>; // Made async for Supabase
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Fetch user profile from Supabase
        const { data: userProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', firebaseUser.uid)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: Row not found
          console.error("Error fetching user profile from Supabase:", fetchError);
          setUser(null);
        } else if (userProfile) {
          setUser(userProfile as User);
        } else {
          // User exists in Firebase Auth but not in Supabase DB (e.g., first-time Google sign-in)
          // Create a new user profile in Supabase
          const defaultProfileDetails: FounderProfile = { // Default to Founder, can be changed in profile settings
            startupName: '',
            industry: '',
            fundingStage: '',
            bio: `Joined Nexus Startup!`,
            location: '',
            website: '',
            profilePictureUrl: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${(firebaseUser.displayName || 'U')?.[0]}`,
            language: 'en',
          };

          const newAppUser: Omit<User, 'createdAt'> & { created_at?: string } = { // Omit createdAt, Supabase handles it
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'New User',
            role: UserRole.Founder, // Default role
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
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle fetching/creating user in Supabase
    } catch (error) {
      console.error("Error during Google sign-in:", error);
    } finally {
      // setIsLoading(false); // onAuthStateChanged will set loading to false
    }
  };

  const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user
      return { success: true };
    } catch (error: any) {
      console.error("Error during email/password sign-in:", error);
      return { success: false, error: error.message };
    } finally {
      // setIsLoading(false); // onAuthStateChanged will set loading to false
    }
  };

  const signupWithEmailPassword = async (
    email: string,
    password: string,
    name: string,
    role: AppUserRole,
    profileData: Partial<ProfileData>
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: name });

      const newUserProfile: ProfileData = {
        ...(profileData as BaseProfile),
        ...(role === UserRole.Founder && profileData as FounderProfile),
        profilePictureUrl: firebaseUser.photoURL || profileData.profilePictureUrl || `https://placehold.co/100x100.png?text=${name?.[0] || 'U'}`,
        language: profileData.language || 'en',
        bio: profileData.bio || '',
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
        // Optionally: delete the Firebase user if Supabase profile creation fails
        // await firebaseUser.delete();
        return { success: false, error: createError.message };
      }
      // onAuthStateChanged will handle setting the user state after Supabase record is created (or should!)
      return { success: true };
    } catch (error: any) {
      console.error("Error during email/password sign-up:", error);
      return { success: false, error: error.message };
    } finally {
      // setIsLoading(false); // onAuthStateChanged will set loading to false
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
      const updatePayload: Partial<Omit<User, 'id' | 'createdAt' | 'email'>> = {};
      if (updatedUserData.name) updatePayload.name = updatedUserData.name;
      if (updatedUserData.role) updatePayload.role = updatedUserData.role;
      if (updatedUserData.profile) updatePayload.profile = updatedUserData.profile;
      // Add other updatable fields as needed, e.g., connections
      if (updatedUserData.connections) updatePayload.connections = updatedUserData.connections;
      if (updatedUserData.connectionRequestsSent) updatePayload.connectionRequestsSent = updatedUserData.connectionRequestsSent;
      if (updatedUserData.connectionRequestsReceived) updatePayload.connectionRequestsReceived = updatedUserData.connectionRequestsReceived;


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
