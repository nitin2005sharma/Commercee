import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_API_KEY;

function createMockStripe(): any {
  return {
    checkout: {
      sessions: {
        create: async (data: any) => ({ id: "cs_mock", ...data }),
      },
    },
    paymentIntents: {
      create: async (data: any) => ({ id: "pi_mock", ...data }),
      confirm: async (id: string, opts?: any) => ({ id, status: "succeeded", ...opts }),
    },
    customers: {
      create: async (data: any) => ({ id: "cus_mock", ...data }),
    },
    refunds: {
      create: async (data: any) => ({ id: "re_mock", ...data }),
    },
    charges: {
      create: async (data: any) => ({ id: "ch_mock", ...data }),
    },
    _isMock: true,
  };
}

export function getStripe(): Stripe | any {
  if (stripeKey) {
    return new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" });
  }
  return createMockStripe();
}

export const stripe = getStripe();
export default stripe;