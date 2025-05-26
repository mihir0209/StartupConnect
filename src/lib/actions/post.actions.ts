
"use server";

import { z } from "zod";
import type { Post, Comment as CommentType } from "@/lib/types";
import { mockPosts, mockUsers } from "@/lib/mockData"; 

const CreatePostSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty.").max(2000, "Post content is too long."),
  imageUrl: z.string().url().optional().or(z.literal('')),
  authorId: z.string(),
  dataAiHint: z.string().optional(), 
});

export async function createPost(prevState: any, formData: FormData) {
  try {
    const validatedFields = CreatePostSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      return {
        type: "error" as const,
        message: "Invalid post data.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { content, imageUrl, authorId, dataAiHint } = validatedFields.data;
    
    const newPost: Post = {
      id: `post${Date.now()}${Math.floor(Math.random() * 1000)}`,
      authorId,
      content,
      imageUrl: imageUrl || undefined,
      dataAiHint: dataAiHint || (imageUrl ? 'user image' : undefined),
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    mockPosts.unshift(newPost); 

    return { type: "success" as const, message: "Mock post created successfully!", post: newPost };

  } catch (error: any) {
    console.error("Create post (mock) error:", error);
    return { type: "error" as const, message: error.message || "An unexpected error occurred while creating the mock post." };
  }
}

export async function getPosts(): Promise<Post[]> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate small delay
  return [...mockPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function likePost(postId: string, userId: string): Promise<{success: boolean, updatedPost?: Post}> {
    const postIndex = mockPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return {success: false};
    }

    const post = mockPosts[postIndex];
    const currentLikes = post.likes || [];
    let updatedLikes: string[];

    if (currentLikes.includes(userId)) {
        updatedLikes = currentLikes.filter(id => id !== userId); // Unlike
    } else {
        updatedLikes = [...currentLikes, userId]; // Like
    }
    
    mockPosts[postIndex] = { ...post, likes: updatedLikes };
    
    return {success: true, updatedPost: mockPosts[postIndex]};
}

export async function addComment(postId: string, userId: string, content: string): Promise<{success: boolean, updatedPost?: Post}> {
    if (!content.trim()) return {success: false};

    const postIndex = mockPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return {success: false};
    }
    const post = mockPosts[postIndex];

    const newComment: CommentType = {
        id: `comment${Date.now()}${Math.floor(Math.random() * 1000)}`,
        authorId: userId,
        content: content.trim(),
        createdAt: new Date().toISOString(),
    };
    
    const currentComments = post.comments || [];
    const updatedComments = [...currentComments, newComment];
    
    mockPosts[postIndex] = { ...post, comments: updatedComments };

    return {success: true, updatedPost: mockPosts[postIndex]};
}
