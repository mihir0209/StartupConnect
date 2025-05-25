
"use client";

import type { Post, User as AuthorType, UserRole, ProfileData, FounderProfile } from "@/lib/types"; // Added UserRole, ProfileData
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
import { INDUSTRIES, FUNDING_STAGES } from "@/lib/constants"; // For fallback

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user: loggedInUser } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'A';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }

  let authorForDisplay: {
    id: string;
    name: string;
    role: UserRole | string;
    profile: { profilePictureUrl?: string };
  };

  const foundMockAuthor = mockUsers.find(u => u.id === post.authorId);

  if (foundMockAuthor) {
    authorForDisplay = {
      id: foundMockAuthor.id,
      name: foundMockAuthor.name,
      role: foundMockAuthor.role,
      profile: { profilePictureUrl: foundMockAuthor.profile.profilePictureUrl },
    };
  } else if (loggedInUser && loggedInUser.id === post.authorId) {
    // Post is by the current logged-in user who isn't in mockUsers
    authorForDisplay = {
      id: loggedInUser.id,
      name: loggedInUser.name,
      role: loggedInUser.role,
      profile: { profilePictureUrl: loggedInUser.profile.profilePictureUrl },
    };
  } else {
    // Fallback for truly unknown authors (e.g. another Firebase user not in mocks)
    authorForDisplay = {
      id: post.authorId,
      name: "Nexus User",
      role: "Member", // Generic role
      profile: { profilePictureUrl: `https://placehold.co/40x40.png?text=N` },
    };
  }
  
  const userHasLiked = loggedInUser ? post.likes.includes(loggedInUser.id) : false;

  const handleLike = () => {
    if (!loggedInUser) {
      toast({ variant: "destructive", title: "Login Required", description: "Please login to like posts." });
      return;
    }
    startTransition(async () => {
      await likePost(post.id, loggedInUser.id);
      // Optimistic update can be handled here, or rely on revalidation
    });
  };

  const handleCommentSubmit = () => {
    if (!loggedInUser || !commentText.trim()) {
      toast({ variant: "destructive", title: "Error", description: !loggedInUser ? "Please login to comment." : "Comment cannot be empty." });
      return;
    }
    startTransition(async () => {
      const result = await addComment(post.id, loggedInUser.id, commentText);
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
          <Link href={`/profile/${authorForDisplay.id}`} legacyBehavior>
            <a className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={authorForDisplay.profile.profilePictureUrl || `https://placehold.co/40x40.png?text=${getInitials(authorForDisplay.name)}`} alt={authorForDisplay.name} data-ai-hint="profile avatar small" />
                <AvatarFallback>{getInitials(authorForDisplay.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold hover:underline">{authorForDisplay.name}</p>
                <p className="text-xs text-muted-foreground">
                  {authorForDisplay.role} &bull; {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
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
              // Logic for comment author display (similar to post author)
              let commentAuthorDisplay: { name: string; profilePictureUrl?: string; }
              const foundCommentAuthor = mockUsers.find(u => u.id === comment.authorId);
              if (foundCommentAuthor) {
                  commentAuthorDisplay = { name: foundCommentAuthor.name, profilePictureUrl: foundCommentAuthor.profile.profilePictureUrl };
              } else if (loggedInUser && loggedInUser.id === comment.authorId) {
                  commentAuthorDisplay = { name: loggedInUser.name, profilePictureUrl: loggedInUser.profile.profilePictureUrl };
              } else {
                  commentAuthorDisplay = { name: "Nexus User", profilePictureUrl: `https://placehold.co/32x32.png?text=N` };
              }

              return (
                <div key={comment.id} className="flex gap-2 text-sm">
                  <Avatar className="h-8 w-8">
                     <AvatarImage src={commentAuthorDisplay.profilePictureUrl || `https://placehold.co/32x32.png?text=${getInitials(commentAuthorDisplay.name)}`} alt={commentAuthorDisplay.name} data-ai-hint="profile avatar small" />
                     <AvatarFallback>{getInitials(commentAuthorDisplay.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 rounded-md bg-secondary p-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-xs">{commentAuthorDisplay.name}</span>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p className="mt-1">{comment.content}</p>
                  </div>
                </div>
              );
            })}
            {loggedInUser && (
              <div className="flex gap-2 mt-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={loggedInUser.profile.profilePictureUrl || `https://placehold.co/32x32.png?text=${getInitials(loggedInUser.name)}`} alt={loggedInUser.name} data-ai-hint="profile avatar small" />
                  <AvatarFallback>{getInitials(loggedInUser.name)}</AvatarFallback>
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

