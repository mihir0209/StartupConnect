
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockCommunities as initialMockCommunities } from "@/lib/mockData"; // Keep initial for static part if needed
import { INDUSTRIES, APP_NAME } from "@/lib/constants";
import type { Community } from "@/lib/types";
import { Group, PlusCircle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const CreateCommunitySchema = z.object({
  name: z.string().min(3, "Community name must be at least 3 characters").max(50, "Community name too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description too long"),
  industry: z.string().refine(val => INDUSTRIES.includes(val), "Please select a valid industry"),
});

type CreateCommunityFormData = z.infer<typeof CreateCommunitySchema>;

export default function CommunitiesPage() {
  const { toast } = useToast();
  const { user, createCommunity } = useAuth();
  const [communities, setCommunities] = useState<Community[]>(initialMockCommunities);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [forceRender, setForceRender] = useState(0); // To re-fetch/re-render list

   useEffect(() => {
    // In a real app, you'd fetch communities. Here, we just re-set from mockData.
    // This ensures that if mockData is updated by AuthContext, we see the changes.
    setCommunities([...initialMockCommunities].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, [forceRender, initialMockCommunities]); // Depend on mockCommunities if it can be externally modified and you want to reflect that

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateCommunityFormData>({
    resolver: zodResolver(CreateCommunitySchema),
    defaultValues: {
      name: "",
      description: "",
      industry: INDUSTRIES[0],
    },
  });

  const handleCreateCommunitySubmit: SubmitHandler<CreateCommunityFormData> = async (data) => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to create a community." });
      return;
    }
    const result = await createCommunity(data);
    if (result.success) {
      toast({ title: "Community Created!", description: `${data.name} is now live.` });
      reset();
      setIsCreateDialogOpen(false);
      setForceRender(prev => prev + 1); // Trigger re-render of the list
    } else {
      toast({ variant: "destructive", title: "Creation Failed", description: result.error || "Could not create community." });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Communities</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Community
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create a New Community</DialogTitle>
              <DialogDescription>
                Build a space for like-minded individuals in the {APP_NAME} ecosystem.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleCreateCommunitySubmit)} className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Community Name</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" {...field} placeholder="e.g., AI Innovators Hub" />}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => <Textarea id="description" {...field} placeholder="What is this community about?" rows={4} />}
                />
                {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
              </div>
              <div>
                <Label htmlFor="industry">Industry Focus</Label>
                <Controller
                  name="industry"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map(industry => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.industry && <p className="text-sm text-destructive mt-1">{errors.industry.message}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Community
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {communities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map(community => (
            <Card key={community.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-32 w-full bg-muted">
                <Image 
                    src={`https://placehold.co/400x160.png?text=${encodeURIComponent(community.name.substring(0,15))}`} 
                    alt={`${community.name} banner`} 
                    fill
                    className="object-cover"
                    data-ai-hint={`${community.industry} community`} 
                />
              </div>
              <CardHeader>
                <CardTitle className="text-lg hover:text-primary">
                    <Link href={`/communities/${community.id}`}>{community.name}</Link>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">{community.industry}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{community.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center border-t pt-4">
                <span className="text-sm text-muted-foreground">{community.members.length} member{community.members.length === 1 ? '' : 's'}</span>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/communities/${community.id}`}>
                    View <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center p-10 col-span-full">
          <Group className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">No communities found.</p>
          <p className="text-sm text-muted-foreground">Why not create one and kickstart a discussion?</p>
        </Card>
      )}
    </div>
  );
}
