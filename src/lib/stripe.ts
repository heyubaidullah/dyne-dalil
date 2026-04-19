import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeServerClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
      appInfo: {
        name: "dalil",
      },
    });
  }

  return stripeClient;
}
