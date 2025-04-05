import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Friends from "@/pages/Friends";
import Questions from "@/pages/Questions";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import MainLayout from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { apiRequest } from "./lib/queryClient";

export type User = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarColor: string;
};

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth setUser={setUser} />;
  }

  return (
    <MainLayout user={user} setUser={setUser}>
      <Switch>
        <Route path="/" component={() => <Home user={user} />} />
        <Route path="/friends" component={() => <Friends user={user} />} />
        <Route path="/questions" component={() => <Questions user={user} />} />
        <Route path="/messages" component={() => <Messages user={user} />} />
        <Route path="/profile" component={() => <Profile user={user} setUser={setUser} />} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
