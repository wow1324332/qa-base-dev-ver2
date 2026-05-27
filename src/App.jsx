import React, { useState, useEffect } from 'react';
import { globalStyles } from './constants';
import { Toast, SplashScreen, TransitionLoading } from './components/SharedUI';
import { LoginScreen, ProfileModal, AdminModal } from './components/Auth';
import { FunctionalBoard } from './components/FunctionalBoard';
import { DevicesDashboard } from './components/DevicesModule';
import { ScheduleDashboard } from './components/ScheduleModule';

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [user, setUser] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = globalStyles;
    document.head.appendChild(styleSheet);
    return () => { document.head.removeChild(styleSheet); };
  }, []);

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

      {showProfileModal && user && <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onUpdateProfile={(image) => setUser({...user, profileImage: image})} />}
      {showAdminModal && <AdminModal onClose={() => setShowAdminModal(false)} />}
    </>
  );
}
