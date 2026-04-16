import { redirect } from "next/navigation";
import UploadWorkspace from "@/components/upload/UploadWorkspace";
import { getDefaultOrganizationProfile } from "@/lib/organization-profile";

export default async function UploadPage() {
  const organizationProfile = await getDefaultOrganizationProfile();
  if (!organizationProfile.onboardingCompleted) {
    redirect("/welcome");
  }
  if (!organizationProfile.selectedModules.includes("invoice_imports")) {
    redirect("/");
  }

  return <UploadWorkspace />;
}
