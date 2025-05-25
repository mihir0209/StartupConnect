"use client";

import type { Post, User as Author } from "@/lib/types";
import { mockUsers } from "@/lib/mockData"; // To find author details
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, ThumbsUp, Share2, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { likePost, addComment } from "@/lib/actions/post.actions";
import { useState, useTransition } from "react";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const author = mockUsers.find(u => u.id === post.authorId);
  if (!author) return null; // Or some fallback UI

  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'A';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }
  
  const userHasLiked = user ? post.likes.includes(user.id) : false;

  const handleLike = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Login Required", description: "Please login to like posts." });
      return;
    }
    startTransition(async () => {
      await likePost(post.id, user.id);
      // Optimistic update can be handled here, or rely on revalidation
    });
  };

  const handleCommentSubmit = () => {
    if (!user || !commentText.trim()) {
      toast({ variant: "destructive", title: "Error", description: !user ? "Please login to comment." : "Comment cannot be empty." });
      return;
    }
    startTransition(async () => {
      const result = await addComment(post.id, user.id, commentText);
      if (result.success) {
        setCommentText("");
        toast({ title: "Success", description: "Comment added." });
        // Optionally: setShowComments(true) if not already.
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to add comment." });
      }
    });
  };

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${author.id}`} legacyBehavior>
            <a className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={author.profile.profilePictureUrl || `https://placehold.co/40x40.png?text=${getInitials(author.name)}`} alt={author.name} data-ai-hint="profile avatar small" />
                <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold hover:underline">{author.name}</p>
                <p className="text-xs text-muted-foreground">
                  {author.role} &bull; {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
            </a>
          </Link>
          <Button variant="ghost" size="icon" className="ml-auto">
            <MoreHorizontal className="h-5 w-5" />
            <span className="sr-only">More options</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
        {post.imageUrl && (
          <div className="mt-4 relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image 
              src={post.imageUrl} 
              alt="Post image" 
              layout="fill" 
              objectFit="cover" 
              data-ai-hint={post.dataAiHint || "social media content"}/>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4 pt-2">
        <div className="flex w-full justify-between items-center text-xs text-muted-foreground mb-2">
          <span>{post.likes.length > 0 ? `${post.likes.length} like${post.likes.length > 1 ? 's' : ''}` : ''}</span>
          <button onClick={() => setShowComments(!showComments)} className="hover:underline">
            {post.comments.length > 0 ? `${post.comments.length} comment${post.comments.length > 1 ? 's' : ''}` : 'No comments'}
          </button>
        </div>
        <div className="w-full border-t pt-2 grid grid-cols-3 gap-1">
          <Button variant={userHasLiked ? "secondary" : "ghost"} onClick={handleLike} disabled={isPending} className="w-full">
            <ThumbsUp className={`mr-2 h-4 w-4 ${userHasLiked ? "text-primary fill-primary" : ""}`} /> Like
          </Button>
          <Button variant="ghost" onClick={() => setShowComments(!showComments)} className="w-full">
            <MessageCircle className="mr-2 h-4 w-4" /> Comment
          </Button>
          <Button variant="ghost" className="w-full">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>
        {showComments && (
          <div className="w-full mt-4 space-y-3">
            {post.comments.map(comment => {
              const commentAuthor = mockUsers.find(u => u.id === comment.authorId);
              return (
                <div key={comment.id} className="flex gap-2 text-sm">
                  <Avatar className="h-8 w-8">
                     <AvatarImage src={commentAuthor?.profile.profilePictureUrl || `https://placehold.co/32x32.png?text=${getInitials(commentAuthor?.name)}`} alt={commentAuthor?.name} data-ai-hint="profile avatar small" />
                     <AvatarFallback>{getInitials(commentAuthor?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 rounded-md bg-secondary p-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-xs">{commentAuthor?.name || 'User'}</span>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p className="mt-1">{comment.content}</p>
                  </div>
                </div>
              );
            })}
            {user && (
              <div className="flex gap-2 mt-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profile.profilePictureUrl || `https://placehold.co/32x32.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar small" />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea 
                    placeholder="Write a comment..." 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    className="mb-2"
                  />
                  <Button size="sm" onClick={handleCommentSubmit} disabled={isPending || !commentText.trim()}>
                    {isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
