import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthForm } from "@/components/auth/AuthForm";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

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

        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="animate-pulse text-primary-foreground text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return isAdmin ? <AdminPanel /> : <UserDashboard />;
};

export default Index;
