import React, { useState, useEffect } from 'react';
import { globalStyles } from './constants';
import { Toast, SplashScreen, TransitionLoading } from './components/SharedUI';
import { LoginScreen, ProfileModal, AdminModal } from './components/Auth';
import { FunctionalBoard } from './components/FunctionalBoard';
import { DevicesDashboard } from './components/DevicesModule';
import { ScheduleDashboard } from './components/ScheduleModule';
import { ProjectsDashboard } from './components/ProjectsModule';

export default function App() {
  // 1. 세션 스토리지에서 이전 화면과 로그인 유저 상태를 읽어와 초기값으로 설정
  const [screen, setScreen] = useState(() => {
    return sessionStorage.getItem('qa_base_current_screen') || 'splash';
  });
  
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('qa_base_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [toastMessage, setToastMessage] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // 2. 현재 화면 상태(screen)가 변경될 때마다 세션 스토리지에 자동 백업
  useEffect(() => {
    sessionStorage.setItem('qa_base_current_screen', screen);
  }, [screen]);

  // 3. 로그인 유저 상태(user)가 변경될 때마다 세션 스토리지에 자동 백업 (로그아웃 시 삭제)
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('qa_base_current_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('qa_base_current_user');
    }
  }, [user]);

  // 4. 전역 CSS 스타일 주입 로직
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = globalStyles;
    document.head.appendChild(styleSheet);
    return () => { document.head.removeChild(styleSheet); };
  }, []);

  // 5. PWA(앱 설치) 기능 활성화 로직
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setScreen('loadingBoard');
  };

  const showToast = (msg) => setToastMessage(msg);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      showToast('기기가 PWA 설치를 지원하지 않거나 이미 설치되어 있습니다.');
    }
  };

  return (
    <>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
      {screen === 'splash' && <SplashScreen onComplete={() => setScreen('login')} />}
      {screen === 'login' && <LoginScreen onLogin={handleLogin} onInstallApp={handleInstallApp} />}
      {screen === 'loadingBoard' && <TransitionLoading title="Functional Board" onComplete={() => setScreen('board')} />}
      {screen === 'board' && <FunctionalBoard user={user} onNavigate={(target) => setScreen(`loading_${target}`)} onLogout={() => { setUser(null); setScreen('login'); }} onShowProfileModal={() => setShowProfileModal(true)} onShowAdminModal={() => setShowAdminModal(true)} />}
      
      {screen === 'loading_dashboard' && <TransitionLoading title="Devices Dashboard" onComplete={() => setScreen('dashboard')} />}
      {screen === 'dashboard' && <DevicesDashboard user={user} onNavigate={(target) => setScreen(target === 'board' ? 'loadingBoard' : target)} onLogout={() => { setUser(null); setScreen('login'); }} onQuit={() => { setUser(null); setScreen('splash'); }} />}
      
      {screen === 'loading_schedule' && <TransitionLoading title="Schedule Manager" onComplete={() => setScreen('schedule')} />}
      {screen === 'schedule' && <ScheduleDashboard user={user} onNavigate={(target) => setScreen(target === 'board' ? 'loadingBoard' : target)} onLogout={() => { setUser(null); setScreen('login'); }} onQuit={() => { setUser(null); setScreen('splash'); }} />}

      {screen === 'loading_projects' && <TransitionLoading title="Jira Projects" onComplete={() => setScreen('projects')} />}
      {screen === 'projects' && <ProjectsDashboard user={user} onNavigate={(target) => setScreen(target === 'board' ? 'loadingBoard' : target)} onLogout={() => { setUser(null); setScreen('login'); }} onQuit={() => { setUser(null); setScreen('splash'); }} />}
      
      {showProfileModal && user && <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onUpdateProfile={(image) => setUser({...user, profileImage: image})} />}
      {showAdminModal && <AdminModal onClose={() => setShowAdminModal(false)} />}
    </>
  );
}
