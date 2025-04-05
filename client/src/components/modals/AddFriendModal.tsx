import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFriendModal({ isOpen, onClose }: AddFriendModalProps) {
  const [friendEmail, setFriendEmail] = useState("");
  const { toast } = useToast();

  const addFriendMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest('POST', '/api/friends', { friendEmail: email });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent!",
        description: "They'll be notified of your request.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      setFriendEmail("");
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add friend",
        description: error.message || "There was an error sending your friend request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!friendEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your friend's email address.",
        variant: "destructive",
      });
      return;
    }

    addFriendMutation.mutate(friendEmail);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Friend</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="friendEmail">Friend's Email</Label>
              <Input
                id="friendEmail"
                type="email"
                placeholder="Enter your friend's email address"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                required
              />
            </div>
            
            <p className="text-sm text-gray-500">
              Your friend will receive a notification and can accept your friend request.
            </p>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addFriendMutation.isPending || !friendEmail.trim()}
            >
              {addFriendMutation.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
