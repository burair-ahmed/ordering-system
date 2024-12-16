import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";

type NextApiResponseSocket = NextApiResponse & {
  socket: {
    server: NetServer & { io?: SocketIOServer };
  };
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseSocket
) {
  if (!res.socket.server.io) {
    console.log("Setting up Socket.IO server...");
    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socket",
      cors: {
        origin: "*", // Adjust this to allow specific origins
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

  res.end(); // Close the API route
}
