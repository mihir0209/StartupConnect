"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/shared/Logo';
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
import { Bell, LogOut, Search, Settings, UserCircle, Briefcase, MessageSquare, Users, SearchCode } from 'lucide-react';
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"; // Import from sidebar UI component
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';


export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toggleSidebar, isMobile } = useSidebar();


  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 shadow-sm">
      {isMobile && (
         <SidebarTrigger className="md:hidden" />
      )}
      <Link href="/home" className="flex items-center gap-2 mr-auto md:mr-4" aria-label={`${APP_NAME} Home`}>
        <Logo iconOnly={isMobile} />
      </Link>
      
      <div className="relative flex-1 md:grow-0 md:flex-initial md:w-96 hidden md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search profiles, posts, communities..."
          className="w-full rounded-lg bg-background pl-8 md:w-full"
          aria-label="Search"
        />
      </div>

      <nav className="ml-auto flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="rounded-full md:hidden" aria-label="Search">
            <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profile?.profilePictureUrl || `https://placehold.co/32x32.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar" />
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
