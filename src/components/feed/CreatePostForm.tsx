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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
      {pending ? "Posting..." : "Post"}
      <Send className="ml-2 h-4 w-4" />
    </Button>
  );
}

export function CreatePostForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const initialState = { message: null, errors: {}, type: "", post: null };
  const [state, dispatch] = useActionState(createPost, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.type === "success" && state.post) {
      toast({ title: "Success!", description: "Your post has been published." });
      formRef.current?.reset(); // Reset the form fields
    } else if (state?.type === "error" && state.message) {
      toast({ variant: "destructive", title: "Error", description: state.message });
    }
  }, [state, toast]);

  if (!user) return null;
  
  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
  }


  // Add authorId to formData. This is a hidden input, or could be passed differently if not FormData
  const handleSubmitWithAuthor = (formData: FormData) => {
    formData.append('authorId', user.id);
    dispatch(formData);
  }

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.profile.profilePictureUrl || `https://placehold.co/40x40.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="profile avatar small" />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <p className="font-semibold">{user.name}</p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <form action={handleSubmitWithAuthor} ref={formRef} className="space-y-4">
          <div>
            <Label htmlFor="content" className="sr-only">What's on your mind?</Label>
            <Textarea
              id="content"
              name="content"
              placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
              rows={3}
              className="resize-none"
              aria-describedby="content-error"
            />
            {state?.errors?.content && <p id="content-error" className="text-sm text-destructive mt-1">{state.errors.content[0]}</p>}
          </div>
          <div>
            <Label htmlFor="imageUrl" className="text-sm font-medium text-muted-foreground">Image URL (Optional)</Label>
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
            // General error not specific to a field
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <CardFooter className="flex justify-between p-0 pt-2">
            <Button variant="ghost" size="sm" type="button" className="text-muted-foreground"> {/* For future file upload */}
              <ImagePlus className="mr-2 h-4 w-4" />
              Add Image/Video
            </Button>
            <SubmitButton />
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
