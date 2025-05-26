
"use client";

import { mockUsers, mockPosts } from "@/lib/mockData";
import type { User, FounderProfile, InvestorProfile, ExpertProfile, ConnectionStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Link as LinkIcon, MessageSquare, UserPlus, CheckCircle, Edit3, Globe, BookOpen, Target, DollarSign, Brain, CalendarDays, Settings2, UserX, Clock } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { use, useEffect, useState } from "react"; // Added 'use'
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";


export default function UserProfilePage({ params: paramsPromise }: { params: { userId: string } }) {
  const params = use(paramsPromise); // Unwrap params using React.use()
  const { userId } = params;

  const { user: loggedInUser, sendConnectionRequest, removeConnection, acceptConnectionRequest, declineConnectionRequest, createMockChat } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Local state for the viewed user's profile, to allow refresh if mockData is updated elsewhere.
  // For a real backend, this would be fetched data.
  const [viewedUser, setViewedUser] = useState<User | null | undefined>(() => mockUsers.find(u => u.id === userId));
  
  // Re-fetch or update viewedUser if params.userId changes or loggedInUser's connections change
   useEffect(() => {
    setViewedUser(mockUsers.find(u => u.id === userId));
  }, [userId, loggedInUser]); // Re-evaluate if loggedInUser's state changes (e.g., connections)

  const userPosts = mockPosts.filter(p => p.authorId === userId);

  if (viewedUser === undefined) { // Still loading or initial find
    return <div className="text-center py-10">Loading profile...</div>;
  }
  if (!viewedUser) {
    return <div className="text-center py-10">User not found.</div>;
  }
  
  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }

  const isOwnProfile = viewedUser.id === loggedInUser?.id;

  const getConnectionStatus = (): ConnectionStatus => {
    if (!loggedInUser || !viewedUser || isOwnProfile) return 'not_connected'; // Or a specific status for own profile like 'is_self'
    if (loggedInUser.connections.includes(viewedUser.id)) return 'connected';
    if (loggedInUser.connectionRequestsSent.includes(viewedUser.id)) return 'pending_sent';
    if (loggedInUser.connectionRequestsReceived.includes(viewedUser.id)) return 'pending_received';
    return 'not_connected';
  };

  const connectionStatus = getConnectionStatus();

  const handleConnect = async () => {
    if (!loggedInUser || !viewedUser) return;
    const result = await sendConnectionRequest(viewedUser.id);
    if (result.success) {
      toast({ title: "Connection Request Sent", description: `Request sent to ${viewedUser.name}.` });
      // Optimistically update or rely on useEffect to refresh viewedUser based on loggedInUser changes
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };
  
  const handleRemoveConnection = async () => {
    if (!loggedInUser || !viewedUser) return;
    const result = await removeConnection(viewedUser.id);
    if (result.success) {
      toast({ title: "Connection Removed", description: `You are no longer connected with ${viewedUser.name}.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handleAcceptRequest = async () => {
    if (!loggedInUser || !viewedUser) return;
    const result = await acceptConnectionRequest(viewedUser.id);
    if (result.success) {
      toast({ title: "Connection Accepted", description: `You are now connected with ${viewedUser.name}.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handleDeclineRequest = async () => {
    if (!loggedInUser || !viewedUser) return;
    const result = await declineConnectionRequest(viewedUser.id);
    if (result.success) {
      toast({ title: "Connection Declined", description: `Request from ${viewedUser.name} declined.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handleMessage = async () => {
    if (!loggedInUser || !viewedUser) return;
    // Attempt to create a mock chat if one doesn't exist (or find existing)
    const chatResult = await createMockChat([loggedInUser.id, viewedUser.id]);
    if (chatResult.success && chatResult.chatId) {
      router.push(`/messages?chatWith=${viewedUser.id}&chatId=${chatResult.chatId}`);
    } else if (chatResult.success) { // Chat exists, just navigate
       router.push(`/messages?chatWith=${viewedUser.id}`);
    } else {
      toast({ variant: "destructive", title: "Message Error", description: "Could not initiate or find chat." });
    }
  };


  const renderActionButtons = () => {
    if (isOwnProfile) {
      return <Button asChild variant="outline"><Link href="/settings/profile"><Edit3 className="mr-2 h-4 w-4"/>Edit Profile</Link></Button>;
    }
    switch (connectionStatus) {
      case 'connected':
        return (
          <>
            <Button onClick={handleMessage} className="bg-primary hover:bg-primary/90"><MessageSquare className="mr-2 h-4 w-4"/>Message</Button>
            <Button variant="outline" onClick={handleRemoveConnection}><UserX className="mr-2 h-4 w-4"/>Disconnect</Button>
          </>
        );
      case 'pending_sent':
        return <Button variant="outline" disabled><Clock className="mr-2 h-4 w-4"/>Pending</Button>;
      case 'pending_received':
        return (
          <>
            <Button onClick={handleAcceptRequest} className="bg-accent hover:bg-accent/90 text-accent-foreground"><CheckCircle className="mr-2 h-4 w-4"/>Accept</Button>
            <Button variant="outline" onClick={handleDeclineRequest}><UserX className="mr-2 h-4 w-4"/>Decline</Button>
          </>
        );
      case 'not_connected':
      default:
        return <Button onClick={handleConnect} className="bg-primary hover:bg-primary/90"><UserPlus className="mr-2 h-4 w-4"/>Connect</Button>;
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="overflow-hidden shadow-xl">
        <div className="h-48 bg-gradient-to-r from-primary via-blue-500 to-sky-400 relative">
           <Image src={viewedUser.profile.profilePictureUrl ? `https://placehold.co/1200x250.png?text=${encodeURIComponent(viewedUser.name)}` : `https://placehold.co/1200x250.png`} alt={`${viewedUser.name}'s banner`} layout="fill" objectFit="cover" data-ai-hint="profile banner abstract" />
        </div>
        
        <div className="relative px-6">
          <div className="flex flex-col md:flex-row items-start gap-6 -mt-16 md:-mt-20">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-card rounded-full shadow-lg">
              <AvatarImage src={viewedUser.profile.profilePictureUrl || `https://placehold.co/160x160.png?text=${getInitials(viewedUser.name)}`} alt={viewedUser.name} data-ai-hint="profile avatar large"/>
              <AvatarFallback className="text-5xl">{getInitials(viewedUser.name)}</AvatarFallback>
            </Avatar>
            <div className="pt-16 md:pt-20 flex-1">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{viewedUser.name}</h1>
                  <p className="text-md text-muted-foreground">{viewedUser.role}</p>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  {renderActionButtons()}
                </div>
              </div>
              {viewedUser.profile.location && <p className="text-sm text-muted-foreground mt-1 flex items-center"><MapPin className="h-4 w-4 mr-2"/>{viewedUser.profile.location}</p>}
              {viewedUser.profile.website && <Link href={viewedUser.profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 flex items-center"><LinkIcon className="h-4 w-4 mr-2"/>{viewedUser.profile.website}</Link>}
            </div>
          </div>
        
          <div className="py-6">
            {viewedUser.profile.bio && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center"><BookOpen className="h-5 w-5 mr-2 text-primary"/>About</h2>
                <p className="text-muted-foreground whitespace-pre-line">{viewedUser.profile.bio}</p>
              </div>
            )}

            {viewedUser.role === "Startup Founder" && (viewedUser.profile as FounderProfile).startupName && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center"><Briefcase className="h-5 w-5 mr-2 text-primary"/>Startup Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <p><strong>Startup:</strong> {(viewedUser.profile as FounderProfile).startupName}</p>
                    <p><strong>Industry:</strong> {(viewedUser.profile as FounderProfile).industry}</p>
                    <p><strong>Funding Stage:</strong> {(viewedUser.profile as FounderProfile).fundingStage}</p>
                    {(viewedUser.profile as FounderProfile).traction && <p className="md:col-span-2"><strong>Traction:</strong> {(viewedUser.profile as FounderProfile).traction}</p>}
                    {(viewedUser.profile as FounderProfile).needs && <p className="md:col-span-2"><strong>Needs:</strong> {(viewedUser.profile as FounderProfile).needs}</p>}
                </div>
              </div>
            )}

            {(viewedUser.role === "Angel Investor" || viewedUser.role === "Venture Capitalist") && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center"><Target className="h-5 w-5 mr-2 text-primary"/>Investment Focus</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <p className="md:col-span-2"><strong>Focus Areas:</strong> {(viewedUser.profile as InvestorProfile).investmentFocus?.join(', ') || 'N/A'}</p>
                    {(viewedUser.profile as InvestorProfile).fundingRange && <p><strong>Typical Range:</strong> {(viewedUser.profile as InvestorProfile).fundingRange}</p>}
                    {(viewedUser.profile as InvestorProfile).fundSize && <p><strong>Fund Size:</strong> {(viewedUser.profile as InvestorProfile).fundSize}</p>}
                    {(viewedUser.profile as InvestorProfile).preferredFundingStages && <p className="md:col-span-2"><strong>Preferred Stages:</strong> {(viewedUser.profile as InvestorProfile).preferredFundingStages?.join(', ') || 'N/A'}</p>}
                    {(viewedUser.profile as InvestorProfile).portfolioHighlights && <p className="md:col-span-2"><strong>Portfolio Highlights:</strong> {(viewedUser.profile as InvestorProfile).portfolioHighlights}</p>}
                </div>
              </div>
            )}

            {viewedUser.role === "Industry Expert" && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center"><Brain className="h-5 w-5 mr-2 text-primary"/>Expertise</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <p><strong>Area:</strong> {(viewedUser.profile as ExpertProfile).areaOfExpertise}</p>
                    <p><strong>Experience:</strong> {(viewedUser.profile as ExpertProfile).yearsOfExperience} years</p>
                    {(viewedUser.profile as ExpertProfile).servicesOffered && <p className="md:col-span-2"><strong>Services:</strong> {(viewedUser.profile as ExpertProfile).servicesOffered}</p>}
                </div>
              </div>
            )}
            
            {viewedUser.profile.language && (
                 <p className="text-xs text-muted-foreground mt-1 flex items-center"><Globe className="h-3 w-3 mr-1"/>Language: {viewedUser.profile.language}</p>
            )}
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Activity</h2>
        {userPosts.length > 0 ? (
          <div className="space-y-6">
            {userPosts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        ) : (
          <Card><CardContent className="p-6 text-center text-muted-foreground">This user hasn't posted anything yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}


    