import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video } from "lucide-react";

interface ShortsSubmissionFormProps {
  onSubmissionSuccess: () => void;
}

export const ShortsSubmissionForm = ({ onSubmissionSuccess }: ShortsSubmissionFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    shortsUrl: "",
    title: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("shorts")
        .insert({
          user_id: user.id,
          shorts_url: formData.shortsUrl,
          title: formData.title,
        });

      if (error) throw error;

      toast({
        title: "Shorts submitted successfully!",
        description: "Your shorts submission is now pending approval.",
      });

      setFormData({ shortsUrl: "", title: "" });
      onSubmissionSuccess();
    } catch (error: any) {
      toast({
        title: "Error submitting shorts",
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
          <Video className="h-5 w-5 text-accent" />
          Submit Your Shorts/Reels
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Video Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Your video title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortsUrl">Shorts/Reels URL</Label>
            <Input
              id="shortsUrl"
              value={formData.shortsUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, shortsUrl: e.target.value }))}
              placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..."
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-gradient-accent hover:bg-gradient-primary shadow-soft transition-all duration-normal" 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Shorts
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};