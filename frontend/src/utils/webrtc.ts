import { WebRTCConfig } from "../types/webrtc";

export const webrtcConfig: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const createPeerConnection = (): RTCPeerConnection => {
  const peerConnection = new RTCPeerConnection(webrtcConfig);
  
  // Add some basic logging
  peerConnection.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', peerConnection.iceConnectionState);
  };
  
  peerConnection.onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection.connectionState);
  };
  
  return peerConnection;
};

export const getUserMedia = async (constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> => {
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error('Error accessing user media:', error);
    throw new Error('Failed to access camera/microphone');
  }
};

export const stopMediaStream = (stream: MediaStream | null): void => {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
};
