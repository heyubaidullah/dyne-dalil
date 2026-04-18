"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Give the workspace a name.").max(80),
  description: z.string().trim().max(600).optional(),
});

export type CreateWorkspaceState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "description", string>>;
};

export async function createWorkspaceAction(
  _prev: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: CreateWorkspaceState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "name" | "description" | undefined;
      if (key) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const sb = db();
  const { data, error } = await sb
    .from("workspaces")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description?.length ? parsed.data.description : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create workspace." };
  }

  revalidatePath("/workspaces");
  revalidatePath("/");
  redirect(`/w/${data.id}`);
}
