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
  const shareScreenVideoRef = useRef<HTMLVideoElement>(null);

  const unwrappedParams = React.use(params);
  const { roomID } = unwrappedParams;

  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupWebRTC = async () => {
      try {
        const pc = new RTCPeerConnection();
        setPeerConnection(pc);

        // Capture camera and microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Disable video and audio by default
        stream.getVideoTracks().forEach((track) => (track.enabled = false));
        stream.getAudioTracks().forEach((track) => (track.enabled = false));

        // Store and display the camera stream
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add tracks to peer connection
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("New ICE candidate:", event.candidate);
          }
        };

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
      const micTrack = localStream.getAudioTracks()[0];
      micTrack.enabled = !micTrack.enabled;

      // If screen sharing is active, apply the toggle to its audio as well
      if (screenStream) {
        const screenAudioTrack = screenStream.getAudioTracks()[0];
        if (screenAudioTrack) {
          screenAudioTrack.enabled = micTrack.enabled;
        }
      }

      setAudioEnabled(micTrack.enabled);
    }
  };

  const shareScreen = async () => {
    try {
      // Capture the screen with audio
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setScreenStream(screen);

      // Display the screen-sharing stream locally
      if (shareScreenVideoRef.current) {
        shareScreenVideoRef.current.srcObject = screen;
      }

      // Add the screen video track to the connection
      if (peerConnection) {
        const screenTrack = screen.getVideoTracks()[0];
        peerConnection.addTrack(screenTrack, screen);

        // Preserve microphone audio in the connection
        if (localStream) {
          const micTrack = localStream.getAudioTracks()[0];
          const audioSender = peerConnection
            .getSenders()
            .find((s) => s.track?.kind === "audio");

          if (audioSender) {
            audioSender.replaceTrack(micTrack);
          } else {
            peerConnection.addTrack(micTrack, localStream);
          }
        }
      }

      // Stop screen sharing when the screen track ends
      screen.getVideoTracks()[0].onended = stopScreenSharing;

      setIsSharingScreen(true);
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        console.log("Screen sharing permission denied. No changes made.");
      } else {
        console.error("Error while attempting to share screen:", err);
      }
    }
  };

  const stopScreenSharing = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);

      // Clear the screen-sharing video element
      if (shareScreenVideoRef.current) {
        shareScreenVideoRef.current.srcObject = null;
      }

      setIsSharingScreen(false);
    }
  };

  const leaveCall = () => {
    // Stop all media tracks and clean up resources
    cleanupResources();
    router.push("/");
  };

  const cleanupResources = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    setPeerConnection(null);
    setLocalStream(null);
    setScreenStream(null);
    setVideoEnabled(false);
    setAudioEnabled(false);
    setIsSharingScreen(false);
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Room {roomID}</h1>
      {error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow-md">
          <p>{error}</p>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-start gap-4 p-4">
          <div className="flex items-center justify-center gap-4 w-full h-auto">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              className="w-1/2 min-h-[525px] transition-all border-2 border-zinc-700/50 rounded-lg scale-x-[-1]"
            />
            <video
              ref={shareScreenVideoRef}
              autoPlay
              playsInline
              className="w-1/2 min-h-[525px] border-2 border-zinc-700/50 rounded-lg"
            />
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
