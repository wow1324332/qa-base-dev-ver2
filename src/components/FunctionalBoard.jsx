import React, { useState } from 'react';
import { Users, Settings, User, LogOut, Server, Calendar, Bug, KeyRound, MonitorSmartphone } from 'lucide-react';

const AppLogo = ({ className }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) return <MonitorSmartphone className={`text-gray-800 ${className}`} strokeWidth={1.5} />;
  return <img src="/icon-192x192.png" alt="QA Base" className={`object-contain ${className}`} onError={() => setImgError(true)} />;
};

export const FunctionalBoard = ({ user, onNavigate, onLogout, onShowProfileModal, onShowAdminModal }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const onlineUsersCount = 1;

  return (
    <div 
      className="w-screen h-screen bg-[#f8f9fa] flex flex-col animate-simple-fade bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg-functional.png')" }}
    >
      <header className="h-20 px-8 flex justify-between items-center bg-[url('/header-bg.jpg')] bg-cover bg-[length:100%_100%] shrink-0 relative z-50 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-3"></div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-md hover-breath cursor-default">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">{onlineUsersCount}명 접속중</span>
          </div>

          {user?.role === 'admin' && (
            <button 
              onClick={onShowAdminModal}
              className="p-2 text-gray-400 hover:text-gray-800 transition-colors hover-breath rounded-full bg-white shadow-sm border border-gray-100"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover-breath p-1 pr-3 bg-white rounded-full border border-gray-200 shadow-md"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-medium overflow-hidden">
                {user?.profileImage ? <img src={user.profileImage} alt="profile" className="w-full h-full object-cover" /> : user?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
            </div>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 py-2 animate-fast-fade z-50">
                <button 
                  onClick={() => { setShowProfileMenu(false); onShowProfileModal(); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <User className="w-4 h-4 mr-3" /> 프로필 수정
                </button>
                <div className="h-px bg-gray-100 my-1"></div>
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-3" /> 로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-12 flex flex-col items-center">
        <div className="w-full max-w-5xl">
          <h2 className="text-3xl font-bold text-gray-600 mb-2">Functional Board</h2>
          <p className="text-sm text-gray-500 mb-10">사용할 QA 기능을 선택하세요.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* ✨ 1. Devices 카드 수정 */}
            <div 
              onClick={() => onNavigate('dashboard')}
              // 👇 className에 relative와 overflow-hidden을 추가하여 이미지가 모서리를 넘어가지 않게 합니다.
              className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-3xl p-8 cursor-pointer border border-gray-200 shadow-md hover-breath group"
            >
              {/* 👇 올리신 Functioncard.jpg 배경을 깔아주는 코드입니다. */}
              <div className="absolute inset-0 bg-[url('/Functioncard.jpg')] bg-cover bg-center opacity-[0.2] mix-blend-multiply transition-opacity duration-500 group-hover:opacity-[0.3] pointer-events-none"></div>
              
              {/* 👇 기존 내용물들을 묶어서 배경보다 위에 표시되게(z-10) 합니다. */}
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gray-800 transition-colors duration-500 shadow-sm border border-gray-100">
                  <Server className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Devices</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  검증용 시료 보유 현황을 조회하고<br/>상태 및 대여 현황을 관리하세요.
                </p>
              </div>
            </div>
            
            {/* ✨ 2. Schedule 카드 수정 */}
            <div 
              onClick={() => onNavigate('schedule')}
              className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-3xl p-8 cursor-pointer border border-gray-200 shadow-md hover-breath group"
            >
              <div className="absolute inset-0 bg-[url('/Functioncard.jpg')] bg-cover bg-center opacity-[0.2] mix-blend-multiply transition-opacity duration-500 group-hover:opacity-[0.3] pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gray-800 transition-colors duration-500 shadow-sm border border-gray-100">
                  <Calendar className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Schedule</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  검증 일정을 캘린더로 확인하고<br/>칸반 보드로 진행 현황을 관리하세요.
                </p>
              </div>
            </div>

            {/* ✨ 3. Projects 카드 수정 */}
            <div 
              onClick={() => onNavigate('projects')}
              className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-3xl p-8 cursor-pointer border border-gray-200 shadow-md hover-breath group"
            >
              <div className="absolute inset-0 bg-[url('/Functioncard.jpg')] bg-cover bg-center opacity-[0.2] mix-blend-multiply transition-opacity duration-500 group-hover:opacity-[0.3] pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gray-800 transition-colors duration-500 shadow-sm border border-gray-100">
                  <Bug className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2 flex items-center">
                  Projects <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold tracking-wider border border-blue-200 shadow-sm">JIRA</span>
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  JIRA 스페이스와 연동하여<br/>개발결함 추적 및 통계를 관리하세요.
                </p>
              </div>
            </div>

            {/* ✨ 4. Accounts 카드 수정 */}
            <div 
              onClick={() => onNavigate('accounts')}
              className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-3xl p-8 cursor-pointer border border-gray-200 shadow-md hover-breath group"
            >
              <div className="absolute inset-0 bg-[url('/Functioncard.jpg')] bg-cover bg-center opacity-[0.2] mix-blend-multiply transition-opacity duration-500 group-hover:opacity-[0.3] pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gray-800 transition-colors duration-500 shadow-sm border border-gray-100">
                  <KeyRound className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Accounts</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  강력한 보안의 테스트용 계정들을<br/>빠르고 안전하게 관리하세요.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};
export default FunctionalBoard;
