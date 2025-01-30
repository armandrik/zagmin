"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  FC,
} from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const startSocket = async () => {
      try {
        console.log("🔄 Connecting to WebSocket...");

        // **Ensure API is initialized before connecting**
        const res = await fetch("/api/socket", { method: "POST" });
        if (!res.ok) {
          console.error("❌ Failed to initialize WebSocket:", res.status);
          return;
        }

        const connection = io("http://localhost:3001", {
          path: "/api/socket",
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
          timeout: 20000, // Wait longer before timeout
        });

        connection.on("connect", () => {
          console.log("✅ Connected to WebSocket:", connection.id);
        });

        connection.on("connect_error", (err) => {
          console.error("❌ WebSocket connection error:", err);
        });

        setSocket(connection);
      } catch (err) {
        console.error("❌ Failed to initialize WebSocket:", err);
      }
    };

    startSocket();

    return () => {
      console.log("🔌 Disconnecting from WebSocket...");
      socket?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
