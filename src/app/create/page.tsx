// app/room/[id]/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Participant {
  id: string;
  name: string;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  stream?: MediaStream;
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
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Имитация подключения участников
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
    }, 2000);

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

  // Функция для расчета grid-классов в зависимости от количества участников
  const getGridClass = (count: number) => {
    switch (count) {
      case 1:
        return "grid-cols-1 grid-rows-1";
      case 2:
        return "grid-cols-2 grid-rows-1";
      case 3:
        return "grid-cols-2 grid-rows-2";
      case 4:
        return "grid-cols-2 grid-rows-2";
      case 5:
      case 6:
        return "grid-cols-3 grid-rows-2";
      case 7:
      case 8:
        return "grid-cols-4 grid-rows-2";
      case 9:
        return "grid-cols-3 grid-rows-3";
      default:
        return "grid-cols-4 grid-rows-3";
    }
  };

  // Функция для расчета размера видео в зависимости от количества участников
  const getVideoSizeClass = (count: number) => {
    if (count <= 4) {
      return "h-full";
    } else if (count <= 9) {
      return "h-64";
    } else {
      return "h-48";
    }
  };

  const toggleAudio = () => {
    setIsAudioMuted(!isAudioMuted);
    // Обновляем состояние локального участника
    setParticipants(prev => 
      prev.map(p => 
        p.id === "local" ? { ...p, isAudioMuted: !isAudioMuted } : p
      )
    );
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // Обновляем состояние локального участника
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
        
        // Обработка остановки демонстрации экрана
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          initializeMedia(); // Возвращаем камеру
        };
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    } else {
      setIsScreenSharing(false);
      initializeMedia(); // Возвращаем камеру
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    // Можно добавить toast-уведомление
  };

  const leaveRoom = () => {
    router.push("/home");
  };

  // Компонент видео участника
  const VideoTile = ({ participant, isLocal = false }: { participant: Participant; isLocal?: boolean }) => (
    <div className="relative bg-gray-800 rounded-xl overflow-hidden group">
      {/* Видео элемент */}
      <video
        ref={isLocal ? localVideoRef : null}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full ${getVideoSizeClass(participants.length)} object-cover ${
          participant.isVideoOff ? 'hidden' : ''
        }`}
      />
      
      {/* Заглушка когда видео выключено */}
      {participant.isVideoOff && (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl font-semibold">
                {participant.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <p className="text-white text-sm">{participant.name}</p>
          </div>
        </div>
      )}
      
      {/* Информация об участнике */}
      <div className="absolute bottom-3 left-3 bg-black/60 rounded-lg px-3 py-1.5">
        <div className="flex items-center gap-2">
          {participant.isAudioMuted && (
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
          <span className="text-white text-sm font-medium">
            {participant.name} {isLocal && "(Вы)"}
          </span>
        </div>
      </div>
      
      {/* Индикаторы статуса */}
      <div className="absolute top-3 right-3 flex gap-1">
        {participant.isAudioMuted && !isLocal && (
          <div className="bg-red-500 rounded-full p-1">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        )}
        {isLocal && isScreenSharing && (
          <div className="bg-blue-500 rounded-lg px-2 py-1">
            <span className="text-white text-xs font-medium">Демонстрация</span>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Подключение к комнате...</p>
          <p className="text-white/70 mt-2">ID комнаты: {roomId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <Link 
            href="/home" 
            className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="bg-black/50 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 text-white">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">ID: {roomId}</span>
                <button
                  onClick={copyRoomId}
                  className="text-white/70 hover:text-white transition-colors"
                  title="Скопировать ID комнаты"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="bg-black/50 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 text-white text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{participants.length} участников</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Video Grid Area */}
      <div className="h-screen flex items-center justify-center p-4 pt-20 pb-32">
        <div 
          ref={videoContainerRef}
          className={`w-full h-full max-w-7xl grid ${getGridClass(participants.length)} gap-4 auto-rows-fr`}
        >
          {participants.map((participant) => (
            <VideoTile
              key={participant.id}
              participant={participant}
              isLocal={participant.id === "local"}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-4">
          {/* Кнопка микрофона */}
          <button
            onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isAudioMuted 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isAudioMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>

          {/* Кнопка камеры */}
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isVideoOff 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isVideoOff ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              )}
            </svg>
          </button>

          {/* Кнопка демонстрации экрана */}
          <button
            onClick={toggleScreenShare}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isScreenSharing 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>

          {/* Кнопка завершения звонка */}
          <button
            onClick={leaveRoom}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-200"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}