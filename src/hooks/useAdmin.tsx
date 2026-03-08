import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      setIsAdmin(!!data && !error);
      setLoading(false);
    };

    check();
  }, [userId]);

  return { isAdmin, loading };
}
