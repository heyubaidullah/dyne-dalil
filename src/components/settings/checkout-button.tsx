"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type CheckoutResponse = {
  success: boolean;
  url?: string;
  error?: string;
  message?: string;
};

export function CheckoutButton() {
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
    <Button onClick={startCheckout} disabled={isPending} className="w-full gap-2">
      <CreditCard className="h-4 w-4" />
      {isPending ? "Redirecting to Stripe..." : "Pay with Stripe"}
    </Button>
  );
}
