import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { getSocket } from '../services/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function CallModal() {
  const { callState, endCall } = useChatStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [isAccepted, setIsAccepted] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    if (!callState.active) {
      cleanupCall();
      setIsAccepted(false);
      return;
    }

    if (callState.incoming) {
      setCallStatus('Incoming Call...');
    } else {
      setCallStatus('Ringing...');
      initiateCallerWebRTC();
    }

    const socket = getSocket();
    if (!socket) return;

    const handleCallAccepted = async ({ answer }) => {
      setCallStatus('Call Connected');
      setIsAccepted(true);
      try {
        if (peerConnectionRef.current && answer) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        }
      } catch (err) {
        console.error('[WebRTC] Error setting remote answer:', err);
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      try {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    };

    const handleCallRejected = () => {
      setCallStatus('Call Rejected');
      setTimeout(() => cleanupCall(), 1200);
    };

    const handleCallEnded = () => {
      setCallStatus('Call Ended');
      setTimeout(() => cleanupCall(), 1000);
    };

    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:ice_candidate', handleIceCandidate);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:ice_candidate', handleIceCandidate);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
    };
  }, [callState.active, callState.incoming]);

  // Caller initiates call and creates SDP Offer
  const initiateCallerWebRTC = async () => {
    try {
      const stream = await acquireMediaStream();
      if (!stream) return;

      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const socket = getSocket();
      if (socket && callState.peerUser) {
        socket.emit('call:initiate', {
          toUserId: callState.peerUser._id,
          chatId: callState.chatId,
          offer,
          callType: callState.callType,
        });
      }
    } catch (err) {
      console.error('[WebRTC] Error initiating call:', err);
      setCallStatus('Failed to start call media');
    }
  };

  // Recipient accepts incoming call and creates SDP Answer
  const handleAcceptCall = async () => {
    setIsAccepted(true);
    setCallStatus('Connecting Media...');

    try {
      const stream = await acquireMediaStream();
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      if (callState.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callState.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        const socket = getSocket();
        if (socket && callState.peerUser) {
          socket.emit('call:accept', {
            toUserId: callState.peerUser._id,
            answer,
          });
        }
      }
      setCallStatus('Call Connected');
    } catch (err) {
      console.error('[WebRTC] Error accepting call:', err);
      setCallStatus('Media Connection Error');
    }
  };

  // Create RTCPeerConnection with STUN configuration & track handlers
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        if (socket && callState.peerUser) {
          socket.emit('call:ice_candidate', {
            toUserId: callState.peerUser._id,
            candidate: event.candidate,
          });
        }
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received Remote Stream Track:', event.streams[0]);
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(() => {});
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(() => {});
        }
      }
    };

    return pc;
  };

  const acquireMediaStream = async () => {
    try {
      const constraints = {
        audio: true,
        video: callState.callType === 'video' ? { width: 1280, height: 720 } : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn('[WebRTC] Camera/Mic access warning:', err.message);
      setCallStatus('Mic/Camera Permission Required');
      return null;
    }
  };

  const handleRejectCall = () => {
    const socket = getSocket();
    if (socket && callState.peerUser) {
      socket.emit('call:reject', { toUserId: callState.peerUser._id });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    endCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
      }
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
      }
    }
    setIsVideoOff(!isVideoOff);
  };

  if (!callState.active) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-6 backdrop-blur-2xl select-none">
      {/* Hidden audio element for remote audio stream playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Header */}
      <div className="w-full flex items-center justify-between max-w-4xl text-slate-300">
        <div className="flex items-center gap-3">
          <img
            src={callState.peerUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
            alt={callState.peerUser?.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
          />
          <div>
            <h3 className="text-lg font-bold text-slate-100">{callState.peerUser?.name || 'Contact'}</h3>
            <p className="text-xs text-emerald-400 font-medium">{callStatus}</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
          {callState.callType} Call
        </div>
      </div>

      {/* Main Video Stream Window */}
      <div className="flex-1 w-full max-w-4xl my-4 relative bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-2xl">
        {callState.callType === 'video' ? (
          <div className="w-full h-full relative bg-slate-950 flex items-center justify-center">
            {/* Remote Video Element */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Local Video Thumbnail Box */}
            <div className="absolute bottom-4 right-4 w-36 h-28 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="w-32 h-32 rounded-full bg-emerald-600/20 border-4 border-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30 animate-pulse">
              <img
                src={callState.peerUser?.avatar}
                alt={callState.peerUser?.name}
                className="w-28 h-28 rounded-full object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-slate-100">{callState.peerUser?.name}</h3>
            <p className="text-sm text-emerald-400 mt-2 font-medium">{callStatus}</p>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-6 bg-slate-900/90 px-8 py-4 rounded-full border border-slate-800 shadow-2xl z-20">
        {callState.incoming && !isAccepted ? (
          <>
            <button
              onClick={handleAcceptCall}
              className="px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/40 transition transform hover:scale-105"
            >
              <Phone className="w-5 h-5 fill-current" /> Accept
            </button>
            <button
              onClick={handleRejectCall}
              className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-600/40 transition transform hover:scale-105"
            >
              <PhoneOff className="w-5 h-5" /> Decline
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition ${
                isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {callState.callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition ${
                  isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}

            <button
              onClick={handleRejectCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-lg shadow-red-600/40 transform hover:scale-105"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
