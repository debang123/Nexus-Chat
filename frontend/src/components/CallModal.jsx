import React, { useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

export default function CallModal() {
  const { callState, endCall } = useChatStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  if (!callState.active) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-8 backdrop-blur-xl select-none">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between max-w-4xl text-slate-300">
        <div className="flex items-center gap-3">
          <img
            src={callState.peerUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
            alt={callState.peerUser?.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
          />
          <div>
            <h3 className="text-lg font-bold text-slate-100">{callState.peerUser?.name || 'Calling...'}</h3>
            <p className="text-xs text-emerald-400 font-medium">
              {callState.incoming ? 'Incoming Call...' : 'Connecting WebRTC End-to-End Encrypted...'}
            </p>
          </div>
        </div>
        <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider">
          {callState.callType} Call
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="flex-1 w-full max-w-4xl my-6 relative bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-2xl">
        {callState.callType === 'video' && !isVideoOff ? (
          <div className="w-full h-full relative bg-slate-950 flex items-center justify-center">
            {/* Simulated Remote Stream placeholder or WebRTC Video Element */}
            <img
              src={callState.peerUser?.avatar}
              alt="Remote Video"
              className="w-full h-full object-cover opacity-80 filter blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40 flex items-center justify-center">
              <div className="text-center">
                <img
                  src={callState.peerUser?.avatar}
                  alt={callState.peerUser?.name}
                  className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-emerald-500 shadow-2xl animate-pulse"
                />
                <h4 className="text-xl font-bold text-slate-100">{callState.peerUser?.name}</h4>
              </div>
            </div>

            {/* Local Video Thumbnail Box */}
            <div className="absolute bottom-4 right-4 w-40 h-28 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl">
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                You
              </div>
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
            <p className="text-sm text-slate-400 mt-2">Audio Call in Progress</p>
          </div>
        )}
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center gap-6 bg-slate-900/90 px-8 py-4 rounded-full border border-slate-800 shadow-2xl">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full transition ${
            isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {callState.callType === 'video' && (
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-4 rounded-full transition ${
              isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-lg shadow-red-600/40 transform hover:scale-105"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
