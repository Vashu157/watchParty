import { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { WebRTCHookReturn, PeerConnectionState } from '../types/webrtc';
import { createPeerConnection, getUserMedia, stopMediaStream } from '../utils/webrtc';

interface UseWebRTCProps {
  socket: Socket | null;
  roomLink: string;
  currentUserId: string;
}

export const useWebRTC = ({ socket, roomLink, currentUserId }: UseWebRTCProps): WebRTCHookReturn => {
  const [state, setState] = useState<PeerConnectionState>({
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    isConnected: false,
    isCalling: false,
    isReceivingCall: false,
  });

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = createPeerConnection();
    peerConnectionRef.current = pc;

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote stream');
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      setState(prev => ({ ...prev, remoteStream, isConnected: true }));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && remoteUserId) {
        console.log('Sending ICE candidate');
        socket.emit('webrtc-ice-candidate', {
          roomLink,
          candidate: event.candidate.toJSON(),
          targetUserId: remoteUserId
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const isConnected = pc.connectionState === 'connected';
      setState(prev => ({ ...prev, isConnected }));
      
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.log('Peer connection failed or disconnected');
        endCall();
      }
    };

    setState(prev => ({ ...prev, peerConnection: pc }));
    return pc;
  }, [socket, roomLink, remoteUserId]);

  // Start a call
  const startCall = useCallback(async () => {
    if (!socket) return;

    try {
      setState(prev => ({ ...prev, isCalling: true }));
      
      // Get user media
      const stream = await getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setState(prev => ({ ...prev, localStream: stream }));

      // Request to start video call
      socket.emit('start-video-call', { roomLink });

    } catch (error) {
      console.error('Error starting call:', error);
      setState(prev => ({ ...prev, isCalling: false }));
    }
  }, [socket, roomLink]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!socket || !remoteUserId) return;

    try {
      // Get user media
      const stream = await getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setState(prev => ({ ...prev, localStream: stream, isReceivingCall: false }));

      // Initialize peer connection and add local stream
      const pc = initializePeerConnection();
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

    } catch (error) {
      console.error('Error accepting call:', error);
      setState(prev => ({ ...prev, isReceivingCall: false }));
    }
  }, [socket, remoteUserId, initializePeerConnection]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!socket) return;
    
    setState(prev => ({ ...prev, isReceivingCall: false }));
    socket.emit('end-video-call', { roomLink });
  }, [socket, roomLink]);

  // End call
  const endCall = useCallback(() => {
    if (!socket) return;

    // Stop local stream
    stopMediaStream(localStreamRef.current);
    localStreamRef.current = null;

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Reset state
    setState({
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isConnected: false,
      isCalling: false,
      isReceivingCall: false,
    });

    remoteStreamRef.current = null;
    setRemoteUserId(null);

    // Notify server
    socket.emit('end-video-call', { roomLink });
  }, [socket, roomLink]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleVideoCallStarted = (data: any) => {
      console.log('Video call started:', data);
      const otherParticipant = data.participants.find((p: any) => p.userId !== currentUserId);
      if (otherParticipant) {
        setRemoteUserId(otherParticipant.userId);
      }

      // If we initiated the call, create offer
      if (data.initiator === currentUserId && localStreamRef.current) {
        const pc = initializePeerConnection();
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });

        // Create and send offer
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit('webrtc-offer', {
              roomLink,
              offer: pc.localDescription,
              targetUserId: otherParticipant.userId
            });
          })
          .catch(console.error);
      } else if (data.initiator !== currentUserId) {
        // We're receiving the call
        setState(prev => ({ ...prev, isReceivingCall: true }));
      }
    };

    const handleVideoCallEnded = () => {
      console.log('Video call ended');
      endCall();
    };

    const handleOfferReceived = async (data: any) => {
      console.log('Offer received from:', data.fromUserId);
      setRemoteUserId(data.fromUserId);

      if (!localStreamRef.current) {
        // Auto-accept and get media if we don't have it yet
        await acceptCall();
      }

      if (peerConnectionRef.current && localStreamRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(data.offer);
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);

          socket.emit('webrtc-answer', {
            roomLink,
            answer,
            targetUserId: data.fromUserId
          });
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      }
    };

    const handleAnswerReceived = async (data: any) => {
      console.log('Answer received from:', data.fromUserId);
      
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(data.answer);
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      }
    };

    const handleIceCandidateReceived = async (data: any) => {
      console.log('ICE candidate received');
      
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(data.candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    };

    // Register event listeners
    socket.on('video-call-started', handleVideoCallStarted);
    socket.on('video-call-ended', handleVideoCallEnded);
    socket.on('webrtc-offer-received', handleOfferReceived);
    socket.on('webrtc-answer-received', handleAnswerReceived);
    socket.on('webrtc-ice-candidate-received', handleIceCandidateReceived);

    // Cleanup
    return () => {
      socket.off('video-call-started', handleVideoCallStarted);
      socket.off('video-call-ended', handleVideoCallEnded);
      socket.off('webrtc-offer-received', handleOfferReceived);
      socket.off('webrtc-answer-received', handleAnswerReceived);
      socket.off('webrtc-ice-candidate-received', handleIceCandidateReceived);
    };
  }, [socket, currentUserId, roomLink, initializePeerConnection, acceptCall, endCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMediaStream(localStreamRef.current);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  return {
    localStream: state.localStream,
    remoteStream: state.remoteStream,
    isConnected: state.isConnected,
    isCalling: state.isCalling,
    isReceivingCall: state.isReceivingCall,
    isAudioEnabled,
    isVideoEnabled,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
    acceptCall,
    rejectCall,
  };
};
