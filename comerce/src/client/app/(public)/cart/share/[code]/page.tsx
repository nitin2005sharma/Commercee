"use client";

import SafeImage from "@/app/components/atoms/SafeImage";
import MainLayout from "@/app/components/templates/MainLayout";
import { useAuth } from "@/app/hooks/useAuth";
import useToast from "@/app/hooks/ui/useToast";
import { SOCKET_URL } from "@/app/lib/constants/config";
import { continueCheckoutFlow } from "@/app/lib/utils/checkoutFlow";
import {
  useAddSharedCartNoteMutation,
  useAssignSharedCartItemMutation,
  useGetSharedCartQuery,
  useInitiateSharedCartCheckoutMutation,
  useJoinSharedCartMutation,
  useRegenerateSharedCartInviteMutation,
  useReleaseSharedCartCheckoutMutation,
  useRemoveSharedCartItemMutation,
  useSendSharedCartMessageMutation,
  useUpdateSharedCartItemMutation,
  useUpdateSharedCartSettingsMutation,
  useVoteOnSharedCartItemMutation,
} from "@/app/store/apis/SharedCartApi";
import { generateProductPlaceholder } from "@/app/utils/placeholderImage";
import {
  BadgeCheck,
  Clock3,
  Copy,
  MessageCircleMore,
  Minus,
  Plus,
  RefreshCcw,
  Send,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  ThumbsDown,
  ThumbsUp,
  Unlock,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useEffect, useMemo, useRef, useState } from "react";

const formatCurrency = (value?: number) =>
  typeof value === "number" ? `$${value.toFixed(2)}` : "$0.00";

const ASSIGNMENT_OPTIONS = [
  { value: "CLAIMED", label: "Claimed" },
  { value: "PURCHASING", label: "Purchasing" },
  { value: "PURCHASED", label: "Purchased" },
  { value: "RELEASED", label: "Release" },
];

const SharedCartPage = () => {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { data, isLoading, refetch } = useGetSharedCartQuery(code);
  const [joinSharedCart] = useJoinSharedCartMutation();
  const [updateSharedCartItem, { isLoading: isUpdatingItem }] =
    useUpdateSharedCartItemMutation();
  const [removeSharedCartItem] = useRemoveSharedCartItemMutation();
  const [voteOnSharedCartItem] = useVoteOnSharedCartItemMutation();
  const [addSharedCartNote, { isLoading: isAddingNote }] =
    useAddSharedCartNoteMutation();
  const [sendSharedCartMessage, { isLoading: isSendingMessage }] =
    useSendSharedCartMessageMutation();
  const [assignSharedCartItem] = useAssignSharedCartItemMutation();
  const [updateSharedCartSettings, { isLoading: isSavingSettings }] =
    useUpdateSharedCartSettingsMutation();
  const [regenerateSharedCartInvite, { isLoading: isRegeneratingInvite }] =
    useRegenerateSharedCartInviteMutation();
  const [initiateSharedCartCheckout, { isLoading: isStartingCheckout }] =
    useInitiateSharedCartCheckoutMutation();
  const [releaseSharedCartCheckout, { isLoading: isReleasingCheckout }] =
    useReleaseSharedCartCheckoutMutation();

  const [displayName, setDisplayName] = useState(user?.name || "Collaborator");
  const [settings, setSettings] = useState({
    title: "",
    inviteMode: "COLLABORATE",
    isReadOnly: false,
    expiresAt: "",
  });
  const [chatInput, setChatInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const hasJoinedRef = useRef(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const sharedCart = data?.sharedCart;
  const summary = sharedCart?.summary;
  const isOwner = Boolean(user?.id && sharedCart?.ownerId === user.id);
  const checkoutStatus = summary?.checkout?.status || "IDLE";
  const isCheckoutLocked = Boolean(summary?.checkout?.isLocked);
  const isInteractionLocked =
    Boolean(sharedCart?.isReadOnly) ||
    isCheckoutLocked ||
    checkoutStatus === "COMPLETED";

  useEffect(() => {
    if (!sharedCart) {
      return;
    }

    setSettings({
      title: sharedCart.title || "",
      inviteMode: sharedCart.inviteMode || "COLLABORATE",
      isReadOnly: Boolean(sharedCart.isReadOnly),
      expiresAt: sharedCart.expiresAt
        ? new Date(sharedCart.expiresAt).toISOString().slice(0, 16)
        : "",
    });
  }, [sharedCart]);

  useEffect(() => {
    if (!code || hasJoinedRef.current) {
      return;
    }

    hasJoinedRef.current = true;
    joinSharedCart({ code, displayName }).catch(() => {
      hasJoinedRef.current = false;
    });
  }, [code, displayName, joinSharedCart]);

  useEffect(() => {
    if (!code) {
      return;
    }

    const socket: Socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socketRef.current = socket;
    socket.emit("joinSharedCart", code);

    const refresh = () => {
      refetch();
    };

    const handleTyping = ({ user: typingDisplayName }: { user: string }) => {
      if (!typingDisplayName || typingDisplayName === displayName) {
        return;
      }

      setTypingUser(typingDisplayName);

      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
      }

      typingIndicatorTimeoutRef.current = setTimeout(() => {
        setTypingUser(null);
      }, 1600);
    };

    const clearTyping = () => {
      setTypingUser(null);
    };

    socket.on("sharedCartUpdated", refresh);
    socket.on("sharedCartVoteUpdated", refresh);
    socket.on("sharedCartNoteAdded", refresh);
    socket.on("sharedCartPresenceUpdated", refresh);
    socket.on("sharedCartCheckoutUpdated", refresh);
    socket.on("sharedCartTyping", handleTyping);
    socket.on("sharedCartStopTyping", clearTyping);

    return () => {
      socket.off("sharedCartUpdated", refresh);
      socket.off("sharedCartVoteUpdated", refresh);
      socket.off("sharedCartNoteAdded", refresh);
      socket.off("sharedCartPresenceUpdated", refresh);
      socket.off("sharedCartCheckoutUpdated", refresh);
      socket.off("sharedCartTyping", handleTyping);
      socket.off("sharedCartStopTyping", clearTyping);
      socket.disconnect();
      socketRef.current = null;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
      }
    };
  }, [code, displayName, refetch]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sharedCart?.messages?.length]);

  const assignmentsByVariant = useMemo(() => {
    return (sharedCart?.assignments || []).reduce(
      (acc: Record<string, any[]>, assignment: any) => {
        if (!acc[assignment.variantId]) {
          acc[assignment.variantId] = [];
        }
        acc[assignment.variantId].push(assignment);
        return acc;
      },
      {}
    );
  }, [sharedCart?.assignments]);

  const itemNotesByVariant = useMemo(() => {
    return (sharedCart?.itemNotes || []).reduce(
      (acc: Record<string, any[]>, note: any) => {
        if (!note.variantId) {
          return acc;
        }

        if (!acc[note.variantId]) {
          acc[note.variantId] = [];
        }

        acc[note.variantId].push(note);
        return acc;
      },
      {}
    );
  }, [sharedCart?.itemNotes]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/cart/share/${sharedCart?.code || code}`
      );
      showToast("Invite link copied", "success");
    } catch {
      showToast("Could not copy the invite link", "error");
    }
  };

  const handleDisplayNameBlur = async () => {
    if (!code || !displayName.trim()) {
      return;
    }

    try {
      await joinSharedCart({ code, displayName }).unwrap();
    } catch {
      showToast("Could not update your collaborator name", "error");
    }
  };

  const handleQuantityChange = async (variantId: string, quantity: number) => {
    try {
      await updateSharedCartItem({
        code,
        variantId,
        quantity,
        displayName,
      }).unwrap();
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to update shared cart";
      showToast(message, "error");
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeSharedCartItem({ code, itemId, displayName }).unwrap();
      showToast("Item removed from shared cart", "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to remove item";
      showToast(message, "error");
    }
  };

  const handleVote = async (
    variantId: string,
    vote: "UPVOTE" | "DOWNVOTE"
  ) => {
    try {
      await voteOnSharedCartItem({
        code,
        variantId,
        vote,
        displayName,
      }).unwrap();
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to save vote";
      showToast(message, "error");
    }
  };

  const handleAddNote = async (variantId?: string, content?: string) => {
    const nextContent = (content || "").trim();

    if (!nextContent) {
      return;
    }

    try {
      await addSharedCartNote({
        code,
        content: nextContent,
        variantId,
        displayName,
      }).unwrap();
      showToast("Note added to shared cart", "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to add note";
      showToast(message, "error");
    }
  };

  const handleAssignment = async (
    variantId: string,
    quantity: number,
    status: "CLAIMED" | "PURCHASING" | "PURCHASED" | "RELEASED"
  ) => {
    try {
      await assignSharedCartItem({
        code,
        variantId,
        quantity,
        status,
        displayName,
      }).unwrap();
      showToast("Ownership updated", "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to update ownership";
      showToast(message, "error");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSharedCartSettings({
        code,
        title: settings.title || undefined,
        inviteMode: settings.inviteMode as "COLLABORATE" | "VIEW_ONLY",
        isReadOnly: settings.isReadOnly,
        expiresAt: settings.expiresAt
          ? new Date(settings.expiresAt).toISOString()
          : null,
        displayName,
      }).unwrap();
      showToast("Shared cart settings updated", "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to save settings";
      showToast(message, "error");
    }
  };

  const handleRegenerateInvite = async () => {
    try {
      const result = await regenerateSharedCartInvite({
        code,
        displayName,
      }).unwrap();
      showToast("Invite link regenerated", "success");
      router.replace(`/cart/share/${result.sharedCart.code}`);
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to regenerate invite";
      showToast(message, "error");
    }
  };

  const emitTyping = () => {
    if (!socketRef.current || !displayName.trim()) {
      return;
    }

    socketRef.current.emit("sharedCartTyping", {
      code,
      user: displayName.trim(),
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("sharedCartStopTyping", { code });
    }, 900);
  };

  const handleSendMessage = async () => {
    const content = chatInput.trim();

    if (!content) {
      return;
    }

    try {
      await sendSharedCartMessage({
        code,
        content,
        displayName,
      }).unwrap();
      setChatInput("");
      socketRef.current?.emit("sharedCartStopTyping", { code });
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to send message";
      showToast(message, "error");
    }
  };

  const handleStartCheckout = async () => {
    try {
      const session = await initiateSharedCartCheckout({
        code,
        displayName,
      }).unwrap();
      await continueCheckoutFlow(session, router);
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to start shared checkout";
      showToast(message, "error");
    }
  };

  const handleReleaseCheckout = async () => {
    try {
      await releaseSharedCartCheckout({
        code,
        displayName,
      }).unwrap();
      showToast("Checkout lock released", "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to release checkout lock";
      showToast(message, "error");
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_35%),linear-gradient(135deg,#0f172a,_#1e293b_55%,#334155)] p-6 text-white">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                  Live shopping room
                </span>
                {summary?.readyToBuy ? (
                  <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-slate-950">
                    Ready to buy
                  </span>
                ) : null}
                {checkoutStatus === "IN_PROGRESS" ? (
                  <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-slate-950">
                    Checkout in progress
                  </span>
                ) : null}
                {checkoutStatus === "COMPLETED" ? (
                  <span className="rounded-full bg-sky-300 px-3 py-1 text-xs font-semibold text-slate-950">
                    Checked out
                  </span>
                ) : null}
                {sharedCart?.isReadOnly ? (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-slate-100">
                    Read only
                  </span>
                ) : null}
                {summary?.invite?.expiresAt ? (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-slate-100">
                    Expires {new Date(summary.invite.expiresAt).toLocaleDateString()}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-semibold">
                {sharedCart?.title || "Coordinate the final decision together"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Chat in real time, claim items, keep the group on budget, and let
                one owner complete the final purchase when the room is ready.
              </p>

              {sharedCart?.goalBundle ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  <p className="font-semibold text-white">
                    Built from saved bundle: {sharedCart.goalBundle.name || "Saved plan"}
                  </p>
                  <p className="mt-2 leading-6">
                    Bundle budget {formatCurrency(sharedCart.goalBundle.budget)} with{" "}
                    {formatCurrency(sharedCart.goalBundle.remainingBudget)} left in the
                    original plan.
                  </p>
                </div>
              ) : null}

              {checkoutStatus === "IN_PROGRESS" ? (
                <div className="mt-4 rounded-2xl border border-amber-200/40 bg-amber-300/15 p-4 text-sm text-amber-100">
                  <p className="font-semibold text-white">
                    {summary?.checkout?.startedByName || "Someone"} is at the checkout
                    step right now.
                  </p>
                  <p className="mt-2 leading-6">
                    Item edits are frozen so the order does not drift while payment
                    is being completed.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                <Copy size={16} />
                Copy invite link
              </button>
              <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm">
                Code: <span className="font-semibold">{sharedCart?.code || code}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Group total
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {formatCurrency(summary?.subtotal)}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Unresolved items
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {summary?.unresolvedItems || 0}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Shared budget
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {summary?.budget
                  ? `${summary.budget.utilization.toFixed(0)}%`
                  : "Open"}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                People shopping
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {sharedCart?.members?.length || 0}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <label className="text-sm font-medium text-slate-700">
              Your name in the room
            </label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              onBlur={handleDisplayNameBlur}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="Add your display name"
            />
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Users size={16} />
              People here
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(sharedCart?.members || []).map((member: any) => (
                <span
                  key={member.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {member.displayName} - {member.role.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                Loading shared cart...
              </div>
            ) : sharedCart?.cart?.cartItems?.length ? (
              sharedCart.cart.cartItems.map((item: any) => {
                const votes = summary?.voteSummary?.[item.variantId] || {
                  upvotes: 0,
                  downvotes: 0,
                };
                const assignments = assignmentsByVariant[item.variantId] || [];
                const itemNotes = itemNotesByVariant[item.variantId] || [];

                return (
                  <div
                    key={item.id}
                    className="rounded-[2rem] border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                      <div className="h-28 w-28 overflow-hidden rounded-3xl bg-slate-100">
                        {item.variant.images?.[0] ? (
                          <SafeImage
                            src={item.variant.images[0]}
                            fallbackSrc={generateProductPlaceholder(
                              item.variant.product.name
                            )}
                            alt={item.variant.product.name}
                            width={112}
                            height={112}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-500">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="text-xl font-semibold text-slate-900">
                              {item.variant.product.name}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                              {item.variant.sku}
                            </p>
                          </div>
                          <p className="text-lg font-semibold text-slate-900">
                            {formatCurrency(item.variant.price)}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.variantId,
                                Math.max(item.quantity - 1, 0)
                              )
                            }
                            disabled={isInteractionLocked}
                            className="rounded-full border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item.variantId, item.quantity + 1)
                            }
                            disabled={isUpdatingItem || isInteractionLocked}
                            className="rounded-full border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={isInteractionLocked}
                            className="ml-2 text-sm font-medium text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                Ownership and buying status
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Track who is taking this line and where it stands.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {ASSIGNMENT_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() =>
                                    handleAssignment(
                                      item.variantId,
                                      item.quantity,
                                      option.value as
                                        | "CLAIMED"
                                        | "PURCHASING"
                                        | "PURCHASED"
                                        | "RELEASED"
                                    )
                                  }
                                  disabled={isInteractionLocked}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {assignments.length ? (
                              assignments.map((assignment: any) => (
                                <span
                                  key={assignment.id}
                                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
                                >
                                  {assignment.assigneeName} - {assignment.status.toLowerCase()} -
                                  {" "}
                                  {assignment.quantity}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                                Nobody has claimed this yet
                              </span>
                            )}
                          </div>

                          {itemNotes.length ? (
                            <div className="mt-4 space-y-2">
                              {itemNotes.slice(0, 2).map((note: any) => (
                                <div
                                  key={note.id}
                                  className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700"
                                >
                                  <p className="font-semibold text-slate-900">
                                    {note.authorName}
                                  </p>
                                  <p className="mt-1 leading-6">{note.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-3 rounded-3xl bg-slate-50 p-4 lg:w-56">
                        <div className="flex items-center justify-between text-sm text-slate-700">
                          <button
                            onClick={() => handleVote(item.variantId, "UPVOTE")}
                            disabled={isInteractionLocked}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ThumbsUp size={14} />
                            {votes.upvotes}
                          </button>
                          <button
                            onClick={() => handleVote(item.variantId, "DOWNVOTE")}
                            disabled={isInteractionLocked}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ThumbsDown size={14} />
                            {votes.downvotes}
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            handleAddNote(
                              item.variantId,
                              `For ${item.variant.product.name}, I think we should compare fit, timing, and whether this is still the best use of the budget.`
                            )
                          }
                          disabled={isInteractionLocked || isAddingNote}
                          className="w-full rounded-2xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Add item note
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                This shared cart is empty right now.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ShoppingBag size={16} />
                Shared checkout
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                {checkoutStatus === "IN_PROGRESS" ? (
                  <>
                    <p className="font-semibold text-slate-900">
                      {summary?.checkout?.startedByName || "Someone"} is checking out now
                    </p>
                    <p className="mt-2 leading-6">
                      The cart is frozen so the final payment step reflects the
                      same decision everyone agreed on.
                    </p>
                  </>
                ) : checkoutStatus === "COMPLETED" ? (
                  <>
                    <p className="font-semibold text-slate-900">
                      This room already completed checkout
                    </p>
                    <p className="mt-2 leading-6">
                      You can still review the decisions and chat history, but the
                      purchasable flow is finished.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-slate-900">
                      One owner finishes the final purchase
                    </p>
                    <p className="mt-2 leading-6">
                      Everyone can collaborate here, but the owner places the final
                      order once the room is ready.
                    </p>
                  </>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {isAuthenticated ? (
                  isOwner ? (
                    checkoutStatus === "IN_PROGRESS" ? (
                      <button
                        onClick={handleReleaseCheckout}
                        disabled={isReleasingCheckout}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Unlock size={16} />
                        {isReleasingCheckout ? "Releasing..." : "Release checkout lock"}
                      </button>
                    ) : (
                      <button
                        onClick={handleStartCheckout}
                        disabled={
                          isStartingCheckout || !summary?.canProceedToCheckout
                        }
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <ShoppingCart size={16} />
                        {isStartingCheckout
                          ? "Starting checkout..."
                          : "Proceed to checkout together"}
                      </button>
                    )
                  ) : (
                    <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      Only the shared-cart owner can place the final order, but
                      you can keep collaborating here.
                    </div>
                  )
                ) : (
                  <Link
                    href="/sign-in"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Sign in to checkout
                  </Link>
                )}
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span>Every item has an owner</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {summary?.unresolvedItems ? `${summary.unresolvedItems} open` : "Done"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span>Budget is still healthy</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {summary?.budget?.overBy
                      ? `Over by ${formatCurrency(summary.budget.overBy)}`
                      : "On track"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span>Group has a clear favorite</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {summary?.pollWinner?.productName || "Not yet"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <MessageCircleMore size={16} />
                Room chat
              </div>

              <div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-3">
                {(sharedCart?.messages || []).map((message: any) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl px-3 py-2 text-sm ${
                      message.authorName === displayName
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        message.authorName === displayName
                          ? "text-white"
                          : "text-slate-900"
                      }`}
                    >
                      {message.authorName}
                    </p>
                    <p className="mt-1 leading-6">{message.content}</p>
                    <p
                      className={`mt-2 text-xs ${
                        message.authorName === displayName
                          ? "text-slate-300"
                          : "text-slate-400"
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                {!sharedCart?.messages?.length ? (
                  <p className="text-sm text-slate-500">
                    Start the conversation here so it feels like the group is
                    shopping in the same room.
                  </p>
                ) : null}
                <div ref={chatBottomRef} />
              </div>

              <div className="mt-3 min-h-5 text-xs font-medium text-slate-500">
                {typingUser ? `${typingUser} is typing...` : " "}
              </div>

              <div className="mt-2 flex gap-2">
                <textarea
                  value={chatInput}
                  onChange={(event) => {
                    setChatInput(event.target.value);
                    emitTyping();
                  }}
                  rows={3}
                  className="min-h-[96px] flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  placeholder="Talk through options, timing, budget, and who is buying what."
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSendingMessage || !chatInput.trim()}
                  className="inline-flex h-fit items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <BadgeCheck size={16} />
                Decision dashboard
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Budget pulse</p>
                  {summary?.budget ? (
                    <>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{
                            width: `${Math.min(summary.budget.utilization, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-3">
                        Target {formatCurrency(summary.budget.target)} - Remaining{" "}
                        {formatCurrency(summary.budget.remaining)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2">No bundle budget is attached to this cart yet.</p>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Shortlist</p>
                  <div className="mt-3 space-y-2">
                    {(summary?.shortlist || []).map((entry: any) => (
                      <div
                        key={entry.variantId}
                        className="flex items-center justify-between rounded-2xl bg-white px-3 py-2"
                      >
                        <span className="text-sm text-slate-700">
                          {entry.productName}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Net {entry.netVotes}
                        </span>
                      </div>
                    ))}
                    {!summary?.shortlist?.length ? (
                      <p className="text-sm text-slate-500">
                        Vote on items to let the shortlist emerge.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Member subtotals</p>
                  <div className="mt-3 space-y-2">
                    {(summary?.memberSubtotals || []).map((entry: any) => (
                      <div
                        key={entry.assigneeName}
                        className="flex items-center justify-between rounded-2xl bg-white px-3 py-2"
                      >
                        <span>{entry.assigneeName}</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(entry.total)}
                        </span>
                      </div>
                    ))}
                    {!summary?.memberSubtotals?.length ? (
                      <p className="text-sm text-slate-500">
                        Once people claim items, their subtotals will appear here.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Clock3 size={16} />
                Activity feed
              </div>
              <div className="mt-4 space-y-3">
                {(sharedCart?.activities || []).map((activity: any) => (
                  <div
                    key={activity.id}
                    className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700"
                  >
                    <p className="font-semibold text-slate-900">
                      {activity.actorName || "A collaborator"}
                    </p>
                    <p className="mt-1 leading-6">{activity.message}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
                {!sharedCart?.activities?.length ? (
                  <p className="text-sm text-slate-500">
                    Votes, ownership changes, and checkout state changes will appear here.
                  </p>
                ) : null}
              </div>
            </div>

            {isOwner ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Settings2 size={16} />
                  Invite controls
                </div>
                <div className="mt-4 space-y-4">
                  <input
                    value={settings.title}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Shared cart title"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <select
                      value={settings.inviteMode}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          inviteMode: event.target.value,
                        }))
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="COLLABORATE">Collaborate</option>
                      <option value="VIEW_ONLY">View only</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={settings.expiresAt}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          expiresAt: event.target.value,
                        }))
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>
                  <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={settings.isReadOnly}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          isReadOnly: event.target.checked,
                        }))
                      }
                    />
                    Freeze this cart in read-only mode
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isSavingSettings ? "Saving..." : "Save controls"}
                    </button>
                    <button
                      onClick={handleRegenerateInvite}
                      disabled={isRegeneratingInvite}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCcw size={16} />
                      {isRegeneratingInvite ? "Regenerating..." : "Regenerate link"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SharedCartPage;
