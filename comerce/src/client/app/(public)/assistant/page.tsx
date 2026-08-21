"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  CornerDownLeft,
  Loader2,
  MessageSquareText,
  ShoppingCart,
} from "lucide-react";
import MainLayout from "@/app/components/templates/MainLayout";
import SafeImage from "@/app/components/atoms/SafeImage";
import useToast from "@/app/hooks/ui/useToast";
import { useAddToCartMutation } from "@/app/store/apis/CartApi";
import { useSendShoppingAssistantMessageMutation } from "@/app/store/apis/ShoppingAssistantApi";
import { generateProductPlaceholder } from "@/app/utils/placeholderImage";

type AssistantPayload = {
  reply: string;
  assistantMode: "openai" | "catalog";
  extractedBrief?: {
    budget?: number | null;
    keywords?: string[];
  };
  suggestedProducts?: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    categoryName?: string | null;
    variantId: string;
    sku: string;
    price: number;
    stock: number;
    image?: string | null;
    why: string;
  }>;
  suggestedGoals?: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    audience: string;
    suggestedBudget: number;
    why: string;
  }>;
  suggestedBundles?: Array<{
    id: string;
    title: string;
    summary: string;
    total: number;
    frequency: number;
    items: Array<{
      productName: string;
      productSlug: string;
      variantId: string;
      price: number;
      image?: string | null;
    }>;
  }>;
  followUpQuestions?: string[];
};

type ConversationEntry =
  | {
      role: "user";
      content: string;
    }
  | {
      role: "assistant";
      content: string;
      payload: AssistantPayload;
    };

const QUICK_PROMPTS = [
  "I need a travel setup under $250",
  "Build me a work-from-home desk refresh",
  "I want a gift bundle for a gamer",
  "Show me frequently bought starter items",
];

const formatPrice = (amount?: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);

const AssistantPage = () => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ConversationEntry[]>([]);
  const [input, setInput] = useState("");
  const [sendShoppingAssistantMessage, { isLoading }] =
    useSendShoppingAssistantMessageMutation();
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();

  const conversationHistory = useMemo(
    () =>
      messages.map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
    [messages]
  );

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((entry): entry is Extract<ConversationEntry, { role: "assistant" }> => entry.role === "assistant");

  const handleAddToCart = async (variantId: string) => {
    try {
      await addToCart({
        variantId,
        quantity: 1,
      }).unwrap();
      showToast("Added to cart", "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Could not add this item to the cart";
      showToast(message, "error");
    }
  };

  const handleSend = async (messageText?: string) => {
    const nextMessage = (messageText ?? input).trim();

    if (!nextMessage) {
      return;
    }

    const nextUserMessage: ConversationEntry = {
      role: "user",
      content: nextMessage,
    };

    setMessages((current) => [...current, nextUserMessage]);
    setInput("");

    try {
      const response = await sendShoppingAssistantMessage({
        message: nextMessage,
        history: [...conversationHistory, nextUserMessage].slice(-8),
      }).unwrap();

      const assistantPayload = response.assistant as AssistantPayload;

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: assistantPayload.reply,
          payload: assistantPayload,
        },
      ]);
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "The assistant could not respond right now";
      showToast(message, "error");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSend();
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(135deg,#f8fffb,_#eef8ff_60%,#ffffff)] p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
                Shopping Helper
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                Get help choosing the right products
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Search the catalog, compare bundles, and narrow a rough shopping
                idea into a short list you can actually use.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Catalog based",
                  value: "Only suggests real products",
                },
                {
                  label: "Plan friendly",
                  value: "Can suggest useful bundles",
                },
                {
                  label: "Cart ready",
                  value: "Add recommended items directly",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/70 bg-white/80 px-5 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Bot size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Shopping chat</h2>
                <p className="text-sm text-slate-500">
                  Ask a question and compare suggestions from the catalog.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {!messages.length ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-600">
                  Start with a messy real shopping question like &quot;I need a travel outfit under
                  $180&quot; or &quot;build a starter desk setup for a small room.&quot;
                </div>
              ) : (
                messages.map((entry, index) => (
                  <div
                    key={`${entry.role}-${index}`}
                    className={`rounded-3xl px-5 py-4 ${
                      entry.role === "user"
                        ? "ml-auto max-w-[85%] bg-slate-900 text-white"
                        : "max-w-[90%] border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                      {entry.role === "user" ? "You" : "Assistant"}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-7">
                      {entry.content}
                    </p>
                    {entry.role === "assistant" && entry.payload.followUpQuestions?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {entry.payload.followUpQuestions.map((question) => (
                          <button
                            key={question}
                            type="button"
                            onClick={() => setInput(question)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-5">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-3">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={4}
                  placeholder="Ask for a bundle, a better budget mix, a gift idea, a travel setup, or a shopping plan."
                  className="w-full resize-none bg-transparent px-2 py-2 text-sm text-slate-700 outline-none"
                />
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                  <p className="text-xs text-slate-500">
                    Tip: mention a budget, style, or who it is for to get stronger picks.
                  </p>
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CornerDownLeft size={16} />}
                    {isLoading ? "Thinking..." : "Send"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">Current read</h3>
              </div>
              {lastAssistantMessage ? (
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Reply source
                    </p>
                    <p className="mt-2 font-medium text-slate-900">
                      {lastAssistantMessage.payload.assistantMode === "openai"
                        ? "Enhanced catalog reply"
                        : "Catalog reply"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Budget
                    </p>
                    <p className="mt-2 font-medium text-slate-900">
                      {lastAssistantMessage.payload.extractedBrief?.budget
                        ? formatPrice(lastAssistantMessage.payload.extractedBrief.budget)
                        : "Not captured yet"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Keywords
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(lastAssistantMessage.payload.extractedBrief?.keywords || []).map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {keyword}
                        </span>
                      ))}
                      {!lastAssistantMessage.payload.extractedBrief?.keywords?.length ? (
                        <span className="text-sm text-slate-500">Waiting for more signal</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Once you send a request, the assistant will show the budget and keyword signals
                  it extracted from your brief.
                </p>
              )}
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-emerald-600" />
                <h3 className="text-lg font-semibold text-slate-900">Suggested products</h3>
              </div>
              <div className="mt-4 space-y-4">
                {(lastAssistantMessage?.payload.suggestedProducts || []).map((product) => (
                  <div
                    key={product.variantId}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white">
                        <SafeImage
                          src={product.image}
                          fallbackSrc={generateProductPlaceholder(product.name)}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link
                              href={`/product/${product.slug}`}
                              className="line-clamp-2 text-sm font-semibold text-slate-900 transition hover:text-emerald-700"
                            >
                              {product.name}
                            </Link>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                              {product.categoryName || "General"}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{product.why}</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-medium text-slate-500">
                            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product.variantId)}
                            disabled={isAddingToCart}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            <ShoppingCart size={14} />
                            Add to cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!lastAssistantMessage?.payload.suggestedProducts?.length ? (
                  <p className="text-sm leading-6 text-slate-500">
                    Product suggestions appear here after the assistant finds a solid catalog match.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <MessageSquareText size={18} className="text-emerald-600" />
                <h3 className="text-lg font-semibold text-slate-900">Goal and bundle paths</h3>
              </div>
              <div className="mt-4 space-y-4">
                {(lastAssistantMessage?.payload.suggestedGoals || []).map((goal) => (
                  <Link
                    key={goal.id}
                    href={`/goals/${goal.slug}`}
                    className="block rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{goal.why}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {formatPrice(goal.suggestedBudget)}
                      </span>
                    </div>
                  </Link>
                ))}

                {(lastAssistantMessage?.payload.suggestedBundles || []).map((bundle) => (
                  <div
                    key={bundle.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{bundle.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{bundle.summary}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {formatPrice(bundle.total)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {bundle.items.map((item) => (
                        <Link
                          key={`${bundle.id}-${item.variantId}`}
                          href={`/product/${item.productSlug}`}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {item.productName}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {!lastAssistantMessage?.payload.suggestedGoals?.length &&
                !lastAssistantMessage?.payload.suggestedBundles?.length ? (
                  <p className="text-sm leading-6 text-slate-500">
                    If the assistant spots a better goal flow or a frequently bought bundle, it
                    will show up here.
                  </p>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
};

export default AssistantPage;
