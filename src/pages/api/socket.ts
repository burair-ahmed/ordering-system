import { NextApiRequest, NextApiResponse } from "next";
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";

type NextApiResponseSocket = NextApiResponse & {
  socket: {
    server: NetServer & { io?: SocketIOServer };
  };
};

let io: SocketIOServer | null = null;

export default function handler(req: NextApiRequest, res: NextApiResponseSocket) {
  if (!res.socket.server.io) {
    console.log("Setting up Socket.IO server...");
    io = new SocketIOServer(res.socket.server, {
      path: "/api/socket", // Path must match the client-side configuration
      cors: {
        origin: "*",  // Update with your frontend domain if needed
        methods: ["GET", "POST"],
      },
    });

    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected");

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
  }

  res.end(); // End the response
}
