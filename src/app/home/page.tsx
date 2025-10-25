// app/page.tsx
"use client";
import "./home.css";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AnimatedBackground from "../../components/AnimatedBackground";
import { useTheme } from "../../contexts/ThemeContext";

// Компонент модалки для подключения
function JoinModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const [roomId, setRoomId] = useState("");

  const handleJoin = () => {
    // Всегда переходим на /create независимо от введенного ID
    window.location.href = `/create`;
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Подключиться к встрече</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">
            Введите ID комнаты
          </label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Например: ABC123XY"
            className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300"
          >
            Отмена
          </button>
          <button
            onClick={handleJoin}
            className="flex-1 bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-4 rounded-lg transition-all duration-300"
          >
            Подключиться
          </button>
        </div>
      </div>
    </div>
  );
}

function BurgerMenu({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer z-50"
      aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
    >
      <span
        className={`block absolute w-6 h-0.5 bg-white transition-all duration-500 transform ${
          isOpen ? "rotate-45" : "-translate-y-1.5"
        }`}
      />
      <span
        className={`block absolute w-6 h-0.5 bg-white transition-all duration-400 transform ${
          isOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"
        }`}
      />
      <span
        className={`block absolute w-6 h-0.5 bg-white transition-all duration-500 transform ${
          isOpen ? "-rotate-45" : "translate-y-1.5"
        }`}
      />
    </button>
  );
}

function UserProfile() {
  return (
    <Link 
      href="/profile" 
      className="fixed top-4 right-4 z-30 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-2 hover:bg-white/20 transition-all duration-400 cursor-pointer no-underline"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
        U
      </div>
      <span className="text-white font-medium text-sm hidden sm:block">
        User_123
      </span>
    </Link>
  );
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const { isDarkTheme, waveColor } = useTheme();

  const toggleMenu = () => setIsMenuOpen((s) => !s);

  return (
    <div className="min-h-screen relative">
      {/* фон */}
      <AnimatedBackground className="fixed inset-0 w-full h-full -z-10" />

      <div className="relative z-10 flex flex-col md:flex-row h-screen">
        {/* Сайдбар */}
        <aside
          className={`fixed md:relative z-40 w-64 bg-white/10 backdrop-blur-md border-r border-white/20 h-screen p-6 transition-transform duration-450 ease-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Заголовок с логотипом и бургером */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Image 
                  src="/avatar.svg" 
                  alt="Visio Logo" 
                  width={32} 
                  height={32}
                  className="w-8 h-8"
                />
                <span className="text-white font-semibold text-xl">Visio</span>
              </div>

              {/* Бургер только в мобильной версии */}
              <div className="md:hidden">
                <BurgerMenu isOpen={isMenuOpen} onClick={toggleMenu} />
              </div>
            </div>

            {/* Навигация */}
            <nav className="flex flex-col space-y-2 flex-grow">
              <Link
                href="#"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all duration-300 hover:scale-102"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">Встречи</span>
              </Link>

              <Link
                href="#"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/20 hover:text-white transition-all duration-300 hover:scale-102"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                <span className="font-medium">Вызовы</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* overlay для мобильных — закрывает меню по клику */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Основная область */}
        <main className="flex-1 flex items-center justify-center p-4 md:p-8">
          {/* Профиль */}
          <UserProfile />

          {/* Бургер для открытия меню на мобильных (только когда меню закрыто) */}
          {!isMenuOpen && (
            <div className="fixed top-4 left-4 z-50 md:hidden">
              <BurgerMenu isOpen={isMenuOpen} onClick={toggleMenu} />
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 md:p-12 w-full max-w-4xl mt-8 sm:mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 justify-items-center">
              {/* Кнопка создания встречи */}
              <Link
                href="/create"
                className="group w-full max-w-xs bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-500 flex flex-col items-center justify-center text-white no-underline"
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-500">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-center">
                  Создать видеовстречу
                </span>
              </Link>

              {/* Кнопка подключения (открывает модалку) */}
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="group w-full max-w-xs bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-500 flex flex-col items-center justify-center text-white cursor-pointer"
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-500">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-center">
                  Подключиться
                </span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Модалка подключения */}
      <JoinModal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
      />
    </div>
  );
}