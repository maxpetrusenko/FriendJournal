import { useState } from "react";
import { User } from "@/App";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "@/components/shared/UserAvatar";
import { formatDistanceToNow } from "date-fns";

interface MessagesProps {
  user: User;
}

interface Friend {
  id: number;
  status: string;
  friend: {
    id: number;
    fullName: string;
    username: string;
    avatarColor: string;
  };
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  read: boolean;
  createdAt: string;
}

export default function Messages({ user }: MessagesProps) {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messageText, setMessageText] = useState("");
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const { data: friends = [], isLoading: friendsLoading } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedFriend?.friend.id],
    enabled: !!selectedFriend,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number, content: string }) => {
      const res = await apiRequest('/api/messages', 'POST', data);
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedFriend?.friend.id] });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedFriend) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedFriend.friend.id,
      content: messageText
    });
  };

  // Filter for accepted friends
  const acceptedFriends = friends.filter((f: Friend) => f.status === 'accepted');

  // Show mobile message screen if friend is selected
  if (isMobile && selectedFriend) {
    return (
      <div className="space-y-4 h-[calc(100vh-8rem)]">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={() => setSelectedFriend(null)}>
            ← Back
          </Button>
          <UserAvatar user={selectedFriend.friend} size="small" />
          <h1 className="text-lg font-semibold">{selectedFriend.friend.fullName}</h1>
        </div>
        
        <div className="flex flex-col h-[calc(100%-8rem)]">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 mb-4 overflow-y-auto">
            <CardContent className="p-4 flex flex-col space-y-4">
              {messagesLoading ? (
                <div className="flex flex-col space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`animate-pulse flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                      <div className={`h-12 w-36 rounded-lg ${i % 2 === 0 ? 'bg-primary-100' : 'bg-gray-100'}`}></div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message: Message) => (
                  <MessageBubble 
                    key={message.id} 
                    message={message} 
                    isSender={message.senderId === user.id} 
                  />
                ))
              )}
            </CardContent>
          </Card>
          
          <div className="flex space-x-2">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 resize-none"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              size="icon"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
      
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-[300px_1fr]'} gap-6 h-[calc(100vh-12rem)]`}>
        {/* Friend List */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="mb-4">
              <Input placeholder="Search friends..." />
            </div>
            
            {friendsLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-2">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : acceptedFriends.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">No friends to message</p>
                <Button>Add Friends</Button>
              </div>
            ) : (
              <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-20rem)]">
                {acceptedFriends.map((friend: Friend) => (
                  <button
                    key={friend.id}
                    className={`flex items-center space-x-3 p-2 w-full text-left rounded-lg ${
                      selectedFriend?.id === friend.id 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedFriend(friend)}
                  >
                    <UserAvatar user={friend.friend} size="small" />
                    <div>
                      <p className="font-medium">{friend.friend.fullName}</p>
                      <p className="text-xs text-gray-500">Click to message</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Message Content - Only shown on desktop or when no friend is selected on mobile */}
        {(!isMobile || !selectedFriend) && (
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
            <CardContent className="p-4 h-full flex flex-col">
              {!selectedFriend ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Select a friend to start messaging</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="border-b pb-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <UserAvatar user={selectedFriend.friend} size="small" />
                      <h2 className="font-semibold">{selectedFriend.friend.fullName}</h2>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto mb-4 flex flex-col space-y-4">
                    {messagesLoading ? (
                      <div className="flex flex-col space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={`animate-pulse flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                            <div className={`h-12 w-36 rounded-lg ${i % 2 === 0 ? 'bg-primary-100' : 'bg-gray-100'}`}></div>
                          </div>
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message: Message) => (
                        <MessageBubble 
                          key={message.id} 
                          message={message} 
                          isSender={message.senderId === user.id} 
                        />
                      ))
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 resize-none"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      size="icon"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, isSender }: { message: Message, isSender: boolean }) {
  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isSender 
            ? 'bg-primary-100 text-primary-900' 
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p>{message.content}</p>
        <p className={`text-xs mt-1 ${isSender ? 'text-primary-700' : 'text-gray-500'}`}>
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
