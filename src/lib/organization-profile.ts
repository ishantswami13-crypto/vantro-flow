import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import {
  COMPANY_SCALES,
  FEATURE_MODULES,
  PRIMARY_ORG_ID,
  type CompanyScale,
  type FeatureModuleId,
  getRecommendedModules,
  parseSelectedModules,
  serializeSelectedModules,
} from "./onboarding-config";

export interface OrganizationProfile {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
  businessType: string | null;
  companyScale: CompanyScale | null;
  selectedModules: FeatureModuleId[];
  onboardingCompleted: boolean;
  city: string | null;
  state: string | null;
  plan: string | null;
}

function mapOrganization(row: typeof organizations.$inferSelect): OrganizationProfile {
  const companyScale = (row.company_scale as CompanyScale | null) ?? null;
  const selectedModules = parseSelectedModules(row.selected_modules);

  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name,
    email: row.email,
    businessType: row.business_type,
    companyScale,
    selectedModules: selectedModules.length > 0 && companyScale ? selectedModules : companyScale ? getRecommendedModules(companyScale) : [],
    onboardingCompleted: Boolean(row.onboarding_completed),
    city: row.city,
    state: row.state,
    plan: row.plan,
  };
}

export async function ensurePrimaryOrganization() {
  const [existing] = await db.select().from(organizations).where(eq(organizations.id, PRIMARY_ORG_ID)).limit(1);
  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(organizations)
    .values({
      id: PRIMARY_ORG_ID,
      name: "Vantro Workspace",
      plan: "free",
    })
    .returning();

  return created;
}

export async function getDefaultOrganizationProfile(): Promise<OrganizationProfile> {
  const organization = await ensurePrimaryOrganization();
  return mapOrganization(organization);
}

export async function requireOnboardingComplete() {
  const profile = await getDefaultOrganizationProfile();
  return profile;
}

export async function saveOrganizationOnboarding(input: {
  name: string;
  contactName: string;
  email: string;
  businessType?: string;
  companyScale: CompanyScale;
  city?: string;
  state?: string;
  selectedModules: FeatureModuleId[];
}) {
  await ensurePrimaryOrganization();

  const modulesToStore =
    input.selectedModules.length > 0 ? input.selectedModules : getRecommendedModules(input.companyScale);

  const [updated] = await db
    .update(organizations)
    .set({
      name: input.name,
      contact_name: input.contactName,
      email: input.email,
      business_type: input.businessType?.trim() || null,
      company_scale: input.companyScale,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      selected_modules: serializeSelectedModules(modulesToStore),
      onboarding_completed: true,
      onboarding_completed_at: new Date(),
    })
    .where(eq(organizations.id, PRIMARY_ORG_ID))
    .returning();

  return mapOrganization(updated);
}

export function getModulesForScale(scale: CompanyScale | null | undefined) {
  if (!scale) {
    return [];
  }

  const recommended = new Set(getRecommendedModules(scale));
  return FEATURE_MODULES.map((module) => ({
    ...module,
    recommended: recommended.has(module.id),
  }));
}

export const COMPANY_SCALE_OPTIONS = COMPANY_SCALES;
