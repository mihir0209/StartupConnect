
"use client";

import type { User, ProfileData, BaseProfile, FounderProfile, InvestorProfile, ExpertProfile, UserRole as AppUserRole, Community, Chat, Message } from '@/lib/types';
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS } from '@/lib/constants';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { mockUsers, mockCommunities, mockPosts, mockChats } from '@/lib/mockData'; 

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
  createMockChat: (participantIds: string[]) => Promise<{ success: boolean; chatId?: string; error?: string, chat?: Chat }>;
  sendMessage: (chatId: string, senderId: string, content: string) => Promise<{ success: boolean; newMessage?: Message; error?: string }>;
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
        const storedUser = JSON.parse(storedUserJson) as User;
        const liveMockUser = mockUsers.find(u => u.id === storedUser.id);
        if (liveMockUser) {
          // Ensure the live mock user's connections/requests are up-to-date with potentially modified mockUsers array
          const fullyUpdatedUser = {
            ...liveMockUser,
            connections: liveMockUser.connections || [],
            connectionRequestsSent: liveMockUser.connectionRequestsSent || [],
            connectionRequestsReceived: liveMockUser.connectionRequestsReceived || [],
          };
          setUser(fullyUpdatedUser);
        } else {
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
    // Simulate login with a default mock user or the first one
    let mockGoogleUser = mockUsers.find(u => u.email === 'founder@example.com') || mockUsers[0];
    
    if (!mockGoogleUser) { // Fallback if mockUsers is empty for some reason
       mockGoogleUser = {
        id: generateMockId(),
        email: 'defaultuser@example.com',
        name: 'Default User',
        role: UserRole.Founder,
        profile: { startupName: 'My Startup', industry: INDUSTRIES[0], fundingStage: FUNDING_STAGES[0] } as FounderProfile,
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
    const foundUser = mockUsers.find(u => u.email === email); // Password check omitted for mock
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
      } as ProfileData, // Type assertion
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
    if (userIndex === -1) {
      // This might happen if mockUsers array was somehow reset but user state wasn't
      // For mock, let's assume user should exist if context.user is set
      // Could also create a new entry if not found and update, but let's keep it simple
      return { success: false, error: "User not found in mock data for update."};
    }

    const updatedUser = { 
      ...mockUsers[userIndex], 
      ...updatedUserData,
      // Deep merge profile if it's part of updatedUserData
      profile: updatedUserData.profile 
                 ? { ...(mockUsers[userIndex].profile as ProfileData), ...(updatedUserData.profile as Partial<ProfileData>)} 
                 : mockUsers[userIndex].profile
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
    
    const currentUserData = mockUsers[currentUserIndex];
    currentUserData.connectionRequestsSent = [...new Set([...(currentUserData.connectionRequestsSent || []), targetUserId])];
    currentUserData.connectionRequestsReceived = (currentUserData.connectionRequestsReceived || []).filter(id => id !== targetUserId); // In case of mutual requests
    currentUserData.connections = (currentUserData.connections || []).filter(id => id !== targetUserId);


    const targetUserData = mockUsers[targetUserIndex];
    targetUserData.connectionRequestsReceived = [...new Set([...(targetUserData.connectionRequestsReceived || []), user.id])];
    
    updateUserStateAndStorage({ ...currentUserData }); 
    return { success: true };
  };

  const acceptConnectionRequest = async (requesterId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const currentUserIndex = mockUsers.findIndex(u => u.id === user.id);
    const requesterUserIndex = mockUsers.findIndex(u => u.id === requesterId);

    if (currentUserIndex === -1 || requesterUserIndex === -1) return { success: false, error: "User not found." };

    const currentUserData = mockUsers[currentUserIndex];
    currentUserData.connections = [...new Set([...(currentUserData.connections || []), requesterId])];
    currentUserData.connectionRequestsReceived = (currentUserData.connectionRequestsReceived || []).filter(id => id !== requesterId);

    const requesterUserData = mockUsers[requesterUserIndex];
    requesterUserData.connections = [...new Set([...(requesterUserData.connections || []), user.id])];
    requesterUserData.connectionRequestsSent = (requesterUserData.connectionRequestsSent || []).filter(id => id !== user.id);
    
    updateUserStateAndStorage({ ...currentUserData });
    return { success: true };
  };

  const declineConnectionRequest = async (requesterId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const currentUserIndex = mockUsers.findIndex(u => u.id === user.id);
     if (currentUserIndex === -1) return { success: false, error: "User not found." };

    const currentUserData = mockUsers[currentUserIndex];
    currentUserData.connectionRequestsReceived = (currentUserData.connectionRequestsReceived || []).filter(id => id !== requesterId);
    
    const requesterUserIndex = mockUsers.findIndex(u => u.id === requesterId);
    if (requesterUserIndex !== -1) {
        mockUsers[requesterUserIndex].connectionRequestsSent = (mockUsers[requesterUserIndex].connectionRequestsSent || []).filter(id => id !== user.id);
    }

    updateUserStateAndStorage({ ...currentUserData });
    return { success: true };
  };

  const removeConnection = async (connectionId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const currentUserIndex = mockUsers.findIndex(u => u.id === user.id);
    const connectionUserIndex = mockUsers.findIndex(u => u.id === connectionId);

    if (currentUserIndex === -1 || connectionUserIndex === -1) return { success: false, error: "User not found." };

    const currentUserData = mockUsers[currentUserIndex];
    currentUserData.connections = (currentUserData.connections || []).filter(id => id !== connectionId);

    const connectionUserData = mockUsers[connectionUserIndex];
    connectionUserData.connections = (connectionUserData.connections || []).filter(id => id !== user.id);

    updateUserStateAndStorage({ ...currentUserData });
    return { success: true };
  };

  // Community Management (Mock)
  const joinCommunity = async (communityId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const communityIndex = mockCommunities.findIndex(c => c.id === communityId);
    if (communityIndex === -1) return { success: false, error: "Community not found." };

    mockCommunities[communityIndex].members = [...new Set([...mockCommunities[communityIndex].members, user.id])];
    return { success: true };
  };

  const leaveCommunity = async (communityId: string): Promise<{ success: boolean; error?: string }> => {
     if (!user) return { success: false, error: "User not logged in." };
    const communityIndex = mockCommunities.findIndex(c => c.id === communityId);
    if (communityIndex === -1) return { success: false, error: "Community not found." };

    mockCommunities[communityIndex].members = mockCommunities[communityIndex].members.filter(id => id !== user.id);
    return { success: true };
  };

  const createMockChat = async (participantIds: string[]): Promise<{ success: boolean; chatId?: string; error?: string, chat?: Chat }> => {
    if (!user || !participantIds.includes(user.id)) return { success: false, error: "User not authenticated or not part of participants." };

    const sortedParticipantIds = [...participantIds].sort();
    
    let existingChat = mockChats.find(chat => {
        if (chat.isGroupChat && sortedParticipantIds.length > 2) { // Group chat check
             return chat.participantIds.length === sortedParticipantIds.length && 
                    chat.participantIds.every(id => sortedParticipantIds.includes(id));
        } else if (!chat.isGroupChat && sortedParticipantIds.length === 2) { // 1-on-1 chat check
            return chat.participantIds.length === sortedParticipantIds.length && 
                   chat.participantIds.every(id => sortedParticipantIds.includes(id));
        }
        return false;
    });

    if (existingChat) {
        return { success: true, chatId: existingChat.id, chat: existingChat };
    }

    const newChatId = `chat_${generateMockId()}`;
    const newChat: Chat = {
      id: newChatId,
      participantIds: sortedParticipantIds,
      messages: [], // Initialize with empty messages
      isGroupChat: participantIds.length > 2,
      // lastMessage: undefined, // No message initially
      ...(participantIds.length > 2 && { groupName: 'New Group' }) // Basic group name
    };
    mockChats.unshift(newChat); // Add to beginning to appear first in lists
    return { success: true, chatId: newChatId, chat: newChat };
  };

  const sendMessage = async (chatId: string, senderId: string, content: string): Promise<{ success: boolean; newMessage?: Message; error?: string }> => {
    const chatIndex = mockChats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) {
      return { success: false, error: "Chat not found." };
    }

    const newMessage: Message = {
      id: `msg_${generateMockId()}`,
      chatId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
    };

    mockChats[chatIndex].messages.push(newMessage);
    mockChats[chatIndex].lastMessage = newMessage;

    // Move this chat to the top of the mockChats array for recent activity
    const updatedChat = mockChats.splice(chatIndex, 1)[0];
    mockChats.unshift(updatedChat);
    
    // No need to call updateUserStateAndStorage unless user object itself needs update.
    // The MessagesPage will re-render due to navigation or other state changes.
    return { success: true, newMessage };
  };


  return (
    <AuthContext.Provider value={{
      user, isLoading,
      loginWithGoogle, loginWithEmailPassword, signupWithEmailPassword, logout, updateUserInContext,
      sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest, removeConnection,
      joinCommunity, leaveCommunity,
      createMockChat, sendMessage
    }}>
      {children}
    </AuthContext.Provider>
  );
};
