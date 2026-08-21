import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

interface WebRTCCallProps {
  chatId: string;
  socket: Socket | null;
}

export const useWebRTCCall = ({ chatId, socket }: WebRTCCallProps) => {
  const [callStatus, setCallStatus] = useState<
    "idle" | "calling" | "in-call" | "ended"
  >("idle");

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const teardownCallResources = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }

    remoteSocketIdRef.current = null;
    pendingIceCandidatesRef.current = [];
  };

  const attachMediaElements = () => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }

    if (audioRef.current && remoteStreamRef.current) {
      audioRef.current.srcObject = remoteStreamRef.current;
    }
  };

  const flushPendingIceCandidates = () => {
    if (!socket || !remoteSocketIdRef.current) {
      return;
    }

    pendingIceCandidatesRef.current.forEach((candidate) => {
      socket.emit("iceCandidate", {
        chatId,
        candidate,
        to: remoteSocketIdRef.current,
      });
    });

    pendingIceCandidatesRef.current = [];
  };

  const setupPeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnectionRef.current = peerConnection;
    remoteStreamRef.current = new MediaStream();

    localStreamRef.current?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current!);
    });

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current?.addTrack(track);
      });
      attachMediaElements();
    };

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      const candidate = event.candidate.toJSON();

      if (socket && remoteSocketIdRef.current) {
        socket.emit("iceCandidate", {
          chatId,
          candidate,
          to: remoteSocketIdRef.current,
        });
      } else {
        pendingIceCandidatesRef.current.push(candidate);
      }
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === "connected") {
        setCallStatus("in-call");
      }

      if (
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "disconnected"
      ) {
        cleanupCall(false);
      }
    };

    attachMediaElements();

    return peerConnection;
  };

  const cleanupCall = (notifyPeer: boolean) => {
    if (notifyPeer && socket && remoteSocketIdRef.current) {
      socket.emit("endCall", { chatId });
    }

    teardownCallResources();

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    setCallStatus("ended");
    resetTimerRef.current = setTimeout(() => setCallStatus("idle"), 1000);
  };

  const startCall = async () => {
    if (!socket || callStatus !== "idle") {
      return;
    }

    try {
      setCallStatus("calling");
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      attachMediaElements();

      const peerConnection = setupPeerConnection();
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("callOffer", { chatId, offer });
    } catch (error) {
      console.error("Failed to start call:", error);
      cleanupCall(false);
    }
  };

  const answerCall = async (offer: RTCSessionDescriptionInit, from: string) => {
    if (!socket) {
      return;
    }

    try {
      remoteSocketIdRef.current = from;
      setCallStatus("calling");
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      attachMediaElements();

      const peerConnection = setupPeerConnection();

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("callAnswer", { chatId, answer, to: from });
      flushPendingIceCandidates();
    } catch (error) {
      console.error("Failed to answer call:", error);
      cleanupCall(false);
    }
  };

  const endCall = () => {
    cleanupCall(true);
  };

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleOffer = ({ offer, from }) => {
      if (callStatus === "idle") {
        answerCall(offer, from);
      }
    };

    const handleAnswer = async ({ answer, from }) => {
      if (peerConnectionRef.current && callStatus === "calling") {
        if (from) {
          remoteSocketIdRef.current = from;
        }

        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        flushPendingIceCandidates();
      }
    };

    const handleIceCandidate = async ({ candidate, from }) => {
      if (from && !remoteSocketIdRef.current) {
        remoteSocketIdRef.current = from;
      }

      if (peerConnectionRef.current && candidate) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    };

    const handleCallEnded = () => {
      cleanupCall(false);
    };

    socket.on("callOffer", handleOffer);
    socket.on("callAnswer", handleAnswer);
    socket.on("iceCandidate", handleIceCandidate);
    socket.on("callEnded", handleCallEnded);

    return () => {
      socket.off("callOffer", handleOffer);
      socket.off("callAnswer", handleAnswer);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("callEnded", handleCallEnded);
    };
  }, [socket, callStatus]);

  useEffect(() => {
    attachMediaElements();
  }, [callStatus]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      teardownCallResources();
    };
  }, []);

  return {
    callStatus,
    startCall,
    endCall,
    audioRef,
    localVideoRef,
    remoteVideoRef,
  };
};
