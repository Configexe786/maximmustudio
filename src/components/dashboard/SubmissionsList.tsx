import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Eye } from "lucide-react";

interface Submission {
  id: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  admin_remarks?: string;
}

interface Channel extends Submission {
  channel_url: string;
  channel_name?: string;
}

interface Shorts extends Submission {
  shorts_url: string;
  title?: string;
  views_count: number;
}

interface SubmissionsListProps {
  channels: Channel[];
  shorts: Shorts[];
}

export const SubmissionsList = ({ channels, shorts }: SubmissionsListProps) => {
  return (
    <div className="space-y-6">
      {/* Channel Submissions */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Your Channel Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No channel submissions yet
            </p>
          ) : (
            <div className="space-y-3">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-fast"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">
                        {channel.channel_name || "Untitled Channel"}
                      </h4>
                      <StatusBadge status={channel.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {channel.channel_url}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDistanceToNow(new Date(channel.submitted_at))} ago
                    </p>
                    {channel.admin_remarks && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        Note: {channel.admin_remarks}
                      </p>
                    )}
                  </div>
                  <a
                    href={channel.channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-glow transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shorts Submissions */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Your Shorts Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {shorts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No shorts submissions yet
            </p>
          ) : (
            <div className="space-y-3">
              {shorts.map((short) => (
                <div
                  key={short.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-fast"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">
                        {short.title || "Untitled Video"}
                      </h4>
                      <StatusBadge status={short.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {short.shorts_url}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Submitted {formatDistanceToNow(new Date(short.submitted_at))} ago
                      </span>
                      {short.status === "approved" && (
                        <div className="flex items-center gap-1 text-primary">
                          <Eye className="h-3 w-3" />
                          <span>{short.views_count.toLocaleString()} views</span>
                        </div>
                      )}
                    </div>
                    {short.admin_remarks && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        Note: {short.admin_remarks}
                      </p>
                    )}
                  </div>
                  <a
                    href={short.shorts_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-glow transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};