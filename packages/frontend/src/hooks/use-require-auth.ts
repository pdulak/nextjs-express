"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function useRequireAuth(requiredPermission?: string) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (requiredPermission && !user.permissions.includes(requiredPermission)) {
      router.replace("/");
    }
  }, [user, loading, requiredPermission, router]);

  return { user, loading };
}
