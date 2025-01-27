import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">Welcome to DevCall</h1>
      <div className="grid gap-4">
        {[1, 2, 3].map((room) => (
          <Link
            key={room}
            href={`/room/${room}`}
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Join Room {room}
          </Link>
        ))}
      </div>
    </main>
  );
}
