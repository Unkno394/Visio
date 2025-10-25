"use client"; 

import Link from 'next/link';
import Image from 'next/image';
import AnimatedBackground from '../components/AnimatedBackground';

function HeaderOverlay() {
  return (
    <div className="fixed top-[5%] left-1/2 -translate-x-1/2 w-[90%] backdrop-blur-md bg-white/10 rounded-lg z-50 border border-white/20 header-overlay-responsive">
      <div className="flex flex-row max-[320px]:flex-col max-[320px]:items-stretch justify-between items-center px-6 py-4 header-content-responsive">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 relative">
            <Image 
              src="/avatar.svg" 
              alt="Avatar" 
              width={32} 
              height={32}
              className="object-contain"
            />
          </div>
          <span className="text-white font-semibold text-lg jua-font">Visio</span>
        </div>

        <div className="flex items-center gap-4 max-[320px]:justify-center header-buttons-responsive">
          {/* Кнопки используют Montserrat Alternates по умолчанию */}
          <Link 
            href="/auth"
            className="text-white hover:text-gray-200 transition-colors px-3 py-1 font-medium"
          >
            Вход
          </Link>
          <Link 
            href="/auth"
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors border border-white/30 font-medium"
          >
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <div className="fixed top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-4xl text-center z-40">
      <div className="flex justify-center mb-8">
        <div className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 relative">
          <Image
            src="/123.svg"
            alt="Visio"
            width={256}
            height={256}
            className="object-contain w-full h-full"
            priority
          />
        </div>
      </div>

      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
        Общайтесь и работайте вместе с Visio.
      </h1>

      <p className="text-lg md:text-xl lg:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-normal">
        Высококачественные видеовстречи для командной работы и неформального общения — теперь расстояние не преграда. 
        Подключайтесь с любого устройства, из любой точки мира.
      </p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative w-full h-full min-h-screen">
      <AnimatedBackground className="fixed inset-0 w-full h-full -z-10" />
      <HeaderOverlay />
      <HeroSection />
    </div>
  );
}