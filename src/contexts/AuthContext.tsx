
"use client";

import type { User, ProfileData, BaseProfile, FounderProfile, InvestorProfile, ExpertProfile, UserRole as AppUserRole, Community, Chat, Message, CofounderListing } from '@/lib/types';
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS, APP_NAME } from '@/lib/constants';
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { mockUsers, mockCommunities, mockPosts, mockChats, mockCofounderListings } from '@/lib/mockData';

// Simplified structure for pending user info, not tied to any specific auth provider SDK
interface PendingNewUserInfo {
  uid: string; // This will be a mock-generated ID
  email: string | null;
  displayName: string | null;
  provider?: 'google' | 'email' | 'linkedin'; // To optionally know the source
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  profileCompletionRequired: boolean;
  pendingNewUserInfo: PendingNewUserInfo | null; // Renamed
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithLinkedIn: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmailPassword: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; needsProfileCompletion?: boolean }>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUserData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  completeNewUserProfile: (data: { name: string; role: AppUserRole; profileData: Partial<ProfileData> }) => Promise<{ success: boolean; error?: string; user?: User }>;
  sendConnectionRequest: (targetUserId: string) => Promise<{ success: boolean; error?: string }>;
  acceptConnectionRequest: (requesterId: string) => Promise<{ success: boolean; error?: string }>;
  declineConnectionRequest: (requesterId: string) => Promise<{ success: boolean; error?: string }>;
  removeConnection: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
  joinCommunity: (communityId: string) => Promise<{ success: boolean; error?: string }>;
  leaveCommunity: (communityId: string) => Promise<{ success: boolean; error?: string }>;
  createCommunity: (communityData: { name: string; description: string; industry: string }) => Promise<{ success: boolean; communityId?: string; error?: string }>;
  createCofounderListing: (listingData: Omit<CofounderListing, 'id' | 'userId' | 'createdAt'>) => Promise<{ success: boolean; listingId?: string; error?: string }>;
  createMockChat: (participantIds: string[]) => Promise<{ success: boolean; chatId?: string; error?: string, chat?: Chat }>;
  sendMessage: (chatId: string, senderId: string, content: string) => Promise<{ success: boolean; newMessage?: Message; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const generateMockId = (prefix: string = 'mockId_') => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
const LOCAL_STORAGE_USER_KEY = `${APP_NAME.toLowerCase().replace(/\s+/g, '-')}-mock-user`;
const LOCAL_STORAGE_PENDING_USER_KEY = `${APP_NAME.toLowerCase().replace(/\s+/g, '-')}-pending-new-user`;


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCompletionRequired, setProfileCompletionRequired] = useState(false);
  const [pendingNewUserInfo, setPendingNewUserInfo] = useState<PendingNewUserInfo | null>(null); // Renamed

  const updateUserInMockDataArray = (updatedUser: User) => {
    const userIndex = mockUsers.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = updatedUser;
    } else {
      mockUsers.push(updatedUser);
    }
  };

  const updateUserStateAndStorage = useCallback((currentUser: User | null) => {
    setUser(currentUser);
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(currentUser));
      updateUserInMockDataArray(currentUser);
      setProfileCompletionRequired(false);
      setPendingNewUserInfo(null); // Clear pending info when user is set
      localStorage.removeItem(LOCAL_STORAGE_PENDING_USER_KEY);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedUserJson = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      const storedPendingUserJson = localStorage.getItem(LOCAL_STORAGE_PENDING_USER_KEY);

      if (storedUserJson) {
        const storedUser = JSON.parse(storedUserJson) as User;
        const liveMockUser = mockUsers.find(u => u.id === storedUser.id);
        if (liveMockUser) {
             const mergedUser = {
                ...liveMockUser, 
                name: storedUser.name,
                email: storedUser.email,
                role: storedUser.role,
                profile: storedUser.profile,
             };
            setUser(mergedUser);
        } else {
            setUser(storedUser);
            mockUsers.push(storedUser); 
        }
      } else if (storedPendingUserJson) {
        const pendingInfo = JSON.parse(storedPendingUserJson) as PendingNewUserInfo;
        setPendingNewUserInfo(pendingInfo);
        setProfileCompletionRequired(true);
      }
    } catch (e) {
      console.error("Error loading user state from localStorage:", e);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_PENDING_USER_KEY);
    }
    setIsLoading(false);
  }, []);


  const checkAndHandleNewUserFlow = (
    uid: string,
    email: string | null,
    displayName: string | null,
    provider?: 'google' | 'email' | 'linkedin' // Added linkedin here
  ): boolean => {
    const existingUser = mockUsers.find(u => u.id === uid || (email && u.email === email));
    if (existingUser) {
      updateUserStateAndStorage(existingUser);
      return false; 
    } else {
      const newPendingInfo: PendingNewUserInfo = { uid, email, displayName, provider };
      setPendingNewUserInfo(newPendingInfo);
      localStorage.setItem(LOCAL_STORAGE_PENDING_USER_KEY, JSON.stringify(newPendingInfo));
      setProfileCompletionRequired(true);
      setUser(null);
      return true; 
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const mockGoogleUID = generateMockId('google_');
    const mockGoogleEmail = `googleuser${Math.floor(Math.random() * 10000)}@example.com`;
    const mockGoogleName = 'Google User ' + Math.floor(Math.random() * 100);

    checkAndHandleNewUserFlow(mockGoogleUID, mockGoogleEmail, mockGoogleName, 'google');
    setIsLoading(false);
    return { success: true };
  };

  const loginWithLinkedIn = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    let linkedInUser = mockUsers.find(u => u.email === 'expert@example.com'); // Try to find a specific mock user
    if (!linkedInUser) {
      const mockLinkedInUID = generateMockId('linkedin_');
      linkedInUser = {
        id: mockLinkedInUID,
        email: `linkedin${Math.floor(Math.random() * 10000)}@example.com`,
        name: 'LinkedIn User ' + Math.floor(Math.random() * 100),
        role: UserRole.IndustryExpert, // Default role for mock LinkedIn
        profile: {
          areaOfExpertise: EXPERTISE_AREAS[Math.floor(Math.random() * EXPERTISE_AREAS.length)],
          yearsOfExperience: Math.floor(Math.random() * 10) + 1,
          bio: "Experienced professional from StartupConnect (via mock LinkedIn).",
          location: "Professional Network City",
          profilePictureUrl: `https://placehold.co/100x100.png?text=LI`,
          language: 'en',
        } as ExpertProfile,
        connections: [], connectionRequestsSent: [], connectionRequestsReceived: [],
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(linkedInUser); 
    }
    updateUserStateAndStorage(linkedInUser); // LinkedIn users directly log in, no profile completion for mock
    setIsLoading(false);
    return { success: true };
  };

  const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const foundUserInMock = mockUsers.find(u => u.email === email);

    if (foundUserInMock) {
      updateUserStateAndStorage(foundUserInMock);
    } else {
      // Simulate a new user if login fails but we want to guide them to signup/profile completion
      const mockUID = generateMockId('email_fail_login_');
      // For this mock, if login fails, we don't auto-create a pending user.
      // The user must explicitly sign up.
      setIsLoading(false);
      return { success: false, error: "Login failed: User not found or incorrect password." };
    }
    setIsLoading(false);
    return { success: true };
  };

  const signupWithEmailPassword = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string; needsProfileCompletion?: boolean }> => {
    setIsLoading(true);
    if (mockUsers.some(u => u.email === email)) {
      setIsLoading(false);
      return { success: false, error: "User with this email already exists." };
    }

    const mockNewUID = generateMockId('email_signup_');
    const newPendingInfo: PendingNewUserInfo = {
      uid: mockNewUID,
      email: email,
      displayName: name,
      provider: 'email'
    };
    setPendingNewUserInfo(newPendingInfo);
    localStorage.setItem(LOCAL_STORAGE_PENDING_USER_KEY, JSON.stringify(newPendingInfo));
    setProfileCompletionRequired(true);
    setUser(null); 
    setIsLoading(false);
    return { success: true, needsProfileCompletion: true };
  };

  const completeNewUserProfile = async (data: { name: string; role: AppUserRole; profileData: Partial<ProfileData> }): Promise<{ success: boolean; error?: string; user?: User }> => {
    if (!pendingNewUserInfo) {
      return { success: false, error: "No pending user information to complete profile for." };
    }

    const newUser: User = {
      id: pendingNewUserInfo.uid,
      email: pendingNewUserInfo.email || 'unknown@example.com',
      name: data.name,
      role: data.role,
      profile: {
        bio: data.profileData.bio ?? "",
        location: data.profileData.location ?? "",
        website: data.profileData.website ?? "",
        profilePictureUrl: data.profileData.profilePictureUrl || `https://placehold.co/100x100.png?text=${data.name?.[0]?.toUpperCase() || 'U'}`,
        language: (data.profileData as BaseProfile).language || 'en',
        ...(data.role === UserRole.Founder && {
          startupName: (data.profileData as FounderProfile).startupName ?? "",
          industry: (data.profileData as FounderProfile).industry ?? INDUSTRIES[0],
          fundingStage: (data.profileData as FounderProfile).fundingStage ?? FUNDING_STAGES[0],
          traction: (data.profileData as FounderProfile).traction ?? "",
          needs: (data.profileData as FounderProfile).needs ?? "",
        }),
        ...( (data.role === UserRole.AngelInvestor || data.role === UserRole.VC) && {
          investmentFocus: (data.profileData as InvestorProfile).investmentFocus ?? [],
          fundingRange: (data.profileData as InvestorProfile).fundingRange ?? "",
          portfolioHighlights: (data.profileData as InvestorProfile).portfolioHighlights ?? "",
          fundSize: (data.profileData as InvestorProfile).fundSize ?? "",
          preferredFundingStages: (data.profileData as InvestorProfile).preferredFundingStages ?? [],
        }),
        ...(data.role === UserRole.IndustryExpert && {
          areaOfExpertise: (data.profileData as ExpertProfile).areaOfExpertise ?? EXPERTISE_AREAS[0],
          yearsOfExperience: (data.profileData as ExpertProfile).yearsOfExperience ?? 0,
          servicesOffered: (data.profileData as ExpertProfile).servicesOffered ?? "",
        }),
      } as ProfileData,
      connections: [], connectionRequestsSent: [], connectionRequestsReceived: [],
      createdAt: new Date().toISOString(),
    };

    updateUserStateAndStorage(newUser);
    return { success: true, user: newUser };
  };

  const logout = async () => {
    setIsLoading(true);
    updateUserStateAndStorage(null);
    setPendingNewUserInfo(null);
    localStorage.removeItem(LOCAL_STORAGE_PENDING_USER_KEY);
    setProfileCompletionRequired(false);
    setIsLoading(false);
  };

  const updateUserInContext = async (updatedUserData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No user logged in to update." };
    
    const currentUserFromMock = mockUsers.find(u => u.id === user.id);
    if (!currentUserFromMock) return { success: false, error: "User not found in mock data for update." };

    const updatedUserFull = {
      ...currentUserFromMock,
      ...updatedUserData,
      profile: updatedUserData.profile
                 ? { ...(currentUserFromMock.profile as ProfileData), ...(updatedUserData.profile as Partial<ProfileData>)}
                 : currentUserFromMock.profile
    } as User;
    
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
    
    const targetUserData = { ...mockUsers[targetUserIndex] }; 
    targetUserData.connectionRequestsReceived = [...new Set([...(targetUserData.connectionRequestsReceived || []), user.id])];
    
    mockUsers[currentUserIndex] = currentUserData;
    mockUsers[targetUserIndex] = targetUserData;
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

    const requesterUserData = { ...mockUsers[requesterUserIndex] };
    requesterUserData.connections = [...new Set([...(requesterUserData.connections || []), user.id])];
    requesterUserData.connectionRequestsSent = (requesterUserData.connectionRequestsSent || []).filter(id => id !== user.id);
    
    mockUsers[currentUserIndex] = currentUserData;
    mockUsers[requesterUserIndex] = requesterUserData;
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
        const requesterUserData = { ...mockUsers[requesterUserIndex] };
        requesterUserData.connectionRequestsSent = (requesterUserData.connectionRequestsSent || []).filter(id => id !== user.id);
        mockUsers[requesterUserIndex] = requesterUserData;
    }
    
    mockUsers[currentUserIndex] = currentUserData;
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

    const connectionUserData = { ...mockUsers[connectionUserIndex] };
    connectionUserData.connections = (connectionUserData.connections || []).filter(id => id !== user.id);
    
    mockUsers[currentUserIndex] = currentUserData;
    mockUsers[connectionUserIndex] = connectionUserData;
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

  const createCommunity = async (communityData: { name: string; description: string; industry: string }): Promise<{ success: boolean; communityId?: string; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    
    const newCommunityId = generateMockId('comm_');
    const newCommunity: Community = {
      id: newCommunityId,
      name: communityData.name,
      description: communityData.description,
      industry: communityData.industry as (typeof INDUSTRIES)[number],
      members: [user.id],
      creatorId: user.id,
      createdAt: new Date().toISOString(),
    };
    mockCommunities.unshift(newCommunity);
    return { success: true, communityId: newCommunityId };
  };
  
  const createCofounderListing = async (listingData: Omit<CofounderListing, 'id' | 'userId' | 'createdAt'>): Promise<{ success: boolean; listingId?: string; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const newListingId = generateMockId('listing_');
    const newListing: CofounderListing = {
      id: newListingId,
      userId: user.id,
      ...listingData,
      createdAt: new Date().toISOString(),
    };
    mockCofounderListings.unshift(newListing);
    return { success: true, listingId: newListingId };
  };

  const createMockChat = async (participantIds: string[]): Promise<{ success: boolean; chatId?: string; error?: string, chat?: Chat }> => {
    if (!user || !participantIds.includes(user.id)) return { success: false, error: "User not authenticated or not part of participants." };

    const sortedParticipantIds = [...participantIds].sort();
    
    let existingChat = mockChats.find(chat => {
        const currentChatParticipantIdsSorted = [...chat.participantIds].sort();
        if (sortedParticipantIds.length === currentChatParticipantIdsSorted.length) {
            return sortedParticipantIds.every((id, index) => id === currentChatParticipantIdsSorted[index]);
        }
        return false;
    });

    if (existingChat) {
        return { success: true, chatId: existingChat.id, chat: existingChat };
    }

    const newChatId = generateMockId('chat_');
    const newChat: Chat = {
      id: newChatId,
      participantIds: sortedParticipantIds,
      messages: [],
      lastMessage: undefined,
      isGroupChat: participantIds.length > 2,
      ...(participantIds.length > 2 && { groupName: 'New Group' }) // Could be more dynamic
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
      id: generateMockId('msg_'),
      chatId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
    };

    mockChats[chatIndex].messages.push(newMessageData);
    mockChats[chatIndex].lastMessage = newMessageData;

    // Move the updated chat to the beginning of the list to show it as most recent
    const updatedChat = mockChats.splice(chatIndex, 1)[0];
    mockChats.unshift(updatedChat);
    
    // If the current user is the sender, update the user state to reflect the change in messages
    // This is a simplified way to trigger re-renders where `user` is a dependency
    if (user && user.id === senderId) {
        setUser(prevUser => prevUser ? {...prevUser} : null);
    }
    
    return { success: true, newMessage: newMessageData };
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading, profileCompletionRequired, pendingNewUserInfo,
      loginWithGoogle, loginWithLinkedIn, loginWithEmailPassword, signupWithEmailPassword, logout, updateUserInContext,
      completeNewUserProfile,
      sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest, removeConnection,
      joinCommunity, leaveCommunity, createCommunity, createCofounderListing,
      createMockChat, sendMessage
    }}>
      {children}
    </AuthContext.Provider>
  );
};

    