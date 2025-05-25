"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserRole, INDUSTRIES, FUNDING_STAGES, EXPERTISE_AREAS, USER_ROLES } from "@/lib/constants";
import type { User, Post } from "@/lib/types";
import { mockUsers, mockPosts } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search as SearchIcon, Filter, UserCircle, FileText } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

type SearchResult = (User & { type: 'user' }) | (Post & { type: 'post' });

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    role: "",
    industry: "",
    location: "",
    fundingStage: "",
    expertise: "",
  });
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock search logic
    let filteredUsers = mockUsers.filter(user => {
      let match = true;
      if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) && !(user.profile.bio || "").toLowerCase().includes(searchTerm.toLowerCase())) {
        match = false;
      }
      if (filters.role && user.role !== filters.role) match = false;
      if (filters.industry && (user.profile as any).industry !== filters.industry && !( (user.profile as any).investmentFocus || []).includes(filters.industry) ) match = false;
      if (filters.location && !(user.profile.location || "").toLowerCase().includes(filters.location.toLowerCase())) match = false;
      if (filters.fundingStage && (user.profile as any).fundingStage !== filters.fundingStage && !((user.profile as any).preferredFundingStages || []).includes(filters.fundingStage) ) match = false;
      if (filters.expertise && (user.profile as any).areaOfExpertise !== filters.expertise) match = false;
      return match;
    });

    let filteredPosts = mockPosts.filter(post => {
        let match = true;
        if(searchTerm && !post.content.toLowerCase().includes(searchTerm.toLowerCase())) match = false;
        // Add post specific filters if any e.g. author role, industry tags
        return match;
    });

    setResults([
        ...filteredUsers.map(u => ({...u, type: 'user' as 'user'})),
        ...filteredPosts.map(p => ({...p, type: 'post' as 'post'}))
    ]);
  };

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }

  return (
    <div className="flex gap-8">
      {/* Filters Sidebar */}
      <Card className="w-1/4 h-fit sticky top-24 shadow-lg"> {/* Adjust top value based on header height */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5 text-primary"/> Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={value => handleFilterChange('role', value)} value={filters.role}>
              <SelectTrigger id="role"><SelectValue placeholder="Any Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Role</SelectItem>
                {USER_ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Select onValueChange={value => handleFilterChange('industry', value)} value={filters.industry}>
              <SelectTrigger id="industry"><SelectValue placeholder="Any Industry" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Industry</SelectItem>
                {INDUSTRIES.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="e.g., Bangalore" value={filters.location} onChange={e => handleFilterChange('location', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="fundingStage">Funding Stage</Label>
            <Select onValueChange={value => handleFilterChange('fundingStage', value)} value={filters.fundingStage}>
              <SelectTrigger id="fundingStage"><SelectValue placeholder="Any Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Stage</SelectItem>
                {FUNDING_STAGES.map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="expertise">Expertise</Label>
             <Select onValueChange={value => handleFilterChange('expertise', value)} value={filters.expertise}>
              <SelectTrigger id="expertise"><SelectValue placeholder="Any Expertise" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Expertise</SelectItem>
                {EXPERTISE_AREAS.map(exp => <SelectItem key={exp} value={exp}>{exp}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSearch} className="w-full mt-4 bg-primary hover:bg-primary/90">Apply Filters</Button>
        </CardContent>
      </Card>

      {/* Search Results Area */}
      <div className="w-3/4 space-y-6">
        <form onSubmit={handleSearch} className="flex gap-2 items-center mb-6">
          <Input 
            type="search" 
            placeholder="Search keywords (e.g., 'AI founder Delhi', 'climate tech post')" 
            className="flex-1 text-lg p-3"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Button type="submit" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground"><SearchIcon className="mr-2 h-5 w-5"/> Search</Button>
        </form>

        {results.length > 0 ? (
          results.map(item => {
            if (item.type === 'user') {
              const user = item as User;
              return (
                <Card key={user.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 flex items-start gap-4">
                    <Avatar className="h-16 w-16 border">
                      <AvatarImage src={user.profile.profilePictureUrl || `https://placehold.co/64x64.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Link href={`/profile/${user.id}`} className="text-lg font-semibold text-primary hover:underline">{user.name}</Link>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                      {(user.profile as any).industry && <p className="text-xs text-muted-foreground">Industry: {(user.profile as any).industry}</p>}
                      {(user.profile as any).areaOfExpertise && <p className="text-xs text-muted-foreground">Expertise: {(user.profile as any).areaOfExpertise}</p>}
                      <p className="text-sm mt-1 line-clamp-2">{user.profile.bio || "No bio available."}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild><Link href={`/profile/${user.id}`}>View Profile</Link></Button>
                  </CardContent>
                </Card>
              );
            }
            if (item.type === 'post') {
              const post = item as Post;
              const author = mockUsers.find(u => u.id === post.authorId);
              return (
                 <Card key={post.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="p-4 pb-2">
                         <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={author?.profile.profilePictureUrl || `https://placehold.co/32x32.png?text=${getInitials(author?.name)}`} alt={author?.name} data-ai-hint="profile avatar small"/>
                                <AvatarFallback>{getInitials(author?.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-semibold">{author?.name || "Unknown User"}</p>
                                <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                         <p className="text-sm line-clamp-3">{post.content}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                        <Button variant="link" size="sm" className="p-0 h-auto" asChild><Link href={`/posts/${post.id}`}>Read more</Link></Button>
                    </CardFooter>
                 </Card>
              );
            }
            return null;
          })
        ) : (
          <Card className="text-center p-10">
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No results found.</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search terms or filters.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
