import { User } from "@/App";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MainLayoutProps {
  children: React.ReactNode;
  user: User;
  setUser: (user: User | null) => void;
}

export default function MainLayout({ children, user, setUser }: MainLayoutProps) {
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <MobileNav />
      
      <div className="flex-1 flex overflow-hidden md:grid md:grid-cols-[280px_1fr]">
        <Sidebar user={user} />
        
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
