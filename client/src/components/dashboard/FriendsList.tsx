import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import UserAvatar from "@/components/shared/UserAvatar";
import ProgressBar from "@/components/shared/ProgressBar";

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

export default function FriendsList() {
  const { data: friends, isLoading, error } = useQuery({
    queryKey: ['/api/friends'],
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Friends</h2>
          <Link href="/friends" className="text-primary-600 text-sm font-medium hover:text-primary-700">View All</Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <CardContent className="p-0">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-2 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <div className="h-10 bg-gray-200 rounded w-full" />
                    <div className="h-10 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !friends || friends.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Friends</h2>
          <Link href="/friends" className="text-primary-600 text-sm font-medium hover:text-primary-700">View All</Link>
        </div>
        
        <Card className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <CardContent className="p-0 text-center">
            <p className="text-gray-500 mb-4">You don't have any friends yet</p>
            <Button className="bg-primary-600 hover:bg-primary-700">Add Friends</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter for accepted friends
  const acceptedFriends = friends.filter((friend: Friend) => friend.status === 'accepted');

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Friends</h2>
        <Link href="/friends" className="text-primary-600 text-sm font-medium hover:text-primary-700">View All</Link>
      </div>
      
      {acceptedFriends.length === 0 ? (
        <Card className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <CardContent className="p-0 text-center">
            <p className="text-gray-500 mb-4">You don't have any active friendships yet</p>
            <Button className="bg-primary-600 hover:bg-primary-700">Add Friends</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {acceptedFriends.slice(0, 3).map((friend: Friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      )}
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
