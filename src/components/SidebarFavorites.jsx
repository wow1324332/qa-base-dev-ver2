import React, { useState, useEffect, useRef } from 'react';
import { Server, Calendar, User, Kanban, Plus, Minus, KeyRound } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const SidebarFavorites = ({ db, user, onNavigate, sidebarOpen, currentModule }) => {
  // 1. 앱의 전체 기능 목록
  const ALL_FEATURES = [
    { id: 'dashboard', label: 'Device Manager', icon: Server },
    { id: 'schedule', label: 'QA Calendar', icon: Calendar },
    { id: 'accounts', label: 'Account Vault', icon: KeyRound },
    { id: 'projects', label: 'Project Board', icon: Kanban } 
  ];

  // [수정] AVAILABLE_FEATURES 제거: 현재 모듈도 추가 목록에 뜰 수 있도록 함

  const [favorites, setFavorites] = useState([]);
  const [showAddFav, setShowAddFav] = useState(false);
  const [favEditMode, setFavEditMode] = useState(false);
  const longPressTimer = useRef(null);

  const userDocId = user?.email || user?.uid || user?.id || user?.name || 'anonymous_user';

  // 파이어베이스 데이터 불러오기
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user || !db) return;
      try {
        const docRef = doc(db, 'user_preferences', userDocId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().favorites) {
          setFavorites(docSnap.data().favorites);
        }
      } catch (error) {
        console.error("즐겨찾기 데이터를 불러오는 중 에러 발생:", error);
      }
    };
    fetchFavorites();
  }, [userDocId, user, db]);

  // 파이어베이스 데이터 저장하기
  const updateFavorites = async (newFavs) => {
    setFavorites(newFavs); 
    if (!user || userDocId === 'anonymous_user' || !db) return;
    try {
      await setDoc(doc(db, 'user_preferences', userDocId), { favorites: newFavs }, { merge: true });
    } catch (error) {
      console.error("즐겨찾기 서버 저장 실패:", error);
    }
  };

  // 바탕 클릭 및 폴딩 시 팝업 닫기
  useEffect(() => {
    const handleClickOutside = () => { setFavEditMode(false); setShowAddFav(false); };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) { setShowAddFav(false); setFavEditMode(false); }
  }, [sidebarOpen]);

  // 1.5초 롱프레스 제어
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setFavEditMode(true);
      setShowAddFav(false);
    }, 1500); 
  };
  const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  const handleFavClick = (id, e) => {
    if (favEditMode) { e.stopPropagation(); return; }
    onNavigate(id); 
  };

  return (
    <div className="p-5 w-64 shrink-0 border-t border-gray-100/50 bg-white/40">
      <div className="text-[10px] font-bold text-gray-400 tracking-wider mb-3 px-1 uppercase flex justify-between items-center">
        <span>Quick Links</span>
        {favEditMode && <span className="text-red-400 text-[9px] animate-pulse font-medium">삭제 모드</span>}
      </div>
      
      <div className="flex items-center space-x-3 relative">
        {favorites.map(favId => {
          const feature = ALL_FEATURES.find(f => f.id === favId);
          if (!feature) return null;
          const Icon = feature.icon;
          
          const isCurrent = favId === currentModule;

          return (
            <div
              key={favId} className="relative"
              onMouseDown={handleTouchStart} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd}
              onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
            >
              <button
                onClick={(e) => {
                  if (isCurrent && !favEditMode) return;
                  handleFavClick(favId, e);
                }}
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  favEditMode 
                    ? 'bg-gray-100/80' 
                    : isCurrent
                      ? 'bg-blue-50/40 text-blue-300 opacity-60 cursor-default shadow-inner'
                      : 'bg-white hover:bg-blue-50 text-gray-500 hover:text-blue-600 shadow-sm border border-gray-100/50 hover:border-blue-200'
                }`}
                title={isCurrent ? `${feature.label} (현재 접속 중)` : feature.label}
              >
                <Icon className={`w-5 h-5 ${favEditMode ? 'animate-pulse text-gray-400' : ''}`} />
              </button>
              {favEditMode && (
                <button
                  onClick={(e) => { e.stopPropagation(); updateFavorites(favorites.filter(id => id !== favId)); }}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors z-10 animate-fade-in"
                >
                  <Minus className="w-3 h-3" strokeWidth={3} />
                </button>
              )}
            </div>
          );
        })}

        {/* [수정] 3개 제한을 전체 기능 개수(ALL_FEATURES.length)로 변경 */}
        {favorites.length < ALL_FEATURES.length && (
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowAddFav(!showAddFav)}
              className="p-3 rounded-2xl border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 hover:bg-white transition-all duration-300 flex items-center justify-center bg-transparent"
            >
              <Plus className="w-5 h-5" />
            </button>
            {showAddFav && (
              <div className="fixed bottom-24 left-6 w-48 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[99999] p-2 animate-fast-fade">
                <div className="text-[10px] font-bold text-gray-400 px-3 py-1.5 mb-1 tracking-wider uppercase">기능 추가</div>
                {/* [수정] AVAILABLE_FEATURES 대신 ALL_FEATURES를 직접 필터링하여 현재 기능도 추가할 수 있게 만듦 */}
                {ALL_FEATURES.filter(f => !favorites.includes(f.id)).map(f => (
                  <button
                    key={f.id}
                    onClick={() => { updateFavorites([...favorites, f.id]); setShowAddFav(false); }}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                  >
                    <f.icon className="w-4 h-4 text-gray-400" />
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
