import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Wallet, IndianRupee, CreditCard } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const WalletPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_name: "",
    routing_number: "",
    ifsc_code: "",
  });

  const fetchData = async () => {
    if (!user) return;

    try {
      const [profileResponse, withdrawalsResponse] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("withdrawals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ]);

      if (profileResponse.error) throw profileResponse.error;
      if (withdrawalsResponse.error) throw withdrawalsResponse.error;

      setProfile(profileResponse.data);
      setWithdrawals(withdrawalsResponse.data || []);
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

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!user || !profile) return;

    const amount = parseFloat(withdrawForm.amount);
    if (amount < 500) {
      toast({
        title: "Insufficient Balance",
        description: "Minimum withdrawal is ₹500",
        variant: "destructive",
      });
      return;
    }

    if (amount > (profile?.earnings || 0)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough earnings to withdraw this amount",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: withdrawError } = await supabase
        .from("withdrawals")
        .insert({
          user_id: user.id,
          amount: amount,
          bank_account_name: withdrawForm.bank_account_name,
          bank_account_number: withdrawForm.bank_account_number,
          bank_name: withdrawForm.bank_name,
          routing_number: withdrawForm.routing_number,
          ifsc_code: withdrawForm.ifsc_code,
        });

      if (withdrawError) throw withdrawError;

      // Update user's available earnings
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ earnings: profile.earnings - amount })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal request has been submitted for admin approval.",
      });

      setWithdrawForm({
        amount: "",
        bank_account_name: "",
        bank_account_number: "",
        bank_name: "",
        routing_number: "",
        ifsc_code: "",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error submitting withdrawal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading wallet...</div>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Wallet & Earnings</h1>
                  <p className="text-sm text-muted-foreground">Max Immu Studio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <IndianRupee className="h-5 w-5" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                ₹{profile?.earnings?.toFixed(2) || "0.00"}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Ready for withdrawal
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CreditCard className="h-5 w-5" />
                Total Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ₹{withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + parseFloat(w.amount || 0), 0).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Successfully withdrawn
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Form */}
        <Card className="shadow-medium mb-8">
          <CardHeader>
            <CardTitle>Request Withdrawal</CardTitle>
            <p className="text-sm text-muted-foreground">
              Minimum withdrawal amount is ₹500.00
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="500"
                    max={profile?.earnings || 0}
                    placeholder="Enter amount"
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    placeholder="Enter bank name"
                    value={withdrawForm.bank_name}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, bank_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="account_name">Account Holder Name</Label>
                  <Input
                    id="account_name"
                    placeholder="Enter account holder name"
                    value={withdrawForm.bank_account_name}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, bank_account_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    placeholder="Enter account number"
                    value={withdrawForm.bank_account_number}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, bank_account_number: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="routing_number">Routing Number (Optional)</Label>
                  <Input
                    id="routing_number"
                    placeholder="Enter routing number"
                    value={withdrawForm.routing_number}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, routing_number: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ifsc_code">IFSC Code</Label>
                  <Input
                    id="ifsc_code"
                    placeholder="Enter IFSC code"
                    value={withdrawForm.ifsc_code}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, ifsc_code: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Withdrawal Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No withdrawal requests yet
              </p>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div 
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">₹{withdrawal.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {withdrawal.bank_name} - {withdrawal.bank_account_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(withdrawal.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={withdrawal.status} />
                      {withdrawal.admin_remarks && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {withdrawal.admin_remarks}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WalletPage;