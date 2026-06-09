import React, { useState, useEffect } from 'react';
import { MonitorSmartphone } from 'lucide-react'; // [추가] 시네마틱 스플래시에 사용할 아이콘
import { globalStyles } from './constants';
import { Toast, TransitionLoading } from './components/SharedUI'; // [수정] 밋밋한 기존 SplashScreen 제거
import { LoginScreen, ProfileModal, AdminModal } from './components/Auth';
import { FunctionalBoard } from './components/FunctionalBoard';
import { DevicesDashboard } from './components/DevicesModule';
import { ScheduleDashboard } from './components/ScheduleModule';
import { ProjectsDashboard } from './components/ProjectsModule';
import { AccountsDashboard } from './components/AccountsModule';

// [추가] 스플래시 로딩 화면 내부에서 사용할 로고 컴포넌트
const AppLogo = ({ className }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) return <MonitorSmartphone className={`text-blue-600 ${className}`} strokeWidth={1.5} />;
  return <img src="/icon-192x192.png" alt="QA Base" className={`object-contain ${className}`} onError={() => setImgError(true)} />;
};

// [추가] 역동적이고 시네마틱한 원형 로딩 애니메이션 컴포넌트
const CinematicSplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 200); // 100% 도달 후 부드럽게 넘어가도록 짧은 딜레이
          return 100;
        }
        // 초반은 빠르게, 후반은 부드럽게 감속하는 자연스러운 로딩 속도 계산
        const remaining = 100 - prev;
        const increment = Math.max(0.3, remaining * 0.08); 
        return Math.min(100, prev + increment);
      });
    }, 30); 

    return () => clearInterval(interval);
  }, [onComplete]);

  // SVG 원형 렌더링을 위한 수학 계산 (로고를 두르는 큰 크기)
  const radius = 64; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 bg-[#f8f9fa] flex flex-col items-center justify-center z-50 animate-fade-in overflow-hidden">
      <div className="relative flex items-center justify-center">
        {/* 역동적인 배경 블러 효과 */}
        <div className="absolute inset-0 bg-blue-200/20 rounded-full filter blur-[80px] animate-pulse-slow pointer-events-none scale-150"></div>
        
        {/* 중앙 로고 */}
        <AppLogo className="w-20 h-20 relative z-20 animate-float drop-shadow-2xl" />

        {/* 원형 로딩바 컨테이너 */}
        <div className="absolute inset-0 flex items-center justify-center z-10 scale-[1.35]">
          <svg className="w-56 h-56 transform -rotate-90 drop-shadow-md" viewBox="0 0 140 140">
            {/* 배경 희미한 원 */}
            <circle
              className="text-gray-200/50"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="70"
              cy="70"
            />
            {/* 실시간으로 채워지는 빛나는 프로그레스 원 */}
            <circle
              className="text-blue-600 transition-all ease-out"
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="70"
              cy="70"
              style={{ 
                transitionDuration: '100ms', 
                filter: 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.7))' 
              }}
            />
          </svg>
        </div>
      </div>
      
      {/* 텍스트 영역 */}
      <h2 className="mt-16 text-2xl font-bold text-gray-900 tracking-tight animate-pulse relative z-20">QA Base</h2>
      <div className="flex flex-col items-center mt-3 relative z-20">
        <p className="text-gray-500 text-sm font-medium tracking-wide flex items-center">
          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2 animate-ping"></span>
          시스템 최적화 중...
        </p>
        <p className="text-blue-600 font-bold text-lg mt-1 tracking-tighter drop-shadow-sm">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
};

export default function App() {
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

  useEffect(() => {
    sessionStorage.setItem('qa_base_current_screen', screen);
  }, [screen]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('qa_base_current_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('qa_base_current_user');
    }
  }, [user]);

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
      
      {/* [수정] 교체된 시네마틱 원형 스플래시 화면 렌더링 */}
      {screen === 'splash' && <CinematicSplashScreen onComplete={() => setScreen('login')} />}
      
      {screen === 'login' && <LoginScreen onLogin={handleLogin} onInstallApp={handleInstallApp} />}
      {screen === 'loadingBoard' && <TransitionLoading title="Functional Board" onComplete={() => setScreen('board')} />}
      {screen === 'board' && <FunctionalBoard user={user} onNavigate={(target) => setScreen(`loading_${target}`)} onLogout={() => { setUser(null); setScreen('login'); }} onShowProfileModal={() => setShowProfileModal(true)} onShowAdminModal={() => setShowAdminModal(true)} />}
      
      {screen === 'loading_dashboard' && <TransitionLoading title="Devices Dashboard" onComplete={() => setScreen('dashboard')} />}
      {screen === 'dashboard' && <DevicesDashboard user={user} onNavigate={(target) => setScreen(target === 'board' ? 'loadingBoard' : target)} onLogout={() => { setUser(null); setScreen('login'); }} onQuit={() => { setUser(null); setScreen('splash'); }} />}
      
      {screen === 'loading_schedule' && <TransitionLoading title="Schedule Manager" onComplete={() => setScreen('schedule')} />}
      {screen === 'schedule' && <ScheduleDashboard user={user} onNavigate={(target) => setScreen(target === 'board' ? 'loadingBoard' : target)} onLogout={() => { setUser(null); setScreen('login'); }} onQuit={() => { setUser(null); setScreen('splash'); }} />}

      {screen === 'loading_projects' && <TransitionLoading title="Projects Board" onComplete={() => setScreen('projects')} />}
      {screen === 'projects' && <ProjectsDashboard user={user} onNavigate={(target) => setScreen(target === 'board' ? 'loadingBoard' : target)} onLogout={() => { setUser(null); setScreen('login'); }} onQuit={() => { setUser(null); setScreen('splash'); }} />}

      {screen === 'loading_accounts' && <TransitionLoading title="Accounts Vault" onComplete={() => setScreen('accounts')} />}
      {screen === 'accounts' && <AccountsDashboard user={user} onNavigate={(target) => setScreen(target === 'board' ? 'loadingBoard' : target)} onLogout={() => { setUser(null); setScreen('login'); }} onQuit={() => { setUser(null); setScreen('splash'); }} />}

      {showProfileModal && user && <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onUpdateProfile={(image) => setUser({...user, profileImage: image})} />}
      {showAdminModal && <AdminModal onClose={() => setShowAdminModal(false)} />}
    </>
  );
}
