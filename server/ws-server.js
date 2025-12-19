/* Simple standalone WebSocket signaling server for WebRTC rooms.
   Run with: node server/ws-server.js (or npm run ws-server)
   Default port: 3001; configure via WS_PORT env.
*/

const { WebSocketServer } = require("ws");

const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 3001;

const rooms = new Map(); // roomId -> Map(peerId, { socket, name, role })

const sendSafe = (socket, data) => {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(data));
  }
};

const broadcast = (roomId, data, exceptPeerId) => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.forEach((peer, id) => {
    if (id !== exceptPeerId) {
      sendSafe(peer.socket, data);
    }
  });
};

const randomId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(16).slice(2);

const wss = new WebSocketServer({ port: PORT }, () => {
  console.log(`[ws-server] listening on ws://localhost:${PORT}`);
});

wss.on("connection", (socket, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomId = url.searchParams.get("roomId");
  const name = url.searchParams.get("name") || "Гость";

  if (!roomId) {
    socket.close(1008, "Room id required");
    return;
  }

  const peerId = randomId();
  const room = rooms.get(roomId) ?? new Map();
  rooms.set(roomId, room);
  const role = room.size === 0 ? "admin" : "member";

  const existing = Array.from(room.entries()).map(([id, peer]) => ({
    peerId: id,
    name: peer.name,
    role: peer.role,
  }));

  sendSafe(socket, { type: "init", peerId, roomId, participants: existing, role });

  room.set(peerId, { socket, name, role });

  broadcast(roomId, { type: "peer-joined", peerId, name, role }, peerId);

  console.log(
    `[ws-server] join room=${roomId} peer=${peerId} name=${name} role=${role} count=${room.size}`
  );

  socket.on("message", (raw) => {
    let data;
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
      const target = room.get(data.targetId);
      if (target) {
        sendSafe(target.socket, payload);
      }
      // echo back to sender so admin UI stays in sync
      sendSafe(socket, payload);
    } else {
      broadcast(roomId, payload, peerId);
    }
  });

  const cleanup = (code, reason) => {
    room.delete(peerId);
    if (room.size === 0) rooms.delete(roomId);
    else broadcast(roomId, { type: "peer-left", peerId });
    console.log(
      `[ws-server] close room=${roomId} peer=${peerId} code=${code} reason=${reason}`
    );
  };

  socket.on("close", (code, reason) => cleanup(code, reason.toString()));
  socket.on("error", (err) => cleanup(1011, err.message || "error"));
});

wss.on("error", (err) => {
  console.error("[ws-server] fatal error", err);
});
