import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Check, X, Eye } from "lucide-react";

interface WithdrawalManagementProps {
  withdrawals: any[];
  onUpdate: () => void;
}

export const WithdrawalManagement = ({ withdrawals, onUpdate }: WithdrawalManagementProps) => {
  const { toast } = useToast();
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [isProcessing, setIsProcessing] = useState<{ [key: string]: boolean }>({});

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approved' | 'rejected') => {
    setIsProcessing(prev => ({ ...prev, [withdrawalId]: true }));
    
    try {
      const { error } = await supabase
        .from("withdrawals")
        .update({
          status: action,
          admin_remarks: remarks[withdrawalId] || null,
          processed_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);

      if (error) throw error;

      toast({
        title: `Withdrawal ${action}`,
        description: `The withdrawal request has been ${action}.`,
      });

      onUpdate();
      setRemarks(prev => ({ ...prev, [withdrawalId]: "" }));
    } catch (error: any) {
      toast({
        title: "Error processing withdrawal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(prev => ({ ...prev, [withdrawalId]: false }));
    }
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💳 Withdrawal Requests
          {pendingWithdrawals.length > 0 && (
            <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-sm">
              {pendingWithdrawals.length} Pending
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {withdrawals.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No withdrawal requests
          </p>
        ) : (
          <div className="space-y-6">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {withdrawal.profiles?.full_name || withdrawal.profiles?.email || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {withdrawal.profiles?.email}
                    </p>
                    <p className="text-lg font-bold text-primary mt-2">
                      ${withdrawal.amount}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={withdrawal.status} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(withdrawal.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <h4 className="font-medium text-sm text-foreground">Bank Details:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Bank:</span> {withdrawal.bank_name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Account Holder:</span> {withdrawal.bank_account_name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Account Number:</span> {withdrawal.bank_account_number}
                    </div>
                    {withdrawal.routing_number && (
                      <div>
                        <span className="text-muted-foreground">Routing:</span> {withdrawal.routing_number}
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Actions for Pending Withdrawals */}
                {withdrawal.status === 'pending' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`remarks-${withdrawal.id}`} className="text-sm font-medium">
                        Admin Remarks (Optional)
                      </Label>
                      <Textarea
                        id={`remarks-${withdrawal.id}`}
                        placeholder="Add remarks for this withdrawal..."
                        value={remarks[withdrawal.id] || ""}
                        onChange={(e) => setRemarks(prev => ({ 
                          ...prev, 
                          [withdrawal.id]: e.target.value 
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleWithdrawalAction(withdrawal.id, 'approved')}
                        disabled={isProcessing[withdrawal.id]}
                        className="flex items-center gap-2 bg-success hover:bg-success/90"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleWithdrawalAction(withdrawal.id, 'rejected')}
                        disabled={isProcessing[withdrawal.id]}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {/* Show admin remarks for processed withdrawals */}
                {withdrawal.status !== 'pending' && withdrawal.admin_remarks && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Admin Remarks:</h4>
                    <p className="text-sm text-foreground">{withdrawal.admin_remarks}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};