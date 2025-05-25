import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockUsers, mockChats as initialMockChats } from "@/lib/mockData";
import { MessageSquare, Send, Search, PlusCircle, Paperclip } from "lucide-react";
import Link from "next/link";
import type { Chat, Message as MessageType } from "@/lib/types";
import { useState } from "react"; // Assuming this will be client component for interactivity

// Make a mutable copy for client-side interaction simulation
let mockChats: Chat[] = JSON.parse(JSON.stringify(initialMockChats)); 
if (!mockChats.length && mockUsers.length >= 2) { // Populate with some mock chats if empty
    mockChats.push({
        id: 'chat1',
        participantIds: ['user1', 'user2'],
        lastMessage: { id: 'msg1', chatId: 'chat1', senderId: 'user1', content: 'Hey Bob, saw your post on Climate Tech!', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()},
        isGroupChat: false,
    });
    mockChats.push({
        id: 'chat2',
        participantIds: ['user1', 'user3'],
        lastMessage: { id: 'msg2', chatId: 'chat2', senderId: 'user3', content: 'Thanks for the advice on product dev!', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()},
        isGroupChat: false,
    });
}


// Helper to get participant details
const getParticipantDetails = (participantIds: string[], currentUserId: string) => {
    const otherParticipantId = participantIds.find(id => id !== currentUserId);
    if (!otherParticipantId) return { name: 'Unknown Group', avatar: 'https://placehold.co/40x40.png?text=G' };
    const user = mockUsers.find(u => u.id === otherParticipantId);
    return { 
      name: user?.name || 'Unknown User', 
      avatar: user?.profile.profilePictureUrl || `https://placehold.co/40x40.png?text=${user?.name[0] || 'U'}`,
      userId: user?.id
    };
};

const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || 'U';
    return (names[0][0] + (names[names.length -1][0] || '')).toUpperCase();
}

// Mock current user ID for demo purposes
const currentUserId = 'user1'; 
const currentUser = mockUsers.find(u => u.id === currentUserId);


export default function MessagesPage() {
  // For a real app, selectedChat and messages would be managed with useState and fetched/updated.
  // This is a static representation for now.
  const [selectedChat, setSelectedChat] = useState<Chat | null>(mockChats.length > 0 ? mockChats[0] : null);
  const [messages, setMessages] = useState<MessageType[]>(selectedChat ? [selectedChat.lastMessage!] : []); // simplified
  const [newMessage, setNewMessage] = useState("");

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    // Mock fetching messages for this chat
    setMessages(chat.lastMessage ? [chat.lastMessage] : []); 
    // In a real app, fetch all messages for chat.id
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
    
    // Update mockChats lastMessage for the sidebar
    const chatIndex = mockChats.findIndex(c => c.id === selectedChat.id);
    if (chatIndex > -1) {
        mockChats[chatIndex].lastMessage = message;
    }

    setNewMessage("");
  };


  return (
    <div className="flex h-[calc(100vh-var(--header-height,4rem)-2*var(--main-padding,1.5rem))] border rounded-lg overflow-hidden shadow-lg"> {/* Adjust height based on your header and padding */}
      {/* Sidebar for chats */}
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
          {mockChats.map(chat => {
            const details = getParticipantDetails(chat.participantIds, currentUserId);
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Main chat area */}
      <div className="w-2/3 flex flex-col bg-background">
        {selectedChat ? (
          <>
            <div className="p-4 border-b flex items-center gap-3 bg-card">
              <Avatar className="h-10 w-10">
                 <AvatarImage src={getParticipantDetails(selectedChat.participantIds, currentUserId).avatar} data-ai-hint="profile avatar small"/>
                 <AvatarFallback>{getInitials(getParticipantDetails(selectedChat.participantIds, currentUserId).name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{getParticipantDetails(selectedChat.participantIds, currentUserId).name}</p>
                <p className="text-xs text-green-500">Online</p> {/* Mock status */}
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* Placeholder for messages */}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl ${msg.senderId === currentUserId ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
              ))}
              {messages.length === 0 && <p className="text-center text-muted-foreground">No messages in this chat yet.</p>}
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
            <p className="text-muted-foreground">Or create a new conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
