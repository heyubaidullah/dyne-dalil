import { z } from "zod";
import { requireEnv } from "@/lib/env";
import { getStripeServerClient } from "@/lib/stripe";

const requestSchema = z
  .object({
    customerEmail: z.string().email().optional(),
    quantity: z.number().int().min(1).max(10).optional(),
  })
  .optional();

export async function POST(request: Request) {
  let payload: z.infer<typeof requestSchema>;

  try {
    payload = requestSchema.parse(await request.json().catch(() => ({})));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: "Invalid checkout payload",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return Response.json(
      { success: false, error: "Could not parse checkout payload" },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripeServerClient();
    const appUrl = requireEnv("NEXT_PUBLIC_APP_URL");
    const priceId = requireEnv("STRIPE_PRICE_ID");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: payload?.quantity ?? 1,
        },
      ],
      customer_email: payload?.customerEmail,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${appUrl}/settings/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings/billing/cancel`,
      metadata: {
        source: "dalil-settings-billing",
      },
    });

    if (!session.url) {
      return Response.json(
        { success: false, error: "Stripe did not return a checkout URL" },
        { status: 502 },
      );
    }

    return Response.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout session";

    return Response.json(
      {
        success: false,
        error: "Failed to create checkout session",
        message,
      },
      { status: 500 },
    );
  }
}
