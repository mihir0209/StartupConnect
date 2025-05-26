
"use server";

import { z } from "zod";
import type { Post, Comment as CommentType } from "@/lib/types"; // Renamed Comment to CommentType to avoid conflict
import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";
// mockPosts and mockUsers are removed as we'll use Supabase

const CreatePostSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty.").max(2000, "Post content is too long."),
  imageUrl: z.string().url().optional().or(z.literal('')),
  authorId: z.string(), // Assuming authorId is passed from an authenticated session
  // dataAiHint is not part of schema, but can be passed if needed from client for image generation
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
    
    const newPostPayload = {
      author_id: authorId, // Ensure column name matches Supabase (e.g., author_id)
      content,
      image_url: imageUrl || null, // Use null for empty optional URL
      likes: [], // Initialize as empty array
      comments: [], // Initialize as empty array for JSONB storage
      // Supabase will handle id and created_at if columns are set up with defaults
    };

    const { data: createdPost, error } = await supabase
      .from('posts')
      .insert([newPostPayload])
      .select()
      .single();

    if (error) {
      console.error("Supabase create post error:", error);
      return { type: "error", message: error.message || "Failed to create post." };
    }
    
    revalidatePath("/home");
    // Map Supabase response to Post type if column names differ (e.g., author_id to authorId)
    const postForClient: Post = {
      id: createdPost.id,
      authorId: createdPost.author_id,
      content: createdPost.content,
      imageUrl: createdPost.image_url,
      likes: createdPost.likes || [],
      comments: createdPost.comments || [],
      createdAt: createdPost.created_at,
      // dataAiHint needs to be handled if it's part of the form and post object
    };
    return { type: "success", message: "Post created successfully!", post: postForClient };

  } catch (error: any) {
    console.error("Create post error:", error);
    return { type: "error", message: error.message || "An unexpected error occurred while creating the post." };
  }
}

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      author_id,
      content,
      image_url,
      likes,
      comments,
      created_at,
      tags
    `) // Explicitly select columns
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts from Supabase:', error);
    return [];
  }
  if (!data) return [];

  // Map Supabase data to Post[] type
  return data.map(post => ({
    id: post.id,
    authorId: post.author_id,
    content: post.content,
    imageUrl: post.image_url,
    likes: post.likes || [],
    comments: (post.comments as CommentType[] || []), // Ensure comments are correctly typed
    createdAt: post.created_at,
    tags: post.tags,
  }));
}

export async function likePost(postId: string, userId: string): Promise<{success: boolean, newLikesCount?: number}> {
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      console.error('Error fetching post for like:', fetchError);
      return {success: false};
    }

    const currentLikes: string[] = post.likes || [];
    let updatedLikes: string[];

    if (currentLikes.includes(userId)) {
        updatedLikes = currentLikes.filter(id => id !== userId); // Unlike
    } else {
        updatedLikes = [...currentLikes, userId]; // Like
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({ likes: updatedLikes })
      .eq('id', postId);

    if (updateError) {
      console.error('Error updating likes:', updateError);
      return {success: false};
    }
    
    revalidatePath("/home");
    revalidatePath(`/posts/${postId}`); // Assuming a dynamic post page
    return {success: true, newLikesCount: updatedLikes.length};
}

export async function addComment(postId: string, userId: string, content: string): Promise<{success: boolean, newComment?: CommentType}> {
    if (!content.trim()) return {success: false};

    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('comments')
      .eq('id', postId)
      .single();
    
    if (fetchError || !post) {
      console.error('Error fetching post for comment:', fetchError);
      return {success: false};
    }

    const newComment: CommentType = {
        id: crypto.randomUUID(), // Generate UUID for comment
        authorId: userId,
        content: content.trim(),
        createdAt: new Date().toISOString(),
    };
    
    const currentComments: CommentType[] = (post.comments as CommentType[] || []);
    const updatedComments = [...currentComments, newComment];

    const { error: updateError } = await supabase
      .from('posts')
      .update({ comments: updatedComments })
      .eq('id', postId);

    if (updateError) {
      console.error('Error adding comment:', updateError);
      return {success: false};
    }

    revalidatePath("/home");
    revalidatePath(`/posts/${postId}`);
    return {success: true, newComment};
}
