import { useState } from "react";
import { User } from "@/App";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import FriendActivity from "@/components/dashboard/FriendActivity";
import QuestionOfTheDay from "@/components/dashboard/QuestionOfTheDay";
import FriendsList from "@/components/dashboard/FriendsList";
import QuestionCategories from "@/components/dashboard/QuestionCategories";
import AddFriendModal from "@/components/modals/AddFriendModal";

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.fullName.split(' ')[0]}!</h1>
          <p className="text-gray-600 mt-1">Continue building meaningful connections with your friends</p>
        </div>
        
        {/* Add Friend Button */}
        <Button 
          onClick={() => setIsAddFriendModalOpen(true)}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg shadow-sm hover:bg-primary-700"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Friend
        </Button>
      </div>
      
      {/* Friend Activity */}
      <FriendActivity />
      
      {/* Question of the Day */}
      <QuestionOfTheDay />
      
      {/* Your Friends */}
      <FriendsList />
      
      {/* Question Categories */}
      <QuestionCategories />
      
      {/* Add Friend Modal */}
      <AddFriendModal 
        isOpen={isAddFriendModalOpen} 
        onClose={() => setIsAddFriendModalOpen(false)} 
      />
    </div>
  );
}
