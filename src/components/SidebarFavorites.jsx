import React, { useState, useEffect, useRef } from 'react';
import { Server, Calendar, User, Kanban, Plus, Minus, KeyRound, ChevronRight } from 'lucide-react';
import { doc, onSnapshot, setDoc, collection } from 'firebase/firestore';

export const SidebarFavorites = ({ db, user, onNavigate, sidebarOpen, currentModule }) => {
  const ALL_FEATURES = [
    { id: 'dashboard', label: 'Device Manager', icon: Server },
    { id: 'schedule', label: 'QA Calendar', icon: Calendar },
    { id: 'accounts', label: 'Account Vault', icon: KeyRound },
    { id: 'projects', label: 'Project Board', icon: Kanban } 
  ];

  const [favorites, setFavorites] = useState([]);
  const [favoriteEpics, setFavoriteEpics] = useState([]); // 추가: 하트 누른 에픽들
  const [allEpics, setAllEpics] = useState([]); // 추가: 에픽 이름 매핑용
  
  const [showAddFav, setShowAddFav] = useState(false);
  const [showProjectPopup, setShowProjectPopup] = useState(false); // 추가: 프로젝트 팝업 상태
  const [favEditMode, setFavEditMode] = useState(false);
  const longPressTimer = useRef(null);

  const userDocId = user?.email || user?.uid || user?.id || user?.name || 'anonymous_user';

  // 1. 유저 즐겨찾기 실시간 데이터 연동
  useEffect(() => {
    if (!user || !db || userDocId === 'anonymous_user') return;
    const docRef = doc(db, 'user_preferences', userDocId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.favorites) setFavorites(data.favorites);
        if (data.favorite_epics) setFavoriteEpics(data.favorite_epics);
      }
    });
    return () => unsubscribe();
  }, [userDocId, user, db]);

  // 2. 프로젝트 이름 매핑을 위해 에픽 데이터 불러오기
  useEffect(() => {
    if (!db) return;
    const epicsRef = collection(db, 'jira_epics');
    const unsubscribe = onSnapshot(epicsRef, (snapshot) => {
      setAllEpics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [db]);

  const updateFavorites = async (newFavs) => {
    setFavorites(newFavs); 
    if (!user || userDocId === 'anonymous_user' || !db) return;
    try { await setDoc(doc(db, 'user_preferences', userDocId), { favorites: newFavs }, { merge: true }); } 
    catch (error) { console.error("즐겨찾기 서버 저장 실패:", error); }
  };

  useEffect(() => {
    const handleClickOutside = () => { setFavEditMode(false); setShowAddFav(false); setShowProjectPopup(false); };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) { setShowAddFav(false); setFavEditMode(false); setShowProjectPopup(false); }
  }, [sidebarOpen]);

  const handleTouchStart = () => { longPressTimer.current = setTimeout(() => { setFavEditMode(true); setShowAddFav(false); setShowProjectPopup(false); }, 1500); };
  const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  // 추가: 특정 에픽으로 직행하는 함수
  const openSpecificEpic = (epicKey) => {
    setShowProjectPopup(false);
    onNavigate('projects'); // 먼저 프로젝트 화면으로 이동
    // 0.1초 뒤 화면이 마운트된 후 이동하라는 신호(이벤트)를 발송
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('OPEN_EPIC', { detail: epicKey }));
    }, 100);
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
          const isProjectMenu = favId === 'projects'; // 프로젝트 보드인지 확인

          return (
            <div
              key={favId} className="relative"
              onMouseDown={handleTouchStart} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd}
              onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (favEditMode) return;
                  if (isProjectMenu) {
                    setShowProjectPopup(!showProjectPopup); // 프로젝트면 팝업 띄우기
                  } else {
                    if (!isCurrent) onNavigate(favId);
                  }
                }}
                className={`p-3 rounded-2xl transition-all duration-300 relative ${
                  favEditMode ? 'bg-gray-100/80' : 
                  (isCurrent && !isProjectMenu) ? 'bg-blue-50/40 text-blue-300 opacity-60 cursor-default shadow-inner' : 
                  'bg-white hover:bg-blue-50 text-gray-500 hover:text-blue-600 shadow-sm border border-gray-100/50 hover:border-blue-200'
                }`}
                title={feature.label}
              >
                <Icon className={`w-5 h-5 ${favEditMode ? 'animate-pulse text-gray-400' : ''}`} />
                {/* 프로젝트 아이콘 우측 상단에 뱃지 표시 */}
                {isProjectMenu && favoriteEpics.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>

              {/* 시네마틱 프로젝트 팝업 */}
              {isProjectMenu && showProjectPopup && !favEditMode && (
                <div className="absolute bottom-14 left-0 w-56 bg-white/95 backdrop-blur-xl border border-gray-100/80 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] p-2 z-[99999] animate-fade-in-up origin-bottom-left" onClick={e=>e.stopPropagation()}>
                  <div className="text-[10px] font-bold text-blue-500 px-3 py-2 uppercase tracking-wider flex items-center mb-1">
                    <Kanban className="w-3 h-3 mr-1.5" /> Favorite Epics
                  </div>
                  {favoriteEpics.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar pb-1">
                      {favoriteEpics.map(epicKey => {
                        const epicData = allEpics.find(e => e.epicKey === epicKey);
                        return (
                          <button key={epicKey} onClick={() => openSpecificEpic(epicKey)} className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-blue-50/80 text-left transition-colors group">
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="text-[10px] text-gray-400 font-bold mb-0.5">{epicKey}</span>
                              <span className="text-sm font-semibold text-gray-700 truncate group-hover:text-blue-700">{epicData?.name || '알 수 없는 프로젝트'}</span>
                            </div>
                            <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-center">
                      <span className="text-xs text-gray-400">프로젝트 보드에서 하트를<br/>눌러 즐겨찾기를 추가하세요!</span>
                    </div>
                  )}
                  <div className="h-px bg-gray-100 my-1 mx-2"></div>
                  <button onClick={() => { setShowProjectPopup(false); onNavigate('projects'); }} className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
                    <Kanban className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">전체 프로젝트 보드 가기</span>
                  </button>
                </div>
              )}

              {favEditMode && (
                <button onClick={(e) => { e.stopPropagation(); updateFavorites(favorites.filter(id => id !== favId)); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors z-10 animate-fade-in">
                  <Minus className="w-3 h-3" strokeWidth={3} />
                </button>
              )}
            </div>
          );
        })}

        {/* 빈자리 추가 버튼 */}
        {favorites.length < ALL_FEATURES.length && (
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAddFav(!showAddFav)} className="p-3 rounded-2xl border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 hover:bg-white transition-all duration-300">
              <Plus className="w-5 h-5" />
            </button>
            {showAddFav && (
              <div className="fixed bottom-24 left-6 w-48 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[99999] p-2 animate-fast-fade">
                <div className="text-[10px] font-bold text-gray-400 px-3 py-1.5 mb-1 tracking-wider uppercase">기능 추가</div>
                {ALL_FEATURES.filter(f => !favorites.includes(f.id)).map(f => (
                  <button key={f.id} onClick={() => { updateFavorites([...favorites, f.id]); setShowAddFav(false); }} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors text-sm font-medium">
                    <f.icon className="w-4 h-4 text-gray-400" /><span>{f.label}</span>
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
