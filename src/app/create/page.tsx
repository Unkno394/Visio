"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatPanel } from "../../components/ChatPanel";
import { MicOff, Smile } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  role: "admin" | "member";
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isChatBlocked?: boolean;
  stream?: MediaStream;
  joinOrder?: number;
}

interface Reaction {
  id: string;
  emoji: string;
  x: number; // percentage
  y: number; // percentage
  scale: number;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  emoji?: string;
}

interface InitMessage {
  type: "init";
  peerId: string;
  roomId: string;
  role?: "admin" | "member";
  participants: { peerId: string; name: string; role?: "admin" | "member" }[];
}

type SignalMessage =
  | InitMessage
  | { type: "peer-joined"; peerId: string; name?: string; role?: "admin" | "member" }
  | { type: "peer-left"; peerId: string }
  | {
      type: "admin-command";
      targetId: string;
      action: "mute-audio" | "mute-video" | "ban" | "chat-off" | "chat-on";
    }
  | {
      type: "offer" | "answer";
      from: string;
      name?: string;
      role?: "admin" | "member";
      sdp: RTCSessionDescriptionInit;
    }
  | { type: "ice-candidate"; from: string; candidate: RTCIceCandidateInit }
  | {
      type: "chat";
      from: string;
      name?: string;
      role?: "admin" | "member";
      text: string;
      timestamp: number;
    }
  | { type: "reaction"; emoji: string }
  | { type: "media-state"; from: string; isAudioMuted?: boolean; isVideoOff?: boolean };

const iceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
];

if (process.env.NEXT_PUBLIC_TURN_URL) {
  iceServers.push({
    urls: process.env.NEXT_PUBLIC_TURN_URL,
    username: process.env.NEXT_PUBLIC_TURN_USER,
    credential: process.env.NEXT_PUBLIC_TURN_PASS,
  });
}

const iceConfig: RTCConfiguration = { iceServers };

function VideoTile({
  participant,
  isLocal = false,
  totalCount,
}: {
  participant: Participant;
  isLocal?: boolean;
  totalCount: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const hasActiveVideo =
    !!participant.stream &&
    !participant.isVideoOff &&
    participant.stream
      .getVideoTracks()
      .some((track) => track.enabled && track.readyState === "live");

  const showPlaceholder = !hasActiveVideo;

  const getVideoSizeClass = (count: number) => {
    if (count <= 4) return "h-full";
    if (count <= 9) return "h-64";
    return "h-48";
  };

  return (
    <div className="relative bg-gray-800 rounded-2xl overflow-hidden group hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-white/10">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full ${getVideoSizeClass(totalCount)} object-cover ${
          showPlaceholder ? "hidden" : ""
        }`}
      />

      {showPlaceholder && (
        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <span className="text-white text-2xl font-bold">
                {participant.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <p className="text-white font-semibold">{participant.name}</p>
            <p className="text-white/60 text-sm mt-1">Камера выключена</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 border border-white/20">
        <div className="flex items-center gap-2">
          {participant.isAudioMuted && (
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
          <span className="text-white text-sm font-medium">
            {participant.name} {isLocal && "(Вы)"}
          </span>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex gap-2">
        {participant.isAudioMuted && !isLocal && (
          <div className="bg-red-500 rounded-lg px-2 py-1 backdrop-blur-md border border-white/20">
            <MicOff className="w-3 h-3 text-white" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isChatOpenRef = useRef(false);
  const [displayName, setDisplayName] = useState("Вы");
  const [nameInput, setNameInput] = useState("");
  const [hasName, setHasName] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-1",
      userId: "system",
      userName: "Система",
      text: "Добро пожаловать! Позовите друга по ID комнаты и начните общение.",
      timestamp: new Date(),
    },
  ]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatBlocked, setIsChatBlocked] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false);
  const [assignedRole, setAssignedRole] = useState<"admin" | "member" | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const clientIdRef = useRef<string | null>(null);
  const peerNamesRef = useRef<Map<string, string>>(new Map());
  const chatBlockedRef = useRef<Map<string, boolean>>(new Map());
  const nextJoinOrderRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedName = localStorage.getItem("visio-display-name");
    if (storedName) {
      setNameInput(storedName);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentRoom = searchParams.get("roomId");
    const banKey = currentRoom ? `visio-ban-${currentRoom}` : null;
    if (banKey && sessionStorage.getItem(banKey) === "1") {
      setIsBanned(true);
    }
    if (currentRoom) {
      setRoomId(currentRoom);
      return;
    }

    const cryptoApi = typeof crypto !== "undefined" ? crypto : null;
    const random =
      cryptoApi && typeof cryptoApi.randomUUID === "function"
        ? cryptoApi.randomUUID()
        : (() => {
            if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
              return Array.from(cryptoApi.getRandomValues(new Uint8Array(8)))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
            }
            return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
      })();
    const newRoomId = random.slice(0, 8).toUpperCase();
    const url = new URL(window.location.href);
    url.searchParams.set("roomId", newRoomId);
    router.replace(url.pathname + url.search);
    setRoomId(newRoomId);
    setIsAdmin(true);
    setAssignedRole("admin");
  }, [router, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!roomId) return;
    const roomName = sessionStorage.getItem(`visio-room-name-${roomId}`);
    if (roomName) {
      setDisplayName(roomName);
      setHasName(true);
      setIsLoading(true);
    } else {
      setHasName(false);
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!roomId) return;
    const stored = sessionStorage.getItem(`visio-chat-blocks-${roomId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        chatBlockedRef.current = new Map(Object.entries(parsed));
      } catch {
        chatBlockedRef.current = new Map();
      }
    } else {
      chatBlockedRef.current = new Map();
    }

    const storedRole = sessionStorage.getItem(`visio-role-${roomId}`) as
      | "admin"
      | "member"
      | null;
    if (storedRole) {
      setIsAdmin(storedRole === "admin");
      setAssignedRole(storedRole);
    }
  }, [roomId]);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  const cleanupConnections = useCallback(() => {
    socketRef.current?.close();
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const sendSignal = useCallback((payload: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      console.warn("[ws] cannot send, socket not open", socketRef.current?.readyState);
    }
  }, []);

  const attachLocalStream = useCallback(
    (stream: MediaStream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      console.log("[media] attach local stream", {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
      });

      setParticipants((prev) => {
        const others = prev.filter((p) => p.id !== "local");
        return [
          {
            id: "local",
            name: displayName,
            role: isAdmin ? "admin" : assignedRole || "member",
            isAudioMuted,
            isVideoOff,
            joinOrder: 0,
            stream,
          },
          ...others,
        ];
      });
      nextJoinOrderRef.current = Math.max(nextJoinOrderRef.current, 1);
    },
    [assignedRole, displayName, isAdmin, isAudioMuted, isVideoOff]
  );

  const ensureLocalTracks = useCallback(() => {
    const localStream = localStreamRef.current;
    if (!localStream) return;
    peerConnections.current.forEach((connection) => {
      const senderTrackIds = connection.getSenders().map((s) => s.track?.id);
      localStream.getTracks().forEach((track) => {
        if (!senderTrackIds.includes(track.id)) {
          connection.addTrack(track, localStream);
        }
      });
    });
  }, []);

  const createPeerConnection = useCallback(
    (peerId: string) => {
      const existing = peerConnections.current.get(peerId);
      if (existing) return existing;

      const connection = new RTCPeerConnection(iceConfig);
      console.log("[webrtc] create peer connection", peerId);
      peerConnections.current.set(peerId, connection);

      const localStream = localStreamRef.current;
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          connection.addTrack(track, localStream);
        });
      }

      connection.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: "ice-candidate",
            targetId: peerId,
            candidate: event.candidate,
          });
        } else {
          console.log("[webrtc] ice-candidate null", peerId);
        }
      };

      connection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        const name = peerNamesRef.current.get(peerId) || "Участник";
        console.log("[webrtc] ontrack", peerId, {
          audioTracks: remoteStream?.getAudioTracks().length,
          videoTracks: remoteStream?.getVideoTracks().length,
        });
        setParticipants((prev) => {
          const others = prev.filter((p) => p.id !== peerId);
          const existing = prev.find((p) => p.id === peerId);
          return [
            ...others,
            {
              id: peerId,
              name,
              role: existing?.role || "member",
              isAudioMuted: existing?.isAudioMuted ?? false,
              isVideoOff: existing?.isVideoOff ?? false,
              isChatBlocked:
                chatBlockedRef.current.get(peerId) ??
                existing?.isChatBlocked ??
                false,
              stream: remoteStream,
            },
          ];
        });
      };

      connection.onconnectionstatechange = () => {
        if (
          connection.connectionState === "failed" ||
          connection.connectionState === "disconnected"
        ) {
          connection.restartIce?.();
        }
        console.log("[webrtc] state", peerId, connection.connectionState, {
          ice: connection.iceConnectionState,
        });
      };

      return connection;
    },
    [sendSignal]
  );

  const createAndSendOffer = useCallback(
    async (connection: RTCPeerConnection, peerId: string) => {
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      sendSignal({ type: "offer", targetId: peerId, sdp: offer });
      console.log("[webrtc] sent offer to", peerId);
    },
    [sendSignal]
  );

  const handleInit = useCallback(
    async (message: InitMessage) => {
      clientIdRef.current = message.peerId;
      setIsConnected(true);
      const resolvedRole: "admin" | "member" =
        message.role || (message.participants.length === 0 ? "admin" : "member");
      setIsAdmin(resolvedRole === "admin");
      setAssignedRole(resolvedRole);
      if (roomId) {
        sessionStorage.setItem(`visio-role-${roomId}`, resolvedRole);
      }
      setParticipants((prev) =>
        prev.map((p) => (p.id === "local" ? { ...p, role: resolvedRole } : p))
      );
      if (resolvedRole === "admin") {
        nextJoinOrderRef.current = Math.max(nextJoinOrderRef.current, 1);
      }
      console.log("[ws] init", {
        peerId: message.peerId,
        participants: message.participants.length,
        roomId: message.roomId,
      });

      peerNamesRef.current.set("local", displayName);
      message.participants.forEach((p) => {
        peerNamesRef.current.set(p.peerId, p.name || "Участник");
      });

      let joinCounter = nextJoinOrderRef.current || 1;
      const remoteParticipants: Participant[] = message.participants.map((p) => {
        const storedBlocked =
          chatBlockedRef.current.get(p.peerId) ?? false;
        return {
          id: p.peerId,
          name: p.name || "Участник",
          role: p.role || "member",
          isAudioMuted: false,
          isVideoOff: false,
          isChatBlocked: storedBlocked,
          joinOrder: joinCounter++,
        };
      });
      nextJoinOrderRef.current = joinCounter;

      setParticipants((prev) => {
        const local = prev.find((p) => p.id === "local");
        const localParticipant = local ? { ...local, role: resolvedRole } : null;
        return localParticipant ? [localParticipant, ...remoteParticipants] : remoteParticipants;
      });

      await Promise.all(
        message.participants.map(async (peer) => {
          const connection = createPeerConnection(peer.peerId);
          await createAndSendOffer(connection, peer.peerId);
        })
      );

      setIsLoading(false);
    },
    [createAndSendOffer, createPeerConnection, displayName]
  );

  const handleOffer = useCallback(
    async (message: Extract<SignalMessage, { type: "offer" }>) => {
      const connection = createPeerConnection(message.from);
      ensureLocalTracks();
      peerNamesRef.current.set(message.from, message.name || "Участник");

      if (!connection.currentRemoteDescription) {
        await connection.setRemoteDescription(message.sdp);
      }

      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      sendSignal({
        type: "answer",
        targetId: message.from,
        sdp: answer,
      });
      console.log("[webrtc] sent answer to", message.from);
    },
    [createPeerConnection, sendSignal]
  );

  const handleAnswer = useCallback(
    async (message: Extract<SignalMessage, { type: "answer" }>) => {
      const connection = peerConnections.current.get(message.from);
      if (connection && !connection.currentRemoteDescription) {
        await connection.setRemoteDescription(message.sdp);
        console.log("[webrtc] set remote answer from", message.from);
      }
    },
    []
  );

  const handleIceCandidate = useCallback(
    async (message: Extract<SignalMessage, { type: "ice-candidate" }>) => {
      const connection = peerConnections.current.get(message.from);
      if (connection && message.candidate) {
        try {
          await connection.addIceCandidate(message.candidate);
          console.log("[webrtc] added ice from", message.from);
        } catch (error) {
          console.error("Failed to add ICE candidate", error);
        }
      }
    },
    []
  );

  const handleSignal = useCallback(
    async (message: SignalMessage) => {
      switch (message.type) {
        case "init":
          await handleInit(message);
          break;
        case "peer-joined":
          peerNamesRef.current.set(
            message.peerId,
            message.name || "Участник"
          );
          ensureLocalTracks();
          setParticipants((prev) => {
            if (prev.some((p) => p.id === message.peerId)) return prev;
            return [
              ...prev,
              {
                id: message.peerId,
                name: message.name || "Участник",
                role: message.role || "member",
                isAudioMuted: false,
                isVideoOff: false,
                isChatBlocked:
                  chatBlockedRef.current.get(message.peerId) ?? false,
                joinOrder: nextJoinOrderRef.current++,
              },
            ];
          });
          break;
        case "peer-left": {
          const connection = peerConnections.current.get(message.peerId);
          connection?.close();
          peerConnections.current.delete(message.peerId);
          if (roomId) {
            chatBlockedRef.current.delete(message.peerId);
            sessionStorage.setItem(
              `visio-chat-blocks-${roomId}`,
              JSON.stringify(Object.fromEntries(chatBlockedRef.current))
            );
          }
          setParticipants((prev) =>
            prev.filter((p) => p.id !== message.peerId)
          );
          break;
        }
        case "admin-command": {
          const targetId = message.targetId;
          const localPeerId = clientIdRef.current;
          const isForMe = targetId === localPeerId;

          if (isForMe) {
            if (message.action === "mute-audio") {
              localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
              setIsAudioMuted(true);
              setParticipants((prev) =>
                prev.map((p) =>
                  p.id === "local" ? { ...p, isAudioMuted: true } : p
                )
              );
            }
            if (message.action === "mute-video") {
              localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = false));
              setIsVideoOff(true);
              setParticipants((prev) =>
                prev.map((p) =>
                  p.id === "local" ? { ...p, isVideoOff: true } : p
                )
              );
            }
            if (message.action === "chat-off") {
              chatBlockedRef.current.set("local", true);
              if (roomId) {
                sessionStorage.setItem(
                  `visio-chat-blocks-${roomId}`,
                  JSON.stringify(Object.fromEntries(chatBlockedRef.current))
                );
              }
              setIsChatBlocked(true);
              setParticipants((prev) =>
                prev.map((p) =>
                  p.id === "local" ? { ...p, isChatBlocked: true } : p
                )
              );
            }
            if (message.action === "chat-on") {
              chatBlockedRef.current.set("local", false);
              if (roomId) {
                sessionStorage.setItem(
                  `visio-chat-blocks-${roomId}`,
                  JSON.stringify(Object.fromEntries(chatBlockedRef.current))
                );
              }
              setIsChatBlocked(false);
              setParticipants((prev) =>
                prev.map((p) =>
                  p.id === "local" ? { ...p, isChatBlocked: false } : p
                )
              );
            }
            if (message.action === "ban") {
              sessionStorage.setItem(`visio-ban-${roomId}`, "1");
              setIsBanned(true);
              cleanupConnections();
            }
          } else if (isAdmin) {
            // update UI for targeted participant
            setParticipants((prev) =>
              prev.map((p) => {
                if (p.id !== targetId) return p;
                if (message.action === "chat-off") {
                  chatBlockedRef.current.set(targetId, true);
                  if (roomId) {
                    sessionStorage.setItem(
                      `visio-chat-blocks-${roomId}`,
                      JSON.stringify(Object.fromEntries(chatBlockedRef.current))
                    );
                  }
                }
                if (message.action === "chat-on") {
                  chatBlockedRef.current.set(targetId, false);
                  if (roomId) {
                    sessionStorage.setItem(
                      `visio-chat-blocks-${roomId}`,
                      JSON.stringify(Object.fromEntries(chatBlockedRef.current))
                    );
                  }
                }
                if (message.action === "mute-audio") return { ...p, isAudioMuted: true };
                if (message.action === "mute-video") return { ...p, isVideoOff: true };
                if (message.action === "chat-off") return { ...p, isChatBlocked: true };
                if (message.action === "chat-on") return { ...p, isChatBlocked: false };
                if (message.action === "ban") return p;
                return p;
              })
            );
          }
          break;
        }
        case "offer":
          await handleOffer(message);
          break;
        case "answer":
          await handleAnswer(message);
          break;
        case "ice-candidate":
          await handleIceCandidate(message);
          break;
        case "chat": {
          setMessages((prev) => [
            ...prev,
            {
              id: `${message.from}-${message.timestamp}`,
              userId: message.from,
              userName: message.name || "Участник",
              text: message.text,
              timestamp: new Date(message.timestamp),
            },
          ]);
          if (!isChatOpenRef.current) setHasUnread(true);
          break;
        }
        case "media-state": {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === message.from
                ? {
                    ...p,
                    isAudioMuted:
                      message.isAudioMuted !== undefined
                        ? message.isAudioMuted
                        : p.isAudioMuted,
                    isVideoOff:
                      message.isVideoOff !== undefined
                        ? message.isVideoOff
                        : p.isVideoOff,
                  }
                : p
            )
          );
          break;
        }
        case "reaction": {
          triggerReaction(message.emoji, false);
          break;
        }
        default:
          break;
      }
    },
    [handleAnswer, handleIceCandidate, handleInit, handleOffer, isAdmin, roomId]
  );

  const connectToSignaling = useCallback(
    async (room: string) => {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const explicitUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        (process.env.NEXT_PUBLIC_WS_PORT
          ? `${protocol}://${window.location.hostname}:${process.env.NEXT_PUBLIC_WS_PORT}/api/ws`
          : null);
      const endpointWs = explicitUrl || `${protocol}://${window.location.host}/api/ws`;

      const roleQuery = isAdmin ? "admin" : "member";
      const ws = new WebSocket(
        `${endpointWs}?roomId=${room}&name=${encodeURIComponent(
          displayName
        )}&role=${roleQuery}`
      );
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("[ws] open", room);
      };

      ws.onmessage = async (event) => {
        try {
          let textPayload = "";
          if (typeof event.data === "string") {
            textPayload = event.data;
          } else if (event.data instanceof Blob) {
            textPayload = await event.data.text();
          } else if (event.data instanceof ArrayBuffer) {
            textPayload = new TextDecoder().decode(event.data);
          }
          if (!textPayload) return;
          const data = JSON.parse(textPayload);
          console.log("[ws] message", data.type, data);
          await handleSignal(data);
        } catch (error) {
          console.error("Failed to parse signaling message", error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsLoading(false);
        console.warn("[ws] closed");
      };

      ws.onerror = () => {
        setIsConnected(false);
        setIsLoading(false);
        console.error("[ws] error");
      };
    },
    [displayName, handleSignal, isAdmin]
  );

  const startLocalMedia = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      console.warn("Media devices are not available in this environment.");
      setParticipants((prev) => {
        const others = prev.filter((p) => p.id !== "local");
        return [
          {
            id: "local",
            name: displayName,
            isAudioMuted: true,
            isVideoOff: true,
          },
          ...others,
        ];
      });
      return null;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    cameraStreamRef.current = stream;
    localStreamRef.current = stream;
    stream.getAudioTracks().forEach((track) => (track.enabled = !isAudioMuted));
    stream.getVideoTracks().forEach((track) => (track.enabled = !isVideoOff));
    attachLocalStream(stream);
    ensureLocalTracks();
    return stream;
  }, [attachLocalStream, displayName, ensureLocalTracks, isAudioMuted, isVideoOff]);

  useEffect(() => {
    if (!roomId) return;
    if (!hasName) return;
    if (isBanned) return;
    let cancelled = false;

    const init = async () => {
      try {
        await startLocalMedia();
        if (cancelled) return;
        await connectToSignaling(roomId);
      } catch (error) {
        console.error("Failed to initialize media", error);
        setIsLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      cleanupConnections();
    };
  }, [cleanupConnections, connectToSignaling, hasName, roomId, startLocalMedia]);

  const getGridClass = (count: number) => {
    switch (count) {
      case 1:
        return "grid-cols-1 grid-rows-1";
      case 2:
        return "grid-cols-2 grid-rows-1";
      case 3:
      case 4:
        return "grid-cols-2 grid-rows-2";
      case 5:
      case 6:
        return "grid-cols-3 grid-rows-2";
      case 7:
      case 8:
        return "grid-cols-4 grid-rows-2";
      case 9:
        return "grid-cols-3 grid-rows-3";
      default:
        return "grid-cols-4 grid-rows-3";
    }
  };

  const toggleAudio = () => {
    const newValue = !isAudioMuted;
    setIsAudioMuted(newValue);
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !newValue;
    });
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === "local" ? { ...p, isAudioMuted: newValue } : p
      )
    );
    sendSignal({ type: "media-state", isAudioMuted: newValue });
  };

  const toggleVideo = () => {
    const newValue = !isVideoOff;
    setIsVideoOff(newValue);
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !newValue;
    });
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === "local" ? { ...p, isVideoOff: newValue } : p
      )
    );
    sendSignal({ type: "media-state", isVideoOff: newValue });
  };

  const replaceVideoTrack = useCallback((track: MediaStreamTrack) => {
    peerConnections.current.forEach((connection) => {
      const sender = connection
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender) {
        sender.replaceTrack(track);
      }
    });
  }, []);

  const stopScreenShare = useCallback(() => {
    const cameraStream = cameraStreamRef.current;
    const cameraTrack = cameraStream?.getVideoTracks()[0];
    if (cameraTrack) {
      replaceVideoTrack(cameraTrack);
      localStreamRef.current = cameraStream;
      attachLocalStream(cameraStream);
    }
    setIsScreenSharing(false);
  }, [attachLocalStream, replaceVideoTrack]);

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;

      replaceVideoTrack(screenTrack);

      screenTrack.onended = () => {
        stopScreenShare();
      };

      const combinedStream = new MediaStream([
        screenTrack,
        ...(localStreamRef.current?.getAudioTracks() ?? []),
      ]);

      localStreamRef.current = combinedStream;
      attachLocalStream(combinedStream);
      setIsVideoOff(false);
      setIsScreenSharing(true);
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  };

  const handleSendMessage = (text: string) => {
    if (isChatBlocked && !isAdmin) return;
    const from = clientIdRef.current || "local";
    const outgoing = {
      type: "chat" as const,
      text,
      timestamp: Date.now(),
      name: displayName,
    };
    sendSignal(outgoing);
    const newMessage: Message = {
      id: `${from}-${outgoing.timestamp}`,
      userId: from,
      userName: displayName,
      text,
      timestamp: new Date(outgoing.timestamp),
    };
    setMessages((prev) => [...prev, newMessage]);
      setHasUnread(false);
  };

  const copyRoomId = () => {
    if (roomId) navigator.clipboard.writeText(roomId);
  };

  const leaveRoom = () => {
    if (roomId) {
      sessionStorage.removeItem(`visio-chat-blocks-${roomId}`);
    }
    cleanupConnections();
    router.push("/");
  };

  const triggerReaction = (emoji?: string, emit: boolean = true) => {
    const options = ["❤️", "😂", "👏", "👍", "🔥", "🎉"];
    const chosen = emoji || options[Math.floor(Math.random() * options.length)];
    const count = 10;
    const newOnes: Reaction[] = Array.from({ length: count }).map(() => {
      const x = 15 + Math.random() * 70;
      const y = 45 + Math.random() * 35;
      const scale = 0.7 + Math.random() * 0.6;
      const id = `reaction-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      return { id, emoji: chosen, x, y, scale };
    });
    setReactions((prev) => [...prev, ...newOnes]);
    if (emit) {
      sendSignal({ type: "reaction", emoji: chosen });
    }
    const ids = newOnes.map((r) => r.id);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => !ids.includes(r.id)));
    }, 2600);
  };

  const sendAdminCommand = (targetId: string, action: "mute-audio" | "mute-video" | "ban" | "chat-off" | "chat-on") => {
    if (!isAdmin) return;
    sendSignal({ type: "admin-command", targetId, action });
    // optimistic UI update
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== targetId) return p;
        switch (action) {
          case "mute-audio":
            return { ...p, isAudioMuted: true };
          case "mute-video":
            return { ...p, isVideoOff: true };
          case "chat-off":
            chatBlockedRef.current.set(targetId, true);
            if (roomId) {
              sessionStorage.setItem(
                `visio-chat-blocks-${roomId}`,
                JSON.stringify(Object.fromEntries(chatBlockedRef.current))
              );
            }
            return { ...p, isChatBlocked: true };
          case "chat-on":
            chatBlockedRef.current.set(targetId, false);
            if (roomId) {
              sessionStorage.setItem(
                `visio-chat-blocks-${roomId}`,
                JSON.stringify(Object.fromEntries(chatBlockedRef.current))
              );
            }
            return { ...p, isChatBlocked: false };
          default:
            return p;
        }
      })
    );
    if (action === "ban") {
      if (roomId) {
        chatBlockedRef.current.delete(targetId);
        sessionStorage.setItem(
          `visio-chat-blocks-${roomId}`,
          JSON.stringify(Object.fromEntries(chatBlockedRef.current))
        );
      }
      setParticipants((prev) => prev.filter((p) => p.id !== targetId));
    }
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.role === b.role) return a.name.localeCompare(b.name);
    return a.role === "admin" ? -1 : 1;
  });

  useEffect(() => {
    if (!isAdmin && isParticipantsOpen) {
      setIsParticipantsOpen(false);
    }
  }, [isAdmin, isParticipantsOpen]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    localStorage.setItem("visio-display-name", trimmed);
    if (roomId) {
      sessionStorage.setItem(`visio-room-name-${roomId}`, trimmed);
    }
    setDisplayName(trimmed);
    setHasName(true);
    setIsLoading(true);
  };

  if (!hasName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <h2 className="text-white text-2xl font-bold mb-4 text-center">
            Представьтесь перед подключением
          </h2>
          <p className="text-white/70 text-sm mb-6 text-center">
            Ваше имя увидят другие участники встречи.
          </p>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Например: Алексей"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/30"
            >
              Продолжить
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Доступ закрыт</h2>
          <p className="text-white/70 mb-6">Вы были заблокированы в этой встрече.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl border border-white/30 transition-all"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-white text-2xl font-bold mb-2">
            Подключаем к комнате...
          </h2>
          <p className="text-white/60">ID комнаты: {roomId}</p>
          <div className="mt-6 w-64 bg-white/10 rounded-full h-2 mx-auto">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"
              style={{ width: "75%" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
      <header className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-white hover:text-white/80 transition-all duration-200 group"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 border border-white/20">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </div>
            <span className="font-semibold text-sm sm:text-base">Назад</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 text-white">
                <div
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                    isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                ></div>
                <span className="font-medium text-sm sm:text-base">
                  ID: {roomId}
                </span>
                <button
                  onClick={copyRoomId}
                  className="text-white/70 hover:text-white transition-all duration-200 hover:scale-110"
                  title="Скопировать ID комнаты"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <button
              disabled={!isAdmin}
              onClick={() => isAdmin && setIsParticipantsOpen(true)}
              className={`bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-white/20 transition-all duration-200 ${
                isAdmin ? "hover:bg-white/15" : "opacity-50 cursor-not-allowed"
              }`}
              title={isAdmin ? "Показать участников" : "Доступно только админу"}
            >
              <div className="flex items-center gap-2 sm:gap-3 text-white">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="font-medium text-sm sm:text-base">
                  <span className="sm:hidden">{participants.length}</span>
                  <span className="hidden sm:inline">
                    {participants.length} участников
                  </span>
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`h-screen flex items-center justify-center p-4 pt-20 sm:pt-24 pb-28 sm:pb-36 transition-all duration-500 ${
          isChatOpen ? "2xl:pr-[480px]" : ""
        }`}
      >
        {(() => {
          const orderedParticipants = [...participants].sort((a, b) => {
            const aOrder = a.joinOrder ?? 9999;
            const bOrder = b.joinOrder ?? 9999;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.name.localeCompare(b.name);
          });
          return (
        <div
          ref={videoContainerRef}
          className={`w-full h-full max-w-7xl grid ${getGridClass(
            participants.length
          )} gap-4 sm:gap-6 auto-rows-fr transition-all duration-500`}
        >
          {orderedParticipants.map((participant) => (
            <VideoTile
              key={participant.id}
              participant={participant}
              isLocal={participant.id === "local"}
              totalCount={participants.length}
            />
          ))}
        </div>
          );
        })()}

        <ChatPanel
          isOpen={isChatOpen}
          messages={messages}
          onSendMessage={handleSendMessage}
          participants={participants}
          isChatBlocked={isChatBlocked && !isAdmin}
          onClose={() => {
            setIsChatOpen(false);
            setHasUnread(false);
          }}
        />

        {/* Reactions overlay */}
        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
          {reactions.map((r) => (
            <span
              key={r.id}
              className="absolute text-3xl sm:text-4xl will-change-transform"
              style={{
                left: `${r.x}%`,
                top: `${r.y}%`,
                transform: `translate(-50%, -50%) scale(${r.scale})`,
                animation: "reaction-float 2.2s ease-out forwards",
              }}
            >
              {r.emoji}
            </span>
          ))}
        </div>

        {/* Reactions overlay */}
        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
          {reactions.map((r) => (
            <span
              key={r.id}
              className="absolute text-3xl sm:text-4xl will-change-transform"
              style={{
                left: `${r.x}%`,
                top: `${r.y}%`,
                transform: `translate(-50%, -50%) scale(${r.scale})`,
                animation: "reaction-float 1.6s ease-out forwards",
              }}
            >
              {r.emoji}
            </span>
          ))}
        </div>

        {/* Participants Panel */}
        <div
          className={`fixed right-0 top-0 h-full bg-gray-900/95 backdrop-blur-md border-l border-white/20 transition-all duration-300 z-30 ${
            isParticipantsOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"
          }`}
          style={{ width: "360px" }}
        >
          <div className="p-6 border-b border-white/10 bg-gray-900/80 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-xl">Участники</h3>
              <p className="text-white/40 text-sm mt-1">
                {participants.length} онлайн
              </p>
            </div>
            <button
              onClick={() => setIsParticipantsOpen(false)}
              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto h-[calc(100%-96px)]">
            {sortedParticipants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-white font-semibold text-sm truncate max-w-[160px] sm:max-w-[200px]">
                      {p.name}
                      {p.id === "local" && " (Вы)"}
                    </span>
                    {p.role === "admin" && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                        Админ
                      </span>
                    )}
                    {p.role === "member" && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/80 border border-white/20">
                        Участник
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
                    <span className="flex items-center gap-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          p.isAudioMuted ? "bg-red-500" : "bg-green-500"
                        }`}
                      ></span>
                      {p.isAudioMuted ? "Микрофон выкл." : "Микрофон вкл."}
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          p.isVideoOff ? "bg-red-500" : "bg-green-500"
                        }`}
                      ></span>
                      {p.isVideoOff ? "Видео выкл." : "Видео вкл."}
                    </span>
                  </div>
                </div>
                {isAdmin && p.id !== "local" && (
                  <div className="flex gap-2">
                    {(() => {
                      const blocked =
                        chatBlockedRef.current.get(p.id) ??
                        p.isChatBlocked ??
                        false;
                      return (
                        <button
                          onClick={() =>
                            sendAdminCommand(p.id, blocked ? "chat-on" : "chat-off")
                          }
                          className={`w-9 h-9 rounded-lg border text-white text-xs transition-all duration-150 ${
                            blocked
                              ? "bg-red-500/80 hover:bg-red-600 border-red-400/60"
                              : "bg-white/10 hover:bg-white/20 border-white/20"
                          }`}
                          title={blocked ? "Разрешить чат" : "Запретить чат"}
                        >
                          {blocked ? "🔒" : "💬"}
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => sendAdminCommand(p.id, "ban")}
                      className="w-9 h-9 bg-red-500/80 hover:bg-red-600 rounded-lg border border-red-400/40 text-white text-xs"
                      title="Выгнать"
                    >
                      ❌
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-md">
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isAudioMuted
                ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/25"
                : "bg-white/10 hover:bg-white/20 hover:scale-110 border border-white/20"
            }`}
          >
            <svg
              className="w-5 h-5 sm:w-7 sm:h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isAudioMuted ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              )}
            </svg>
          </button>

          <button
            onClick={toggleVideo}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isVideoOff
                ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/25"
                : "bg-white/10 hover:bg-white/20 hover:scale-110 border border-white/20"
            }`}
          >
            <svg
              className="w-5 h-5 sm:w-7 sm:h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isVideoOff ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                />
              )}
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsEmojiMenuOpen((v) => !v)}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl bg-white/10 hover:bg-white/20 hover:scale-110 border border-white/20"
              title="Отправить реакцию"
            >
              <Smile className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </button>
            {isEmojiMenuOpen && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-2 flex gap-2 z-40">
                {["❤️", "😂", "👏", "👍", "🔥", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      triggerReaction(emoji, true);
                      setIsEmojiMenuOpen(false);
                    }}
                    className="text-xl sm:text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isScreenSharing
                ? "bg-blue-500 hover:bg-blue-600 scale-110 shadow-blue-500/25"
                : "bg-white/10 hover:bg-white/20 hover:scale-110 border border-white/20"
            }`}
          >
            <svg
              className="w-5 h-5 sm:w-7 sm:h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
          </button>

          <button
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              setHasUnread(false);
            }}
            className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isChatOpen
                ? "bg-green-500 hover:bg-green-600 scale-110 shadow-green-500/25"
                : "bg-white/10 hover:bg-white/20 hover:scale-110 border border-white/20"
            }`}
          >
            <svg
              className="w-5 h-5 sm:w-7 sm:h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {!isChatOpen && hasUnread && (
              <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></span>
            )}
          </button>

          <button
            onClick={leaveRoom}
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-110 shadow-red-500/25 border border-red-400/20"
          >
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes reaction-float {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -120%) scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
