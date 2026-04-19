"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";

const onboardingSchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(80),
  product_name: z.string().trim().min(1, "At least one product").max(200),
  audience_group: z
    .string()
    .trim()
    .min(1, "Describe who your product is for")
    .max(200),
  product_category: z
    .string()
    .trim()
    .min(1, "Pick a product category")
    .max(80),
  main_goal: z.string().trim().min(1, "Pick a main goal").max(120),
  preferred_focus: z.string().trim().max(120).optional().or(z.literal("")),
  team_size: z.coerce.number().int().min(0).max(100000).optional(),
  company_notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type OnboardingInput = z.input<typeof onboardingSchema>;

export type OnboardingResult =
  | { ok: true; workspace_id: string }
  | { ok: false; error: string };

export async function createCompanyDashboardAction(
  input: OnboardingInput,
): Promise<OnboardingResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid onboarding input.",
    };
  }

  const data = parsed.data;
  const sb = db();
  const description = data.product_name
    ? `Product focus: ${data.product_name}.`
    : null;

  const { data: ws, error } = await sb
    .from("workspaces")
    .insert({
      name: data.company_name,
      description,
      audience_group: data.audience_group,
      product_category: data.product_category,
      main_goal: data.main_goal,
      preferred_focus: data.preferred_focus?.length
        ? data.preferred_focus
        : null,
      team_size: data.team_size ?? null,
      company_notes: data.company_notes?.length ? data.company_notes : null,
      onboarding_completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !ws) {
    return {
      ok: false,
      error: error?.message ?? "Could not create the dashboard.",
    };
  }

  revalidatePath("/workspaces");
  revalidatePath("/");

  return { ok: true, workspace_id: ws.id };
}
