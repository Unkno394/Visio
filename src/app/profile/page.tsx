// app/profile/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import AnimatedBackground from "../../components/AnimatedBackground";
import { useTheme, WaveColor } from "../../contexts/ThemeContext";
import AlertDialog from "../../components/AlertDialog";

/* ---------- Кастомный хук для кастомного алерта ---------- */
function useCustomAlert() {
  const [alertData, setAlertData] = useState<{
    title: string;
    description: string;
    confirmText?: string;
    confirmColor?: "red" | "blue" | "green" | "yellow" | "purple";
  } | null>(null);

  const showAlert = (
    title: string,
    description: string,
    confirmText = "ОК",
    confirmColor: "blue" | "red" | "green" | "yellow" | "purple" = "blue"
  ) => {
    setAlertData({ title, description, confirmText, confirmColor });
  };

  const alertComponent = alertData ? (
    <AlertDialog
      trigger={<></>}
      title={alertData.title}
      description={alertData.description}
      cancelText=""
      confirmText={alertData.confirmText}
      confirmColor={alertData.confirmColor}
      onConfirm={() => setAlertData(null)}
      onCancel={() => setAlertData(null)}
    />
  ) : null;

  return { showAlert, alertComponent };
}

/* ---------- Компоненты ---------- */
function UserProfileHeader({
  username,
  onEdit,
  isEditing,
  newUsername,
  onChangeUsername,
  onSave,
  onCancel,
  waveColor,
}: {
  username: string;
  onEdit: () => void;
  isEditing: boolean;
  newUsername: string;
  onChangeUsername: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  waveColor: WaveColor;
}) {
  const getWaveColorClass = (color: WaveColor) => {
    switch (color) {
      case "blue": return "from-blue-400 to-blue-600";
      case "green": return "from-green-400 to-green-600";
      case "red": return "from-red-400 to-red-600";
      case "yellow": return "from-yellow-400 to-yellow-600";
      case "purple": return "from-purple-400 to-purple-600";
      default: return "from-blue-400 to-blue-600";
    }
  };

  return (
    <div className="flex items-center gap-4 mb-8">
      <div
        className={`w-20 h-20 rounded-full bg-gradient-to-br ${getWaveColorClass(
          waveColor
        )} flex items-center justify-center text-white font-semibold text-2xl`}
      >
        {username.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        {isEditing ? (
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => onChangeUsername(e.target.value)}
              className="bg-white/20 border border-white/30 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-white/50 flex-1"
              placeholder="Введите имя пользователя"
              maxLength={20}
            />
            <div className="flex gap-2">
              <button
                onClick={onSave}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors whitespace-nowrap"
              >
                Сохранить
              </button>
              <button
                onClick={onCancel}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded text-sm transition-colors whitespace-nowrap"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{username}</h1>
            <button
              onClick={onEdit}
              className="text-blue-400 hover:text-blue-300 transition-colors"
              title="Изменить ник"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 
                  2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </div>
        )}
        <p className="text-white/70">user@example.com</p>
      </div>
    </div>
  );
}

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

/* ---------- Основной компонент ---------- */
export default function ProfilePage() {
  const { waveColor, setWaveColor } = useTheme();
  const { showAlert, alertComponent } = useCustomAlert();

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [username, setUsername] = useState("User_123");
  const [newUsername, setNewUsername] = useState("User_123");
  const [email, setEmail] = useState("user@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUsernameSave = () => {
    if (newUsername.trim() === "") {
      showAlert("Ошибка", "Имя пользователя не может быть пустым", "Понял", "red");
      return;
    }
    if (newUsername.length < 3) {
      showAlert("Ошибка", "Имя пользователя должно содержать минимум 3 символа", "ОК", "red");
      return;
    }
    setUsername(newUsername);
    setIsEditingUsername(false);
    showAlert("Успешно", "Имя пользователя изменено!", "Хорошо", "green");
  };

  const handleUsernameCancel = () => {
    setNewUsername(username);
    setIsEditingUsername(false);
  };

  const handleEmailSave = () => {
    if (email.trim() === "") {
      showAlert("Ошибка", "Email не может быть пустым", "Понял", "red");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("Ошибка", "Введите корректный email", "ОК", "red");
      return;
    }
    setIsEditingEmail(false);
    showAlert("Успешно", "Email успешно изменён!", "Хорошо", "green");
  };

  const handlePasswordSave = () => {
    if (newPassword !== confirmPassword) {
      showAlert("Ошибка", "Пароли не совпадают", "Понял", "red");
      return;
    }
    if (newPassword.length < 6) {
      showAlert("Ошибка", "Пароль должен содержать минимум 6 символов", "ОК", "red");
      return;
    }
    setIsEditingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showAlert("Успешно", "Пароль успешно изменён!", "Хорошо", "green");
  };

  const handleLogout = () => {
    showAlert("Выход", "Выход выполнен. До скорого!", "ОК", "yellow");
    setTimeout(() => (window.location.href = "/login"), 1000);
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground className="fixed inset-0 w-full h-full -z-10" />

      <div className="relative z-10">
        <header className="flex items-center justify-between p-4 md:p-6">
          <Link
            href="/home"
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors no-underline"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>На главную</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-white/70 hidden sm:inline">Профиль</span>
          </div>
        </header>

        <main className="container mx-auto px-4 md:px-6 max-w-4xl pb-8">
          <UserProfileHeader
            username={username}
            onEdit={() => setIsEditingUsername(true)}
            isEditing={isEditingUsername}
            newUsername={newUsername}
            onChangeUsername={setNewUsername}
            onSave={handleUsernameSave}
            onCancel={handleUsernameCancel}
            waveColor={waveColor}
          />

          {/* Личная информация */}
          <SettingsSection title="Личная информация">
            <SettingItem label="Электронная почта">
              {isEditingEmail ? (
                <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/20 border border-white/30 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-white/50 flex-1"
                    placeholder="Введите email"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEmailSave}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors whitespace-nowrap"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setIsEditingEmail(false)}
                      className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded text-sm transition-colors whitespace-nowrap"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-white/70">{email}</span>
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors whitespace-nowrap"
                  >
                    Изменить
                  </button>
                </div>
              )}
            </SettingItem>
          </SettingsSection>

          {/* Безопасность */}
          <SettingsSection title="Безопасность">
            <SettingItem label="Смена пароля">
              {isEditingPassword ? (
                <div className="flex flex-col gap-3 w-full max-w-md">
                  <input
                    type="password"
                    placeholder="Текущий пароль"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-white/20 border border-white/30 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                  />
                  <input
                    type="password"
                    placeholder="Новый пароль"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white/20 border border-white/30 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                  />
                  <input
                    type="password"
                    placeholder="Подтвердите пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/20 border border-white/30 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handlePasswordSave}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors flex-1"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setIsEditingPassword(false)}
                      className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded text-sm transition-colors flex-1"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingPassword(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors whitespace-nowrap"
                >
                  Сменить пароль
                </button>
              )}
            </SettingItem>
          </SettingsSection>

          {/* Внешний вид */}
          <SettingsSection title="Внешний вид">
            <SettingItem label="Цвет волны">
              <div className="flex flex-col items-start gap-3">
                <span className="text-white/70 text-sm">Выберите цвет анимированной волны</span>
                <WaveColorSelector currentColor={waveColor} onColorChange={setWaveColor} />
              </div>
            </SettingItem>
          </SettingsSection>

          {/* Действия */}
          <SettingsSection title="Действия">
            <SettingItem label="Выйти из системы">
              <AlertDialog
                trigger={
                  <button className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 px-6 py-3 rounded-lg transition-colors duration-300 border border-red-500/30 whitespace-nowrap">
                    Выйти из системы
                  </button>
                }
                title="Выход из системы"
                description="Вы уверены, что хотите выйти? Все несохранённые данные будут потеряны."
                cancelText="Отмена"
                confirmText="Выйти"
                confirmColor="red"
                onConfirm={handleLogout}
              />
            </SettingItem>
          </SettingsSection>

          <div className="text-center text-white/50 text-sm mt-8">
            <p>Аккаунт создан: 15 января 2024</p>
            <p className="mt-1">Последний вход: сегодня в 14:30</p>
          </div>

          {/* Рендер кастомного алерта */}
          {alertComponent}
        </main>
      </div>
    </div>
  );
}
