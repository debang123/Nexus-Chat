import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { getSocket } from '../services/socket';

export default function CallModal() {
  const { callState, endCall } = useChatStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [isAccepted, setIsAccepted] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    if (!callState.active) {
      cleanupMediaStreams();
      setIsAccepted(false);
      return;
    }

    if (callState.incoming) {
      setCallStatus('Incoming Call...');
    } else {
      setCallStatus('Ringing...');
      startLocalMediaStream();
    }

    const socket = getSocket();
    if (!socket) return;

    const handleCallAccepted = async () => {
      setCallStatus('Call Connected');
      setIsAccepted(true);
    };

    const handleCallRejected = () => {
      setCallStatus('Call Rejected');
      setTimeout(() => endCall(), 1500);
    };

    const handleCallEnded = () => {
      setCallStatus('Call Ended');
      setTimeout(() => endCall(), 1000);
    };

    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
    };
  }, [callState.active, callState.incoming]);

  const startLocalMediaStream = async () => {
    try {
      const constraints = {
        audio: true,
        video: callState.callType === 'video',
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('[WebRTC] Camera/Microphone access error:', err.message);
      setCallStatus('Camera/Mic permission required');
    }
  };

  const handleAcceptCall = async () => {
    setIsAccepted(true);
    setCallStatus('Connecting Media...');
    await startLocalMediaStream();

    const socket = getSocket();
    if (socket && callState.peerUser) {
      socket.emit('call:accept', {
        toUserId: callState.peerUser._id,
      });
    }
  };

  const handleRejectCall = () => {
    const socket = getSocket();
    if (socket && callState.peerUser) {
      socket.emit('call:reject', {
        toUserId: callState.peerUser._id,
      });
    }
    endCall();
  };

  const cleanupMediaStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // Toggle enabled state
      }
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff; // Toggle enabled state
      }
    }
    setIsVideoOff(!isVideoOff);
  };

  if (!callState.active) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-6 backdrop-blur-2xl select-none">
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
            {/* Remote Video Stream / Placeholder */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {(!isAccepted || isVideoOff) && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
                <img
                  src={callState.peerUser?.avatar}
                  alt={callState.peerUser?.name}
                  className="w-28 h-28 rounded-full object-cover mb-4 border-4 border-emerald-500 shadow-2xl animate-pulse"
                />
                <h4 className="text-xl font-bold text-slate-100">{callState.peerUser?.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{callStatus}</p>
              </div>
            )}

            {/* Local Video Thumbnail Box */}
            <div className="absolute bottom-4 right-4 w-36 h-28 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
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
      <div className="flex items-center gap-6 bg-slate-900/90 px-8 py-4 rounded-full border border-slate-800 shadow-2xl">
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
