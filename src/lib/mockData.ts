
import type { User, Post, Community, Chat, CofounderListing } from './types';
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS } from './constants';
import type { FounderProfile, InvestorProfile, ExpertProfile } from './types';


// Export as 'let' to allow modification by actions for mock backend behavior
export let mockUsers: User[] = [
  {
    id: 'user1',
    email: 'founder@example.com',
    name: 'Alice Founder',
    role: UserRole.Founder,
    profile: {
      startupName: 'InnovateX',
      industry: INDUSTRIES[0], // B2B SaaS
      fundingStage: FUNDING_STAGES[1], // Seed
      bio: 'Building the future of SaaS.',
      location: 'Bangalore, India',
      profilePictureUrl: 'https://placehold.co/100x100.png',
      // dataAiHint: 'female programmer', // dataAiHint is usually on image elements
      language: 'en',
    } as FounderProfile,
    connections: ['user2', 'user3'],
    connectionRequestsSent: [],
    connectionRequestsReceived: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
  },
  {
    id: 'user2',
    email: 'investor@example.com',
    name: 'Bob Investor',
    role: UserRole.AngelInvestor,
    profile: {
      investmentFocus: [INDUSTRIES[0], INDUSTRIES[2]], // B2B SaaS, Climate Tech
      fundingRange: '$50k - $250k',
      bio: 'Early-stage investor focused on impact.',
      location: 'Mumbai, India',
      profilePictureUrl: 'https://placehold.co/100x100.png',
      language: 'en',
    } as InvestorProfile,
    connections: ['user1'],
    connectionRequestsSent: [],
    connectionRequestsReceived: ['user4'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
  },
  {
    id: 'user3',
    email: 'expert@example.com',
    name: 'Carol Expert',
    role: UserRole.IndustryExpert,
    profile: {
      areaOfExpertise: EXPERTISE_AREAS[0], // Product Development
      yearsOfExperience: 10,
      bio: 'Helping startups build great products.',
      location: 'Delhi, India',
      profilePictureUrl: 'https://placehold.co/100x100.png',
      language: 'en',
    } as ExpertProfile,
    connections: ['user1'],
    connectionRequestsSent: [],
    connectionRequestsReceived: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  },
   {
    id: 'user4',
    email: 'vc@example.com',
    name: 'David VC',
    role: UserRole.VC,
    profile: {
      investmentFocus: [INDUSTRIES[1], INDUSTRIES[3]], // EdTech, FinTech
      fundSize: '$100M',
      preferredFundingStages: [FUNDING_STAGES[2], FUNDING_STAGES[3]], // Series A, Series B
      bio: 'Partner at Growth Ventures, looking for scalable tech companies.',
      location: 'Gurgaon, India',
      profilePictureUrl: 'https://placehold.co/100x100.png',
      language: 'en',
    } as InvestorProfile,
    connections: [],
    connectionRequestsSent: ['user2'],
    connectionRequestsReceived: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days ago
  },
];

export let mockPosts: Post[] = [
  {
    id: 'post1',
    authorId: 'user1',
    content: 'Excited to share that InnovateX has just closed its seed round! Looking for a CTO to join our journey. #SaaS #Funding #Hiring',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'startup office celebration',
    likes: ['user2', 'user3'],
    comments: [
      { id: 'comment1', authorId: 'user2', content: 'Congratulations Alice!', createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'post2',
    authorId: 'user2',
    content: 'Just published an article on the future of Climate Tech investments in India. Check it out! #ClimateTech #Investment #India',
    likes: ['user1'],
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'post3',
    authorId: 'user3',
    content: 'My top 5 tips for product development for early-stage startups: 1. Talk to users, 2. Iterate quickly, 3. Focus on core value, 4. Build a great team, 5. Measure everything. #ProductManagement #Startups',
    likes: ['user1', 'user2'],
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
];

export let mockCommunities: Community[] = [
  {
    id: 'comm1',
    name: 'B2B SaaS Founders India',
    description: 'A community for B2B SaaS founders in India to share insights and support each other.',
    industry: INDUSTRIES[0],
    members: ['user1'],
    creatorId: 'user1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comm2',
    name: 'Climate Tech Investors',
    description: 'Connecting investors passionate about climate technology solutions.',
    industry: INDUSTRIES[2],
    members: ['user2'],
    creatorId: 'user2',
    createdAt: new Date().toISOString(),
  },
];

export let mockChats: Chat[] = [
    // Example: A chat between user1 and user2
    // This structure will be populated/updated by createMockChat and sendMessage
    {
        id: 'chat_user1_user2', // Example ID, might be generated differently
        participantIds: ['user1', 'user2'].sort(),
        messages: [
            {
                id: 'msg1',
                chatId: 'chat_user1_user2',
                senderId: 'user1',
                content: 'Hey Bob, saw your article on Climate Tech!',
                timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
            },
            {
                id: 'msg2',
                chatId: 'chat_user1_user2',
                senderId: 'user2',
                content: 'Thanks Alice! Glad you liked it.',
                timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString() // 28 mins ago
            }
        ],
        lastMessage: {
                id: 'msg2',
                chatId: 'chat_user1_user2',
                senderId: 'user2',
                content: 'Thanks Alice! Glad you liked it.',
                timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString()
            },
        isGroupChat: false,
    }
];
export let mockCofounderListings: CofounderListing[] = [];
