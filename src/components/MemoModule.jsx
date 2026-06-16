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

  // 1. 데이터 불러오기 (카테고리 및 메모)
  useEffect(() => {
    if (!user) return;

    // 카테고리 구독
    const qCategories = query(collection(db, 'memoCategories'), where('userId', '==', user.id || user.email));
    const unsubCat = onSnapshot(qCategories, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt - b.createdAt));
    });

    // 메모 구독
    const qMemos = query(collection(db, 'memos'), where('userId', '==', user.id || user.email));
    const unsubMemo = onSnapshot(qMemos, (snap) => {
      setMemos(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.updatedAt - a.updatedAt));
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

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('카테고리를 삭제하시겠습니까? (내부 메모는 "미분류"로 이동됩니다)')) return;
    
    // 카테고리에 속한 메모들을 미분류로 변경
    const targetMemos = memos.filter(m => m.categoryId === catId);
    for (const memo of targetMemos) {
      await updateDoc(doc(db, 'memos', memo.id), { categoryId: 'Uncategorized' });
    }
    // 카테고리 삭제
    await deleteDoc(doc(db, 'memoCategories', catId));
    if (activeCategory === catId) setActiveCategory('All');
  };

  // 3. 메모 관리 로직
  const handleAddMemo = async () => {
    await addDoc(collection(db, 'memos'), {
      userId: user.id || user.email,
      categoryId: activeCategory === 'All' ? 'Uncategorized' : activeCategory,
      title: '',
      content: '',
      colorId: 'gray',
      isFolded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const handleUpdateMemo = async (id, updateData) => {
    await updateDoc(doc(db, 'memos', id), { ...updateData, updatedAt: serverTimestamp() });
  };

  const handleDeleteMemo = async (id) => {
    if (window.confirm('이 메모를 삭제하시겠습니까?')) {
      await deleteDoc(doc(db, 'memos', id));
      if (focusedMemo?.id === id) setFocusedMemo(null);
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
            
            <div className="flex items-center justify-between px-3 mb-8 mt-16">
              <span className="text-xs font-semibold text-gray-400 tracking-wider">CATEGORIES</span>
              <button onClick={handleAddCategory} className="text-gray-400 hover:text-gray-800"><Plus className="w-3.5 h-3.5" /></button>
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
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 max-w-7xl mx-auto">
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fast-fade">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 animate-scale-up">
            <button onClick={() => setShowCategoryModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Folder className="w-5 h-5 mr-2 text-gray-600" />
              새 카테고리 추가
            </h3>
            <form onSubmit={submitCategory}>
              <input 
                type="text" 
                autoFocus
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="카테고리 이름"
                className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-gray-800 transition-colors mb-5"
              />
              <div className="flex space-x-2">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm">취소</button>
                <button type="submit" className="flex-1 bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors shadow-md">추가</button>
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
        />
      )}
    </div>
  );
};

// --- 서브 컴포넌트: 개별 메모 카드 (그리드 내 표시) ---
const MemoCard = ({ memo, onUpdate, onDelete, onFocus }) => {
  const theme = MEMO_COLORS.find(c => c.id === memo.colorId) || MEMO_COLORS[0];

  return (
    <div 
      onDoubleClick={onFocus}
      className={`break-inside-avoid mb-6 rounded-2xl p-5 border shadow-sm transition-all duration-300 cursor-pointer hover:shadow-md hover:-translate-y-0.5 backdrop-blur-md ${theme.bg} ${theme.border} group`}
    >
      <div className={`flex justify-between items-center ${memo.isFolded ? 'mb-0' : 'mb-3'}`}>
        <input 
          type="text" 
          value={memo.title} 
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="제목 없음"
          className={`bg-transparent outline-none font-bold text-sm w-full placeholder:text-gray-400 ${theme.text}`}
          onDoubleClick={(e) => e.stopPropagation()} // 더블클릭 이벤트 전파 방지
        />
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
          <button onClick={(e) => { e.stopPropagation(); onUpdate({ isFolded: !memo.isFolded }); }} className={`p-1 rounded hover:bg-black/5 ${theme.text}`}>
            {memo.isFolded ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!memo.isFolded && (
        <div className="relative">
          <div 
            className={`text-xs leading-relaxed outline-none min-h-[60px] max-h-[300px] overflow-hidden ${theme.text}`}
            dangerouslySetInnerHTML={{ __html: memo.content || '<p className="text-gray-400 italic">내용이 없습니다. 더블클릭하여 편집하세요.</p>' }}
          />
          {/* 긴 글 그라데이션 가림 처리 */}
          <div className={`absolute bottom-0 w-full h-8 bg-gradient-to-t from-${theme.bg.split('/')[0].replace('bg-', '')}-50 to-transparent pointer-events-none mix-blend-overlay`}></div>
        </div>
      )}
    </div>
  );
};

// --- 서브 컴포넌트: 포커스 모드 모달 (커스텀 에디터 포함) ---
const FocusMemoModal = ({ memo, onUpdate, onClose, onDelete }) => {
  const contentRef = useRef(null);
  const theme = MEMO_COLORS.find(c => c.id === memo.colorId) || MEMO_COLORS[0];

  // 디바운스 자동 저장 (모달 닫힐 때도 자동 저장되도록 onBlur 활용)
  const handleContentBlur = () => {
    if (contentRef.current) {
      onUpdate({ content: contentRef.current.innerHTML });
    }
  };

  // 커스텀 리치 텍스트 서식 명령어
  const execCmd = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    contentRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-fast-fade">
      {/* 배경 블러 (클릭 시 닫기 & 자동 저장) */}
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { handleContentBlur(); onClose(); }}></div>
      
      <div className={`relative w-full max-w-2xl max-h-full flex flex-col rounded-3xl shadow-2xl backdrop-blur-xl border ${theme.bg} ${theme.border} animate-scale-up overflow-hidden`}>
        
        {/* 상단 툴바 */}
        <div className={`flex items-center justify-between p-3 border-b border-white/20 bg-white/40 shrink-0`}>
          <div className="flex items-center space-x-1 bg-white/50 p-1 rounded-lg backdrop-blur-md shadow-sm border border-white/50">
            <button onClick={() => execCmd('bold')} className="p-1.5 rounded hover:bg-black/5 text-gray-700 transition-colors" title="굵게"><Bold className="w-4 h-4" /></button>
            <button onClick={() => execCmd('italic')} className="p-1.5 rounded hover:bg-black/5 text-gray-700 transition-colors" title="기울임"><Italic className="w-4 h-4" /></button>
            <button onClick={() => execCmd('underline')} className="p-1.5 rounded hover:bg-black/5 text-gray-700 transition-colors" title="밑줄"><Underline className="w-4 h-4" /></button>
            
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            
            {/* 색상 테마 변경 */}
            <div className="flex items-center space-x-1 px-1">
              <Palette className="w-3.5 h-3.5 text-gray-400 mr-1" />
              {MEMO_COLORS.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => onUpdate({ colorId: c.id })}
                  className={`w-4 h-4 rounded-full ${c.bg} border-2 ${memo.colorId === c.id ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-110'} transition-transform shadow-sm`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
            <button onClick={() => { handleContentBlur(); onClose(); }} className="p-1.5 rounded-lg text-gray-500 hover:bg-black/5 transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* 편집 영역 */}
        <div className="p-8 overflow-y-auto flex-1 no-scrollbar">
          <input 
            type="text" 
            value={memo.title} 
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="메모 제목"
            className={`w-full bg-transparent outline-none font-black text-3xl mb-6 placeholder:text-gray-400/60 ${theme.text}`}
          />
          <div 
            ref={contentRef}
            contentEditable
            onBlur={handleContentBlur}
            suppressContentEditableWarning
            className={`outline-none text-sm leading-relaxed min-h-[300px] ${theme.text}`}
            dangerouslySetInnerHTML={{ __html: memo.content }}
          />
        </div>
      </div>
    </div>
  );
};

// 헬퍼 함수: 활성 메뉴 스타일
const activeMenuTheme = (isActive) => isActive ? 'bg-white/80 text-gray-900 font-bold shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-white/50 hover:text-gray-900';
