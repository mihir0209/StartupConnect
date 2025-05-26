
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { INDUSTRIES, EXPERTISE_AREAS } from "@/lib/constants";
import type { CofounderListing, CofounderPreference, User } from "@/lib/types";
import { mockUsers } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchCode, UserCheck, Percent, Clock } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const mockCofounderMatches: (User & { compatibilityScore: number })[] = mockUsers
  .filter(u => u.id !== 'user1') // Exclude self for default mock
  .slice(0,3) 
  .map(u => ({...u, compatibilityScore: Math.floor(Math.random() * (95 - 75 + 1) + 75) }));


export default function CofoundersPage() {
  const { user: loggedInUser, sendConnectionRequest } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState<Partial<CofounderPreference>>({});
  const [matches, setMatches] = useState<(User & { compatibilityScore: number })[]>([]);
  // State to track pending requests for UI updates
  const [pendingRequests, setPendingRequests] = useState<string[]>(loggedInUser?.connectionRequestsSent || []);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call an AI-powered backend service.
    const filteredMatches = mockUsers
      .filter(u => u.id !== loggedInUser?.id)
      .map(u => ({...u, compatibilityScore: Math.floor(Math.random() * (95 - 75 + 1) + 75) }))
      .slice(0, Math.floor(Math.random() * 3) + 2); // random 2-4 matches
    setMatches(filteredMatches);
  };
  
  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }

  const handleConnect = async (targetUserId: string) => {
    if (!loggedInUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to connect."});
      return;
    }
    const result = await sendConnectionRequest(targetUserId);
    if (result.success) {
      toast({ title: "Connection Request Sent" });
      setPendingRequests(prev => [...prev, targetUserId]);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handleCreateListing = () => {
    toast({ title: "Feature Coming Soon", description: "Ability to create your co-founder listing will be added."});
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Co-Founder Matching</h1>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleCreateListing}>
          <SearchCode className="mr-2 h-5 w-5" /> Create Your Listing
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Your Co-Founder</CardTitle>
          <CardDescription>
            Describe your ideal co-founder. Our AI will help you find the best matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="skills">Desired Skills (comma-separated)</Label>
              <Input id="skills" placeholder="e.g., React, Python, Sales" onChange={e => setSearchQuery(prev => ({...prev, skills: e.target.value.split(',').map(s => s.trim())}))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry Experience</Label>
              <Select onValueChange={val => setSearchQuery(prev => ({...prev, industryExperience: [val as (typeof INDUSTRIES)[number]]}))}>
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleSought">Role You're Looking For</Label>
              <Input id="roleSought" placeholder="e.g., Technical Co-founder, Marketing Lead" onChange={e => setSearchQuery(prev => ({...prev, roleSought: e.target.value}))} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="commitment">Commitment Level</Label>
              <Select onValueChange={val => setSearchQuery(prev => ({...prev, commitmentLevel: val}))}>
                <SelectTrigger id="commitment">
                  <SelectValue placeholder="Select commitment level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90">
                <SearchCode className="mr-2 h-4 w-4" /> Find Matches
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Potential Co-Founder Matches</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map(match => (
              <Card key={match.id} className="p-4 flex flex-col items-center text-center shadow-md">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarImage src={match.profile.profilePictureUrl || `https://placehold.co/80x80.png?text=${getInitials(match.name)}`} alt={match.name} data-ai-hint="profile avatar large"/>
                  <AvatarFallback>{getInitials(match.name)}</AvatarFallback>
                </Avatar>
                <Link href={`/profile/${match.id}`} className="text-lg font-semibold hover:underline">{match.name}</Link>
                <p className="text-sm text-muted-foreground">{match.role}</p>
                {(match.profile as any).areaOfExpertise && <p className="text-xs text-muted-foreground">Expertise: {(match.profile as any).areaOfExpertise}</p>}
                {(match.profile as any).startupName && <p className="text-xs text-muted-foreground">Startup: {(match.profile as any).startupName}</p>}
                
                <div className="mt-3 mb-2 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    <Percent className="h-4 w-4 mr-1" />
                    {match.compatibilityScore}% Match
                </div>
                <p className="text-xs text-muted-foreground px-2 line-clamp-2">
                    {match.profile.bio || "User has not set a bio yet."}
                </p>
                {loggedInUser?.connections.includes(match.id) ? (
                   <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                     <Link href={`/messages?chatWith=${match.id}`}>Message</Link>
                   </Button>
                ) : pendingRequests.includes(match.id) || loggedInUser?.connectionRequestsSent.includes(match.id) ? (
                  <Button size="sm" variant="outline" className="mt-4 w-full" disabled>
                    <Clock className="mr-2 h-4 w-4" /> Pending
                  </Button>
                ) : (
                  <Button size="sm" className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground w-full" onClick={() => handleConnect(match.id)}>
                    <UserCheck className="mr-2 h-4 w-4" /> Connect
                  </Button>
                )}
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
