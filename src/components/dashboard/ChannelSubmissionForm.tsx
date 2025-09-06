import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Youtube } from "lucide-react";

interface ChannelSubmissionFormProps {
  onSubmissionSuccess: () => void;
}

export const ChannelSubmissionForm = ({ onSubmissionSuccess }: ChannelSubmissionFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    channelUrl: "",
    channelName: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("channels")
        .insert({
          user_id: user.id,
          channel_url: formData.channelUrl,
          channel_name: formData.channelName,
        });

      if (error) throw error;

      toast({
        title: "Channel submitted successfully!",
        description: "Your channel is now pending approval.",
      });

      setFormData({ channelUrl: "", channelName: "" });
      onSubmissionSuccess();
    } catch (error: any) {
      toast({
        title: "Error submitting channel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-primary" />
          Submit Your Channel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channelName">Channel Name</Label>
            <Input
              id="channelName"
              value={formData.channelName}
              onChange={(e) => setFormData(prev => ({ ...prev, channelName: e.target.value }))}
              placeholder="Your channel name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channelUrl">YouTube Channel URL</Label>
            <Input
              id="channelUrl"
              value={formData.channelUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, channelUrl: e.target.value }))}
              placeholder="https://youtube.com/@yourchannel"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-gradient-primary hover:bg-gradient-accent shadow-soft transition-all duration-normal" 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Channel
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};