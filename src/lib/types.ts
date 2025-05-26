import type { UserRole, FUNDING_STAGES, INDUSTRIES, EXPERTISE_AREAS } from "./constants";

export interface BaseProfile {
  bio?: string;
  location?: string;
  website?: string;
  profilePictureUrl?: string;
  language?: string;
}

export interface FounderProfile extends BaseProfile {
  startupName: string;
  industry: (typeof INDUSTRIES)[number];
  fundingStage: (typeof FUNDING_STAGES)[number];
  traction?: string; // e.g., users, revenue
  needs?: string; // e.g., seeking a CTO
}

export interface InvestorProfile extends BaseProfile { // For Angel Investors and VCs
  investmentFocus: (typeof INDUSTRIES)[number][];
  fundingRange?: string; // e.g., $50k-$250k
  portfolioHighlights?: string;
  fundSize?: string; // For VCs
  preferredFundingStages?: (typeof FUNDING_STAGES)[number][]; // For VCs
}

export interface ExpertProfile extends BaseProfile {
  areaOfExpertise: (typeof EXPERTISE_AREAS)[number];
  yearsOfExperience: number;
  servicesOffered?: string;
}

export type ProfileData = FounderProfile | InvestorProfile | ExpertProfile | BaseProfile;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profile: ProfileData;
  connections: string[]; // Array of user IDs
  connectionRequestsSent: string[]; // Array of user IDs
  connectionRequestsReceived: string[]; // Array of user IDs
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  dataAiHint?: string;
  likes: string[]; // Array of user IDs
  comments: Comment[];
  createdAt: string;
  tags?: string[]; // user IDs or community IDs
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  industry: (typeof INDUSTRIES)[number];
  members: string[]; // Array of user IDs
  creatorId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string; // Identifier for the conversation (could be a combination of user IDs or a group ID)
  senderId: string;
  content: string;
  fileUrl?: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  participantIds: string[]; // For 1-on-1 or group chats
  lastMessage?: Message;
  isGroupChat: boolean;
  groupName?: string; // if isGroupChat
  groupIcon?: string; // if isGroupChat
}

export interface CofounderPreference {
  skills: string[];
  industryExperience: (typeof INDUSTRIES)[number][];
  commitmentLevel: string; // e.g., Full-time, Part-time
  roleSought: string; // e.g., Technical Co-founder, Business Co-founder
}

export interface CofounderListing {
  id: string;
  userId: string; // The user looking for a co-founder
  preferences: CofounderPreference;
  pitch: string; // Brief description of their idea or what they bring
  createdAt: string;
}

// For multi-step form state
export type SignupStep = 1 | 2 | 3;

export type SignupFormData = {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  profileData?: Partial<ProfileData>;
};

export type ProfileField = {
  name: keyof FounderProfile | keyof InvestorProfile | keyof ExpertProfile | keyof BaseProfile;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "multiselect";
  options?: string[];
  required?: boolean;
};

export type ConnectionStatus = 'not_connected' | 'pending_sent' | 'pending_received' | 'connected';
