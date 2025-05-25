import { mockUsers, mockPosts } from "@/lib/mockData";
import type { User, FounderProfile, InvestorProfile, ExpertProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Link as LinkIcon, MessageSquare, UserPlus, CheckCircle, Edit3, Globe, BookOpen, Target, DollarSign, Brain, CalendarDays, Settings2 } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import Link from "next/link";

// Mock current user ID for "Edit Profile" button visibility
const currentMockUserId = 'user1'; 

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const user = mockUsers.find(u => u.id === params.userId);
  const userPosts = mockPosts.filter(p => p.authorId === params.userId);

  if (!user) {
    return <div className="text-center py-10">User not found.</div>;
  }
  
  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }

  const isOwnProfile = user.id === currentMockUserId;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="overflow-hidden shadow-xl">
        {/* Banner Image Placeholder */}
        <div className="h-48 bg-gradient-to-r from-primary via-blue-500 to-sky-400 relative">
           <Image src={`https://placehold.co/1200x250.png?text=${user.name}`} alt={`${user.name}'s banner`} layout="fill" objectFit="cover" data-ai-hint="profile banner abstract" />
        </div>
        
        <div className="relative px-6">
          <div className="flex flex-col md:flex-row items-start gap-6 -mt-16 md:-mt-20">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-card rounded-full shadow-lg">
              <AvatarImage src={user.profile.profilePictureUrl || `https://placehold.co/160x160.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar large"/>
              <AvatarFallback className="text-5xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="pt-16 md:pt-20 flex-1">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
                  <p className="text-md text-muted-foreground">{user.role}</p>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  {isOwnProfile ? (
                    <Button asChild variant="outline"><Link href="/settings/profile"><Edit3 className="mr-2 h-4 w-4"/>Edit Profile</Link></Button>
                  ) : (
                    <>
                      <Button className="bg-primary hover:bg-primary/90"><UserPlus className="mr-2 h-4 w-4"/>Connect</Button>
                      <Button variant="outline"><MessageSquare className="mr-2 h-4 w-4"/>Message</Button>
                    </>
                  )}
                </div>
              </div>
              {user.profile.location && <p className="text-sm text-muted-foreground mt-1 flex items-center"><MapPin className="h-4 w-4 mr-2"/>{user.profile.location}</p>}
              {user.profile.website && <Link href={user.profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 flex items-center"><LinkIcon className="h-4 w-4 mr-2"/>{user.profile.website}</Link>}
            </div>
          </div>
        
          <div className="py-6">
            {user.profile.bio && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center"><BookOpen className="h-5 w-5 mr-2 text-primary"/>About</h2>
                <p className="text-muted-foreground whitespace-pre-line">{user.profile.bio}</p>
              </div>
            )}

            {/* Role-specific details */}
            {user.role === "Startup Founder" && (user.profile as FounderProfile).startupName && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center"><Briefcase className="h-5 w-5 mr-2 text-primary"/>Startup Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <p><strong>Startup:</strong> {(user.profile as FounderProfile).startupName}</p>
                    <p><strong>Industry:</strong> {(user.profile as FounderProfile).industry}</p>
                    <p><strong>Funding Stage:</strong> {(user.profile as FounderProfile).fundingStage}</p>
                    {(user.profile as FounderProfile).traction && <p className="md:col-span-2"><strong>Traction:</strong> {(user.profile as FounderProfile).traction}</p>}
                    {(user.profile as FounderProfile).needs && <p className="md:col-span-2"><strong>Needs:</strong> {(user.profile as FounderProfile).needs}</p>}
                </div>
              </div>
            )}

            {(user.role === "Angel Investor" || user.role === "Venture Capitalist") && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center"><Target className="h-5 w-5 mr-2 text-primary"/>Investment Focus</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <p className="md:col-span-2"><strong>Focus Areas:</strong> {(user.profile as InvestorProfile).investmentFocus.join(', ')}</p>
                    {(user.profile as InvestorProfile).fundingRange && <p><strong>Typical Range:</strong> {(user.profile as InvestorProfile).fundingRange}</p>}
                    {(user.profile as InvestorProfile).fundSize && <p><strong>Fund Size:</strong> {(user.profile as InvestorProfile).fundSize}</p>}
                    {(user.profile as InvestorProfile).preferredFundingStages && <p className="md:col-span-2"><strong>Preferred Stages:</strong> {(user.profile as InvestorProfile).preferredFundingStages.join(', ')}</p>}
                    {(user.profile as InvestorProfile).portfolioHighlights && <p className="md:col-span-2"><strong>Portfolio Highlights:</strong> {(user.profile as InvestorProfile).portfolioHighlights}</p>}
                </div>
              </div>
            )}

            {user.role === "Industry Expert" && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center"><Brain className="h-5 w-5 mr-2 text-primary"/>Expertise</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <p><strong>Area:</strong> {(user.profile as ExpertProfile).areaOfExpertise}</p>
                    <p><strong>Experience:</strong> {(user.profile as ExpertProfile).yearsOfExperience} years</p>
                    {(user.profile as ExpertProfile).servicesOffered && <p className="md:col-span-2"><strong>Services:</strong> {(user.profile as ExpertProfile).servicesOffered}</p>}
                </div>
              </div>
            )}
            
            {user.profile.language && (
                 <p className="text-xs text-muted-foreground mt-1 flex items-center"><Globe className="h-3 w-3 mr-1"/>Language: {user.profile.language}</p>
            )}
          </div>
        </div>
      </Card>

      {/* User's Activity/Posts */}
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
