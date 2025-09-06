import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Check, X, Eye, Users, ExternalLink } from "lucide-react";
import { WithdrawalManagement } from "./WithdrawalManagement";

export const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewCounts, setViewCounts] = useState<{ [key: string]: number }>({});
  const [earningsPerView, setEarningsPerView] = useState<{ [key: string]: number }>({});
  const [withdrawals, setWithdrawals] = useState([]);

  const fetchData = async () => {
    try {
      // Fetch all data separately to avoid join issues
      const [channelsResponse, shortsResponse, usersResponse, withdrawalsResponse] = await Promise.all([
        supabase
          .from("channels")
          .select("*")
          .order("submitted_at", { ascending: false }),
        supabase
          .from("shorts")
          .select("*")
          .order("submitted_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("withdrawals")
          .select("*")
          .order("created_at", { ascending: false })
      ]);

      if (channelsResponse.error) throw channelsResponse.error;
      if (shortsResponse.error) throw shortsResponse.error;
      if (usersResponse.error) throw usersResponse.error;
      if (withdrawalsResponse.error) throw withdrawalsResponse.error;

      // Get profile data and create a map for easy lookup
      const profilesMap = {};
      (usersResponse.data || []).forEach(profile => {
        profilesMap[profile.user_id] = profile;
      });

      // Enhance channels data with profile info
      const enhancedChannels = (channelsResponse.data || []).map(channel => ({
        ...channel,
        profiles: profilesMap[channel.user_id] || { full_name: 'Unknown', email: 'Unknown' }
      }));

      // Enhance shorts data with profile info
      const enhancedShorts = (shortsResponse.data || []).map(short => ({
        ...short,
        profiles: profilesMap[short.user_id] || { full_name: 'Unknown', email: 'Unknown' }
      }));

      // Enhance withdrawals data with profile info
      const enhancedWithdrawals = (withdrawalsResponse.data || []).map(withdrawal => ({
        ...withdrawal,
        profiles: profilesMap[withdrawal.user_id] || { full_name: 'Unknown', email: 'Unknown' }
      }));

      setChannels(enhancedChannels);
      setShorts(enhancedShorts);
      setUsers(usersResponse.data || []);
      setWithdrawals(enhancedWithdrawals);

      // Initialize view counts for shorts
      const counts = {};
      enhancedShorts.forEach(short => {
        counts[short.id] = short.views_count || 0;
      });
      setViewCounts(counts);

      // Initialize earnings per view for shorts
      const earningsMap = {};
      enhancedShorts.forEach(short => {
        earningsMap[short.id] = short.earnings_per_view || 0.0001;
      });
      setEarningsPerView(earningsMap);
    } catch (error: any) {
      console.error('Admin fetch error:', error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateChannelStatus = async (channelId: string, status: "approved" | "rejected", remarks?: string) => {
    try {
      const { error } = await supabase
        .from("channels")
        .update({
          status,
          admin_remarks: remarks,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", channelId);

      if (error) throw error;

      toast({
        title: `Channel ${status}`,
        description: `The channel submission has been ${status}.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating channel",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateShortsStatus = async (shortsId: string, status: "approved" | "rejected", remarks?: string) => {
    try {
      const { error } = await supabase
        .from("shorts")
        .update({
          status,
          admin_remarks: remarks,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", shortsId);

      if (error) throw error;

      toast({
        title: `Shorts ${status}`,
        description: `The shorts submission has been ${status}.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating shorts",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateViewCount = async (shortsId: string) => {
    const newCount = viewCounts[shortsId] || 0;
    const newEarningsPerView = earningsPerView[shortsId] || 0.0001;

    try {
      const { error } = await supabase
        .from("shorts")
        .update({ 
          views_count: newCount,
          earnings_per_view: newEarningsPerView
        })
        .eq("id", shortsId);

      if (error) throw error;

      toast({
        title: "Views and earnings updated",
        description: `View count: ${newCount.toLocaleString()}, Earnings per view: $${newEarningsPerView}`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="h-6 w-6 text-primary" />
              Max Immu Studio - Admin Panel
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Users Overview */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Registered Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user: any) => (
                <div key={user.id} className="p-4 border rounded-lg">
                  <h4 className="font-medium">{user.full_name || "No name"}</h4>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDistanceToNow(new Date(user.created_at))} ago
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Channel Submissions */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Channel Submissions ({channels.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channels.map((channel: any) => (
                <div key={channel.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{channel.channel_name || "Untitled Channel"}</h4>
                        <StatusBadge status={channel.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Submitter:</strong> {channel.profiles?.full_name || "Unknown"} ({channel.profiles?.email})
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>URL:</strong> <a href={channel.channel_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          {channel.channel_url} <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDistanceToNow(new Date(channel.submitted_at))} ago
                      </p>
                    </div>
                  </div>
                  
                  {channel.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateChannelStatus(channel.id, "approved")}
                        className="bg-gradient-success hover:bg-success"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const remarks = prompt("Reason for rejection (optional):");
                          updateChannelStatus(channel.id, "rejected", remarks || undefined);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {channel.admin_remarks && (
                    <p className="text-sm text-muted-foreground italic">
                      <strong>Admin note:</strong> {channel.admin_remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shorts Submissions */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Shorts Submissions ({shorts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shorts.map((short: any) => (
                <div key={short.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{short.title || "Untitled Video"}</h4>
                        <StatusBadge status={short.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Submitter:</strong> {short.profiles?.full_name || "Unknown"} ({short.profiles?.email})
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>URL:</strong> <a href={short.shorts_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          {short.shorts_url} <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDistanceToNow(new Date(short.submitted_at))} ago
                      </p>
                    </div>
                  </div>

                  {short.status === "approved" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`views-${short.id}`} className="text-sm font-medium">
                          <Eye className="h-4 w-4 inline mr-1" />
                          Views:
                        </Label>
                        <Input
                          id={`views-${short.id}`}
                          type="number"
                          value={viewCounts[short.id] !== undefined ? viewCounts[short.id] : (short.views_count || 0)}
                          onChange={(e) => setViewCounts(prev => ({ ...prev, [short.id]: parseInt(e.target.value) || 0 }))}
                          className="w-32"
                          min="0"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`earnings-${short.id}`} className="text-sm font-medium">
                          💰 Earnings per View ($):
                        </Label>
                        <Input
                          id={`earnings-${short.id}`}
                          type="number"
                          step="0.0001"
                          min="0"
                          value={earningsPerView[short.id] !== undefined ? earningsPerView[short.id] : (short.earnings_per_view || 0.0001)}
                          onChange={(e) => setEarningsPerView(prev => ({ 
                            ...prev, 
                            [short.id]: parseFloat(e.target.value) || 0 
                          }))}
                          className="w-32"
                          placeholder="0.0001"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => updateViewCount(short.id)}
                        variant="outline"
                      >
                        Update
                      </Button>
                    </div>
                  )}
                  
                  {short.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateShortsStatus(short.id, "approved")}
                        className="bg-gradient-success hover:bg-success"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const remarks = prompt("Reason for rejection (optional):");
                          updateShortsStatus(short.id, "rejected", remarks || undefined);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {short.admin_remarks && (
                    <p className="text-sm text-muted-foreground italic">
                      <strong>Admin note:</strong> {short.admin_remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Management */}
        <WithdrawalManagement withdrawals={withdrawals} onUpdate={fetchData} />
      </div>
    </div>
  );
};