
"use client";

import type { Post, User as AuthorType, UserRole, ProfileData, User } from "@/lib/types"; 
import { mockUsers } from "@/lib/mockData"; 
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, ThumbsUp, Share2, MoreHorizontal, Send as SendIcon, Edit3, Trash2, AlertOctagon, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { likePost, addComment } from "@/lib/actions/post.actions";
import { useState, useTransition, useEffect } from "react";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";


interface PostCardProps {
  post: Post;
}

export function PostCard({ post: initialPost }: PostCardProps) {
  const { user: loggedInUser, createMockChat, sendMessage } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [currentPost, setCurrentPost] = useState<Post>(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  useEffect(() => {
    setCurrentPost(initialPost); 
  }, [initialPost]);

  const getInitials = (name: string = "") => {
    if(!name) return 'U';
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

  const foundMockAuthor = mockUsers.find(u => u.id === currentPost.authorId);

  if (foundMockAuthor) {
    authorForDisplay = {
      id: foundMockAuthor.id,
      name: foundMockAuthor.name,
      role: foundMockAuthor.role,
      profile: { profilePictureUrl: foundMockAuthor.profile.profilePictureUrl },
    };
  } else if (loggedInUser && loggedInUser.id === currentPost.authorId) {
    authorForDisplay = {
      id: loggedInUser.id,
      name: loggedInUser.name,
      role: loggedInUser.role,
      profile: { profilePictureUrl: loggedInUser.profile.profilePictureUrl },
    };
  } else {
    authorForDisplay = {
      id: currentPost.authorId,
      name: "Nexus User",
      role: "Member", 
      profile: { profilePictureUrl: `https://placehold.co/40x40.png?text=N` },
    };
  }
  
  const userHasLiked = loggedInUser ? currentPost.likes.includes(loggedInUser.id) : false;

  const handleLike = () => {
    if (!loggedInUser) {
      toast({ variant: "destructive", title: "Login Required", description: "Please login to like posts." });
      return;
    }
    startTransition(async () => {
      const result = await likePost(currentPost.id, loggedInUser.id);
      if (result.success && result.updatedPost) {
        setCurrentPost(result.updatedPost);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to update like." });
      }
    });
  };

  const handleCommentSubmit = () => {
    if (!loggedInUser || !commentText.trim()) {
      toast({ variant: "destructive", title: "Error", description: !loggedInUser ? "Please login to comment." : "Comment cannot be empty." });
      return;
    }
    startTransition(async () => {
      const result = await addComment(currentPost.id, loggedInUser.id, commentText);
      if (result.success && result.updatedPost) {
        setCurrentPost(result.updatedPost);
        setCommentText("");
        setShowComments(true); 
        toast({ title: "Success", description: "Comment added." });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to add comment." });
      }
    });
  };

  const handleShareSend = async (connection: User) => {
    if (!loggedInUser) return;
    const chatResult = await createMockChat([loggedInUser.id, connection.id]);
    if (chatResult.success && chatResult.chatId) {
      const messageContent = `Check out this post by ${authorForDisplay.name}:\n"${currentPost.content.substring(0, 70)}${currentPost.content.length > 70 ? '...' : ''}"\n\nView post: /posts/${currentPost.id}`; 
      const sendResult = await sendMessage(chatResult.chatId, loggedInUser.id, messageContent);
      if (sendResult.success) {
        toast({ title: "Shared!", description: `Post sent to ${connection.name}.` });
        setIsShareDialogOpen(false);
        // router.push(`/messages?chatWith=${connection.id}&chatId=${chatResult.chatId}`); // Navigation removed as per user request
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not send message." });
      }
    } else {
      toast({ variant: "destructive", title: "Error", description: "Could not initiate chat." });
    }
  };
  
  const userConnections = loggedInUser ? mockUsers.filter(u => loggedInUser.connections.includes(u.id) && u.id !== loggedInUser.id) : [];

  const handleEditPost = () => {
    toast({ title: "Feature Info", description: "Editing posts will be available soon." });
  };

  const handleDeletePost = () => {
    // For a mock, we might remove it from a global store or just notify
    toast({ title: "Feature Info", description: "Deleting posts will be available soon. For now, imagine it's gone!"});
    // To actually remove from UI if mockPosts is part of a global state or prop:
    // 1. Call an action that removes post from mockPosts.
    // 2. Trigger a re-fetch or re-render of the feed.
    // For now, a toast is sufficient.
  };
  
  const handleReportPost = () => {
    toast({ title: "Post Reported", description: "Thank you for your feedback (mock)." });
  };
  
  const handleSavePost = () => {
    toast({ title: "Post Saved (Mock)", description: "This post has been added to your saved items." });
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
                  {authorForDisplay.role} &bull; {formatDistanceToNow(new Date(currentPost.createdAt), { addSuffix: true })}
                </p>
              </div>
            </a>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto">
                <MoreHorizontal className="h-5 w-5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {loggedInUser && loggedInUser.id === currentPost.authorId && (
                <>
                  <DropdownMenuItem onClick={handleEditPost}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeletePost} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleSavePost}>
                <Bookmark className="mr-2 h-4 w-4" />
                Save Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReportPost}>
                <AlertOctagon className="mr-2 h-4 w-4" />
                Report Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{currentPost.content}</p>
        {currentPost.imageUrl && (
          <div className="mt-4 relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image 
              src={currentPost.imageUrl} 
              alt="Post image" 
              layout="fill" 
              objectFit="cover" 
              data-ai-hint={currentPost.dataAiHint || "social media content"}/>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4 pt-2">
        <div className="flex w-full justify-between items-center text-xs text-muted-foreground mb-2">
          <span>{currentPost.likes.length > 0 ? `${currentPost.likes.length} like${currentPost.likes.length > 1 ? 's' : ''}` : '0 likes'}</span>
          <button onClick={() => setShowComments(!showComments)} className="hover:underline">
            {currentPost.comments.length > 0 ? `${currentPost.comments.length} comment${currentPost.comments.length > 1 ? 's' : ''}` : '0 comments'}
          </button>
        </div>
        <div className="w-full border-t pt-2 grid grid-cols-3 gap-1">
          <Button variant={userHasLiked ? "secondary" : "ghost"} onClick={handleLike} disabled={isPending} className="w-full">
            <ThumbsUp className={`mr-2 h-4 w-4 ${userHasLiked ? "text-primary fill-primary" : ""}`} /> Like
          </Button>
          <Button variant="ghost" onClick={() => setShowComments(!showComments)} className="w-full">
            <MessageCircle className="mr-2 h-4 w-4" /> Comment
          </Button>
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Share Post</DialogTitle>
                <DialogDescription>Send this post to your connections.</DialogDescription>
              </DialogHeader>
              {userConnections.length > 0 ? (
                <ScrollArea className="h-[200px] w-full rounded-md border p-2">
                  <div className="space-y-2">
                  {userConnections.map(connection => (
                    <div key={connection.id} className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={connection.profile.profilePictureUrl || `https://placehold.co/32x32.png?text=${getInitials(connection.name)}`} alt={connection.name} data-ai-hint="profile avatar small"/>
                          <AvatarFallback>{getInitials(connection.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{connection.name}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleShareSend(connection)} disabled={isPending}>
                        <SendIcon className="mr-2 h-3 w-3"/> Send
                      </Button>
                    </div>
                  ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">You have no connections to share with yet.</p>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {showComments && (
          <div className="w-full mt-4 space-y-3">
            {currentPost.comments.map(comment => {
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

