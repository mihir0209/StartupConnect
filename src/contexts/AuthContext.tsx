
"use client";

import type { User, ProfileData, BaseProfile, FounderProfile, InvestorProfile, ExpertProfile, UserRole as AppUserRole, Community } from '@/lib/types';
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS } from '@/lib/constants';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { mockUsers, mockCommunities, mockPosts, mockChats } from '@/lib/mockData'; // Using mockUsers directly

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmailPassword: (email: string, password: string, name: string, role: AppUserRole, profileData: Partial<ProfileData>) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUserData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  sendConnectionRequest: (targetUserId: string) => Promise<{ success: boolean; error?: string }>;
  acceptConnectionRequest: (requesterId: string) => Promise<{ success: boolean; error?: string }>;
  declineConnectionRequest: (requesterId: string) => Promise<{ success: boolean; error?: string }>;
  removeConnection: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
  joinCommunity: (communityId: string) => Promise<{ success: boolean; error?: string }>;
  leaveCommunity: (communityId: string) => Promise<{ success: boolean; error?: string }>;
  createMockChat: (participantIds: string[]) => Promise<{ success: boolean; chatId?: string; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const generateMockId = () => `id${Date.now()}${Math.floor(Math.random() * 1000)}`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUserJson = localStorage.getItem('nexus-mock-user');
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson);
        // Find the user in the current mockUsers array to ensure data consistency
        // especially if mockUsers has been reset/updated in code.
        const liveMockUser = mockUsers.find(u => u.id === storedUser.id);
        if (liveMockUser) {
          setUser(liveMockUser);
        } else {
          // If user from localStorage isn't in current mockUsers, they might be stale
          localStorage.removeItem('nexus-mock-user');
        }
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem('nexus-mock-user');
      }
    }
    setIsLoading(false);
  }, []);

  const updateUserStateAndStorage = (updatedUser: User | null) => {
    setUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem('nexus-mock-user', JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem('nexus-mock-user');
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    let mockGoogleUser = mockUsers.find(u => u.email === 'founder@example.com') || mockUsers[0];
    
    if (!mockGoogleUser) {
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
          language: 'en',
        } as FounderProfile,
        connections: [], connectionRequestsSent: [], connectionRequestsReceived: [],
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(mockGoogleUser);
    }
    
    updateUserStateAndStorage(mockGoogleUser);
    setIsLoading(false);
    return { success: true };
  };

  const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      updateUserStateAndStorage(foundUser);
      setIsLoading(false);
      return { success: true };
    }
    setIsLoading(false);
    return { success: false, error: "Invalid mock credentials." };
  };

  const signupWithEmailPassword = async (
    email: string, password: string, name: string, role: AppUserRole, profileData: Partial<ProfileData>
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    setIsLoading(true);
    if (mockUsers.some(u => u.email === email)) {
      setIsLoading(false);
      return { success: false, error: "Mock user with this email already exists." };
    }

    const newUser: User = {
      id: generateMockId(), email, name, role,
      profile: {
        bio: profileData.bio || "",
        location: profileData.location || "",
        website: profileData.website || "",
        profilePictureUrl: profileData.profilePictureUrl || `https://placehold.co/100x100.png?text=${name?.[0] || 'U'}`,
        language: profileData.language || 'en',
        ...(role === UserRole.Founder && profileData as Partial<FounderProfile>),
        ...(role === UserRole.AngelInvestor && profileData as Partial<InvestorProfile>),
        ...(role === UserRole.VC && profileData as Partial<InvestorProfile>),
        ...(role === UserRole.IndustryExpert && profileData as Partial<ExpertProfile>),
      } as ProfileData,
      connections: [], connectionRequestsSent: [], connectionRequestsReceived: [],
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);
    updateUserStateAndStorage(newUser);
    setIsLoading(false);
    return { success: true, user: newUser };
  };

  const logout = async () => {
    setIsLoading(true);
    updateUserStateAndStorage(null);
    setIsLoading(false);
  };

  const updateUserInContext = async (updatedUserData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No user logged in to update." };
    
    const userIndex = mockUsers.findIndex(u => u.id === user.id);
    if (userIndex === -1) return { success: false, error: "User not found in mock data."};

    const updatedUser = { ...mockUsers[userIndex], ...updatedUserData,
      profile: { ...(mockUsers[userIndex].profile as ProfileData), ...(updatedUserData.profile as Partial<ProfileData>)}
    };
    
    mockUsers[userIndex] = updatedUser;
    updateUserStateAndStorage(updatedUser);
    return { success: true };
  };

  // Connection Management (Mock)
  const sendConnectionRequest = async (targetUserId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const currentUserIndex = mockUsers.findIndex(u => u.id === user.id);
    const targetUserIndex = mockUsers.findIndex(u => u.id === targetUserId);

    if (currentUserIndex === -1 || targetUserIndex === -1) return { success: false, error: "User not found." };

    // Update current user: add to sent, remove from received (if any)
    mockUsers[currentUserIndex].connectionRequestsSent = [...new Set([...mockUsers[currentUserIndex].connectionRequestsSent, targetUserId])];
    mockUsers[currentUserIndex].connectionRequestsReceived = mockUsers[currentUserIndex].connectionRequestsReceived.filter(id => id !== targetUserId);
    mockUsers[currentUserIndex].connections = mockUsers[currentUserIndex].connections.filter(id => id !== targetUserId);


    // Update target user: add to received
    mockUsers[targetUserIndex].connectionRequestsReceived = [...new Set([...mockUsers[targetUserIndex].connectionRequestsReceived, user.id])];
    
    updateUserStateAndStorage({ ...mockUsers[currentUserIndex] }); // Triggers re-render for current user
    return { success: true };
  };

  const acceptConnectionRequest = async (requesterId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const currentUserIndex = mockUsers.findIndex(u => u.id === user.id);
    const requesterUserIndex = mockUsers.findIndex(u => u.id === requesterId);

    if (currentUserIndex === -1 || requesterUserIndex === -1) return { success: false, error: "User not found." };

    // Update current user: add to connections, remove from received
    mockUsers[currentUserIndex].connections = [...new Set([...mockUsers[currentUserIndex].connections, requesterId])];
    mockUsers[currentUserIndex].connectionRequestsReceived = mockUsers[currentUserIndex].connectionRequestsReceived.filter(id => id !== requesterId);

    // Update requester user: add to connections, remove from sent
    mockUsers[requesterUserIndex].connections = [...new Set([...mockUsers[requesterUserIndex].connections, user.id])];
    mockUsers[requesterUserIndex].connectionRequestsSent = mockUsers[requesterUserIndex].connectionRequestsSent.filter(id => id !== user.id);
    
    updateUserStateAndStorage({ ...mockUsers[currentUserIndex] });
    return { success: true };
  };

  const declineConnectionRequest = async (requesterId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const currentUserIndex = mockUsers.findIndex(u => u.id === user.id);
     if (currentUserIndex === -1) return { success: false, error: "User not found." };

    mockUsers[currentUserIndex].connectionRequestsReceived = mockUsers[currentUserIndex].connectionRequestsReceived.filter(id => id !== requesterId);
    // Also remove from target user's sent requests if needed, though less critical for this user's view
    const requesterUserIndex = mockUsers.findIndex(u => u.id === requesterId);
    if (requesterUserIndex !== -1) {
        mockUsers[requesterUserIndex].connectionRequestsSent = mockUsers[requesterUserIndex].connectionRequestsSent.filter(id => id !== user.id);
    }

    updateUserStateAndStorage({ ...mockUsers[currentUserIndex] });
    return { success: true };
  };

  const removeConnection = async (connectionId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const currentUserIndex = mockUsers.findIndex(u => u.id === user.id);
    const connectionUserIndex = mockUsers.findIndex(u => u.id === connectionId);

    if (currentUserIndex === -1 || connectionUserIndex === -1) return { success: false, error: "User not found." };

    mockUsers[currentUserIndex].connections = mockUsers[currentUserIndex].connections.filter(id => id !== connectionId);
    mockUsers[connectionUserIndex].connections = mockUsers[connectionUserIndex].connections.filter(id => id !== user.id);

    updateUserStateAndStorage({ ...mockUsers[currentUserIndex] });
    return { success: true };
  };

  // Community Management (Mock)
  const joinCommunity = async (communityId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const communityIndex = mockCommunities.findIndex(c => c.id === communityId);
    if (communityIndex === -1) return { success: false, error: "Community not found." };

    mockCommunities[communityIndex].members = [...new Set([...mockCommunities[communityIndex].members, user.id])];
    // No need to call updateUserStateAndStorage unless user object itself needs update.
    // Page displaying community will need to re-fetch or re-evaluate mockCommunities.
    return { success: true };
  };

  const leaveCommunity = async (communityId: string): Promise<{ success: boolean; error?: string }> => {
     if (!user) return { success: false, error: "User not logged in." };
    const communityIndex = mockCommunities.findIndex(c => c.id === communityId);
    if (communityIndex === -1) return { success: false, error: "Community not found." };

    mockCommunities[communityIndex].members = mockCommunities[communityIndex].members.filter(id => id !== user.id);
    return { success: true };
  };

  const createMockChat = async (participantIds: string[]): Promise<{ success: boolean; chatId?: string; error?: string }> => {
    if (!user || !participantIds.includes(user.id)) return { success: false, error: "User not authenticated or not part of participants." };

    // Sort participant IDs to create a consistent chat ID for 1-on-1 chats
    const sortedParticipantIds = [...participantIds].sort();
    const potentialChatId = sortedParticipantIds.join('_');

    const existingChat = mockChats.find(chat => {
        if (chat.isGroupChat) return false; // Simple check for 1-on-1
        return chat.participantIds.length === sortedParticipantIds.length && 
               chat.participantIds.every(id => sortedParticipantIds.includes(id));
    });

    if (existingChat) {
        return { success: true, chatId: existingChat.id };
    }

    const newChatId = `chat_${generateMockId()}`;
    const newChat = {
      id: newChatId,
      participantIds: sortedParticipantIds,
      isGroupChat: participantIds.length > 2,
      // lastMessage: undefined, // No message initially
    };
    mockChats.push(newChat);
    return { success: true, chatId: newChatId };
  };


  return (
    <AuthContext.Provider value={{
      user, isLoading,
      loginWithGoogle, loginWithEmailPassword, signupWithEmailPassword, logout, updateUserInContext,
      sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest, removeConnection,
      joinCommunity, leaveCommunity,
      createMockChat
    }}>
      {children}
    </AuthContext.Provider>
  );
};
