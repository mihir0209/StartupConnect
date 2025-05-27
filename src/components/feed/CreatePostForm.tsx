
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createPost } from "@/lib/actions/post.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, ImagePlus, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
// useRouter import removed as router.refresh() is handled by the parent page now

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
      {pending ? "Posting..." : "Post"}
      <Send className="ml-2 h-4 w-4" />
    </Button>
  );
}

interface CreatePostFormProps {
  onPostCreated?: () => void; // Callback to notify parent when post is created
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  // router import removed
  const initialState = { message: null, errors: {}, type: "", post: null };
  const [state, dispatch] = useActionState(createPost, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.type === "success" && state.post) {
      toast({ title: "Success!", description: "Your post has been published." });
      formRef.current?.reset(); // Reset the form fields
      onPostCreated?.(); // Call the callback
      // router.refresh(); // Refresh is now handled by the parent HomePage
    } else if (state?.type === "error" && state.message) {
      toast({ variant: "destructive", title: "Error", description: state.message });
    }
  }, [state, toast, onPostCreated]); 

  if (!user) return <p>Please log in to create a post.</p>; // Or some other placeholder
  
  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }


  const handleSubmitWithAuthor = (formData: FormData) => {
    if (user) { 
      formData.append('authorId', user.id);
    } else {
      toast({ variant: "destructive", title: "Error", description: "User not authenticated to post." });
      return;
    }
    dispatch(formData);
  }

  return (
    // Removed the outer Card as the form will be in a Dialog
    // The DialogHeader in HomePage provides user avatar and name context now
    <form action={handleSubmitWithAuthor} ref={formRef} className="space-y-4 pt-4"> {/* Added pt-4 for spacing */}
      <div>
        <Label htmlFor="content" className="sr-only">What's on your mind?</Label>
        <Textarea
          id="content"
          name="content"
          placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
          rows={5} // Increased rows for more space in dialog
          className="resize-none"
          aria-describedby="content-error"
        />
        {state?.errors?.content && <p id="content-error" className="text-sm text-destructive mt-1">{state.errors.content[0]}</p>}
      </div>
      <div>
        <Label htmlFor="imageUrl" className="text-sm font-medium">Image URL (Optional)</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          type="url"
          placeholder="https://example.com/image.png"
          aria-describedby="imageUrl-error"
        />
        {state?.errors?.imageUrl && <p id="imageUrl-error" className="text-sm text-destructive mt-1">{state.errors.imageUrl[0]}</p>}
      </div>
      {state?.type === "error" && state.message && !state.errors && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-between items-center pt-2"> {/* Replaced CardFooter with a div */}
        <Button variant="ghost" size="sm" type="button" className="text-muted-foreground">
          <ImagePlus className="mr-2 h-4 w-4" />
          Add Image/Video
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
