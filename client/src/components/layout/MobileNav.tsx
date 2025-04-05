import { Link, useLocation } from "wouter";
import { MessageSquare, Home, Users, HelpCircle, User } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Friends", path: "/friends", icon: Users },
    { name: "Questions", path: "/questions", icon: HelpCircle },
    { name: "Messages", path: "/messages", icon: MessageSquare },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-primary" />
            <h1 className="ml-2 text-xl font-semibold text-gray-800">FriendJournal</h1>
          </div>
          
          {/* Profile button for mobile */}
          <Link href="/profile" className="flex items-center space-x-2 focus:outline-none">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 flex items-center justify-center text-white font-medium">
              A
            </div>
          </Link>
        </div>
      </header>
      
      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around items-center py-3 z-10">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const LinkIcon = item.icon;

          return (
            <Link 
              key={item.path}
              href={item.path} 
              className={`flex flex-col items-center ${isActive ? 'text-primary-600' : 'text-gray-500'}`}
            >
              <LinkIcon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
