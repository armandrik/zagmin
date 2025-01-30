// File: /app/api/socket/route.ts
import { NextRequest } from "next/server";
import { Server as SocketServer } from "socket.io";
import { createServer } from "http";

declare global {
    var _io: SocketServer | undefined;
}

// **Ensure WebSocket support in Next.js API routes**
export const config = {
    api: {
        bodyParser: false, // WebSockets don’t use body parsing
    },
};

export async function GET(req: NextRequest) {
    return new Response("Socket.IO server is running", { status: 200 });
}

export async function POST(req: NextRequest) {
    if (global._io) {
        console.log("⚡ Socket.IO server already running");
        return new Response("Socket.IO already initialized", { status: 200 });
    }

    console.log("Initializing Socket.IO server...");

    try {
        const httpServer = createServer();
        const io = new SocketServer(httpServer, {
            path: "/api/socket",
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
        });

        global._io = io;

        io.on("connection", (socket) => {
            console.log("✅ Client connected:", socket.id);

            socket.on("join-room", (roomId: string, userId: string) => {
                console.log(`User ${userId} joined room ${roomId}`);
                socket.join(roomId);
                socket.broadcast.to(roomId).emit("user-connected", userId);
            });

            socket.on("user-toggle-audio", (userId: string, roomId: string) => {
                socket.broadcast.to(roomId).emit("user-toggle-audio", userId);
            });

            socket.on("user-toggle-video", (userId: string, roomId: string) => {
                socket.broadcast.to(roomId).emit("user-toggle-video", userId);
            });

            socket.on("user-leave", (userId: string, roomId: string) => {
                socket.broadcast.to(roomId).emit("user-leave", userId);
                socket.leave(roomId);
            });

            socket.on("disconnect", () => {
                console.log("❌ Client disconnected:", socket.id);
            });
        });

        httpServer.listen(3001, () => {
            console.log("✅ WebSocket server is running on port 3001");
        });

        return new Response("Socket.IO initialized", { status: 200 });
    } catch (err) {
        console.error("❌ Error initializing Socket.IO:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
}
