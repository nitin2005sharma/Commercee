"use client";

import useToast from "@/app/hooks/ui/useToast";
import {
  useCreateCheckoutFallbackMutation,
  useMarkCheckoutFailedMutation,
  useRestoreCheckoutCartMutation,
  useRetryCheckoutMutation,
  useSupportCheckoutHandoffMutation,
} from "@/app/store/apis/CheckoutApi";
import { continueCheckoutFlow } from "@/app/lib/utils/checkoutFlow";
import { motion } from "framer-motion";
import { Headphones, ShoppingCart, Undo2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PaymentFailed = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [retryCheckout, { isLoading: isRetrying }] = useRetryCheckoutMutation();
  const [restoreCheckoutCart, { isLoading: isRestoring }] =
    useRestoreCheckoutCartMutation();
  const [createCheckoutFallback, { isLoading: isFallbackLoading }] =
    useCreateCheckoutFallbackMutation();
  const [markCheckoutFailed] = useMarkCheckoutFailedMutation();
  const [supportCheckoutHandoff, { isLoading: isSupportLoading }] =
    useSupportCheckoutHandoffMutation();

  useEffect(() => {
    markCheckoutFailed({
      reason: "Customer reached the payment failure screen.",
    }).catch(() => undefined);
  }, [markCheckoutFailed]);

  const handleRetry = async () => {
    try {
      const session = await retryCheckout(undefined).unwrap();
      await continueCheckoutFlow(session, router);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to retry checkout";
      showToast(message, "error");
    }
  };

  const handleRestore = async () => {
    try {
      await restoreCheckoutCart(undefined).unwrap();
      router.push("/cart");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to restore cart";
      showToast(message, "error");
    }
  };

  const handleSupport = async () => {
    try {
      const result = await supportCheckoutHandoff({
        reason: "Payment failed during checkout.",
      }).unwrap();
      router.push(`/support?chatId=${result.chatId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to contact support";
      showToast(message, "error");
    }
  };

  const handleFallback = async () => {
    try {
      const result = await createCheckoutFallback(undefined).unwrap();
      await continueCheckoutFlow(result, router);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Fallback checkout failed";
      showToast(message, "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fff7ed,#fff)] px-4 py-12"
    >
      <div className="w-full max-w-2xl rounded-[2rem] border border-rose-200 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <XCircle size={42} />
        </div>

        <h1 className="mt-6 text-center text-3xl font-semibold text-slate-900">
          Payment failed, but your checkout is recoverable
        </h1>
        <p className="mt-3 text-center text-base leading-7 text-slate-600">
          Your cart can be restored, retried, or handed off to support without
          starting from scratch.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isRetrying ? "Retrying..." : "Retry payment"}
          </button>
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed"
          >
            <Undo2 size={16} />
            {isRestoring ? "Restoring..." : "Restore saved cart"}
          </button>
          <button
            onClick={handleSupport}
            disabled={isSupportLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed"
          >
            <Headphones size={16} />
            {isSupportLoading ? "Opening..." : "Need help?"}
          </button>
          <button
            onClick={() => router.push("/cart")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ShoppingCart size={16} />
            Back to cart
          </button>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <button
            onClick={handleFallback}
            disabled={isFallbackLoading}
            className="mt-4 w-full rounded-2xl bg-amber-100 px-4 py-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-50"
          >
            {isFallbackLoading ? "Recovering..." : "Use dev fallback order"}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default PaymentFailed;
