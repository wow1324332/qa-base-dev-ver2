import React, { useState, useEffect, useRef } from 'react';
import { 
  StickyNote, Plus, X, Maximize2, Minimize2, Bold, Italic, Underline, 
  Palette, Folder, LayoutDashboard, LogOut, Power, ChevronDown, Trash2
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from '../firebaseConfig'; // 🔥 경로가 다르면 프로젝트에 맞게 수정해 주세요.
import { SidebarFavorites } from './SidebarFavorites';

// 시네마틱 틴트 컬러 테마
const MEMO_COLORS = [
  { id: 'gray', bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-800' },
  { id: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-800' },
  { id: 'rose', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-800' },
  { id: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-800' },
  { id: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-800' },
];

export const MemoDashboard = ({ user, onNavigate, onLogout, onQuit }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [memos, setMemos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [focusedMemo, setFocusedMemo] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // 1. 데이터 불러오기 (카테고리 및 메모)
  useEffect(() => {
    if (!user) return;

    // 카테고리 구독
    const qCategories = query(collection(db, 'memoCategories'), where('userId', '==', user.id || user.email));
    const unsubCat = onSnapshot(qCategories, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })).sort((a, b) => a.createdAt - b.createdAt));
    });

    // 메모 구독
    const qMemos = query(collection(db, 'memos'), where('userId', '==', user.id || user.email));
    const unsubMemo = onSnapshot(qMemos, (snap) => {
      setMemos(snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })).sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => { unsubCat(); unsubMemo(); };
  }, [user]);

  // 2. 카테고리 관리 로직
  const handleAddCategory = () => {
    setNewCategoryName('');
    setShowCategoryModal(true);
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await addDoc(collection(db, 'memoCategories'), {
      userId: user.id || user.email,
      name: newCategoryName.trim(),
      createdAt: serverTimestamp()
    });
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (catId) => {
    // window.confirm 대신 삭제 대상을 지정하고 모달을 띄웁니다.
    setDeleteTarget({ type: 'category', id: catId });
  };

  // 3. 메모 관리 로직
const handleAddMemo = async () => {
    // 1. 파이어베이스에 먼저 빈 메모를 생성하고, 그 결과값(참조 ID)을 받아옵니다.
    const newDocRef = await addDoc(collection(db, 'memos'), {
      userId: user.id || user.email,
      categoryId: activeCategory === 'All' ? 'Uncategorized' : activeCategory,
      title: '',
      content: '',
      colorId: 'gray',
      isFolded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 2. 방금 만들어진 빈 메모의 정보를 즉시 포커스 모달(focusedMemo)에 밀어넣어 창을 띄웁니다!
    setFocusedMemo({
      id: newDocRef.id,
      title: '',
      content: '',
      colorId: 'gray',
      isFolded: false
    });
  };

  const handleUpdateMemo = async (id, updateData) => {
    const payload = { ...updateData };
    
    // 전달된 데이터가 오직 '접기/펼치기(isFolded)' 상태 변경 하나뿐이라면, 
    // 최근 수정 시간(updatedAt)을 갱신하지 않아서 순서가 바뀌지 않도록 방어합니다.
    if (!(Object.keys(updateData).length === 1 && 'isFolded' in updateData)) {
      payload.updatedAt = serverTimestamp();
    }
    
    await updateDoc(doc(db, 'memos', id), payload);
  };

  const handleDeleteMemo = (id) => {
    // window.confirm 대신 삭제 대상을 지정하고 모달을 띄웁니다.
    setDeleteTarget({ type: 'memo', id });
  };

  // ✅ 2. 모달에서 '삭제하기' 버튼을 눌렀을 때 실행되는 진짜 삭제 로직을 여기에 추가합니다.
  const executeDelete = async () => {
    if (!deleteTarget) return;

    // ✅ 핵심 마법: 삭제 작업을 처리하기 전에 "팝업창부터 즉시 닫아서" 딜레이를 제로로 만듭니다.
    const currentTarget = deleteTarget; // 지울 대상을 잠시 보관함에 복사해두고
    setDeleteTarget(null);              // 팝업창을 먼저 닫아버립니다.

    // 그 후, 보관함에 둔 정보를 바탕으로 진짜 삭제 작업을 백그라운드에서 실행합니다.
    if (currentTarget.type === 'category') {
      const targetMemos = memos.filter(m => m.categoryId === currentTarget.id);
      for (const memo of targetMemos) {
        await updateDoc(doc(db, 'memos', memo.id), { categoryId: 'Uncategorized' });
      }
      await deleteDoc(doc(db, 'memoCategories', currentTarget.id));
      if (activeCategory === currentTarget.id) setActiveCategory('All');
    } else if (currentTarget.type === 'memo') {
      await deleteDoc(doc(db, 'memos', currentTarget.id));
      if (focusedMemo?.id === currentTarget.id) setFocusedMemo(null);
    }
  };

  // 필터링된 메모 목록
  const displayedMemos = activeCategory === 'All' 
    ? memos 
    : memos.filter(m => (m.categoryId === activeCategory) || (activeCategory === 'Uncategorized' && !m.categoryId));

  return (
    <div className="w-screen h-screen bg-[#f8f9fa] flex flex-col overflow-hidden animate-simple-fade">
      {/* --- 공통 헤더 --- */}
      <header className="h-20 px-8 flex justify-between items-center bg-[url('/header-bg.jpg')] bg-cover bg-[length:100%_100%] shrink-0 relative z-50 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-3"></div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm cursor-default">
            <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-white text-[10px] font-medium overflow-hidden">
              {user?.profileImage ? <img src={user.profileImage} alt="profile" className="w-full h-full object-cover" /> : user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-medium text-gray-700">{user?.name || 'User'}</span>
          </div>
          <div className="h-4 w-px bg-gray-200"></div>
          <button onClick={onLogout} className="text-gray-400 hover:text-gray-800 transition-colors p-1.5 hover-breath rounded-md"><LogOut className="w-4 h-4" /></button>
          <button onClick={onQuit} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover-breath rounded-md"><Power className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative bg-[#f0f2f5] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/project-bg.jpg')" }}>
        
        {/* --- 좌측 사이드바 --- */}
        <aside className={`bg-white/60 backdrop-blur-xl rounded-r-2xl shadow-[-5px_0_30px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out flex flex-col justify-between z-10 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-64' : 'w-0'}`}>
          <div className="p-4 space-y-1 w-64 overflow-y-auto no-scrollbar">
            <div className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-3 mt-2">MENU</div>
            <button onClick={() => onNavigate('board')} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <LayoutDashboard className="w-4 h-4" /><span className="text-sm font-medium">Functional Board</span>
            </button>
            <div className="h-px bg-gray-100 my-2 mx-3"></div>
            
            {/* ✅ 1. 기존 상단에 있던 + 아이콘을 지우고 깔끔하게 텍스트만 남겼습니다. */}
            <div className="px-3 mb-4 mt-8">
              <span className="text-xs font-semibold text-gray-400 tracking-wider">CATEGORIES</span>
            </div>
            
            <button onClick={() => setActiveCategory('All')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-colors ${activeMenuTheme(activeCategory === 'All')}`}>
              <StickyNote className="w-4 h-4" /><span className="text-sm font-medium">모든 메모</span>
            </button>
            <button onClick={() => setActiveCategory('Uncategorized')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-colors ${activeMenuTheme(activeCategory === 'Uncategorized')}`}>
              <Folder className="w-4 h-4" /><span className="text-sm font-medium">미분류</span>
            </button>
            
            <div className="space-y-0.5 mt-1">
              {categories.map(cat => (
                <div key={cat.id} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors group cursor-pointer ${activeMenuTheme(activeCategory === cat.id)}`} onClick={() => setActiveCategory(cat.id)}>
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <Folder className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium truncate">{cat.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* ✅ 2. 카테고리 목록 바로 아래에 직관적인 "Add Category" 버튼을 추가했습니다. */}
            <button 
              onClick={handleAddCategory} 
              className="w-full flex items-center space-x-3 px-3 py-2.5 mt-3 rounded-xl text-gray-400 hover:bg-white/50 hover:text-gray-900 transition-colors group"
            >
              <Plus className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm font-medium">Add Category</span>
            </button>

          </div>
          <SidebarFavorites db={db} user={user} onNavigate={onNavigate} sidebarOpen={sidebarOpen} currentModule="memo" />
        </aside>

        {/* --- 사이드바 토글 핸들 --- */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className={`absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center transition-all duration-300 ease-in-out group outline-none w-3 h-14 rounded-r-lg backdrop-blur-md shadow-[3px_0_10px_-3px_rgba(0,0,0,0.05)] bg-white/30 hover:bg-white/50 hover:shadow-[4px_0_16px_-4px_rgba(0,0,0,0.1)] ${sidebarOpen ? 'left-[256px]' : 'left-0'}`}
        >
          <div className="w-[1.5px] h-5 bg-gray-400/40 rounded-full transition-colors duration-300 group-hover:bg-gray-500/60"></div>
        </button>

        {/* --- 메인 보드 (그리드 레이아웃) --- */}
        <main className={`flex-1 overflow-y-auto no-scrollbar p-8 transition-all duration-300 ${!sidebarOpen ? 'ml-12' : ''}`}>
          <div className="flex justify-between items-end mb-8 shrink-0 max-w-7xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Quick Memos</h1>
              <p className="text-sm text-gray-500 font-medium">검증 내용이나 임시 데이터를 빠르게 기록하세요.</p>
            </div>
            <button onClick={handleAddMemo} className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors shadow-md hover-breath flex items-center">
              <Plus className="w-4 h-4 mr-1.5" /> 새 메모 추가
            </button>
          </div>

          {/* Masonry Grid 형태의 컬럼 레이아웃 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-start pb-[20vh]">
            {/* ✅ 드래그 관련 찌꺼기 코드(onDragStart 등)를 완벽하게 제거했습니다! */}
            {displayedMemos.map(memo => (
              <MemoCard 
                key={memo.id} 
                memo={memo} 
                onUpdate={(data) => handleUpdateMemo(memo.id, data)}
                onDelete={() => handleDeleteMemo(memo.id)}
                onFocus={() => setFocusedMemo(memo)}
              />
            ))}
          </div>
        </main>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8 animate-fast-fade">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowCategoryModal(false)}></div>
          
          <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.3)] p-8 border border-white/50 animate-scale-up text-center">
            
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Folder className="w-8 h-8 text-gray-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">새 카테고리 추가</h3>
            <p className="text-sm text-gray-500 mb-8 font-medium">새로운 메모 분류를 생성합니다.</p>
            
            <form onSubmit={submitCategory}>
              <input 
                type="text" 
                autoFocus
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="카테고리 이름"
                className="w-full bg-white/50 border border-gray-200/80 text-sm font-medium text-gray-800 rounded-2xl px-4 py-3.5 outline-none focus:border-gray-400 focus:bg-white transition-all mb-6 shadow-sm placeholder:text-gray-400"
              />
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 bg-gray-100/80 text-gray-600 font-semibold py-3.5 rounded-2xl hover:bg-gray-200 transition-colors border border-gray-200/50 shadow-sm">취소</button>
                <button type="submit" className="flex-1 bg-gray-800 text-white font-semibold py-3.5 rounded-2xl hover:bg-gray-900 transition-colors shadow-md transform hover:-translate-y-0.5">추가하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* --- 포커스 모드 (더블클릭 시 팝업) --- */}
      {focusedMemo && (
        <FocusMemoModal 
          memo={focusedMemo} 
          onUpdate={(data) => handleUpdateMemo(focusedMemo.id, data)} 
          onClose={() => setFocusedMemo(null)}
          onDelete={() => handleDeleteMemo(focusedMemo.id)}
          categories={categories}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8 animate-fast-fade">
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
            onClick={() => setDeleteTarget(null)}
          ></div>
          
          <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.3)] p-8 border border-white/50 animate-scale-up text-center">
            
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">정말 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">
              {deleteTarget.type === 'category' 
                ? '카테고리를 삭제하면 내부 메모는\n"미분류"로 이동됩니다.' 
                : '삭제된 메모는 다시 복구할 수 없습니다.'}
            </p>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => setDeleteTarget(null)} 
                className="flex-1 bg-gray-100/80 text-gray-600 font-semibold py-3.5 rounded-2xl hover:bg-gray-200 transition-colors border border-gray-200/50 shadow-sm"
              >
                취소
              </button>
              <button 
                onClick={executeDelete} 
                className="flex-1 bg-red-500 text-white font-semibold py-3.5 rounded-2xl hover:bg-red-600 transition-colors shadow-[0_8px_20px_rgba(239,68,68,0.4)] hover:shadow-[0_10px_25px_rgba(239,68,68,0.5)] transform hover:-translate-y-0.5"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 서브 컴포넌트: 개별 메모 카드 (그리드 내 표시) ---
const MemoCard = ({ memo, onUpdate, onDelete, onFocus }) => {
  const theme = MEMO_COLORS.find(c => c.id === memo.colorId) || MEMO_COLORS[0];
  
  const cardRef = useRef(null);
  const clickTimeout = useRef(null);
  const pressTimer = useRef(null);
  const isLongPressActive = useRef(false); 
  const [showDelete, setShowDelete] = useState(false);

  // 바깥 영역 클릭 시 삭제 버튼 닫기
  useEffect(() => {
    if (!showDelete) return;
    
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setShowDelete(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDelete]);

  const handlePressStart = () => {
    if (!memo.isFolded) return;
    isLongPressActive.current = false;
    
    pressTimer.current = setTimeout(() => {
      isLongPressActive.current = true;
      setShowDelete(true);
    }, 500); 
  };

  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleTitleClick = (e) => {
    if (isLongPressActive.current) {
      isLongPressActive.current = false;
      return; 
    }
    if (showDelete) {
      setShowDelete(false);
      return;
    }
    const target = e.currentTarget.closest('.group');
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    
    clickTimeout.current = setTimeout(() => {
      onUpdate({ isFolded: !memo.isFolded });
      target?.focus();
    }, 200); 
  };

  const handleTitleDoubleClick = (e) => {
    e.stopPropagation();
    if (showDelete) return;
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    onFocus();
  };

  return (
    <div 
      ref={cardRef} 
      tabIndex={-1}
      // ✅ 1. 렌더링 버그의 주범: 주변 메모를 스칠 때마다 레이어를 들썩이게 만들었던 `hover:z-20` 등을 완전히 삭제했습니다!
      className={`relative w-full group outline-none focus:outline-none
        ${showDelete ? 'z-[90]' : memo.isFolded ? 'z-10' : 'z-[60] focus-within:z-[80]'}`}
    >
      
      {/* --- 시네마틱 삭제 버튼 --- */}
      {showDelete && (
        <div className="absolute -top-3 -right-3 z-[100] animate-fast-fade">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setShowDelete(false);
            }}
            // 삭제 버튼 자체의 불필요한 블러 효과도 제거하여 솔리드 레드 컬러로 깔끔하게 띄웁니다.
            className="p-2.5 bg-red-500 text-white rounded-full shadow-[0_8px_20px_rgba(239,68,68,0.5)] hover:bg-red-600 hover:scale-110 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* --- 상단 제목 구역 --- */}
      <div 
        onClick={handleTitleClick}
        onDoubleClick={handleTitleDoubleClick}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}

        className={`relative z-10 p-5 backdrop-blur-md transition-all select-none ${theme.bg} 
          ${memo.isFolded 
            ? 'rounded-2xl shadow-sm hover:shadow-md' 
            : 'rounded-t-2xl shadow-sm'}`}
      >
        <div 
          className="w-full block overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) calc(100% - 24px), rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) calc(100% - 24px), rgba(0,0,0,0) 100%)',
            WebkitMaskSize: '100% 100%',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat'
          }}
        >
          <div className="inline-grid max-w-full align-middle overflow-x-auto outline-none focus:outline-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <span className="invisible whitespace-pre col-start-1 row-start-1 font-bold text-sm pointer-events-none">
              {memo.title || '제목 없음'}
            </span>
            <input 
              type="text" 
              size={1} 
              value={memo.title} 
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="제목 없음"
              readOnly={memo.isFolded} 
              className={`col-start-1 row-start-1 w-full min-w-0 bg-transparent outline-none focus:outline-none focus:ring-0 font-bold text-sm placeholder:text-gray-400 ${theme.text} ${memo.isFolded ? 'pointer-events-none' : ''}`}
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      </div>

      {/* --- 하단 내용 영역 (Dropdown) --- */}
      <div 
        className={`absolute top-full left-0 w-full rounded-b-2xl bg-white overflow-hidden transition-all duration-300 ease-out origin-top
          ${memo.isFolded 
            ? 'opacity-0 -translate-y-3 pointer-events-none invisible max-h-0 shadow-none' 
            : 'opacity-100 translate-y-0 visible max-h-[35vh] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]'
          }
        `}
      >
        <div className={`max-h-[35vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${theme.text}`}>
          <div 
            contentEditable={!memo.isFolded} 
            suppressContentEditableWarning={true}
            spellCheck={false} 
            onBlur={(e) => onUpdate({ content: e.currentTarget.innerHTML })}
            dangerouslySetInnerHTML={{ __html: memo.content || '' }}
            data-placeholder="내용이 없습니다. 클릭하여 편집하세요."
            className="w-full min-h-[100px] p-5 pt-2 outline-none focus:outline-none focus:ring-0 text-xs leading-relaxed break-words whitespace-pre-wrap cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:italic empty:before:pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};

// --- 서브 컴포넌트: 포커스 모드 모달 (커스텀 에디터 포함) ---
const FocusMemoModal = ({ memo, onUpdate, onClose, onDelete, categories = [] }) => {
  const contentRef = useRef(null);
  
  const [localTitle, setLocalTitle] = useState(memo.title || '');
  const [localColorId, setLocalColorId] = useState(memo.colorId || 'gray');
  const [localCategoryId, setLocalCategoryId] = useState(memo.categoryId || 'Uncategorized');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const MUTED_MODAL_THEMES = {
    gray: { header: 'bg-gray-200/70', text: 'text-gray-800' },
    blue: { header: 'bg-blue-200/60', text: 'text-blue-900' },
    rose: { header: 'bg-rose-200/60', text: 'text-rose-900' },
    emerald: { header: 'bg-emerald-200/60', text: 'text-emerald-900' },
    amber: { header: 'bg-amber-200/60', text: 'text-amber-900' },
  };
  const mutedTheme = MUTED_MODAL_THEMES[localColorId] || MUTED_MODAL_THEMES.gray;

  const currentCategoryName = localCategoryId === 'Uncategorized' 
    ? '미분류' 
    : categories.find(c => c.id === localCategoryId)?.name || '미분류';

  const handleCloseAndSave = () => {
    const finalContent = contentRef.current ? contentRef.current.innerHTML : memo.content;
    onUpdate({
      title: localTitle,
      colorId: localColorId,
      content: finalContent,
      categoryId: localCategoryId 
    });
    onClose();
  };

  const execCmd = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    contentRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-fast-fade">
      
      <div className="absolute inset-0 bg-transparent" onClick={handleCloseAndSave}></div>
      
      {/* ✅ 3번 반영: 모달 전체를 감싸던 미세한 흰색 테두리(border border-gray-200)를 완전히 제거했습니다. */}
      <div 
        onClick={() => setShowCategoryDropdown(false)}
        className="relative w-full max-w-2xl h-[70vh] flex flex-col rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] bg-white animate-scale-up overflow-hidden"
      >
        
        {/* ✅ 2번 반영: 제목 구역과 내용 구역을 나누던 하단 선(border-b)을 제거하여 색상으로만 부드럽게 구분되도록 했습니다. */}
        <div className={`px-8 py-4 shrink-0 transition-colors duration-300 ${mutedTheme.header}`}>
          <input 
            type="text" 
            value={localTitle} 
            onChange={(e) => setLocalTitle(e.target.value)} 
            placeholder="제목을 입력하세요"
            className={`w-full bg-transparent outline-none font-semibold text-base placeholder:text-gray-500/70 ${mutedTheme.text}`}
          />
        </div>

        {/* 하단 내용 영역 */}
        <div className="px-8 py-6 overflow-y-auto flex-1 no-scrollbar bg-[#f5f6f8] pb-24 transition-colors duration-300">
          <div 
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-placeholder="내용이 없습니다. 클릭하여 편집하세요."
            className="outline-none text-sm leading-relaxed min-h-[300px] cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:italic empty:before:pointer-events-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: memo.content || '' }}
          />
        </div>

        {/* ✅ 1번 반영: 툴바를 다시 좌우 정중앙(left-1/2)으로 배치하여 완벽한 밸런스를 맞췄습니다. */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-1 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-gray-200/80">
          <button onClick={() => execCmd('bold')} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors" title="굵게"><Bold className="w-3.5 h-3.5" /></button>
          <button onClick={() => execCmd('italic')} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors" title="기울임"><Italic className="w-3.5 h-3.5" /></button>
          <button onClick={() => execCmd('underline')} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors" title="밑줄"><Underline className="w-3.5 h-3.5" /></button>
          
          <div className="w-px h-4 bg-gray-200 mx-1.5"></div>
          
          {/* 색상 테마 변경 */}
          <div className="flex items-center space-x-1.5 px-1">
            <Palette className="w-3.5 h-3.5 text-gray-400 mr-0.5" />
            {MEMO_COLORS.map(c => (
              <button 
                key={c.id} 
                onClick={() => setLocalColorId(c.id)} 
                className={`rounded-full ${c.bg} border-2 ${localColorId === c.id ? 'border-gray-600 scale-110' : 'border-transparent hover:scale-110'} transition-all shadow-sm`}
                style={{ width: '16px', height: '16px' }}
              />
            ))}
          </div>

          <div className="w-px h-4 bg-gray-200 mx-1.5"></div>
          
          <button 
            onClick={() => { onDelete(); onClose(); }} 
            className="p-1.5 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" 
            title="삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 카테고리 변경 버튼 */}
        <div className="absolute bottom-6 right-8 flex flex-col items-end">
          
          {/* 드롭다운 메뉴 */}
          {showCategoryDropdown && (
            <div className="absolute bottom-full mb-2 w-40 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] overflow-hidden animate-fast-fade z-50">
              <div className="max-h-40 overflow-y-auto no-scrollbar py-1.5">
                <button 
                  onClick={(e) => { e.stopPropagation(); setLocalCategoryId('Uncategorized'); setShowCategoryDropdown(false); }}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors ${localCategoryId === 'Uncategorized' ? 'bg-gray-50 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  미분류
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={(e) => { e.stopPropagation(); setLocalCategoryId(cat.id); setShowCategoryDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${localCategoryId === cat.id ? 'bg-gray-50 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 카테고리 선택 버튼 */}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowCategoryDropdown(!showCategoryDropdown); }}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-full bg-white/95 backdrop-blur-md border shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all
              ${showCategoryDropdown ? 'border-gray-300 text-gray-800' : 'border-gray-200/80 text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            <Folder className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-medium truncate max-w-[80px]">{currentCategoryName}</span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
          </button>
        </div>

      </div>
    </div>
  );
};

// 헬퍼 함수: 활성 메뉴 스타일
const activeMenuTheme = (isActive) => isActive ? 'bg-white/80 text-gray-900 font-bold shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-white/50 hover:text-gray-900';
