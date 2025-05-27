
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, MessageSquare, Search, Briefcase, Settings, LogOut, SearchCode, Building2, Group, UserCircle2 } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/lib/constants';

const navItems = [
  { href: '/home', label: 'Home Feed', icon: Home },
  { href: '/network', label: 'My Network', icon: Users },
  { href: '/cofounders', label: 'Co-Founder Matching', icon: SearchCode },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/search', label: 'Search & Filters', icon: Search },
  { href: '/communities', label: 'Communities', icon: Group },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { state, isMobile, setOpenMobile } = useSidebar();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/home" onClick={closeMobileSidebar} className="flex items-center justify-center w-full" aria-label={`${APP_NAME} Home`}>
            <Logo 
              type={(state === 'collapsed' && !isMobile) ? 'icon' : 'banner'}
              size={'md'} // md for banner (194x40), md for icon (32x32)
              className={(state === 'collapsed' && !isMobile) ? '' : 'w-full px-2 py-1'} // Adjust padding for banner
            />
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, className: "bg-primary text-primary-foreground" }}
                  onClick={closeMobileSidebar}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        {user && (
          <SidebarMenu>
             <SidebarMenuItem>
              <Link href={`/profile/${user.id}`} legacyBehavior passHref>
                 <SidebarMenuButton 
                  asChild 
                  isActive={pathname === `/profile/${user.id}`} 
                  tooltip={{ children: "My Profile", className: "bg-primary text-primary-foreground" }}
                  onClick={closeMobileSidebar}
                 >
                    <a>
                      <Avatar className="h-6 w-6 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7">
                        <AvatarImage src={user.profile?.profilePictureUrl || `https://placehold.co/28x28.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar small"/>
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{user.name}</span>
                    </a>
                 </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/settings/profile" legacyBehavior passHref>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname.startsWith('/settings')}
                  tooltip={{ children: "Settings", className: "bg-primary text-primary-foreground" }}
                  onClick={closeMobileSidebar}
                >
                  <a>
                    <Settings />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => { handleLogout(); closeMobileSidebar(); }} 
                tooltip={{ children: "Logout", className: "bg-primary text-primary-foreground" }}
              >
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

