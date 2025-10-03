export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface PeerConnectionState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isConnected: boolean;
  isCalling: boolean;
  isReceivingCall: boolean;
}

export interface WebRTCHookReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isCalling: boolean;
  isReceivingCall: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  startCall: () => Promise<void>;
  endCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
}

export interface WebRTCSocketEvents {
  'start-video-call': { roomLink: string };
  'end-video-call': { roomLink: string };
  'webrtc-offer': { roomLink: string; offer: RTCSessionDescriptionInit; targetUserId: string };
  'webrtc-answer': { roomLink: string; answer: RTCSessionDescriptionInit; targetUserId: string };
  'webrtc-ice-candidate': { roomLink: string; candidate: RTCIceCandidateInit; targetUserId: string };
}

export interface WebRTCSocketCallbacks {
  'video-call-started': (data: { initiator: string; participants: Array<{ userId: string; userName: string }> }) => void;
  'video-call-ended': (data: { endedBy: string; reason?: string }) => void;
  'webrtc-offer-received': (data: { offer: RTCSessionDescriptionInit; fromUserId: string; fromUserName: string }) => void;
  'webrtc-answer-received': (data: { answer: RTCSessionDescriptionInit; fromUserId: string; fromUserName: string }) => void;
  'webrtc-ice-candidate-received': (data: { candidate: RTCIceCandidateInit; fromUserId: string }) => void;
}
