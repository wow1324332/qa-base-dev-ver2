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
  const [favoriteEpics, setFavoriteEpics] = useState([]); 
  const [allEpics, setAllEpics] = useState([]); 
  
  const [showAddFav, setShowAddFav] = useState(false);
  const [showProjectPopup, setShowProjectPopup] = useState(false); 
  const [favEditMode, setFavEditMode] = useState(false);
  const longPressTimer = useRef(null);

  const userDocId = user?.email || user?.uid || user?.id || user?.name || 'anonymous_user';

  // 유저 즐겨찾기 실시간 데이터 연동
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

  // 프로젝트 이름 매핑용 에픽 데이터 불러오기
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


  // 🌟 [핵심] 시네마틱 화면 전환 (커튼 효과) 함수 🌟
  const triggerCinematicTransition = (targetId, afterNavAction = null) => {
    // 이미 전환 중이면 무시 (버튼 다중 클릭 방지)
    if (document.getElementById('cinematic-overlay')) return; 

    // 1. 화면 전체를 덮는 커튼(div) 생성
    const overlay = document.createElement('div');
    overlay.id = 'cinematic-overlay';
    // 배경색을 앱의 기본 배경색(#f8f9fa)과 맞추어 아주 자연스럽게 녹아들게 함
    overlay.className = 'fixed inset-0 bg-[#f8f9fa] z-[9999999] transition-opacity duration-[300ms] ease-in-out pointer-events-auto opacity-0';
    document.body.appendChild(overlay);

    // 2. 커튼 내리기 (투명도 0 -> 100)
    requestAnimationFrame(() => {
      overlay.classList.replace('opacity-0', 'opacity-100');
    });

    // 3. 커튼이 다 내려오면(0.3초 뒤) 몰래 화면(컴포넌트)을 교체
    setTimeout(() => {
      onNavigate(targetId);

      // 화면 교체 후 해야 할 추가 작업(에픽 열기, 초기화 등)이 있다면 실행
      if (afterNavAction) {
        setTimeout(() => afterNavAction(), 50);
      }

      // 4. 새 화면이 그려질 시간(0.1초)을 준 뒤, 다시 커튼 올리기 (투명도 100 -> 0)
      setTimeout(() => {
        overlay.classList.replace('opacity-100', 'opacity-0');
        overlay.classList.replace('pointer-events-auto', 'pointer-events-none');

        // 5. 애니메이션이 완전히 끝나면 DOM에서 삭제
        setTimeout(() => overlay.remove(), 300);
      }, 100);
    }, 300);
  };


  // 추가: 특정 에픽으로 직행하는 함수 (커튼 애니메이션 탑재)
  const openSpecificEpic = (epicKey) => {
    setShowProjectPopup(false);
    triggerCinematicTransition('projects', () => {
      window.dispatchEvent(new CustomEvent('OPEN_EPIC', { detail: epicKey }));
    });
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
          const isProjectMenu = favId === 'projects';

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
                    setShowProjectPopup(!showProjectPopup); 
                  } else {
                    // [적용] 일반 메뉴 이동 시에도 커튼 애니메이션 작동
                    if (!isCurrent) triggerCinematicTransition(favId);
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
                {isProjectMenu && favoriteEpics.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>

              {/* 시네마틱 프로젝트 팝업 */}
              {isProjectMenu && showProjectPopup && !favEditMode && (
                <div className="fixed bottom-24 left-6 w-52 bg-white/95 backdrop-blur-xl border border-gray-100/80 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] p-2 z-[99999] animate-fade-in-up origin-bottom-left" onClick={e=>e.stopPropagation()}>
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
                      <span className="text-xs text-gray-400">프로젝트 보드에서 체크를<br/>눌러 즐겨찾기를 추가하세요!</span>
                    </div>
                  )}
                  <div className="h-px bg-gray-100 my-1 mx-2"></div>
                  {/* [적용] 전체 보드 가기 버튼에도 커튼 애니메이션 탑재 */}
                  <button onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowProjectPopup(false); 
                    triggerCinematicTransition('projects', () => {
                      window.dispatchEvent(new Event('RESET_PROJECTS'));
                    });
                  }} className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
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
