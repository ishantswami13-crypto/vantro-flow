"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/onboarding") return;
    const onboarded = localStorage.getItem("vantro_onboarded");
    if (!onboarded) {
      router.push("/onboarding");
    }
  }, [pathname, router]);

  return <>{children}</>;
}
