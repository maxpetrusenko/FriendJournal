import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/shared/UserAvatar";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: number;
  type: string;
  content: string;
  contentId?: number;
  createdAt: string;
  friend: {
    id: number;
    fullName: string;
    username: string;
    avatarColor: string;
  };
}

export default function FriendActivity() {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['/api/activities'],
  });

  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Friend Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <CardContent className="p-0">
                <div className="animate-pulse flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !activities || activities.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Friend Activity</h2>
        <Card className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <CardContent className="p-0 text-center">
            <p className="text-gray-500">No recent friend activity</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Friend Activity</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.slice(0, 3).map((activity: Activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const getActivityTitle = (type: string, name: string) => {
    switch (type) {
      case 'question_answered':
        return `${name} answered your question`;
      case 'question_asked':
        return `${name} asked you a question`;
      case 'message_sent':
        return `${name} sent you a message`;
      default:
        return `${name} had activity`;
    }
  };

  const getActionButton = (type: string) => {
    switch (type) {
      case 'question_answered':
        return <Button size="sm" variant="link" className="text-primary-600 p-0 h-auto font-medium">View Answer</Button>;
      case 'question_asked':
        return <Button size="sm" variant="link" className="text-primary-600 p-0 h-auto font-medium">Answer Question</Button>;
      case 'message_sent':
        return <Button size="sm" variant="link" className="text-primary-600 p-0 h-auto font-medium">Reply</Button>;
      default:
        return <Button size="sm" variant="link" className="text-primary-600 p-0 h-auto font-medium">View</Button>;
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <CardContent className="p-0">
        <div className="flex items-start space-x-3">
          <UserAvatar user={activity.friend} size="small" />
          <div>
            <p className="font-medium text-gray-900">
              {getActivityTitle(activity.type, activity.friend.fullName)}
            </p>
            <p className="text-gray-600 text-sm mt-1">"{activity.content}"</p>
            <p className="text-gray-400 text-xs mt-2">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          {getActionButton(activity.type)}
        </div>
      </CardContent>
    </Card>
  );
}
