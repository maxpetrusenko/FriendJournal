import { Link, useLocation } from "wouter";
import { User } from "@/App";
import { MessageSquare, Home, Users, HelpCircle, User as UserIcon } from "lucide-react";

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Friends", path: "/friends", icon: Users },
    { name: "Questions", path: "/questions", icon: HelpCircle },
    { name: "Messages", path: "/messages", icon: MessageSquare },
    { name: "My Profile", path: "/profile", icon: UserIcon },
  ];

  return (
    <aside className="hidden md:block bg-white border-r border-gray-200 w-[280px] flex-shrink-0 h-screen sticky top-0">
      {/* Logo and app name */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold text-gray-800">FriendJournal</h1>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const LinkIcon = item.icon;

          return (
            <Link 
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
                isActive 
                  ? "bg-primary-50 text-primary-700 font-medium" 
                  : "text-gray-700 hover:bg-gray-100 font-medium"
              }`}
            >
              <LinkIcon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* User Profile Section */}
      <div className="absolute bottom-0 w-full border-t border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full ${user.avatarColor} flex items-center justify-center text-white font-medium`}>
            {user.fullName.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800">{user.fullName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
