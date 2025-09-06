import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthForm } from "@/components/auth/AuthForm";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { WalletPage } from "./Wallet";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const currentPath = window.location.pathname;

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("user_id", user.id)
          .single();

        setIsAdmin(data?.is_admin || user.email === "tgmastergaming@gmail.com");
      } catch (error) {
        console.error("Error checking admin status:", error);
        // Fallback to email check for admin
        setIsAdmin(user.email === "tgmastergaming@gmail.com");
      } finally {
        setProfileLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // Handle wallet route for authenticated users
  if (currentPath === '/wallet') {
    return <WalletPage />;
  }

  return isAdmin ? <AdminPanel /> : <UserDashboard />;
};

export default Index;
