
"use client";

import type { User, ProfileData, BaseProfile, FounderProfile, InvestorProfile, ExpertProfile, UserRole as AppUserRole, Community, Chat, Message } from '@/lib/types';
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS } from '@/lib/constants';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { mockUsers, mockCommunities, mockPosts, mockChats } from '@/lib/mockData'; 

// Simulate Firebase Auth user object structure
interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  // Add other fields if needed by Firebase Auth provider data
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  profileCompletionRequired: boolean;
  pendingFirebaseUser: { uid: string; email?: string | null; displayName?: string | null } | null;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithLinkedIn: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmailPassword: (email: string, password: string, name: string, role: AppUserRole, profileData: Partial<ProfileData>) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUserData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  completeNewUserProfile: (data: { name: string; role: AppUserRole; profileData: Partial<ProfileData> }) => Promise<{ success: boolean; error?: string; user?: User }>;
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
  const [profileCompletionRequired, setProfileCompletionRequired] = useState(false);
  const [pendingFirebaseUser, setPendingFirebaseUser] = useState<{ uid: string; email?: string | null; displayName?: string | null } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const storedUserJson = localStorage.getItem('startupconnect-mock-user');
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson) as User;
        const liveMockUser = mockUsers.find(u => u.id === storedUser.id);
        if (liveMockUser) {
          setUser({
            ...liveMockUser,
            connections: liveMockUser.connections || [],
            connectionRequestsSent: liveMockUser.connectionRequestsSent || [],
            connectionRequestsReceived: liveMockUser.connectionRequestsReceived || [],
          });
        } else {
          localStorage.removeItem('startupconnect-mock-user');
        }
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem('startupconnect-mock-user');
      }
    }
    setIsLoading(false);
  }, []);

  const updateUserStateAndStorage = (updatedUser: User | null) => {
    setUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem('startupconnect-mock-user', JSON.stringify(updatedUser));
      const userIndex = mockUsers.findIndex(u => u.id === updatedUser.id);
      if (userIndex !== -1) {
        mockUsers[userIndex] = updatedUser;
      } else {
        // This case might happen if a new user is created and immediately set
        mockUsers.push(updatedUser);
      }
      setProfileCompletionRequired(false); // User is now fully set up
      setPendingFirebaseUser(null);
    } else {
      localStorage.removeItem('startupconnect-mock-user');
      // Don't reset profileCompletionRequired or pendingFirebaseUser here
      // as logout might happen before completion.
    }
  };

  const checkAndHandleNewUser = (firebaseUid: string, firebaseEmail: string | null, firebaseDisplayName: string | null): boolean => {
    const existingUser = mockUsers.find(u => u.id === firebaseUid);
    if (existingUser) {
      updateUserStateAndStorage(existingUser);
      return true; // User exists and is logged in
    } else {
      setPendingFirebaseUser({ uid: firebaseUid, email: firebaseEmail, displayName: firebaseDisplayName });
      setProfileCompletionRequired(true);
      setUser(null); // Ensure main user is null while completion is pending
      setIsLoading(false);
      return false; // User is new, needs profile completion
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    // Simulate Firebase Google Auth providing a FirebaseUser object
    const mockFirebaseUser: FirebaseUser = {
      uid: 'google_' + generateMockId(),
      email: 'newgoogleuser@example.com',
      displayName: 'Google User ' + Math.floor(Math.random() * 100),
    };
    
    if (!checkAndHandleNewUser(mockFirebaseUser.uid, mockFirebaseUser.email, mockFirebaseUser.displayName)) {
      // New user, profile completion will be handled by UI redirection
      setIsLoading(false);
      return { success: true }; // Success in terms of Firebase auth, frontend will redirect
    }
    setIsLoading(false);
    return { success: true };
  };

  const loginWithLinkedIn = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    // Simulate LinkedIn providing enough data for direct profile creation
    const mockLinkedInFirebaseUid = 'linkedin_' + generateMockId();
    let linkedInUser = mockUsers.find(u => u.id === mockLinkedInFirebaseUid); // Check if already "signed up" via LinkedIn

    if (!linkedInUser) {
      linkedInUser = {
        id: mockLinkedInFirebaseUid,
        email: `linkedin${Math.floor(Math.random() * 10000)}@example.com`,
        name: 'LinkedIn User ' + Math.floor(Math.random() * 100),
        role: UserRole.IndustryExpert, // Default role for mock LinkedIn
        profile: {
          areaOfExpertise: EXPERTISE_AREAS[Math.floor(Math.random() * EXPERTISE_AREAS.length)],
          yearsOfExperience: Math.floor(Math.random() * 10) + 1,
          bio: "Experienced professional leveraging LinkedIn for connections.",
          location: "San Francisco, USA",
          profilePictureUrl: `https://placehold.co/100x100.png?text=LI`,
          language: 'en',
        } as ExpertProfile,
        connections: [], connectionRequestsSent: [], connectionRequestsReceived: [],
        createdAt: new Date().toISOString(),
      };
      // No need to push to mockUsers here, updateUserStateAndStorage will handle it
    }
    updateUserStateAndStorage(linkedInUser);
    setIsLoading(false);
    return { success: true };
  };

  const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    // Simulate Firebase email/password auth
    // For mock, we find user by email. In real Firebase, uid would be the primary key.
    // Let's assume email is unique and can serve as a mock uid for this lookup in mockUsers if ID isn't already Firebase UID.
    const foundUserInMock = mockUsers.find(u => u.email === email); 
    
    if (foundUserInMock) {
      // If user exists, this simulates successful Firebase auth.
      // The ID in mockUsers might or might not be a "Firebase UID".
      // For this mock, we'll proceed as if it is, and if it's the "first time"
      // (meaning they don't have a Firebase-like ID), it would still hit the new user flow.
      // More robustly, we'd assume the ID in mockUsers for email users IS their Firebase UID.
      if(!checkAndHandleNewUser(foundUserInMock.id, foundUserInMock.email, foundUserInMock.name)){
         // This means the foundUserInMock.id was not considered a "Firebase UID" (e.g. 'user1')
         // and profile completion is now required. This typically shouldn't happen if email users
         // are always created with a Firebase UID from the start.
         // For safety, if checkAndHandleNewUser decides it's a new Firebase user (e.g. by ID format),
         // it will set pending state.
      }
    } else {
      setIsLoading(false);
      return { success: false, error: "Mock login failed: User not found or incorrect password." };
    }
    setIsLoading(false);
    return { success: true };
  };

  const signupWithEmailPassword = async (
    email: string, password: string, name: string /* name from step 1 */, role: AppUserRole, profileData: Partial<ProfileData>
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    setIsLoading(true);
    if (mockUsers.some(u => u.email === email)) {
      setIsLoading(false);
      return { success: false, error: "Mock user with this email already exists." };
    }

    // Simulate Firebase createUserWithEmailAndPassword
    const mockFirebaseUid = 'email_' + generateMockId();

    // For direct signup, we go through the same "new user" check which sets pending state
    // if this UID isn't already in mockUsers (which it won't be).
    // The actual profile data is then collected in the profile-setup page.
    // The role and profileData passed here are from the original multi-step form
    // and will be used by `completeNewUserProfile` if called directly.
    // However, the typical flow now is:
    // 1. Firebase Auth (signup) -> get UID, email
    // 2. AuthContext: set pendingFirebaseUser, profileCompletionRequired = true
    // 3. Redirect to /settings/profile-setup
    // 4. profile-setup page collects role, profileData, name -> calls completeNewUserProfile

    // For this legacy signup flow, if it's called, we'll use the provided data immediately
    // But the preferred path is Firebase auth first, then profile setup.
    // Let's assume this function now primarily just establishes the Firebase auth part.
    
    setPendingFirebaseUser({ uid: mockFirebaseUid, email: email, displayName: name });
    setProfileCompletionRequired(true);
    setUser(null);
    setIsLoading(false);
    return { success: true }; // Indicates Firebase auth part is done, redirect for profile.
  };

  const completeNewUserProfile = async (data: { name: string; role: AppUserRole; profileData: Partial<ProfileData> }): Promise<{ success: boolean; error?: string; user?: User }> => {
    if (!pendingFirebaseUser) {
      return { success: false, error: "No pending Firebase user to complete profile for." };
    }

    const newUser: User = {
      id: pendingFirebaseUser.uid, // Use Firebase UID as the main ID
      email: pendingFirebaseUser.email || 'unknown@example.com', // Fallback, should always have email
      name: data.name,
      role: data.role,
      profile: {
        bio: data.profileData.bio ?? "",
        location: data.profileData.location ?? "",
        website: data.profileData.website ?? "",
        profilePictureUrl: data.profileData.profilePictureUrl || `https://placehold.co/100x100.png?text=${data.name?.[0] || 'U'}`,
        language: (data.profileData as BaseProfile).language || 'en',
        ...(data.role === UserRole.Founder && data.profileData as Partial<FounderProfile>),
        ...( (data.role === UserRole.AngelInvestor || data.role === UserRole.VC) && data.profileData as Partial<InvestorProfile>),
        ...(data.role === UserRole.IndustryExpert && data.profileData as Partial<ExpertProfile>),
      } as ProfileData,
      connections: [], connectionRequestsSent: [], connectionRequestsReceived: [],
      createdAt: new Date().toISOString(),
    };
    
    updateUserStateAndStorage(newUser); // This will also add to mockUsers if not present
    return { success: true, user: newUser };
  };

  const logout = async () => {
    setIsLoading(true);
    updateUserStateAndStorage(null); // Clears main user
    // Explicitly clear pending states on logout to prevent redirection issues if logout happens mid-completion
    setPendingFirebaseUser(null);
    setProfileCompletionRequired(false);
    setIsLoading(false);
  };

  const updateUserInContext = async (updatedUserData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No user logged in to update." };
    
    const userIndex = mockUsers.findIndex(u => u.id === user.id);
    if (userIndex === -1) {
      return { success: false, error: "User not found in mock data for update."};
    }

    const updatedUserFull = { 
      ...mockUsers[userIndex], 
      ...updatedUserData,
      profile: updatedUserData.profile 
                 ? { ...(mockUsers[userIndex].profile as ProfileData), ...(updatedUserData.profile as Partial<ProfileData>)} 
                 : mockUsers[userIndex].profile
    } as User; // Ensure it's cast to User
    
    mockUsers[userIndex] = updatedUserFull; 
    updateUserStateAndStorage(updatedUserFull); 
    return { success: true };
  };

  const sendConnectionRequest = async (targetUserId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const currentUserIndex = mockUsers.findIndex(u => u.id === user.id);
    const targetUserIndex = mockUsers.findIndex(u => u.id === targetUserId);

    if (currentUserIndex === -1 || targetUserIndex === -1) return { success: false, error: "User not found." };
    
    const currentUserData = { ...mockUsers[currentUserIndex] }; 
    currentUserData.connectionRequestsSent = [...new Set([...(currentUserData.connectionRequestsSent || []), targetUserId])];
    currentUserData.connectionRequestsReceived = (currentUserData.connectionRequestsReceived || []).filter(id => id !== targetUserId);
    currentUserData.connections = (currentUserData.connections || []).filter(id => id !== targetUserId);
    
    const targetUserData = mockUsers[targetUserIndex]; 
    targetUserData.connectionRequestsReceived = [...new Set([...(targetUserData.connectionRequestsReceived || []), user.id])];
    
    updateUserStateAndStorage(currentUserData); 
    return { success: true };
  };

  const acceptConnectionRequest = async (requesterId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const currentUserIndex = mockUsers.findIndex(u => u.id === user.id);
    const requesterUserIndex = mockUsers.findIndex(u => u.id === requesterId);

    if (currentUserIndex === -1 || requesterUserIndex === -1) return { success: false, error: "User not found." };

    const currentUserData = { ...mockUsers[currentUserIndex] };
    currentUserData.connections = [...new Set([...(currentUserData.connections || []), requesterId])];
    currentUserData.connectionRequestsReceived = (currentUserData.connectionRequestsReceived || []).filter(id => id !== requesterId);

    const requesterUserData = mockUsers[requesterUserIndex];
    requesterUserData.connections = [...new Set([...(requesterUserData.connections || []), user.id])];
    requesterUserData.connectionRequestsSent = (requesterUserData.connectionRequestsSent || []).filter(id => id !== user.id);
    
    updateUserStateAndStorage(currentUserData);
    return { success: true };
  };

  const declineConnectionRequest = async (requesterId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const currentUserIndex = mockUsers.findIndex(u => u.id === user.id);
     if (currentUserIndex === -1) return { success: false, error: "User not found." };

    const currentUserData = { ...mockUsers[currentUserIndex] };
    currentUserData.connectionRequestsReceived = (currentUserData.connectionRequestsReceived || []).filter(id => id !== requesterId);
    
    const requesterUserIndex = mockUsers.findIndex(u => u.id === requesterId);
    if (requesterUserIndex !== -1) {
        mockUsers[requesterUserIndex].connectionRequestsSent = (mockUsers[requesterUserIndex].connectionRequestsSent || []).filter(id => id !== user.id);
    }

    updateUserStateAndStorage(currentUserData);
    return { success: true };
  };

  const removeConnection = async (connectionId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const currentUserIndex = mockUsers.findIndex(u => u.id === user.id);
    const connectionUserIndex = mockUsers.findIndex(u => u.id === connectionId);

    if (currentUserIndex === -1 || connectionUserIndex === -1) return { success: false, error: "User not found." };

    const currentUserData = { ...mockUsers[currentUserIndex] };
    currentUserData.connections = (currentUserData.connections || []).filter(id => id !== connectionId);

    const connectionUserData = mockUsers[connectionUserIndex];
    connectionUserData.connections = (connectionUserData.connections || []).filter(id => id !== user.id);

    updateUserStateAndStorage(currentUserData);
    return { success: true };
  };

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
        if (sortedParticipantIds.length === 2 && !chat.isGroupChat) { 
            return chat.participantIds.length === 2 && 
                   chat.participantIds.every(id => sortedParticipantIds.includes(id));
        }
        if (sortedParticipantIds.length > 2 && chat.isGroupChat) { 
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
      messages: [], 
      isGroupChat: participantIds.length > 2,
      ...(participantIds.length > 2 && { groupName: 'New Group' }) 
    };
    mockChats.unshift(newChat); 
    return { success: true, chatId: newChatId, chat: newChat };
  };

  const sendMessage = async (chatId: string, senderId: string, content: string): Promise<{ success: boolean; newMessage?: Message; error?: string }> => {
    const chatIndex = mockChats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) {
      return { success: false, error: "Chat not found." };
    }

    const newMessageData: Message = {
      id: `msg_${generateMockId()}`,
      chatId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
    };

    mockChats[chatIndex].messages.push(newMessageData);
    mockChats[chatIndex].lastMessage = newMessageData;

    const updatedChat = mockChats.splice(chatIndex, 1)[0];
    mockChats.unshift(updatedChat);
    
    return { success: true, newMessage: newMessageData };
  };


  return (
    <AuthContext.Provider value={{
      user, isLoading, profileCompletionRequired, pendingFirebaseUser,
      loginWithGoogle, loginWithLinkedIn, loginWithEmailPassword, signupWithEmailPassword, logout, updateUserInContext,
      completeNewUserProfile,
      sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest, removeConnection,
      joinCommunity, leaveCommunity,
      createMockChat, sendMessage
    }}>
      {children}
    </AuthContext.Provider>
  );
};
