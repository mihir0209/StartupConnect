
"use client";

import type { User, ProfileData, BaseProfile, FounderProfile, InvestorProfile, ExpertProfile, UserRole as AppUserRole, Community, Chat, Message, CofounderListing } from '@/lib/types';
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS, APP_NAME } from '@/lib/constants';
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { mockUsers, mockCommunities, mockPosts, mockChats, mockCofounderListings } from '@/lib/mockData';

// Simplified structure for pending user info for profile completion
interface PendingNewUserInfo {
  uid: string;
  email: string | null;
  displayName: string | null;
  provider?: 'google' | 'email' | 'linkedin';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  profileCompletionRequired: boolean;
  pendingNewUserInfo: PendingNewUserInfo | null;
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
  const [pendingNewUserInfo, setPendingNewUserInfo] = useState<PendingNewUserInfo | null>(null);

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
      setPendingNewUserInfo(null);
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
        // Ensure live mock data reflects any updates if user exists
        const liveMockUser = mockUsers.find(u => u.id === storedUser.id);
        if (liveMockUser) {
             // Merge stored data over live mock data to preserve local changes
             const mergedUser = {
                ...liveMockUser, // Base from current mock data
                name: storedUser.name,
                email: storedUser.email,
                role: storedUser.role,
                profile: storedUser.profile, // This will be the locally stored profile
                // Keep connections etc from live mock if they were updated by actions
             };
            setUser(mergedUser);
        } else {
            // User from localStorage not in current mockUsers (e.g. after mockData reset)
            setUser(storedUser);
            mockUsers.push(storedUser); // Add back to mockUsers
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
    provider?: 'google' | 'email' | 'linkedin'
  ): boolean => {
    // Check if user already exists in our mock data
    const existingUser = mockUsers.find(u => u.id === uid || (email && u.email === email));
    if (existingUser) {
      updateUserStateAndStorage(existingUser); // User exists, log them in
      return false; // No profile completion needed
    } else {
      // New user, needs profile completion
      const newPendingInfo: PendingNewUserInfo = { uid, email, displayName, provider };
      setPendingNewUserInfo(newPendingInfo);
      localStorage.setItem(LOCAL_STORAGE_PENDING_USER_KEY, JSON.stringify(newPendingInfo));
      setProfileCompletionRequired(true);
      setUser(null); // Ensure main user state is null while profile completion is pending
      return true; // Profile completion is needed
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    // Simulate Google Sign-In
    const mockGoogleUID = generateMockId('google_');
    const mockGoogleEmail = `googleuser${Math.floor(Math.random() * 10000)}@example.com`;
    const mockGoogleName = 'Google User ' + Math.floor(Math.random() * 100);

    checkAndHandleNewUserFlow(mockGoogleUID, mockGoogleEmail, mockGoogleName, 'google');
    setIsLoading(false);
    return { success: true };
  };

  const loginWithLinkedIn = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    // Simulate LinkedIn Sign-In. For mock purposes, let's try to find a specific user or create one directly.
    // LinkedIn users are assumed to have a complete profile for this mock.
    let linkedInUser = mockUsers.find(u => u.email === 'expert@example.com'); // Try to find a specific mock user

    if (!linkedInUser) {
      const mockLinkedInUID = generateMockId('linkedin_');
      // Create a new mock LinkedIn user with a complete profile
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
      mockUsers.push(linkedInUser); // Add to our mock database
    }
    updateUserStateAndStorage(linkedInUser); // Directly log in, no profile completion for mock LinkedIn
    setIsLoading(false);
    return { success: true };
  };

  const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const foundUserInMock = mockUsers.find(u => u.email === email);

    if (foundUserInMock) {
      // Simulate password check (always true for mock)
      updateUserStateAndStorage(foundUserInMock);
    } else {
      // If user not found, trigger profile completion flow
      // This simulates the case where the user might be trying to log in with an email
      // that was used for, say, a Google sign-up that didn't complete profile creation.
      // Or simply, new user attempting login.
      const mockUID = generateMockId('email_login_');
      checkAndHandleNewUserFlow(mockUID, email, email.split('@')[0], 'email');
      setIsLoading(false);
      // For a pure login attempt that fails because user doesn't exist,
      // we still set profileCompletionRequired to guide them.
      // If they intended to sign up, they should use the signup form.
      // The message indicates they should sign up if new.
      return { success: false, error: "Login failed: User not found. If you are new, please sign up." };
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
    setUser(null); // Ensure main user state is null while profile completion is pending
    setIsLoading(false);
    return { success: true, needsProfileCompletion: true };
  };

  const completeNewUserProfile = async (data: { name: string; role: AppUserRole; profileData: Partial<ProfileData> }): Promise<{ success: boolean; error?: string; user?: User }> => {
    if (!pendingNewUserInfo) {
      return { success: false, error: "No pending user information to complete profile for." };
    }

    const newUser: User = {
      id: pendingNewUserInfo.uid,
      email: pendingNewUserInfo.email || 'unknown@example.com', // Fallback, should always have email
      name: data.name,
      role: data.role,
      profile: {
        // Provide defaults for all base profile fields
        bio: data.profileData.bio ?? "",
        location: data.profileData.location ?? "",
        website: data.profileData.website ?? "",
        profilePictureUrl: data.profileData.profilePictureUrl || `https://placehold.co/100x100.png?text=${data.name?.[0]?.toUpperCase() || 'U'}`,
        language: (data.profileData as BaseProfile).language || 'en',

        // Role-specific fields with defaults
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
          ...(data.role === UserRole.VC && { // VC specific
            fundSize: (data.profileData as InvestorProfile).fundSize ?? "",
            preferredFundingStages: (data.profileData as InvestorProfile).preferredFundingStages ?? [],
          }),
        }),
        ...(data.role === UserRole.IndustryExpert && {
          areaOfExpertise: (data.profileData as ExpertProfile).areaOfExpertise ?? EXPERTISE_AREAS[0],
          yearsOfExperience: (data.profileData as ExpertProfile).yearsOfExperience ?? 0,
          servicesOffered: (data.profileData as ExpertProfile).servicesOffered ?? "",
        }),
      } as ProfileData, // Cast to ensure it matches one of the profile types
      connections: [], // Initialize empty arrays
      connectionRequestsSent: [],
      connectionRequestsReceived: [],
      createdAt: new Date().toISOString(),
    };

    updateUserStateAndStorage(newUser); // This will also clear pendingNewUserInfo and profileCompletionRequired
    return { success: true, user: newUser };
  };


  const logout = async () => {
    setIsLoading(true);
    updateUserStateAndStorage(null);
    setPendingNewUserInfo(null); // Clear pending info on logout
    localStorage.removeItem(LOCAL_STORAGE_PENDING_USER_KEY);
    setProfileCompletionRequired(false);
    setIsLoading(false);
  };

  const updateUserInContext = async (updatedUserData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No user logged in to update." };
    
    // Find current user in mock data to ensure we update the source
    const currentUserFromMock = mockUsers.find(u => u.id === user.id);
    if (!currentUserFromMock) return { success: false, error: "User not found in mock data for update." };

    // Create the fully updated user object
    const updatedUserFull = {
      ...currentUserFromMock, // Start with the current state from mock data
      ...updatedUserData,     // Overlay with general updates
      profile: updatedUserData.profile // Smart merge profile data
                 ? { ...(currentUserFromMock.profile as ProfileData), ...(updatedUserData.profile as Partial<ProfileData>)}
                 : currentUserFromMock.profile // Or keep original if no profile updates
    } as User; // Cast to User type
    
    updateUserStateAndStorage(updatedUserFull); // This updates context, localStorage, and mockUsers array
    return { success: true };
  };

  const sendConnectionRequest = async (targetUserId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not logged in." };
    const currentUserIndex = mockUsers.findIndex(u => u.id === user.id);
    const targetUserIndex = mockUsers.findIndex(u => u.id === targetUserId);

    if (currentUserIndex === -1 || targetUserIndex === -1) return { success: false, error: "User not found." };
    
    // Ensure we are working with copies to avoid direct state mutation before updating
    const currentUserData = { ...mockUsers[currentUserIndex] }; 
    // Use Set to avoid duplicate requests, then convert back to array
    currentUserData.connectionRequestsSent = [...new Set([...(currentUserData.connectionRequestsSent || []), targetUserId])];
    // If a received request existed, remove it (shouldn't happen with proper UI flow but good for data integrity)
    currentUserData.connectionRequestsReceived = (currentUserData.connectionRequestsReceived || []).filter(id => id !== targetUserId);
    // If they were already connected, remove connection (shouldn't happen if UI prevents this)
    currentUserData.connections = (currentUserData.connections || []).filter(id => id !== targetUserId);
    
    const targetUserData = { ...mockUsers[targetUserIndex] }; 
    targetUserData.connectionRequestsReceived = [...new Set([...(targetUserData.connectionRequestsReceived || []), user.id])];
    
    mockUsers[currentUserIndex] = currentUserData;
    mockUsers[targetUserIndex] = targetUserData;
    updateUserStateAndStorage(currentUserData); // Update the logged-in user's state
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
    
    // Also remove from the requester's sent list if they exist
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

    // Ensure not to add duplicate member ID
    mockCommunities[communityIndex].members = [...new Set([...mockCommunities[communityIndex].members, user.id])];
    // No need to call updateUserStateAndStorage unless joining/leaving affects user object directly
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
      industry: communityData.industry as (typeof INDUSTRIES)[number], // Cast to specific type
      members: [user.id], // Creator is the first member
      creatorId: user.id,
      createdAt: new Date().toISOString(),
    };
    mockCommunities.unshift(newCommunity); // Add to the beginning of the array
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

    // Sort participant IDs to ensure consistent chat ID lookups for the same set of users
    const sortedParticipantIds = [...participantIds].sort();
    
    // Check if a chat with these exact participants already exists
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

    // If no existing chat, create a new one
    const newChatId = generateMockId('chat_');
    const newChat: Chat = {
      id: newChatId,
      participantIds: sortedParticipantIds,
      messages: [], // Initialize with empty messages array
      lastMessage: undefined, // No last message yet
      isGroupChat: participantIds.length > 2,
      ...(participantIds.length > 2 && { groupName: 'New Group' }) // Could be more dynamic based on participants
    };
    mockChats.unshift(newChat); // Add to the beginning
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
      // fileUrl could be added if file sharing is implemented
    };

    // Directly update the mockChats array
    mockChats[chatIndex].messages.push(newMessageData);
    mockChats[chatIndex].lastMessage = newMessageData;

    // Move the updated chat to the beginning of the list to show it as most recent
    const updatedChat = mockChats.splice(chatIndex, 1)[0];
    mockChats.unshift(updatedChat);
    
    // If the current user is the sender, update the user state to reflect the change in messages
    // This is a simplified way to trigger re-renders where `user` is a dependency in other components
    if (user && user.id === senderId) {
        setUser(prevUser => prevUser ? {...prevUser} : null); // Trigger re-render
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
