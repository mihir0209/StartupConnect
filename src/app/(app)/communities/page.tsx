
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCommunities } from "@/lib/mockData";
import { Group, PlusCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";


export default function CommunitiesPage() {
  const { toast } = useToast();

  const handleCreateCommunity = () => {
    toast({
      title: "Feature Coming Soon!",
      description: "The ability to create new communities will be added in a future update.",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Communities</h1>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleCreateCommunity}>
          <PlusCircle className="mr-2 h-5 w-5" /> Create Community
        </Button>
      </div>

      {mockCommunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCommunities.map(community => (
            <Card key={community.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-32 w-full bg-muted">
                <Image 
                    src={`https://placehold.co/400x160.png?text=${encodeURIComponent(community.name.substring(0,15))}`} 
                    alt={`${community.name} banner`} 
                    layout="fill" 
                    objectFit="cover"
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
