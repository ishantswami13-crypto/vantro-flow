export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  FEATURE_MODULES,
  COMPANY_SCALES,
  type CompanyScale,
  type FeatureModuleId,
} from "@/lib/onboarding-config";
import { saveOrganizationOnboarding } from "@/lib/organization-profile";

const validScaleIds = new Set(COMPANY_SCALES.map((entry) => entry.id));
const validModuleIds = new Set(FEATURE_MODULES.map((entry) => entry.id));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyScale = body.companyScale as CompanyScale | undefined;
    const selectedModules = Array.isArray(body.selectedModules)
      ? body.selectedModules.filter((value: string): value is FeatureModuleId => validModuleIds.has(value as FeatureModuleId))
      : [];

    if (!body.name?.trim() || !body.contactName?.trim() || !body.email?.trim()) {
      return NextResponse.json({ error: "Company name, contact name, and email are required." }, { status: 400 });
    }

    if (!companyScale || !validScaleIds.has(companyScale)) {
      return NextResponse.json({ error: "Select a valid company scale." }, { status: 400 });
    }

    const profile = await saveOrganizationOnboarding({
      name: body.name.trim(),
      contactName: body.contactName.trim(),
      email: body.email.trim(),
      businessType: body.businessType,
      companyScale,
      city: body.city,
      state: body.state,
      selectedModules,
    });

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save onboarding." }, { status: 500 });
  }
}
