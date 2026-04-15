import { redirect } from "next/navigation";

// The onboarding flow has moved to /onboarding
export default function WelcomePage() {
  redirect("/onboarding");
}
