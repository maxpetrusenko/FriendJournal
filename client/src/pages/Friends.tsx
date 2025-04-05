import { useState } from "react";
import { User } from "@/App";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, UserX, Check, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "@/components/shared/UserAvatar";
import ProgressBar from "@/components/shared/ProgressBar";
import AddFriendModal from "@/components/modals/AddFriendModal";

interface FriendsProps {
  user: User;
}

interface Friend {
  id: number;
  userId: number;
  friendId: number;
  status: string;
  level: number;
  progress: number;
  friend: {
    id: number;
    fullName: string;
    username: string;
    avatarColor: string;
  };
}

export default function Friends({ user }: FriendsProps) {
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: friends, isLoading } = useQuery({
    queryKey: ['/api/friends'],
  });

  const updateFriendStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest('PUT', `/api/friends/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Friend status updated",
        description: "Your friend list has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update friend status",
        description: "There was an error updating the friend status. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAcceptFriend = (id: number) => {
    updateFriendStatusMutation.mutate({ id, status: 'accepted' });
  };

  const handleDeclineFriend = (id: number) => {
    updateFriendStatusMutation.mutate({ id, status: 'declined' });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
          <Button 
            onClick={() => setIsAddFriendModalOpen(true)} 
            className="inline-flex items-center"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add Friend
          </Button>
        </div>

        <Card className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <CardContent className="p-0">
            <div className="flex items-center justify-center py-8 animate-pulse">
              <div className="h-6 w-40 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Separate friends by status
  const pendingIncoming = friends?.filter((f: Friend) => 
    f.status === 'pending' && f.userId !== user.id
  ) || [];
  
  const pendingOutgoing = friends?.filter((f: Friend) => 
    f.status === 'pending' && f.userId === user.id
  ) || [];
  
  const acceptedFriends = friends?.filter((f: Friend) => f.status === 'accepted') || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
        <Button 
          onClick={() => setIsAddFriendModalOpen(true)} 
          className="inline-flex items-center"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Friend
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Friends</TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {(pendingIncoming.length > 0 || pendingOutgoing.length > 0) && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-700">
                {pendingIncoming.length + pendingOutgoing.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          {acceptedFriends.length === 0 ? (
            <Card className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <CardContent className="p-0 text-center">
                <p className="text-gray-500 mb-4">You don't have any friends yet</p>
                <Button 
                  onClick={() => setIsAddFriendModalOpen(true)}
                  className="inline-flex items-center"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add Your First Friend
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {acceptedFriends.map((friend: Friend) => (
                <FriendCard key={friend.id} friend={friend} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="mt-4 space-y-6">
          {pendingIncoming.length === 0 && pendingOutgoing.length === 0 ? (
            <Card className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <CardContent className="p-0 text-center">
                <p className="text-gray-500">No pending friend requests</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {pendingIncoming.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Friend Requests</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingIncoming.map((friend: Friend) => (
                      <PendingRequestCard 
                        key={friend.id} 
                        friend={friend} 
                        onAccept={() => handleAcceptFriend(friend.id)}
                        onDecline={() => handleDeclineFriend(friend.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {pendingOutgoing.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Sent Requests</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingOutgoing.map((friend: Friend) => (
                      <SentRequestCard 
                        key={friend.id} 
                        friend={friend}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
      
      <AddFriendModal 
        isOpen={isAddFriendModalOpen} 
        onClose={() => setIsAddFriendModalOpen(false)} 
      />
    </div>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  return (
    <Card className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <CardContent className="p-0">
        <div className="flex items-center space-x-3">
          <UserAvatar user={friend.friend} size="medium" />
          <div>
            <p className="font-medium text-gray-900">{friend.friend.fullName}</p>
            <div className="flex items-center mt-1">
              <ProgressBar progress={friend.progress} />
              <p className="text-xs text-gray-500 ml-2">Level {friend.level} • {friend.progress}%</p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 mt-4">
          <Button variant="secondary" className="flex-1 text-center px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100">
            Ask Question
          </Button>
          <Button variant="outline" className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PendingRequestCard({ 
  friend,
  onAccept,
  onDecline
}: { 
  friend: Friend;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Card className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <CardContent className="p-0">
        <div className="flex items-center space-x-3">
          <UserAvatar user={friend.friend} size="medium" />
          <div>
            <p className="font-medium text-gray-900">{friend.friend.fullName}</p>
            <p className="text-xs text-gray-500">Wants to connect with you</p>
          </div>
        </div>
        <div className="flex space-x-2 mt-4">
          <Button 
            onClick={onAccept}
            variant="secondary" 
            className="flex-1 text-center px-3 py-2 bg-accent-50 text-accent-700 rounded-lg text-sm font-medium hover:bg-accent-100"
          >
            <Check className="w-4 h-4 mr-1" />
            Accept
          </Button>
          <Button 
            onClick={onDecline}
            variant="outline" 
            className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            <X className="w-4 h-4 mr-1" />
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SentRequestCard({ friend }: { friend: Friend }) {
  return (
    <Card className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <CardContent className="p-0">
        <div className="flex items-center space-x-3">
          <UserAvatar user={friend.friend} size="medium" />
          <div>
            <p className="font-medium text-gray-900">{friend.friend.fullName}</p>
            <p className="text-xs text-gray-500">Request pending</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full mt-4 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          <UserX className="w-4 h-4 mr-1" />
          Cancel Request
        </Button>
      </CardContent>
    </Card>
  );
}
