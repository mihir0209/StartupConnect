
"use client"; 

import { useEffect, useState } from 'react';
import { CreatePostForm } from "@/components/feed/CreatePostForm";
import { PostCard } from "@/components/feed/PostCard";
import { getPosts } from "@/lib/actions/post.actions"; 
import type { Post } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Edit3, Image as ImageIcon } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchPosts() {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    }
    fetchPosts();
  }, []);

  const handlePostCreated = () => {
    setIsDialogOpen(false);
    // Re-fetch posts to update the feed
    async function fetchPosts() {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    }
    fetchPosts();
  };

  const getInitials = (name: string = "") => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }


  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Home Feed</h1>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Card className="mb-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {user && (
                  <Avatar>
                    <AvatarImage src={user.profile.profilePictureUrl || `https://placehold.co/40x40.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar small" />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground text-sm">
                  What's on your mind, {user ? user.name.split(' ')[0] : 'guest'}?
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
            <DialogDescription>
              Share your thoughts, updates, or questions with your network.
            </DialogDescription>
          </DialogHeader>
          <CreatePostForm onPostCreated={handlePostCreated} />
        </DialogContent>
      </Dialog>

      <Separator className="my-8" />
      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No posts yet.</p>
          <p className="text-sm text-muted-foreground">Be the first to share something!</p>
        </div>
      )}
    </div>
  );
}

// Placeholder imports for UI components from HomePage
import { Card, CardContent } from '@/components/ui/card';
