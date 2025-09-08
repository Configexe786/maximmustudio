import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChannelSubmissionForm } from "./ChannelSubmissionForm";
import { ShortsSubmissionForm } from "./ShortsSubmissionForm";
import { SubmissionsList } from "./SubmissionsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, BarChart3 } from "lucide-react";

export const UserDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [stats, setStats] = useState({ totalViews: 0, approvedShorts: 0, earnings: 0, totalEarnings: 0 });
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [channelsResponse, shortsResponse, profileResponse] = await Promise.all([
        supabase
          .from("channels")
          .select("*")
          .eq("user_id", user.id)
          .order("submitted_at", { ascending: false }),
        supabase
          .from("shorts")
          .select("*")
          .eq("user_id", user.id)
          .order("submitted_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()
      ]);

      if (channelsResponse.error) throw channelsResponse.error;
      if (shortsResponse.error) throw shortsResponse.error;
      if (profileResponse.error) throw profileResponse.error;

      setChannels(channelsResponse.data || []);
      setShorts(shortsResponse.data || []);
      setProfile(profileResponse.data);

      // Calculate stats
      const approvedShorts = shortsResponse.data?.filter(s => s.status === "approved") || [];
      const totalViews = approvedShorts.reduce((sum, short) => sum + (short.views_count || 0), 0);
      
      setStats({
        totalViews,
        approvedShorts: approvedShorts.length,
        earnings: profileResponse.data?.earnings || 0,
        totalEarnings: profileResponse.data?.total_earnings || 0,
      });
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account.",
    });
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channelsSubscription = supabase
      .channel('user-channels')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channels',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchData();
      })
      .subscribe();

    const shortsSubscription = supabase
      .channel('user-shorts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shorts',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelsSubscription);
      supabase.removeChannel(shortsSubscription);
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-card shadow-soft border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Max Immu Studio</h1>
                <p className="text-sm text-muted-foreground">Creator Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {user?.email}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-medium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.totalViews.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-medium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved Shorts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.approvedShorts}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-medium">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                ₹{stats.earnings.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submission Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Show channel submission if no approved channel exists */}
          {!channels.some(c => c.status === 'approved') ? (
            <ChannelSubmissionForm onSubmissionSuccess={fetchData} />
          ) : (
            <ShortsSubmissionForm onSubmissionSuccess={fetchData} />
          )}
          
          {/* Wallet/Earnings Card */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                💰 Wallet & Earnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold text-success">₹{stats.earnings.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Withdrawal</p>
                  <p className="text-2xl font-bold text-primary">₹{stats.totalEarnings.toFixed(2)}</p>
                </div>
              </div>
              <Button 
                className="w-full"
                onClick={() => {
                  if (stats.earnings >= 500) {
                    window.location.href = '/wallet';
                  } else {
                    alert("Insufficient Balance. Minimum withdrawal is ₹500.");
                  }
                }}
              >
                Withdraw Funds
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        <SubmissionsList channels={channels} shorts={shorts} />
      </main>
    </div>
  );
};
