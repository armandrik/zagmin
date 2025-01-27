"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";

export default function Room({
  params,
}: {
  params: Promise<{ roomID: string }>;
}) {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const unwrappedParams = React.use(params);
  const { roomID } = unwrappedParams;

  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [error, setError] = useState<string | null>(null); // To display error messages

  useEffect(() => {
    const setupWebRTC = async () => {
      try {
        const pc = new RTCPeerConnection();
        setPeerConnection(pc);

        // Attempt to get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Disable video and audio tracks by default
        stream.getVideoTracks().forEach((track) => (track.enabled = false));
        stream.getAudioTracks().forEach((track) => (track.enabled = false));

        // Store the local stream
        setLocalStream(stream);

        // Display local stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add local tracks to connection
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("New ICE candidate:", event.candidate);
          }
        };

        // Simulate signaling with a remote peer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const remotePC = new RTCPeerConnection();
        remotePC.ontrack = (event) => console.log("Remote track received");

        await remotePC.setRemoteDescription(offer);
        const answer = await remotePC.createAnswer();
        await remotePC.setLocalDescription(answer);
        await pc.setRemoteDescription(answer);

        console.log("Connection established!");
      } catch (err) {
        const error = err as Error;
        if (error.name === "NotAllowedError") {
          setError(
            "Camera and microphone access denied. Please enable them to join the room."
          );
        } else {
          setError("An error occurred while accessing media devices.");
          console.error("Error setting up WebRTC:", err);
        }
      }
    };

    setupWebRTC();

    return () => {
      cleanupResources();
    };
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
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  const shareScreen = async () => {
    if (!isSharingScreen) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = screenStream.getVideoTracks()[0];

      if (peerConnection) {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      screenTrack.onended = stopScreenSharing;
      setIsSharingScreen(true);
    }
  };

  const stopScreenSharing = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (peerConnection) {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      setIsSharingScreen(false);
    }
  };

  const leaveCall = () => {
    cleanupResources();
    router.push("/");
  };

  const cleanupResources = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    setPeerConnection(null);
    setLocalStream(null);
    setVideoEnabled(false);
    setAudioEnabled(false);
    setIsSharingScreen(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Room {roomID}</h1>
      {error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow-md">
          <p>{error}</p>
        </div>
      ) : (
        <div className="w-full h-dvh">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            className="border-2 mx-auto w-full"
          />
          <div className="flex items-center justify-center gap-4 mt-4">
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
              onClick={isSharingScreen ? stopScreenSharing : shareScreen}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {isSharingScreen ? "Stop Sharing" : "Share Screen"}
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
