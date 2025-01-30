"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import { useSocket } from "../../../../context/socket";

export default function Room({
  params,
}: {
  params: Promise<{ roomID: string }>;
}) {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const socket = useSocket();

  const unwrappedParams = React.use(params);
  const { roomID } = unwrappedParams;

  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupWebRTC = async () => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        setPeerConnection(pc);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        stream.getVideoTracks().forEach((track) => (track.enabled = false));
        stream.getAudioTracks().forEach((track) => (track.enabled = false));

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const remoteStream = new MediaStream();
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }

        pc.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
          });
        };

        console.log("Connection established!");
      } catch (err) {
        const error = err as Error;
        if (error.name === "NotAllowedError") {
          setError("Camera and microphone access denied.");
        } else {
          setError("Error accessing media devices.");
        }
      }
    };

    setupWebRTC();
    return () => cleanupResources();
  }, []);

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const micTrack = localStream.getAudioTracks()[0];
      micTrack.enabled = !micTrack.enabled;
      setAudioEnabled(micTrack.enabled);
    }
  };

  const leaveCall = () => {
    cleanupResources();
    router.push("/");
  };

  const cleanupResources = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    remoteStream?.getTracks().forEach((track) => track.stop());
    peerConnection?.close();
    setPeerConnection(null);
    setLocalStream(null);
    setRemoteStream(null);
    setVideoEnabled(false);
    setAudioEnabled(false);
  };

  return (
    <main className="p-4 mobile:p-2">
      <h1 className="text-2xl font-bold mb-4 text-center">Room {roomID}</h1>
      {error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow-md">
          <p>{error}</p>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-start gap-4 p-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full h-auto">
            {/* Local Video */}
            <div className="relative w-1/2 min-h-[525px] border-2 border-gray-700 rounded-lg">
              {videoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full rounded-lg scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-lg">
                  Camera Off
                </div>
              )}
            </div>

            {/* Remote Video */}
            <div className="relative w-1/2 min-h-[525px] border-2 border-gray-700 rounded-lg">
              {remoteStream && remoteStream.getTracks().length > 0 ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full rounded-lg scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-lg">
                  Waiting for User...
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleVideo}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {videoEnabled ? "Turn Video Off" : "Turn Video On"}
            </button>
            <button
              onClick={toggleAudio}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {audioEnabled ? "Mute Audio" : "Unmute Audio"}
            </button>
            <button
              onClick={leaveCall}
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Leave Call
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
