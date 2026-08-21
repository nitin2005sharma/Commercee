"use client";

import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import CustomLoader from "../feedback/CustomLoader";
import { useAuth } from "@/app/hooks/useAuth";
import { useEffect, useState } from "react";

export function withAuth<P extends object = object>(Component: ComponentType<P>) {
  return function AuthWrapper(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (mounted && !isLoading && !isAuthenticated) {
        router.push("/sign-in");
      }
    }, [mounted, isLoading, isAuthenticated]);

    // 🔥 CRITICAL FIX
    if (!mounted || isLoading) {
      return <CustomLoader />;
    }

    return <Component {...props} />;
  };
}
