import { useState, useEffect } from "react";
import { User } from "@/App";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, X, Send } from "lucide-react";
import { useLocation } from "wouter";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuestionsProps {
  user: User;
}

interface Question {
  id: number;
  text: string;
  categoryId: number;
  level: number;
}

interface QuestionCategory {
  id: number;
  name: string;
  description: string;
  iconName: string;
  colorClass: string;
}

interface Friend {
  id: number;
  status: string;
  friendId: number;
  userId: number;
  level: number;
  progress: number;
  friend: {
    id: number;
    fullName: string;
    username: string;
    avatarColor: string;
  };
}

interface QuestionResponse {
  questionId: number;
  response: string;
  sharedWith: number[];
}

export default function Questions({ user }: QuestionsProps) {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  // Parse query params to get category filter
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(parseInt(categoryParam));
    }
  }, [location]);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<QuestionCategory[]>({
    queryKey: ['/api/question-categories'],
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
  });
  
  const { data: friends = [], isLoading: friendsLoading } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
  });

  const filterQuestions = (questions: Question[]) => {
    if (!questions || !Array.isArray(questions)) {
      return [];
    }
    
    let filtered = [...questions];
    
    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(q => q.categoryId === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => q.text.toLowerCase().includes(term));
    }
    
    return filtered;
  };

  // State for managing the new question form
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    categoryId: "",
    level: "1"
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // State for managing the ask friend dialog
  const [isAskFriendDialogOpen, setIsAskFriendDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [responseText, setResponseText] = useState("");
  
  // Use the toast hook
  const { toast } = useToast();
  
  // Get the query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Create question mutation
  const createQuestion = useMutation({
    mutationFn: async (data: { text: string; categoryId: number; level: number }) => {
      return apiRequest('/api/questions', 'POST', data);
    },
    onSuccess: () => {
      // Invalidate and refetch questions
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      // Show success toast
      toast({
        title: "Question created",
        description: "Your question has been added successfully",
      });
      // Reset form and close dialog
      setNewQuestion({
        text: "",
        categoryId: "",
        level: "1"
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to create question. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!newQuestion.text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question text",
        variant: "destructive",
      });
      return;
    }
    
    if (!newQuestion.categoryId) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }
    
    // Create the question
    createQuestion.mutate({
      text: newQuestion.text,
      categoryId: parseInt(newQuestion.categoryId),
      level: parseInt(newQuestion.level)
    });
  };
  
  // Response mutation
  const submitResponse = useMutation({
    mutationFn: async (data: QuestionResponse) => {
      return apiRequest('/api/question-responses', 'POST', data);
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: "Response submitted",
        description: "Your response has been submitted successfully.",
      });
      // Reset form and close dialog
      setResponseText("");
      setSelectedFriends([]);
      setSelectedQuestion(null);
      setIsAskFriendDialogOpen(false);
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Function to handle opening the Ask Friend dialog
  const handleAskQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setIsAskFriendDialogOpen(true);
  };

  // Function to toggle a friend in the selected friends list
  const toggleFriendSelection = (friendId: number) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  // Function to handle response submission
  const handleResponseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedQuestion) {
      toast({
        title: "Error",
        description: "No question selected.",
        variant: "destructive",
      });
      return;
    }
    
    if (!responseText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a response.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedFriends.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one friend to share with.",
        variant: "destructive",
      });
      return;
    }
    
    // Submit the response
    submitResponse.mutate({
      questionId: selectedQuestion.id,
      response: responseText,
      sharedWith: selectedFriends,
    });
  };
  
  const filteredQuestions = filterQuestions(questions);
  
  // Get accepted friends only
  const acceptedFriends = Array.isArray(friends) 
    ? friends.filter((f: Friend) => f.status === 'accepted')
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
          <p className="text-gray-600 mt-1">Explore questions to ask your friends and deepen your connections</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <Plus size={16} />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add a New Question</DialogTitle>
              <DialogDescription>
                Create a new question to share with your friends
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="text">Question Text</Label>
                <Input
                  id="text"
                  placeholder="What is your favorite memory from childhood?"
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newQuestion.categoryId}
                  onValueChange={(value) => setNewQuestion({ ...newQuestion, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category: QuestionCategory) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={newQuestion.level}
                  onValueChange={(value) => setNewQuestion({ ...newQuestion, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 (Casual)</SelectItem>
                    <SelectItem value="2">Level 2 (Getting Deeper)</SelectItem>
                    <SelectItem value="3">Level 3 (Personal)</SelectItem>
                    <SelectItem value="4">Level 4 (Deep Connection)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={createQuestion.isPending}
                >
                  {createQuestion.isPending ? "Creating..." : "Create Question"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search questions..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Category</h2>
            
            {categoriesLoading ? (
              <div className="flex flex-wrap gap-2 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 w-28 bg-gray-200 rounded-full"></div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="rounded-full text-sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Categories
                </Button>
                
                {categories?.map((category: QuestionCategory) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className="rounded-full text-sm"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="level1">
        <TabsList>
          <TabsTrigger value="level1">Level 1</TabsTrigger>
          <TabsTrigger value="level2" disabled>Level 2 (Locked)</TabsTrigger>
          <TabsTrigger value="level3" disabled>Level 3 (Locked)</TabsTrigger>
          <TabsTrigger value="level4" disabled>Level 4 (Locked)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="level1" className="mt-4">
          {questionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <CardContent className="p-4 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No questions match your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question: Question) => {
                const category = categories?.find((c: QuestionCategory) => c.id === question.categoryId);
                
                return (
                  <Card key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-primary-300 transition-colors">
                    <CardContent className="p-4">
                      <p className="text-gray-900 font-medium">{question.text}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500">Category: {category?.name || 'General'}</p>
                        <Button 
                          size="sm" 
                          className="text-sm font-semibold py-2 px-4 bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors duration-300"
                          onClick={() => handleAskQuestion(question)}
                        >Ask a Friend</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Ask Friend Dialog */}
      <Dialog open={isAskFriendDialogOpen} onOpenChange={setIsAskFriendDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ask a Friend</DialogTitle>
            <DialogDescription>
              Answer this question and share it with your friends
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleResponseSubmit} className="space-y-4 pt-4">
            {selectedQuestion && (
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="font-medium text-gray-900">{selectedQuestion.text}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="response">Your Response</Label>
              <Textarea
                id="response"
                placeholder="Share your thoughts..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-3">
              <Label>Share with Friends</Label>
              
              {friendsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2 animate-pulse">
                      <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : acceptedFriends.length === 0 ? (
                <p className="text-sm text-gray-500">You don't have any friends yet. Add friends to share your responses.</p>
              ) : (
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {acceptedFriends.map((connection: Friend) => (
                    <div key={connection.friendId} className="flex items-center gap-2">
                      <Checkbox 
                        id={`friend-${connection.friendId}`}
                        checked={selectedFriends.includes(connection.friendId)}
                        onCheckedChange={() => toggleFriendSelection(connection.friendId)}
                      />
                      <Label 
                        htmlFor={`friend-${connection.friendId}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {connection.friend.fullName}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAskFriendDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex gap-1 items-center bg-blue-600 text-white hover:bg-blue-700"
                disabled={submitResponse.isPending || acceptedFriends.length === 0}
              >
                {submitResponse.isPending ? "Submitting..." : (
                  <>
                    <Send size={14} />
                    Share Response
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
