import type { NextApiRequest, NextApiResponse } from "next";
import { WebSocketServer, WebSocket } from "ws";

type ExtWebSocket = WebSocket & { peerId?: string; roomId?: string };

type Peer = {
  socket: ExtWebSocket;
  name: string;
  role: "admin" | "member";
};

type Room = Map<string, Peer>;

type ExtServer = {
  wss?: WebSocketServer;
  on?: any;
};

const rooms = new Map<string, Room>();

const sendSafe = (socket: WebSocket, data: unknown) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
};

const broadcast = (roomId: string, data: unknown, exceptPeerId?: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.forEach((peer, id) => {
    if (id !== exceptPeerId) {
      sendSafe(peer.socket, data);
    }
  });
};

const setupWebSocketServer = (server: ExtServer) => {
  if (server.wss) return server.wss;

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req: any, socket: any, head: any) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    if (url.pathname !== "/api/ws") return;

    wss.handleUpgrade(req, socket, head, (ws) => {
      (ws as any).query = url.searchParams;
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (socket: ExtWebSocket, req) => {
    const params: URLSearchParams = (socket as any).query || new URLSearchParams();
    const roomId = params.get("roomId") || "";
    const name = params.get("name") || "Гость";

    if (!roomId) {
      socket.close(1008, "Room id required");
      return;
    }

    const peerId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(16).slice(2);

    socket.peerId = peerId;
    socket.roomId = roomId;

    const room = rooms.get(roomId) ?? new Map<string, Peer>();
    rooms.set(roomId, room);
    const role: "admin" | "member" = room.size === 0 ? "admin" : "member";

    const existingParticipants = Array.from(room.entries()).map(
      ([existingPeerId, peer]) => ({
        peerId: existingPeerId,
        name: peer.name,
        role: peer.role,
      })
    );

    sendSafe(socket, {
      type: "init",
      peerId,
      roomId,
      participants: existingParticipants,
      role,
    });

    room.set(peerId, { socket, name, role });

    broadcast(
      roomId,
      {
        type: "peer-joined",
        peerId,
        name,
        role,
      },
      peerId
    );

    const handleClose = () => {
      const roomForPeer = rooms.get(roomId);
      roomForPeer?.delete(peerId);
      if (roomForPeer && roomForPeer.size === 0) {
        rooms.delete(roomId);
      } else {
        broadcast(roomId, { type: "peer-left", peerId });
      }
    };

    console.log(
      `[ws] join room=${roomId} peer=${peerId} name=${name} role=${role} count=${room.size}`
    );

    socket.on("message", (raw) => {
      let data: any;
      try {
        const text =
          typeof raw === "string"
            ? raw
            : raw instanceof Buffer
            ? raw.toString("utf-8")
            : "";
        data = JSON.parse(text);
      } catch {
        return;
      }

      const payload = { ...data, from: peerId, name };
      if (data.targetId) {
        const target = room.get(data.targetId as string);
        if (target) {
          sendSafe(target.socket, payload);
        }
        // echo back to sender to keep UI state in sync
        sendSafe(socket, payload);
      } else {
        broadcast(roomId, payload, peerId);
      }
    });

    socket.on("close", (code, reason) => {
      console.log(
        `[ws] close room=${roomId} peer=${peerId} code=${code} reason=${reason.toString()}`
      );
      handleClose();
    });
    socket.on("error", (err) => {
      console.error(`[ws] error room=${roomId} peer=${peerId}`, err);
      handleClose();
    });

    // keep-alive ping/pong
    const interval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }, 20000);

    socket.on("pong", () => {
      // no-op, just to prevent connection drop
    });

    socket.on("close", () => clearInterval(interval));
    socket.on("error", () => clearInterval(interval));
  });

  server.wss = wss;
  return wss;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const server = (res.socket as any)?.server as ExtServer;
  setupWebSocketServer(server);
  res.setHeader("Content-Type", "application/json");
  res.status(200).end(JSON.stringify({ status: "ok", rooms: rooms.size }));
}
