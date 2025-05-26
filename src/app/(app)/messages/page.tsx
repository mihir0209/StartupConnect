
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockUsers, mockChats as initialMockChats } from "@/lib/mockData";
import { MessageSquare, Send, Search, PlusCircle, Paperclip } from "lucide-react";
import Link from "next/link";
import type { Chat, Message as MessageType, User } from "@/lib/types";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";


// Make a mutable copy for client-side interaction simulation
let mockChats: Chat[] = JSON.parse(JSON.stringify(initialMockChats)); 

// Helper to get participant details
const getParticipantDetails = (participantIds: string[], currentUserId: string) => {
    const otherParticipantId = participantIds.find(id => id !== currentUserId);
    if (!otherParticipantId) return { name: 'Unknown Group', avatar: 'https://placehold.co/40x40.png?text=G', userId: null };
    const user = mockUsers.find(u => u.id === otherParticipantId);
    return { 
      name: user?.name || 'Unknown User', 
      avatar: user?.profile.profilePictureUrl || `https://placehold.co/40x40.png?text=${user?.name?.[0] || 'U'}`,
      userId: user?.id || null
    };
};

const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
}

export default function MessagesPage() {
  const { user: currentUser, createMockChat } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(true);

  useEffect(() => {
    const chatWithUserId = searchParams.get('chatWith');
    const preselectedChatId = searchParams.get('chatId'); // From profile page potentially

    const initializeChat = async () => {
        setIsChatLoading(true);
        if (!currentUser) {
            setIsChatLoading(false);
            return;
        }

        if (preselectedChatId) {
            const chat = mockChats.find(c => c.id === preselectedChatId);
            if (chat) {
                setSelectedChat(chat);
                setMessages(chat.lastMessage ? [chat.lastMessage] : []); // Simplified
            }
        } else if (chatWithUserId) {
            // Try to find an existing 1-on-1 chat
            let existingChat = mockChats.find(c => 
                !c.isGroupChat && 
                c.participantIds.includes(currentUser.id) && 
                c.participantIds.includes(chatWithUserId)
            );

            if (!existingChat) { // If no chat, try to create one (mock)
                const result = await createMockChat([currentUser.id, chatWithUserId]);
                if (result.success && result.chatId) {
                    existingChat = mockChats.find(c => c.id === result.chatId);
                }
            }
            
            if (existingChat) {
                setSelectedChat(existingChat);
                setMessages(existingChat.lastMessage ? [existingChat.lastMessage] : []); // Simplified
            } else {
                // Could not find or create chat, maybe show an error or default state
                setSelectedChat(null);
                setMessages([]);
            }
        } else if (mockChats.length > 0) {
            // Default to first chat if no specific user is targeted
             const firstUserChat = mockChats.find(c => c.participantIds.includes(currentUser.id));
             if (firstUserChat) {
                setSelectedChat(firstUserChat);
                setMessages(firstUserChat.lastMessage ? [firstUserChat.lastMessage] : []);
             } else {
                setSelectedChat(null);
                setMessages([]);
             }
        } else {
             setSelectedChat(null);
             setMessages([]);
        }
        setIsChatLoading(false);
    };

    initializeChat();
  }, [searchParams, currentUser, createMockChat]);


  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setMessages(chat.lastMessage ? [chat.lastMessage] : []); 
    // In a real app, fetch all messages for chat.id
    // Clear query params if user manually selects a different chat
    router.replace('/messages', { scroll: false }); 
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return;
    const message: MessageType = {
        id: `msg${Date.now()}`,
        chatId: selectedChat.id,
        senderId: currentUser.id,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, message]);
    
    const chatIndex = mockChats.findIndex(c => c.id === selectedChat.id);
    if (chatIndex > -1) {
        mockChats[chatIndex].lastMessage = message;
        // Potentially re-sort mockChats based on lastMessage timestamp if sidebar order matters
         mockChats.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
        });
    }
    setNewMessage("");
  };

  if (isChatLoading || !currentUser) {
    return <div className="flex h-[calc(100vh-var(--header-height,4rem)-2*var(--main-padding,1.5rem))] items-center justify-center">Loading chats...</div>;
  }
  
  // Filter chats to only show those the currentUser is part of
  const userChats = mockChats.filter(chat => chat.participantIds.includes(currentUser.id));

  return (
    <div className="flex h-[calc(100vh-var(--header-height,4rem)-2*var(--main-padding,1.5rem))] border rounded-lg overflow-hidden shadow-lg">
      <div className="w-1/3 border-r bg-card flex flex-col">
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
        <div className="flex-1 overflow-y-auto">
          {userChats.map(chat => {
            const details = getParticipantDetails(chat.participantIds, currentUser.id);
            return (
              <button 
                key={chat.id} 
                onClick={() => handleSelectChat(chat)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left ${selectedChat?.id === chat.id ? 'bg-accent' : ''}`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={details.avatar} alt={details.name} data-ai-hint="profile avatar small"/>
                  <AvatarFallback>{getInitials(details.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate">{details.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMessage?.content || "No messages yet"}</p>
                </div>
                {chat.lastMessage && <p className="text-xs text-muted-foreground self-start shrink-0">{new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
              </button>
            );
          })}
           {userChats.length === 0 && <p className="p-4 text-center text-muted-foreground">No conversations yet.</p>}
        </div>
      </div>

      <div className="w-2/3 flex flex-col bg-background">
        {selectedChat ? (
          <>
            <div className="p-4 border-b flex items-center gap-3 bg-card">
              <Avatar className="h-10 w-10">
                 <AvatarImage src={getParticipantDetails(selectedChat.participantIds, currentUser.id).avatar} data-ai-hint="profile avatar small"/>
                 <AvatarFallback>{getInitials(getParticipantDetails(selectedChat.participantIds, currentUser.id).name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{getParticipantDetails(selectedChat.participantIds, currentUser.id).name}</p>
                {/* Mock status or link to profile */}
                 <Link href={`/profile/${getParticipantDetails(selectedChat.participantIds, currentUser.id).userId || ''}`} className="text-xs text-primary hover:underline">View Profile</Link>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow ${msg.senderId === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
              ))}
              {messages.length === 0 && <p className="text-center text-muted-foreground">No messages in this chat yet. Say hello!</p>}
            </div>
            <div className="p-4 border-t bg-card flex items-center gap-2">
              <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5 text-muted-foreground"/></Button>
              <Input 
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
