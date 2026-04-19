"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCompanyDashboardAction } from "@/app/actions/onboarding";

type InitialValues = {
  company_name: string;
  product_name: string;
  audience_group: string;
  product_category: string;
  main_goal: string;
  preferred_focus: string;
  team_size: number | undefined;
  company_notes: string;
};

const MAIN_GOAL_OPTIONS = [
  "Improve customer feedback tracking and product decisions",
  "Find product-market fit",
  "Reduce returns or churn",
  "Prioritize the next roadmap",
  "Understand a new audience",
  "Measure go-to-market performance",
];

const FEEDBACK_FOCUS_OPTIONS = [
  "Product quality and fit",
  "Pricing and positioning",
  "Onboarding and activation",
  "Support and retention",
  "Brand and messaging",
];

const PRODUCT_CATEGORY_OPTIONS = [
  "Apparel / modest fashion",
  "Consumer SaaS",
  "B2B SaaS",
  "Marketplace",
  "Consumer packaged goods",
  "Hardware",
  "Education",
  "Fintech",
  "Food & beverage",
  "Media / community",
  "Other",
];

export function OnboardingForm({ initial }: { initial: InitialValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof InitialValues>(
    key: K,
    v: InitialValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  const requiredFilled = Boolean(
    values.company_name.trim() &&
      values.product_name.trim() &&
      values.audience_group.trim() &&
      values.product_category.trim() &&
      values.main_goal.trim(),
  );
  const requiredCount = 5;
  const filledCount =
    Number(Boolean(values.company_name.trim())) +
    Number(Boolean(values.product_name.trim())) +
    Number(Boolean(values.audience_group.trim())) +
    Number(Boolean(values.product_category.trim())) +
    Number(Boolean(values.main_goal.trim()));
  const progressPct = Math.round((filledCount / requiredCount) * 100);

  function submit() {
    if (!requiredFilled) {
      toast.error("Fill out the five required fields first.");
      return;
    }
    startTransition(async () => {
      const res = await createCompanyDashboardAction({
        company_name: values.company_name.trim(),
        product_name: values.product_name.trim(),
        audience_group: values.audience_group.trim(),
        product_category: values.product_category.trim(),
        main_goal: values.main_goal.trim(),
        preferred_focus: values.preferred_focus.trim(),
        team_size:
          typeof values.team_size === "number" && !Number.isNaN(values.team_size)
            ? values.team_size
            : undefined,
        company_notes: values.company_notes.trim(),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Dashboard ready. Taking you in…");
      router.push(`/w/${res.workspace_id}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{filledCount} of {requiredCount} required fields</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-teal-700 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Company name"
          required
          hint="Your brand, as customers know it."
        >
          <Input
            value={values.company_name}
            onChange={(e) => update("company_name", e.target.value)}
            placeholder="SUHBA"
          />
        </Field>

        <Field
          label="Product / products"
          required
          hint="Hero SKU, app, or service."
        >
          <Input
            value={values.product_name}
            onChange={(e) => update("product_name", e.target.value)}
            placeholder="All-weather jacket"
          />
        </Field>

        <Field
          label="Product category"
          required
          hint="Helps Dalil AI pattern-match feedback."
        >
          <Select
            value={values.product_category}
            onValueChange={(v) => update("product_category", v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Audience group"
          required
          hint="Be specific — narrower is better."
        >
          <Input
            value={values.audience_group}
            onChange={(e) => update("audience_group", e.target.value)}
            placeholder="Young Muslim consumers; Gen Z modest-fashion shoppers"
          />
        </Field>

        <Field
          label="Main goal"
          required
          hint="What you want Dalil to help you do."
        >
          <Select
            value={values.main_goal}
            onValueChange={(v) => update("main_goal", v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick your main goal" />
            </SelectTrigger>
            <SelectContent>
              {MAIN_GOAL_OPTIONS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Preferred feedback focus"
          hint="Optional. Where you want Dalil AI to listen first."
        >
          <Select
            value={values.preferred_focus}
            onValueChange={(v) => update("preferred_focus", v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a focus (optional)" />
            </SelectTrigger>
            <SelectContent>
              {FEEDBACK_FOCUS_OPTIONS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Team size" hint="Optional.">
          <Input
            type="number"
            min={0}
            value={values.team_size ?? ""}
            onChange={(e) =>
              update(
                "team_size",
                e.target.value === ""
                  ? undefined
                  : Math.max(0, Number(e.target.value)),
              )
            }
            placeholder="5"
          />
        </Field>
      </div>

      <Field label="Notes" hint="Optional. Anything about your stage or context.">
        <Textarea
          rows={3}
          value={values.company_notes}
          onChange={(e) => update("company_notes", e.target.value)}
          placeholder="Founding team of five. Launched V1 three months ago; V2 cut planned for next quarter."
        />
      </Field>

      {requiredFilled && (
        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Summary
          </p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <SummaryItem label="Company" value={values.company_name} />
            <SummaryItem label="Product" value={values.product_name} />
            <SummaryItem label="Audience" value={values.audience_group} />
            <SummaryItem label="Category" value={values.product_category} />
            <SummaryItem label="Goal" value={values.main_goal} />
            {values.preferred_focus && (
              <SummaryItem
                label="Focus"
                value={values.preferred_focus}
              />
            )}
          </dl>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {requiredFilled ? (
            <span className="inline-flex items-center gap-1 text-teal-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ready to go. Dalil AI will use this to categorize every input.
            </span>
          ) : (
            "Fill out the required fields to continue."
          )}
        </p>
        <Button
          type="button"
          onClick={submit}
          disabled={pending || !requiredFilled}
          className="gap-1.5"
          size="lg"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Create Dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? (
          <span className="ml-1 text-teal-700">*</span>
        ) : (
          <span className="ml-1 text-xs text-muted-foreground">optional</span>
        )}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-ink-950 dark:text-ink-50">{value}</dd>
    </div>
  );
}
