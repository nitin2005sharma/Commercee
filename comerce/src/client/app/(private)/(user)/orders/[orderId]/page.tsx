"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import MainLayout from "@/app/components/templates/MainLayout";
import ShippingAddressCard from "../ShippingAddressCard";
import OrderSummary from "../OrderSummary";
import OrderStatus from "../OrderStatus";
import OrderItems from "../OrderItems";
import OrderCompanionCard from "../OrderCompanionCard";
import GoalSuccessTrackerCard from "../GoalSuccessTrackerCard";
import { useGetOrderQuery } from "@/app/store/apis/OrderApi";
import CustomLoader from "@/app/components/feedback/CustomLoader";
import { useAuth } from "@/app/hooks/useAuth";
import { SOCKET_URL } from "@/app/lib/constants/config";

const OrderTrackingPage = () => {
  const params = useParams();
  const orderId = Array.isArray(params?.orderId)
    ? params.orderId[0]
    : params?.orderId;
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useGetOrderQuery(orderId, {
    skip: !orderId,
  });
  const order = data?.order;

  useEffect(() => {
    if (!user?.id || !orderId) {
      return;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.emit("joinUserOrders", user.id);

    socket.on("orderUpdated", (payload) => {
      if (!payload?.orderId || payload.orderId === orderId) {
        refetch();
      }
    });

    return () => {
      socket.off("orderUpdated");
      socket.disconnect();
    };
  }, [orderId, refetch, user?.id]);

  if (isLoading) {
    return (
      <MainLayout>
        <CustomLoader />
      </MainLayout>
    );
  }
  if (error || !order)
    return <div>Error loading order or order not found.</div>;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <OrderItems order={order} />

          <div className="col-span-2 space-y-6">
            <OrderStatus order={order} />

            <OrderSummary order={order} />

            <GoalSuccessTrackerCard order={order} />

            <OrderCompanionCard order={order} />
          </div>

          <ShippingAddressCard order={order} />
        </div>
      </div>
    </MainLayout>
  );
};

export default OrderTrackingPage;
