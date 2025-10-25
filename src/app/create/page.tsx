// app/room/[id]/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChatPanel } from "../../components/ChatPanel";

interface Participant {
  id: string;
  name: string;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  stream?: MediaStream;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  emoji?: string;
}

function VideoTile({ 
  participant, 
  isLocal = false 
}: { 
  participant: Participant; 
  isLocal?: boolean; 
}) {
  const getVideoSizeClass = (count: number) => {
    if (count <= 4) return "h-full";
    else if (count <= 9) return "h-64";
    else return "h-48";
  };

  return (
    <div className="relative bg-gray-800 rounded-2xl overflow-hidden group hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-white/10">
      <video
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full ${getVideoSizeClass(4)} object-cover ${
          participant.isVideoOff ? 'hidden' : ''
        }`}
      />
      
      {participant.isVideoOff && (
        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <span className="text-white text-2xl font-bold">
                {participant.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <p className="text-white font-semibold">{participant.name}</p>
            <p className="text-white/60 text-sm mt-1">Камера выключена</p>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 border border-white/20">
        <div className="flex items-center gap-2">
          {participant.isAudioMuted && (
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
          <span className="text-white text-sm font-medium">
            {participant.name} {isLocal && "(Вы)"}
          </span>
        </div>
      </div>
      
      <div className="absolute top-3 right-3 flex gap-2">
        {participant.isAudioMuted && !isLocal && (
          <div className="bg-red-500 rounded-lg px-2 py-1 backdrop-blur-md border border-white/20">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      userId: 'system',
      userName: 'Система',
      text: 'Добро пожаловать в комнату! Начните общение в чате 🎉',
      timestamp: new Date()
    }
  ]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mockParticipants: Participant[] = [
      {
        id: "local",
        name: "Вы",
        isAudioMuted: false,
        isVideoOff: false
      },
      {
        id: "user2",
        name: "Алексей Петров",
        isAudioMuted: true,
        isVideoOff: false
      },
      {
        id: "user3", 
        name: "Мария Иванова",
        isAudioMuted: false,
        isVideoOff: true
      },
      {
        id: "user4",
        name: "Дмитрий Сидоров", 
        isAudioMuted: false,
        isVideoOff: false
      }
    ];

    const timer = setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      setParticipants(mockParticipants);
      initializeMedia();
    }, 1500);

    return () => clearTimeout(timer);
  }, [roomId]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const getGridClass = (count: number) => {
    switch (count) {
      case 1: return "grid-cols-1 grid-rows-1";
      case 2: return "grid-cols-2 grid-rows-1";
      case 3: return "grid-cols-2 grid-rows-2";
      case 4: return "grid-cols-2 grid-rows-2";
      case 5: case 6: return "grid-cols-3 grid-rows-2";
      case 7: case 8: return "grid-cols-4 grid-rows-2";
      case 9: return "grid-cols-3 grid-rows-3";
      default: return "grid-cols-4 grid-rows-3";
    }
  };

  const toggleAudio = () => {
    setIsAudioMuted(!isAudioMuted);
    setParticipants(prev => 
      prev.map(p => 
        p.id === "local" ? { ...p, isAudioMuted: !isAudioMuted } : p
      )
    );
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    setParticipants(prev => 
      prev.map(p => 
        p.id === "local" ? { ...p, isVideoOff: !isVideoOff } : p
      )
    );
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        setIsScreenSharing(true);
        
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          initializeMedia();
        };
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    } else {
      setIsScreenSharing(false);
      initializeMedia();
    }
  };

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      userId: 'local',
      userName: 'Вы',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  const leaveRoom = () => {
    router.push("/home");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-white text-2xl font-bold mb-2">Подключаем к комнате...</h2>
          <p className="text-white/60">ID комнаты: {roomId}</p>
          <div className="mt-6 w-64 bg-white/10 rounded-full h-2 mx-auto">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Link 
            href="/home" 
            className="inline-flex items-center gap-3 text-white hover:text-white/80 transition-all duration-200 group"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 border border-white/20">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span className="font-semibold text-sm sm:text-base">Назад</span>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 text-white">
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="font-medium text-sm sm:text-base">ID: {roomId}</span>
                <button
                  onClick={copyRoomId}
                  className="text-white/70 hover:text-white transition-all duration-200 hover:scale-110"
                  title="Скопировать ID комнаты"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 text-white">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-medium text-sm sm:text-base">
                  <span className="sm:hidden">{participants.length}</span>
                  <span className="hidden sm:inline">{participants.length} участников</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Video Grid Area */}
      <div className={`h-screen flex items-center justify-center p-4 pt-20 sm:pt-24 pb-28 sm:pb-36 transition-all duration-500 ${
        isChatOpen ? '2xl:pr-[480px]' : ''
      }`}>
        <div 
          ref={videoContainerRef}
          className={`w-full h-full max-w-7xl grid ${getGridClass(participants.length)} gap-4 sm:gap-6 auto-rows-fr transition-all duration-500`}
        >
          {participants.map((participant) => (
            <VideoTile
              key={participant.id}
              participant={participant}
              isLocal={participant.id === "local"}
            />
          ))}
        </div>

        {/* Chat Panel */}
        <ChatPanel
          isOpen={isChatOpen}
          messages={messages}
          onSendMessage={handleSendMessage}
          participants={participants}
          onClose={() => setIsChatOpen(false)}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-md">
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          {/* Microphone */}
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isAudioMuted 
                ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/25' 
                : 'bg-white/10 hover:bg-white/20 hover:scale-110 border border-white/20'
            }`}
          >
            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isAudioMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>

          {/* Camera */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isVideoOff 
                ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/25' 
                : 'bg-white/10 hover:bg-white/20 hover:scale-110 border border-white/20'
            }`}
          >
            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isVideoOff ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              )}
            </svg>
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isScreenSharing 
                ? 'bg-blue-500 hover:bg-blue-600 scale-110 shadow-blue-500/25' 
                : 'bg-white/10 hover:bg-white/20 hover:scale-110 border border-white/20'
            }`}
          >
            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>

          {/* Chat */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isChatOpen 
                ? 'bg-green-500 hover:bg-green-600 scale-110 shadow-green-500/25' 
                : 'bg-white/10 hover:bg-white/20 hover:scale-110 border border-white/20'
            }`}
          >
            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* Leave Call */}
          <button
            onClick={leaveRoom}
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-110 shadow-red-500/25 border border-red-400/20"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}