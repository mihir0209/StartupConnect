"use client";

import type { User } from '@/lib/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { mockUsers } from '@/lib/mockData'; // For demo purposes

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, id?: string) => Promise<void>; // id for mock login
  logout: () => Promise<void>;
  signup: (userData: User) => Promise<void>;
  updateUserInContext: (updatedUser: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER_ID_KEY = 'nexus_startup_mock_user_id';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const attemptAutoLogin = () => {
      try {
        const storedUserId = localStorage.getItem(MOCK_USER_ID_KEY);
        if (storedUserId) {
          const loggedInUser = mockUsers.find(u => u.id === storedUserId);
          if (loggedInUser) {
            setUser(loggedInUser);
          } else {
            localStorage.removeItem(MOCK_USER_ID_KEY); // Clean up if user not found
          }
        }
      } catch (error) {
        console.error("Failed to auto-login:", error);
        // Could be due to localStorage access issues (e.g. SSR, private browsing)
      } finally {
        setIsLoading(false);
      }
    };
    attemptAutoLogin();
  }, []);

  const login = async (email: string, id?: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const foundUser = id 
      ? mockUsers.find(u => u.id === id) 
      : mockUsers.find(u => u.email === email);

    if (foundUser) {
      setUser(foundUser);
      try {
        localStorage.setItem(MOCK_USER_ID_KEY, foundUser.id);
      } catch (error) {
        console.error("Failed to save user ID to localStorage:", error);
      }
    } else {
      throw new Error("User not found or credentials incorrect");
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    try {
      localStorage.removeItem(MOCK_USER_ID_KEY);
    } catch (error) {
      console.error("Failed to remove user ID from localStorage:", error);
    }
    setIsLoading(false);
  };

  const signup = async (userData: User) => {
    setIsLoading(true);
    // Simulate API call to create user
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real app, this would come from the backend response
    const newUser = { ...userData, createdAt: new Date().toISOString() };
    mockUsers.push(newUser); // Add to mock data for demo
    setUser(newUser);
    try {
      localStorage.setItem(MOCK_USER_ID_KEY, newUser.id);
    } catch (error) {
      console.error("Failed to save user ID to localStorage:", error);
    }
    setIsLoading(false);
  };
  
  const updateUserInContext = (updatedUser: User) => {
    setUser(updatedUser);
    // Optionally update mockUsers array if it's meant to be a persistent mock store for the session
    const userIndex = mockUsers.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = updatedUser;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signup, updateUserInContext }}>
      {children}
    </AuthContext.Provider>
  );
};
