// app/profile/page.tsx
"use client";

import Link from "next/link";
import AnimatedBackground from "../../components/AnimatedBackground";
import { useTheme, WaveColor } from "../../contexts/ThemeContext";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-6">
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      {children}
    </div>
  );
}

function SettingItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/10 last:border-b-0 gap-2 sm:gap-4">
      <span className="text-white/90 font-medium min-w-[150px]">{label}</span>
      <div className="flex-1 flex justify-end sm:justify-start">{children}</div>
    </div>
  );
}

function WaveColorSelector({
  currentColor,
  onColorChange,
}: {
  currentColor: WaveColor;
  onColorChange: (color: WaveColor) => void;
}) {
  const colors: { color: WaveColor; name: string; bgClass: string }[] = [
    { color: "blue", name: "Синий", bgClass: "bg-blue-500" },
    { color: "green", name: "Зелёный", bgClass: "bg-green-500" },
    { color: "red", name: "Красный", bgClass: "bg-red-500" },
    { color: "yellow", name: "Жёлтый", bgClass: "bg-yellow-500" },
    { color: "purple", name: "Фиолетовый", bgClass: "bg-purple-500" },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map(({ color, name, bgClass }) => (
        <button
          key={color}
          onClick={() => onColorChange(color)}
          className={`w-8 h-8 rounded-full ${bgClass} border-2 transition-all duration-200 ${
            currentColor === color
              ? "border-white scale-110 shadow-lg"
              : "border-transparent hover:scale-105"
          }`}
          title={name}
        />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { waveColor, setWaveColor } = useTheme();

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground className="fixed inset-0 w-full h-full -z-10" />

      <div className="relative z-10">
        <header className="flex items-center justify-between p-4 md:p-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors no-underline"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>На главную</span>
          </Link>
          
        </header>

        <main className="container mx-auto px-4 md:px-6 max-w-4xl pb-8">
          <SettingsSection title="Внешний вид">
            <SettingItem label="Цвет волны">
              <div className="flex flex-col items-start gap-3">
                <span className="text-white/70 text-sm">Выберите цвет анимированной волны</span>
                <WaveColorSelector currentColor={waveColor} onColorChange={setWaveColor} />
              </div>
            </SettingItem>
          </SettingsSection>
        </main>
      </div>
    </div>
  );
}
