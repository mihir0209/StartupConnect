import { CreatePostForm } from "@/components/feed/CreatePostForm";
import { PostCard } from "@/components/feed/PostCard";
import { getPosts } from "@/lib/actions/post.actions"; // Server action to fetch posts
import type { Post } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

export default async function HomePage() {
  const posts: Post[] = await getPosts();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Home Feed</h1>
      <CreatePostForm />
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

// Revalidate this page frequently or on demand when new posts are created
export const revalidate = 60; // Revalidate every 60 seconds, or use on-demand revalidation
