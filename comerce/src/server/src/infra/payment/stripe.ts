import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_API_KEY;

let _stripe: any | null = null;

function createMockStripe() {
  console.warn("[stripe] STRIPE API key not set — using mock Stripe client (safe for local dev).");

  const mock = {
    checkout: {
      sessions: {
        create: async (data: any) => ({
          id: `cs_test_${Math.random().toString(36).slice(2, 12)}`,
          url: data?.success_url ?? "/payment-success",
          ...data,
        }),
        retrieve: async (id: string) => ({
          id,
          amount_total: 0,
          customer_details: null,
          metadata: {},
          payment_method_types: ["card"],
        }),
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
    // generic fallback so code using other namespaces won't crash immediately
    charges: {
      create: async (data: any) => ({ id: "ch_mock", ...data }),
    },
    _isMock: true,
  };

  return mock;
}

export default  function getStripe(): any {
  if (_stripe) return _stripe;
  if (!stripeKey) {
    _stripe = createMockStripe();
  } else {
    _stripe = new Stripe(stripeKey, { apiVersion:"2025-03-31.basil"});
  }
  return _stripe;
}
