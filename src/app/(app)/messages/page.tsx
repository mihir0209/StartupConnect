
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockUsers, mockChats as initialMockChats } from "@/lib/mockData";
import { MessageSquare, Send, Search, PlusCircle, Paperclip, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Chat, Message as MessageType, User } from "@/lib/types";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";


const getParticipantDetails = (participantIds: string[], currentUserId: string) => {
    const otherParticipantId = participantIds.find(id => id !== currentUserId);
    if (!otherParticipantId) return { name: 'Unknown Group', avatar: 'https://placehold.co/40x40.png?text=G', userId: null };
    const user = mockUsers.find(u => u.id === otherParticipantId);
    return {
      name: user?.name || 'Unknown User',
      avatar: user?.profile.profilePictureUrl || `https://placehold.co/40x40.png?text=${getInitials(user?.name)}`,
      userId: user?.id || null
    };
};

const getInitials = (name: string = "") => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
}

export default function MessagesPage() {
  const { user: currentUser, createMockChat, sendMessage } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chatWithUserId = searchParams.get('chatWith');
    const preselectedChatId = searchParams.get('chatId');

    const initializeChat = async () => {
        setIsChatLoading(true);
        if (!currentUser) {
            setIsChatLoading(false);
            return;
        }

        let chatToSelect: Chat | undefined | null = null;

        if (preselectedChatId) {
            chatToSelect = initialMockChats.find(c => c.id === preselectedChatId && c.participantIds.includes(currentUser.id));
        } else if (chatWithUserId) {
            chatToSelect = initialMockChats.find(c =>
                !c.isGroupChat &&
                c.participantIds.includes(currentUser.id) &&
                c.participantIds.includes(chatWithUserId)
            );

            if (!chatToSelect) {
                // Attempt to create a chat if one doesn't exist
                const result = await createMockChat([currentUser.id, chatWithUserId]);
                if (result.success && result.chat) {
                    chatToSelect = result.chat;
                }
            }
        } else if (initialMockChats.filter(c => c.participantIds.includes(currentUser.id)).length > 0) {
             const userChats = initialMockChats.filter(c => c.participantIds.includes(currentUser.id))
                .sort((a,b) => new Date(b.lastMessage?.timestamp || 0).getTime() - new Date(a.lastMessage?.timestamp || 0).getTime());
             chatToSelect = userChats[0];
        }

        setSelectedChat(chatToSelect || null);
        setIsChatLoading(false);
    };

    initializeChat();
  }, [searchParams, currentUser, createMockChat]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChat?.messages]);


  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    if (!isMobile) {
      // Update URL without full page reload for desktop
      router.replace(`/messages?chatId=${chat.id}`, { scroll: false });
    }
  };

  const handleGoBackToChatList = () => {
    setSelectedChat(null);
    // Optionally clear URL params if desired for mobile
    if (isMobile) {
        router.replace('/messages', { scroll: false });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    const result = await sendMessage(selectedChat.id, currentUser.id, newMessage.trim());

    if (result.success && result.newMessage) {
        // The mockChats array is mutated by AuthContext, so we need to find the updated chat
        const updatedChat = initialMockChats.find(c => c.id === selectedChat.id);
        setSelectedChat(updatedChat || null); // Re-set selectedChat to trigger re-render with new message
        setNewMessage("");
    } else {
        // Handle error, e.g., show a toast
        console.error("Failed to send message:", result.error);
    }
  };

  if (isChatLoading || !currentUser) {
    return <div className="flex h-full items-center justify-center">Loading chats...</div>;
  }

  const userChats = initialMockChats
    .filter(chat => chat.participantIds.includes(currentUser.id))
    .sort((a,b) => new Date(b.lastMessage?.timestamp || 0).getTime() - new Date(a.lastMessage?.timestamp || 0).getTime());

  return (
    <div className="flex h-full border rounded-lg overflow-hidden shadow-lg">
      {/* Chat List Pane */}
      <div className={cn(
        "border-r bg-card flex flex-col",
        isMobile
          ? (selectedChat ? "hidden" : "w-full")
          : "w-1/3"
      )}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Messages</h2>
            <Button variant="ghost" size="icon"><PlusCircle className="h-5 w-5 text-primary"/></Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search chats..." className="pl-8" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {userChats.map(chat => {
            const details = getParticipantDetails(chat.participantIds, currentUser.id);
            const lastMessageContent = chat.lastMessage?.content;
            // Truncate preview text
            const previewText = lastMessageContent 
              ? (lastMessageContent.length > 20 
                  ? lastMessageContent.substring(0, 20) + "..." 
                  : lastMessageContent)
              : "No messages yet";

            return (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left ${selectedChat?.id === chat.id && !isMobile ? 'bg-accent' : ''}`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={details.avatar} alt={details.name} data-ai-hint="profile avatar small"/>
                  <AvatarFallback>{getInitials(details.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate">{details.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{previewText}</p>
                </div>
                {chat.lastMessage && <p className="text-xs text-muted-foreground self-start shrink-0">{new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
              </button>
            );
          })}
           {userChats.length === 0 && <p className="p-4 text-center text-muted-foreground">No conversations yet.</p>}
        </ScrollArea>
      </div>

      {/* Chat Content Pane */}
      <div className={cn(
        "flex flex-col bg-background",
         isMobile
          ? (selectedChat ? "w-full" : "hidden")
          : "w-2/3 flex-1"
      )}>
        {selectedChat ? (
          <>
            <div className="p-4 border-b flex items-center gap-3 bg-card">
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={handleGoBackToChatList} className="mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <Avatar className="h-10 w-10">
                 <AvatarImage src={getParticipantDetails(selectedChat.participantIds, currentUser.id).avatar} data-ai-hint="profile avatar small"/>
                 <AvatarFallback>{getInitials(getParticipantDetails(selectedChat.participantIds, currentUser.id).name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{getParticipantDetails(selectedChat.participantIds, currentUser.id).name}</p>
                 <Link href={`/profile/${getParticipantDetails(selectedChat.participantIds, currentUser.id).userId || ''}`} className="text-xs text-primary hover:underline">View Profile</Link>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4"> 
              <div className="space-y-6">
                {(selectedChat.messages || []).map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow ${msg.senderId === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                          <p className="text-sm whitespace-pre-line">{msg.content}</p>
                          <p className="text-xs mt-1 opacity-70 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                {(selectedChat.messages || []).length === 0 && <p className="text-center text-muted-foreground">No messages in this chat yet. Say hello!</p>}
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-card flex items-center gap-2">
              <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5 text-muted-foreground"/></Button>
              <Input
                id="message-input"
                name="message-input"
                placeholder="Type a message..."
                className="flex-1"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} className="bg-primary hover:bg-primary/90">
                <Send className="h-5 w-5" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Select a chat to start messaging</h2>
            <p className="text-muted-foreground">Or create a new conversation from a user's profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
