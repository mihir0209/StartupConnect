import { mockCommunities, mockPosts, mockUsers } from "@/lib/mockData";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreatePostForm } from "@/components/feed/CreatePostForm"; // Reuse for community posts
import { PostCard } from "@/components/feed/PostCard"; // Reuse for community posts
import { Users, Settings, PlusCircle, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const community = mockCommunities.find(c => c.id === params.id);
  
  // Filter posts for this community (mock logic)
  // In a real app, posts would have a communityId or be tagged.
  const communityPosts = mockPosts.filter(p => Math.random() > 0.5).slice(0,2); 

  if (!community) {
    return <div className="text-center py-10">Community not found.</div>;
  }
  
  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }
  const communityMembers = mockUsers.filter(u => community.members.includes(u.id) || Math.random() > 0.7).slice(0,5);


  return (
    <div className="space-y-6">
      <Card className="overflow-hidden shadow-lg">
        <div className="relative h-48 w-full bg-muted">
          <Image 
            src={`https://placehold.co/1200x300.png?text=${community.name}`} 
            alt={`${community.name} banner`} 
            layout="fill" 
            objectFit="cover" 
            className="opacity-80"
            data-ai-hint={`${community.industry} group banner`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 flex flex-col justify-end">
            <h1 className="text-4xl font-bold text-white drop-shadow-md">{community.name}</h1>
            <p className="text-sm text-gray-200 drop-shadow-sm">{community.industry}</p>
          </div>
           <Button variant="outline" className="absolute top-4 right-4 bg-white/80 hover:bg-white">
                <ImageIcon className="mr-2 h-4 w-4"/> Change Banner
            </Button>
        </div>
        <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <p className="text-muted-foreground flex-1">{community.description}</p>
                <div className="flex gap-2">
                    <Button className="bg-primary hover:bg-primary/90">
                        <PlusCircle className="mr-2 h-4 w-4"/> Join Community
                    </Button>
                    <Button variant="outline">
                        <Settings className="mr-2 h-4 w-4"/> Manage
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Community Feed</h2>
          <CreatePostForm /> {/* Simplified: assumes posts here are for the community */}
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
                    <p className="text-xs text-muted-foreground">{member.role}</p>
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
                <p><strong>Description:</strong> {community.description}</p>
                {/* Add more rules or guidelines here */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
