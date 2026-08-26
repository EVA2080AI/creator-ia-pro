import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authClient, useSession } from "@/lib/auth-client";

export function useAuth(redirectTo?: string) {
  const { data, isPending } = useSession();
  const navigate = useNavigate();

  const user = data?.user ?? null;

  useEffect(() => {
    if (!isPending && !user && redirectTo) navigate(redirectTo);
  }, [isPending, user, redirectTo, navigate]);

  const signOut = async () => {
    await authClient.signOut({});
    navigate("/auth");
  };

  return { user, loading: isPending, signOut };
}
