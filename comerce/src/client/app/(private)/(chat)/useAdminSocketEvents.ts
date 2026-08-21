import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/app/lib/constants/config";

export const useAdminSocketEvents = (
  onChatCreated: () => void,
  onChatStatusUpdated: () => void
) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    const joinAdmin = () => {
      socketRef.current?.emit("joinAdmin");
    };

    socketRef.current.on("connect", joinAdmin);
    if (socketRef.current.connected) {
      joinAdmin();
    }

    // Listen for admin events
    socketRef.current.on("chatCreated", (newChat) => {
      console.log("New chat created:", newChat);
      onChatCreated();
    });

    socketRef.current.on("chatStatusUpdated", (updatedChat) => {
      console.log("Chat status updated:", updatedChat);
      onChatStatusUpdated();
    });

    // Clean up on component unmount
    return () => {
      socketRef.current?.off("connect", joinAdmin);
      socketRef.current?.off("chatCreated");
      socketRef.current?.off("chatStatusUpdated");
      socketRef.current?.disconnect();
    };
  }, [onChatCreated, onChatStatusUpdated]);

  return socketRef.current;
};
