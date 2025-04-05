import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import UserAvatar from "@/components/shared/UserAvatar";

interface Friend {
  id: number;
  friend: {
    id: number;
    fullName: string;
    username: string;
    avatarColor: string;
  };
  status: string;
}

export default function QuestionOfTheDay() {
  const [answer, setAnswer] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const { toast } = useToast();

  const { data: questionData, isLoading: questionLoading } = useQuery({
    queryKey: ['/api/questions/random', { level: 1 }],
  });

  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ['/api/friends'],
  });

  const saveAnswerMutation = useMutation({
    mutationFn: async (data: { questionId: number, response: string, sharedWith: number[] }) => {
      const res = await apiRequest('POST', '/api/question-responses', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Answer saved!",
        description: "Your friends will be notified of your response.",
      });
      setAnswer("");
      setSelectedFriends([]);
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
    onError: () => {
      toast({
        title: "Failed to save answer",
        description: "There was an error saving your answer. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSaveAnswer = () => {
    if (!answer.trim()) {
      toast({
        title: "Empty answer",
        description: "Please enter your answer before saving.",
        variant: "destructive",
      });
      return;
    }

    if (questionData && questionData.id) {
      saveAnswerMutation.mutate({
        questionId: questionData.id,
        response: answer,
        sharedWith: selectedFriends
      });
    }
  };

  const toggleFriend = (friendId: number) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const acceptedFriends = friends?.filter((f: Friend) => f.status === 'accepted') || [];

  return (
    <Card className="bg-white rounded-xl shadow p-6 border border-gray-100">
      <CardContent className="p-0">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-6 h-6 text-secondary-500" />
          <h2 className="text-lg font-semibold text-gray-900">Question of the Day</h2>
        </div>
        
        {questionLoading ? (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : questionData ? (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-gray-800 font-medium">{questionData.text}</p>
            <p className="text-gray-500 text-sm mt-1">Category: {questionData.category?.name || 'General'}</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-gray-800 font-medium">No question available</p>
            <p className="text-gray-500 text-sm mt-1">Please try again later</p>
          </div>
        )}
        
        <div className="mt-6">
          <Label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">Your Answer</Label>
          <Textarea 
            id="answer" 
            rows={4} 
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Share your thoughts..." 
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none"
          />
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center">
            <p className="text-sm text-gray-500">Share with:</p>
            <div className="flex ml-2 space-x-1">
              {friendsLoading ? (
                <div className="animate-pulse flex space-x-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-6 w-6 rounded-full bg-gray-200"></div>
                  ))}
                </div>
              ) : acceptedFriends.length > 0 ? (
                <>
                  {acceptedFriends.slice(0, 3).map((friendConn: Friend) => (
                    <button
                      key={friendConn.friend.id}
                      onClick={() => toggleFriend(friendConn.friend.id)}
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                        selectedFriends.includes(friendConn.friend.id)
                          ? `ring-2 ring-primary-500 ${friendConn.friend.avatarColor}`
                          : friendConn.friend.avatarColor
                      }`}
                    >
                      {friendConn.friend.fullName[0]}
                    </button>
                  ))}
                  {acceptedFriends.length > 3 && (
                    <button className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs">
                      +{acceptedFriends.length - 3}
                    </button>
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-400">No friends yet</span>
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleSaveAnswer}
            disabled={saveAnswerMutation.isPending || !answer.trim()}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
            size="lg"
          >
            {saveAnswerMutation.isPending ? "Saving..." : "Save Answer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
