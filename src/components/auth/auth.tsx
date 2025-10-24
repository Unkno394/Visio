'use client';
import './auth.css';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const router = useRouter();

  const handleRegisterClick = (): void => {
    setIsActive(true);
  };

  const handleLoginClick = (): void => {
    setIsActive(false);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    console.log('Form submitted');
    router.push('/');
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-[#191538]">
    
      <div className={`form-container ${isActive ? 'active' : ''}`}>
        <div className="form-box login">
          <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
            <h1 style={{ fontSize: '36px', margin: '-10px 0 15px 0', color: 'white' }}>Вход</h1>

            <div className="input-box">
              <input type="text" placeholder="Имя пользователя" required />
              <i className="bx bxs-user"></i>
            </div>

            <div className="input-box">
              <input type="password" placeholder="Пароль" required />
              <i className="bx bxs-lock-alt"></i>
            </div>

            <button type="submit" className="glass-btn" style={{ width: '100%', height: '48px' }}>
              Войти
            </button>
          </form>
        </div>

        <div className="form-box register">
          <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
            <h1 style={{ fontSize: '36px', margin: '-10px 0 15px 0', color: 'white' }}>Регистрация</h1>

            <div className="input-box">
              <input type="text" placeholder="Имя пользователя" required />
              <i className="bx bxs-user"></i>
            </div>

            <div className="input-box">
              <input type="email" placeholder="Email" required />
              <i className="bx bxs-envelope"></i>
            </div>

            <div className="input-box">
              <input type="password" placeholder="Пароль" required />
              <i className="bx bxs-lock-alt"></i>
            </div>

            <button type="submit" className="glass-btn" style={{ width: '100%', height: '48px' }}>
              Зарегистрироваться
            </button>
          </form>
        </div>

        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1 style={{ fontSize: '36px', marginBottom: '15px' }}>Добро пожаловать!</h1>
            <p style={{ marginBottom: '20px' }}>Нет аккаунта?</p>
            <button 
              className="glass-btn" 
              onClick={handleRegisterClick}
              style={{ width: '160px', height: '46px' }}
            >
              Регистрация
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1 style={{ fontSize: '36px', marginBottom: '15px' }}>С возвращением!</h1>
            <p style={{ marginBottom: '20px' }}>Уже есть аккаунт?</p>
            <button 
              className="glass-btn" 
              onClick={handleLoginClick}
              style={{ width: '160px', height: '46px' }}
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}