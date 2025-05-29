
"use client";

import { mockCommunities, mockPosts, mockUsers } from "@/lib/mockData";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreatePostForm } from "@/components/feed/CreatePostForm";
import { PostCard } from "@/components/feed/PostCard";
import { Users, Settings, PlusCircle, LogOut, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, use } from "react";
import type { Community, User } from "@/lib/types";
import { getUserDisplayDomains } from "@/lib/userUtils";


export default function CommunityDetailPage({ params: paramsPromise }: { params: { id: string } }) {
  const params = use(paramsPromise); 
  const { id: communityId } = params;

  const { user: loggedInUser, joinCommunity, leaveCommunity } = useAuth();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null | undefined>(() => mockCommunities.find(c => c.id === communityId));
  
  // To refresh membership status
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const currentCommunity = mockCommunities.find(c => c.id === communityId);
    setCommunity(currentCommunity);
    if (currentCommunity && loggedInUser) {
      setIsMember(currentCommunity.members.includes(loggedInUser.id));
    }
  }, [communityId, loggedInUser]); // Re-check if any of these change

  // Filter posts for this community (mock logic)
  const communityPosts = mockPosts.filter(p => Math.random() > 0.5).slice(0,2); 

  if (community === undefined) { // Initial loading state
    return <div className="text-center py-10">Loading community...</div>;
  }
  if (!community) {
    return <div className="text-center py-10">Community not found.</div>;
  }
  
  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }
  const communityMembers = mockUsers.filter(u => community.members.includes(u.id) || Math.random() > 0.7).slice(0,5);

  const handleJoinLeaveCommunity = async () => {
    if (!loggedInUser) {
        toast({variant: "destructive", title: "Login Required", description: "Please log in to join communities."});
        return;
    }
    if (isMember) { // Leave
        const result = await leaveCommunity(community.id);
        if (result.success) {
            toast({title: "Left Community", description: `You have left ${community.name}.`});
            setIsMember(false);
            setCommunity(prev => prev ? {...prev, members: prev.members.filter(id => id !== loggedInUser.id)} : null);
        } else {
            toast({variant: "destructive", title: "Error", description: result.error});
        }
    } else { // Join
        const result = await joinCommunity(community.id);
        if (result.success) {
            toast({title: "Joined Community", description: `Welcome to ${community.name}!`});
            setIsMember(true);
            setCommunity(prev => prev ? {...prev, members: [...prev.members, loggedInUser.id]} : null);
        } else {
            toast({variant: "destructive", title: "Error", description: result.error});
        }
    }
  };

  const handleManage = () => {
    toast({title: "Feature Info", description: "Community management features are coming soon."});
  };
  const handleChangeBanner = () => {
    toast({title: "Feature Info", description: "Ability to change banner image is coming soon."});
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden shadow-lg">
        <div className="relative h-48 w-full bg-muted">
          <Image 
            src={`https://placehold.co/1200x300.png?text=${encodeURIComponent(community.name)}`} 
            alt={`${community.name} banner`} 
            fill
            className="object-cover opacity-80"
            data-ai-hint={`${community.industry} group banner`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 flex flex-col justify-end">
            <h1 className="text-4xl font-bold text-white drop-shadow-md">{community.name}</h1>
            <p className="text-sm text-gray-200 drop-shadow-sm">{community.industry}</p>
          </div>
           <Button variant="outline" className="absolute top-4 right-4 bg-white/80 hover:bg-white" onClick={handleChangeBanner}>
                <ImageIcon className="mr-2 h-4 w-4"/> Change Banner
            </Button>
        </div>
        <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <p className="text-muted-foreground flex-1">{community.description}</p>
                <div className="flex gap-2">
                    <Button 
                      className={isMember ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}
                      onClick={handleJoinLeaveCommunity}
                    >
                        {isMember ? <LogOut className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                        {isMember ? "Leave Community" : "Join Community"}
                    </Button>
                    {loggedInUser?.id === community.creatorId && (
                        <Button variant="outline" onClick={handleManage}>
                            <Settings className="mr-2 h-4 w-4"/> Manage
                        </Button>
                    )}
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Community Feed</h2>
          {isMember ? <CreatePostForm /> : <Card><CardContent className="p-6 text-center text-muted-foreground">Join the community to post.</CardContent></Card> }
          {communityPosts.length > 0 ? (
            communityPosts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No posts in this community yet. Be the first!</CardContent></Card>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Members ({community.members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {communityMembers.map(member => (
                <Link href={`/profile/${member.id}`} key={member.id} className="flex items-center gap-3 p-2 hover:bg-accent/50 rounded-md transition-colors">
                  <Avatar className="h-10 w-10">
                     <AvatarImage src={member.profile.profilePictureUrl || `https://placehold.co/40x40.png?text=${getInitials(member.name)}`} alt={member.name} data-ai-hint="profile avatar small"/>
                     <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role} <span className="text-primary/80">{getUserDisplayDomains(member)}</span></p>
                  </div>
                </Link>
              ))}
              {community.members.length > communityMembers.length && 
                <Button variant="link" className="w-full">View all members</Button>
              }
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>About this Community</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
                <p><strong>Industry:</strong> {community.industry}</p>
                <p><strong>Created:</strong> {new Date(community.createdAt).toLocaleDateString()}</p>
                <p><strong>Creator:</strong> {mockUsers.find(u=>u.id === community.creatorId)?.name || "Unknown"}</p>
                {/* Add more rules or guidelines here */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
