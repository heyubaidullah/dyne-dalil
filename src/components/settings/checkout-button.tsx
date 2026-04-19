"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type CheckoutResponse = {
  success: boolean;
  url?: string;
  error?: string;
  message?: string;
};

export function CheckoutButton({
  label = "Pay with Stripe",
  plan,
  variant = "default",
  className,
  showIcon = true,
}: {
  label?: string;
  plan?: string;
  variant?: "default" | "outline";
  className?: string;
  showIcon?: boolean;
} = {}) {
  const [isPending, setIsPending] = useState(false);

  async function startCheckout() {
    try {
      setIsPending(true);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: 1,
          plan,
        }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok || !data.success || !data.url) {
        toast.error(data.message ?? data.error ?? "Could not start checkout.");
        return;
      }

      window.location.assign(data.url);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start checkout.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={startCheckout}
      disabled={isPending}
      className={className ?? "w-full gap-2"}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showIcon ? (
        <CreditCard className="h-4 w-4" />
      ) : null}
      {isPending ? "Redirecting to Stripe…" : label}
    </Button>
  );
}
