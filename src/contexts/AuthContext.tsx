
"use client";

import type { User, ProfileData, BaseProfile, FounderProfile, UserRole as AppUserRole } from '@/lib/types'; // Adjusted imports
import { UserRole } from '@/lib/constants'; // For default role
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, googleProvider, db } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';


interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmailPassword: (email: string, password: string, name: string, role: AppUserRole, profileData: Partial<ProfileData>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUserData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUser(userDocSnap.data() as User);
        } else {
          // This case is typically for users signing up (Google or new Email/Pass)
          // If it's a Google sign-in and no doc, we create one.
          // If it's an email/pass signup, the doc should be created by signupWithEmailPassword.
          // This block primarily ensures Google Sign-In users get a Firestore doc if they're new.
          if (firebaseUser.providerData.some(p => p.providerId === 'google.com')) {
            const newUserProfile: FounderProfile = { 
              startupName: '', 
              industry: '', 
              fundingStage: '', 
              bio: `Joined Nexus Startup!`,
              location: '',
              website: '',
              profilePictureUrl: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${(firebaseUser.displayName || 'U')?.[0]}`,
              language: 'en',
            };
            
            const newAppUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'New User',
              role: UserRole.Founder, 
              profile: newUserProfile,
              connections: [],
              connectionRequestsSent: [],
              connectionRequestsReceived: [],
              createdAt: new Date().toISOString(), 
            };
            try {
              await setDoc(userDocRef, { ...newAppUser, createdAt: serverTimestamp() }); 
              setUser(newAppUser);
            } catch (error) {
              console.error("Error creating new user profile in Firestore for Google user:", error);
              setUser(null); 
            }
          } else {
            // For email/password users, if they are authenticated but no doc exists,
            // it implies an issue or an incomplete signup. For now, we log them out.
            // A more robust solution might redirect them to a profile completion step
            // if their auth record exists but Firestore doc doesn't.
            console.warn("User authenticated but no Firestore document found. Logging out.");
            await signOut(auth);
            setUser(null);
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
      // onAuthStateChanged will handle setting the user
    } catch (error) {
      console.error("Error during Google sign-in:", error);
    } finally {
      setIsLoading(false);
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
      setIsLoading(false);
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

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const newUserProfile: ProfileData = {
        ...(profileData as BaseProfile), // Cast to BaseProfile for common fields
        ...(role === UserRole.Founder && profileData as FounderProfile),
        // Add specific profile types if needed
        profilePictureUrl: firebaseUser.photoURL || profileData.profilePictureUrl || `https://placehold.co/100x100.png?text=${name?.[0] || 'U'}`,
      };

      const newAppUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: name,
        role: role,
        profile: newUserProfile,
        connections: [],
        connectionRequestsSent: [],
        connectionRequestsReceived: [],
        createdAt: new Date().toISOString(),
      };

      await setDoc(userDocRef, { ...newAppUser, createdAt: serverTimestamp() });
      // onAuthStateChanged will handle setting the user state
      return { success: true };
    } catch (error: any) {
      console.error("Error during email/password sign-up:", error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
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
    if (user) {
      const userDocRef = doc(db, "users", user.id);
      try {
        const updatePayload: Partial<User> = {};
        if (updatedUserData.name) updatePayload.name = updatedUserData.name;
        if (updatedUserData.role) updatePayload.role = updatedUserData.role;
        if (updatedUserData.profile) updatePayload.profile = updatedUserData.profile;
        
        await setDoc(userDocRef, updatePayload, { merge: true });
        setUser(prevUser => ({...prevUser, ...updatedUserData} as User));
      } catch (error) {
        console.error("Error updating user profile in Firestore:", error);
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
