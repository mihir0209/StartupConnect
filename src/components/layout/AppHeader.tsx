
"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
// Logo import removed
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Bell, LogOut, Search, Settings, UserCircle, Briefcase, MessageSquare, Users, SearchCode, ThumbsUp, UserCheck, Mail, AtSign, ExternalLink } from 'lucide-react';
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const mockNotifications = [
  { id: '1', type: 'like' as const, text: 'Alice Founder liked your recent post on InnovateX.', time: '2m ago', href:"/posts/post1" },
  { id: '2', type: 'comment' as const, text: 'Bob Investor commented: "Great insights on the article!"', time: '15m ago', href:"/posts/post2" },
  { id: '3', type: 'connection' as const, text: 'David VC sent you a connection request.', time: '1h ago', href:"/network" },
  { id: '4', type: 'message' as const, text: 'New message from Carol Expert regarding product strategy.', time: '3h ago', href:"/messages" },
  { id: '5', type: 'mention' as const, text: 'You were mentioned in a community post in "B2B SaaS Founders".', time: '1d ago', href:"/communities/comm1" },
  { id: '6', type: 'system' as const, text: 'Your profile was viewed by 5 new users this week.', time: '2d ago', href:"/profile/me/analytics" }, // Placeholder link
];

const getNotificationIcon = (type: typeof mockNotifications[number]['type']) => {
  switch (type) {
    case 'like': return <ThumbsUp className="h-4 w-4 text-primary" />;
    case 'comment': return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'connection': return <UserCheck className="h-4 w-4 text-blue-500" />;
    case 'message': return <Mail className="h-4 w-4 text-orange-500" />;
    case 'mention': return <AtSign className="h-4 w-4 text-purple-500" />;
    default: return <Bell className="h-4 w-4 text-muted-foreground" />; // Generic for system or unknown
  }
};

export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { isMobile } = useSidebar();


  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string = "") => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }

  const handleNotificationItemClick = (href: string) => {
    toast({ title: "Notification Clicked", description: `Would navigate to ${href}`});
    // router.push(href); // Uncomment if direct navigation is desired
  }

  const handleViewAllNotifications = () => {
    toast({ title: "Feature Coming Soon", description: "A dedicated notifications page will be available later."});
  }


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b bg-card px-4 md:px-6 shadow-sm">
      {isMobile && (
         <SidebarTrigger className="md:hidden" />
      )}
      {/* Logo removed from here, will rely on Sidebar's logo */}
      <div className="flex-grow md:flex-grow-0 md:ml-4"> {/* Added flex-grow for mobile, adjusted desktop margin */}
         <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            id="header-search-input"
            name="header-search-input"
            type="search"
            placeholder="Search profiles, posts, communities..."
            className="w-full rounded-lg bg-background pl-8"
            aria-label="Search"
            onFocus={() => router.push('/search')} 
            />
        </div>
      </div>
      
      <nav className="ml-auto flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="rounded-full md:hidden" aria-label="Search" onClick={() => router.push('/search')}>
            <Search className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {mockNotifications.length > 0 && (
                 <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-destructive-foreground bg-destructive rounded-full transform translate-x-1/2 -translate-y-1/2">
                  {mockNotifications.length}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 md:w-96 p-0">
            <DropdownMenuLabel className="p-2">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator className="m-0" />
            <ScrollArea className="h-auto max-h-80">
              {mockNotifications.length > 0 ? mockNotifications.map(notif => (
                <DropdownMenuItem key={notif.id} className="p-2 gap-2 items-start cursor-pointer" onClick={() => handleNotificationItemClick(notif.href)}>
                  <span className="mt-0.5">{getNotificationIcon(notif.type)}</span>
                  <div className="flex-1">
                    <p className="text-xs whitespace-normal leading-snug">{notif.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
                  </div>
                </DropdownMenuItem>
              )) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications.
                </div>
              )}
            </ScrollArea>
            {mockNotifications.length > 0 && (
              <>
                <DropdownMenuSeparator className="m-0"/>
                <DropdownMenuItem className="p-2 justify-center cursor-pointer" onClick={handleViewAllNotifications}>
                  <span className="text-sm font-medium text-primary hover:underline">View all notifications</span>
                  <ExternalLink className="ml-1 h-3 w-3 text-primary"/>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profile?.profilePictureUrl || `https://placehold.co/32x32.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar"/>
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/profile/${user.id}`)}>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => router.push('/home')}>
                <Briefcase className="mr-2 h-4 w-4" /> Home Feed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/network')}>
                <Users className="mr-2 h-4 w-4" /> My Network
              </DropdownMenuItem>
               <DropdownMenuItem onClick={() => router.push('/cofounders')}>
                <SearchCode className="mr-2 h-4 w-4" /> Co-Founder Matching
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/messages')}>
                <MessageSquare className="mr-2 h-4 w-4" /> Messages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => router.push('/login')}>Login</Button>
        )}
      </nav>
    </header>
  );
}
