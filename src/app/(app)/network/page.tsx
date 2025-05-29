
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, UserCheck, Clock, CheckCircle, UserX } from "lucide-react";
import { mockUsers } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getUserDisplayDomains } from "@/lib/userUtils";

export default function NetworkPage() {
  const { user: loggedInUser, sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest } = useAuth();
  const { toast } = useToast();
  
  // Local state to trigger re-renders when mockData changes
  const [, setForceRender] = useState(0); 

  useEffect(() => {
    // This effect is primarily to ensure the component re-renders if `loggedInUser`
    // (and its connection arrays) changes due to actions in AuthContext.
  }, [loggedInUser]);

  if (!loggedInUser) {
    return <div className="text-center py-10">Loading user data...</div>;
  }

  const connections = mockUsers.filter(u => loggedInUser.connections.includes(u.id));
  
  const suggestedConnections = mockUsers.filter(u => 
    u.id !== loggedInUser.id && 
    !loggedInUser.connections.includes(u.id) &&
    !loggedInUser.connectionRequestsSent.includes(u.id) &&
    !loggedInUser.connectionRequestsReceived.includes(u.id) &&
    ( (loggedInUser.profile as any).industry === (u.profile as any).industry || 
      Math.random() < 0.3 ) 
  ).slice(0, 5);

  const pendingInvitations = mockUsers.filter(u => loggedInUser.connectionRequestsReceived.includes(u.id));

  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }

  const handleSendRequest = async (targetUserId: string) => {
    const result = await sendConnectionRequest(targetUserId);
    if (result.success) {
      toast({ title: "Connection Request Sent" });
      setForceRender(prev => prev + 1); // Force re-render
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handleAcceptRequest = async (requesterId: string) => {
    const result = await acceptConnectionRequest(requesterId);
    if (result.success) {
      toast({ title: "Connection Accepted" });
      setForceRender(prev => prev + 1);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };
  
  const handleDeclineRequest = async (requesterId: string) => {
    const result = await declineConnectionRequest(requesterId);
     if (result.success) {
      toast({ title: "Connection Declined" });
      setForceRender(prev => prev + 1);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const getButtonState = (targetUserId: string): 'connect' | 'pending' => {
    if (loggedInUser.connectionRequestsSent.includes(targetUserId)) return 'pending';
    return 'connect';
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
                <Card key={user.id} className="p-4 flex flex-col items-center text-center shadow-md hover:shadow-lg transition-shadow">
                  <Avatar className="h-16 w-16 mb-2">
                    <AvatarImage src={user.profile.profilePictureUrl || `https://placehold.co/64x64.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <Link href={`/profile/${user.id}`} className="font-semibold hover:underline">{user.name}</Link>
                  <p className="text-xs text-muted-foreground">{user.role} <span className="text-primary/80">{getUserDisplayDomains(user)}</span></p>
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
              {suggestedConnections.map(user => {
                const buttonState = getButtonState(user.id);
                return (
                  <Card key={user.id} className="p-4 flex flex-col items-center text-center shadow-md hover:shadow-lg transition-shadow">
                    <Avatar className="h-16 w-16 mb-2">
                       <AvatarImage src={user.profile.profilePictureUrl || `https://placehold.co/64x64.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
                       <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <Link href={`/profile/${user.id}`} className="font-semibold hover:underline">{user.name}</Link>
                    <p className="text-xs text-muted-foreground">{user.role} <span className="text-primary/80">{getUserDisplayDomains(user)}</span></p>
                    {buttonState === 'connect' ? (
                      <Button size="sm" className="mt-2 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => handleSendRequest(user.id)}>
                        <UserCheck className="mr-2 h-4 w-4"/> Connect
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="mt-2" disabled>
                        <Clock className="mr-2 h-4 w-4"/> Pending
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
             <p className="text-muted-foreground">No new suggestions right now. Check back later!</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Pending Invitations ({pendingInvitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingInvitations.map(user => (
                <Card key={user.id} className="p-4 flex flex-col items-center text-center shadow-md hover:shadow-lg transition-shadow">
                  <Avatar className="h-16 w-16 mb-2">
                    <AvatarImage src={user.profile.profilePictureUrl || `https://placehold.co/64x64.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <Link href={`/profile/${user.id}`} className="font-semibold hover:underline">{user.name}</Link>
                   <p className="text-xs text-muted-foreground">{user.role} <span className="text-primary/80">{getUserDisplayDomains(user)}</span></p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => handleAcceptRequest(user.id)}>
                      <CheckCircle className="mr-2 h-4 w-4"/> Accept
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeclineRequest(user.id)}>
                      <UserX className="mr-2 h-4 w-4"/> Decline
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">You have no pending invitations.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
