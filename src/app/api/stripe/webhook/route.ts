import Stripe from "stripe";
import { requireEnv } from "@/lib/env";
import { getStripeServerClient } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      { success: false, error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const body = await request.text();

  try {
    const stripe = getStripeServerClient();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET"),
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[stripe] checkout.session.completed", {
          sessionId: session.id,
          customerEmail: session.customer_details?.email,
          amountTotal: session.amount_total,
          currency: session.currency,
        });
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.warn("[stripe] checkout.session.async_payment_failed", {
          sessionId: session.id,
          customerEmail: session.customer_details?.email,
        });
        break;
      }
      default:
        console.log("[stripe] unhandled event", event.type);
    }

    return Response.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook signature verification failed";

    return Response.json(
      { success: false, error: "Webhook signature verification failed", message },
      { status: 400 },
    );
  }
}
