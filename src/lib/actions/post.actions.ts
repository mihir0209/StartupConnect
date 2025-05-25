
"use server";

import { z } from "zod";
import type { Post } from "@/lib/types";
import { mockPosts, mockUsers } from "@/lib/mockData";
import { revalidatePath } from "next/cache";

const CreatePostSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty.").max(2000, "Post content is too long."),
  imageUrl: z.string().url().optional().or(z.literal('')),
  authorId: z.string(), // Assuming authorId is passed from an authenticated session
});

export async function createPost(prevState: any, formData: FormData) {
  try {
    const validatedFields = CreatePostSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      return {
        type: "error",
        message: "Invalid post data.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { content, imageUrl, authorId } = validatedFields.data;
    
    // The authorId is from the authenticated session.
    // We no longer strictly check if authorId exists in mockUsers here,
    // as new users from Firebase Auth won't be in mockUsers initially.
    // The responsibility of displaying author info correctly will be handled by PostCard
    // or by migrating user data fully to Firestore.

    const newPost: Post = {
      id: `post${mockPosts.length + 1}`,
      authorId,
      content,
      imageUrl: imageUrl || undefined,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    mockPosts.unshift(newPost); // Add to the beginning of the array to show newest first

    revalidatePath("/home"); // Revalidate the home page to show the new post
    return { type: "success", message: "Post created successfully!", post: newPost };

  } catch (error) {
    console.error("Create post error:", error);
    return { type: "error", message: "An unexpected error occurred while creating the post." };
  }
}

export async function getPosts(): Promise<Post[]> {
  // Simulate fetching posts, sort by newest first
  return [...mockPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function likePost(postId: string, userId: string): Promise<{success: boolean, newLikesCount?: number}> {
    const post = mockPosts.find(p => p.id === postId);
    if (!post) return {success: false};

    const userIndex = post.likes.indexOf(userId);
    if (userIndex > -1) {
        post.likes.splice(userIndex, 1); // Unlike
    } else {
        post.likes.push(userId); // Like
    }
    revalidatePath("/home"); // Or specific post path
    return {success: true, newLikesCount: post.likes.length};
}

export async function addComment(postId: string, userId: string, content: string): Promise<{success: boolean, commentId?: string}> {
    const post = mockPosts.find(p => p.id === postId);
    if (!post || !content.trim()) return {success: false};

    const newComment = {
        id: `comment${Date.now()}`,
        authorId: userId,
        content: content.trim(),
        createdAt: new Date().toISOString(),
    };
    post.comments.push(newComment);
    revalidatePath("/home"); // Or specific post path
    return {success: true, commentId: newComment.id};
}

// Additional actions like deletePost, updatePost can be added here.

