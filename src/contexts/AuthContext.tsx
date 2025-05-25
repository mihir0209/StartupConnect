
"use client";

import type { User, ProfileData, BaseProfile, FounderProfile } from '@/lib/types'; // Adjusted imports
import { UserRole } from '@/lib/constants'; // For default role
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, googleProvider, db } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';


interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUserData: Partial<User>) => void; 
  signup: (newUser: User) => void; // Added for the mock/legacy signup flow
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
          // User is new, create a basic profile in Firestore
          const newUserProfile: FounderProfile = { // Default to FounderProfile, user should select/confirm role later
            startupName: '', // Will be empty, user needs to fill this
            industry: '', // Will be empty
            fundingStage: '', // Will be empty
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
            role: UserRole.Founder, // Default role, user should update this
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
            console.error("Error creating new user profile in Firestore:", error);
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
    } catch (error) {
      console.error("Error during Google sign-in:", error);
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

  const signup = (newUser: User) => {
    // This method is primarily for the legacy/mock signup flow.
    // It manually sets the user state. For Firebase auth methods (like Google Sign-In),
    // onAuthStateChanged handles user state automatically.
    setUser(newUser);
    setIsLoading(false); // Assume user is active and loading is complete.
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, logout, updateUserInContext, signup }}>
      {children}
    </AuthContext.Provider>
  );
};
