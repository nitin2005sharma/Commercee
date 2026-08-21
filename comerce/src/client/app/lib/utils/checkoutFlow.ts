"use client";

import { loadStripe } from "@stripe/stripe-js";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const stripePromise = loadStripe(
  "pk_test_51R9gs72KGvEXtMtXXTm7UscmmHYsvk9j3ktaM8vxRb3evNJgG1dpD05YWACweIfcPtpCgOIs4HkpGrTCKE1dZD0p00sLC6iIBg"
);

export const continueCheckoutFlow = async (
  session: { redirectUrl?: string; sessionId?: string },
  router: AppRouterInstance
) => {
  if (session.redirectUrl) {
    router.push(session.redirectUrl);
    return;
  }

  if (!session.sessionId) {
    throw new Error("Checkout session not found");
  }

  const stripe = await stripePromise;
  const result = await stripe?.redirectToCheckout({
    sessionId: session.sessionId,
  });

  if (result?.error) {
    throw new Error(result.error.message);
  }
};
