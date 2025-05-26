
"use client";

import type { User, ProfileData, BaseProfile, FounderProfile, InvestorProfile, ExpertProfile, UserRole as AppUserRole } from '@/lib/types';
import { UserRole, INDUSTRIES, FUNDING_STAGES } from '@/lib/constants';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { mockUsers } from '@/lib/mockData'; // Using mockUsers directly

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmailPassword: (email: string, password: string, name: string, role: AppUserRole, profileData: Partial<ProfileData>) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUserData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to generate a simple unique ID for mock users
const generateMockId = () => `user${Date.now()}${Math.floor(Math.random() * 1000)}`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initially true to simulate loading

  useEffect(() => {
    // Simulate initial auth check (e.g., from localStorage if we had persistence)
    // For now, just start with no user logged in.
    const storedUser = localStorage.getItem('nexus-mock-user');
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Validate if parsedUser is one of the mockUsers or a previously signed-up mock user
        const foundUser = mockUsers.find(u => u.id === parsedUser.id);
        if (foundUser) {
            setUser(foundUser);
        } else {
            // If not in current mockUsers (e.g. after a refresh where mockUsers is reset), add them
            // This part is tricky with mock data not persisting across hard refreshes if mockUsers is not also stored/retrieved.
            // For simplicity, we'll assume mockUsers might have been "reset" and a new session begins.
            // A more robust mock would involve storing and retrieving mockUsers from localStorage too.
            // For now, if not in current mockUsers list, consider them logged out on refresh.
            localStorage.removeItem('nexus-mock-user');
        }
    }
    setIsLoading(false);
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    // Simulate Google login: use the first mock user or create a generic one if none exist
    let mockGoogleUser = mockUsers.find(u => u.email === 'founder@example.com') || mockUsers[0];
    
    if (!mockGoogleUser) { // Fallback if mockUsers is empty
        mockGoogleUser = {
            id: generateMockId(),
            email: 'googleuser@example.com',
            name: 'Google User',
            role: UserRole.Founder,
            profile: {
              startupName: 'Google Startup',
              industry: INDUSTRIES[0],
              fundingStage: FUNDING_STAGES[0],
              bio: 'Logged in via Google!',
            } as FounderProfile,
            connections: [],
            connectionRequestsSent: [],
            connectionRequestsReceived: [],
            createdAt: new Date().toISOString(),
        };
        mockUsers.push(mockGoogleUser);
    }
    
    setUser(mockGoogleUser);
    localStorage.setItem('nexus-mock-user', JSON.stringify(mockGoogleUser));
    setIsLoading(false);
    return { success: true };
  };

  const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const foundUser = mockUsers.find(u => u.email === email);
    // In a real app, you'd verify the password. Here, we'll just check if user exists.
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('nexus-mock-user', JSON.stringify(foundUser));
      setIsLoading(false);
      return { success: true };
    }
    setIsLoading(false);
    return { success: false, error: "Invalid mock credentials." };
  };

  const signupWithEmailPassword = async (
    email: string,
    password: string, // Password not used in mock
    name: string,
    role: AppUserRole,
    profileData: Partial<ProfileData>
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    setIsLoading(true);
    if (mockUsers.some(u => u.email === email)) {
      setIsLoading(false);
      return { success: false, error: "Mock user with this email already exists." };
    }

    const newUser: User = {
      id: generateMockId(),
      email,
      name,
      role,
      profile: {
        bio: profileData.bio || '',
        location: profileData.location || '',
        website: profileData.website || '',
        profilePictureUrl: profileData.profilePictureUrl || `https://placehold.co/100x100.png?text=${name?.[0] || 'U'}`,
        language: profileData.language || 'en',
        ...(role === UserRole.Founder && profileData as Partial<FounderProfile>),
        ...(role === UserRole.AngelInvestor && profileData as Partial<InvestorProfile>),
        ...(role === UserRole.VC && profileData as Partial<InvestorProfile>),
        ...(role === UserRole.IndustryExpert && profileData as Partial<ExpertProfile>),
      } as ProfileData,
      connections: [],
      connectionRequestsSent: [],
      connectionRequestsReceived: [],
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser); // Add to our in-memory mock user list
    setUser(newUser);
    localStorage.setItem('nexus-mock-user', JSON.stringify(newUser));
    setIsLoading(false);
    return { success: true, user: newUser };
  };

  const logout = async () => {
    setIsLoading(true);
    setUser(null);
    localStorage.removeItem('nexus-mock-user');
    setIsLoading(false);
  };

  const updateUserInContext = async (updatedUserData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No user logged in to update." };
    
    const userIndex = mockUsers.findIndex(u => u.id === user.id);
    if (userIndex === -1) return { success: false, error: "User not found in mock data."};

    // Create a new object for the updated user to ensure state updates correctly
    const updatedUser = {
      ...mockUsers[userIndex],
      ...updatedUserData,
      profile: { // Deep merge profile
        ...(mockUsers[userIndex].profile as ProfileData),
        ...(updatedUserData.profile as Partial<ProfileData>),
      }
    };
    
    mockUsers[userIndex] = updatedUser;
    setUser(updatedUser);
    localStorage.setItem('nexus-mock-user', JSON.stringify(updatedUser));
    return { success: true };
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
