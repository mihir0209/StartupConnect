
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, UserCheck } from "lucide-react";
import { mockUsers } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Mock current user ID for demo purposes. In a real app, this would come from auth context.
const currentUserId = 'user1'; 

export default function NetworkPage() {
  const currentUser = mockUsers.find(u => u.id === currentUserId);
  
  const connections = mockUsers.filter(u => currentUser?.connections.includes(u.id));
  const suggestedConnections = mockUsers.filter(u => 
    u.id !== currentUserId && 
    !currentUser?.connections.includes(u.id) &&
    ( (currentUser?.profile as any).industry === (u.profile as any).industry || // Basic suggestion logic
      Math.random() < 0.3 ) // Randomly suggest some
  ).slice(0, 5); // Limit suggestions

  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">My Network</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Your Connections ({connections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map(user => (
                <Card key={user.id} className="p-4 flex flex-col items-center text-center">
                  <Avatar className="h-16 w-16 mb-2">
                    <AvatarImage src={user.profile.profilePictureUrl || `https://placehold.co/64x64.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <Link href={`/profile/${user.id}`} className="font-semibold hover:underline">{user.name}</Link>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href={`/profile/${user.id}`}>View Profile</Link>
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">You haven't made any connections yet.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            Suggested Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestedConnections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedConnections.map(user => (
                <Card key={user.id} className="p-4 flex flex-col items-center text-center">
                  <Avatar className="h-16 w-16 mb-2">
                     <AvatarImage src={user.profile.profilePictureUrl || `https://placehold.co/64x64.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
                     <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <Link href={`/profile/${user.id}`} className="font-semibold hover:underline">{user.name}</Link>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                  <Button size="sm" className="mt-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                    <UserCheck className="mr-2 h-4 w-4"/> Connect
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
             <p className="text-muted-foreground">No new suggestions right now. Check back later!</p>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You have no pending invitations.</p>
          {/* Map over pending requests here */}
        </CardContent>
      </Card>
    </div>
  );
}
