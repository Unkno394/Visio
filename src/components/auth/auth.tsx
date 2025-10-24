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

  const handleBackToHome = (): void => {
    router.push('/');
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gradient-to-r from-gray-200 to-blue-100">
      <button 
        onClick={handleBackToHome}
        className="absolute top-6 left-6 z-50 bg-white/80 hover:bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg transition-all duration-200 backdrop-blur-sm border border-gray-200"
      >
        ← На главную
      </button>
      
      <div className={`form-container ${isActive ? 'active' : ''}`}>
        <div className="form-box login">
          <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
            <h1 style={{ fontSize: '36px', margin: '-10px 0 15px 0' }}>Вход</h1>

            <div className="input-box">
              <input type="text" placeholder="Имя пользователя" required />
              <i className="bx bxs-user"></i>
            </div>

            <div className="input-box">
              <input type="password" placeholder="Пароль" required />
              <i className="bx bxs-lock-alt"></i>
            </div>

            <div className="forgot-link">
              <a href="#" style={{ fontSize: '14.5px', color: '#333' }}>
                Забыли пароль?
              </a>
            </div>

            <button type="submit" className="btn-primary">Войти</button>

            <p style={{ fontSize: '14.5px', margin: '15px 0' }}>или войдите через соцсети</p>

            <div className="social-icons">
              <a href="#"><i className="bx bxl-google"></i></a>
              <a href="#"><i className="bx bxl-facebook"></i></a>
              <a href="#"><i className="bx bxl-github"></i></a>
              <a href="#"><i className="bx bxl-linkedin"></i></a>
            </div>
          </form>
        </div>

        <div className="form-box register">
          <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
            <h1 style={{ fontSize: '36px', margin: '-10px 0 15px 0' }}>Регистрация</h1>

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

            <button type="submit" className="btn-primary">Зарегистрироваться</button>

            <p style={{ fontSize: '14.5px', margin: '15px 0' }}>или зарегистрируйтесь через соцсети</p>

            <div className="social-icons">
              <a href="#"><i className="bx bxl-google"></i></a>
              <a href="#"><i className="bx bxl-facebook"></i></a>
              <a href="#"><i className="bx bxl-github"></i></a>
              <a href="#"><i className="bx bxl-linkedin"></i></a>
            </div>
          </form>
        </div>

        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1 style={{ fontSize: '36px', marginBottom: '15px' }}>Добро пожаловать!</h1>
            <p style={{ marginBottom: '20px' }}>Нет аккаунта?</p>
            <button className="btn-primary btn-outline" onClick={handleRegisterClick}>
              Регистрация
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1 style={{ fontSize: '36px', marginBottom: '15px' }}>С возвращением!</h1>
            <p style={{ marginBottom: '20px' }}>Уже есть аккаунт?</p>
            <button className="btn-primary btn-outline" onClick={handleLoginClick}>
              Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}