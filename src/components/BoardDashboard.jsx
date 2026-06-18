import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, FileText, Plus, Search, ChevronRight, LayoutDashboard, 
  LogOut, Power, Bold, Italic, Underline, Trash2, Edit3, X, ChevronDown, Save, Users, Menu
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from '../firebaseConfig'; // 🔥 경로 확인
import { SidebarFavorites } from './SidebarFavorites';

export const BoardDashboard = ({ user, onNavigate, onLogout, onQuit }) => {
  // --- 상태 관리 ---
  const [viewState, setViewState] = useState('large_grid'); // 'large_grid' | 'detail'
  const [activeLargeId, setActiveLargeId] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [largeCats, setLargeCats] = useState([]);
  const [mediumCats, setMediumCats] = useState([]);
  const [posts, setPosts] = useState([]);
  
  const [activeMediumId, setActiveMediumId] = useState('All'); // 'All' 또는 특정 미디엄 카테고리 ID
  const [activePost, setActivePost] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 모달 및 입력 상태
  const [showModal, setShowModal] = useState({ type: null, targetId: null }); // type: 'large', 'medium', 'post_add'
  const [inputText, setInputText] = useState('');

// ✅ 새 글 작성 모달 내 카테고리 선택/생성을 위한 상태 추가
  const [selectedMediumId, setSelectedMediumId] = useState('');
  const [isCreatingNewCat, setIsCreatingNewCat] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ✅ 1. 여기에 롱프레스를 위한 상태 및 타이머를 추가합니다!
  const [activeCardId, setActiveCardId] = useState(null);
  const pressTimer = useRef(null);

  // ✅ 버그 방지: 모달 열릴 때 카테고리 선택 상태 초기화
  useEffect(() => {
    if (showModal.type === 'post_add') {
      setSelectedMediumId(showModal.targetId || mediumCats[0]?.id || '');
      setIsCreatingNewCat(false);
      setNewCategoryName('');
    }
  }, [showModal, mediumCats]);
  
  // --- 데이터 구독 ---
  useEffect(() => {
    if (!user) return;
    // 1. 라지 카테고리
    const qLarge = query(collection(db, 'boardLargeCategories'));
    const unsubLarge = onSnapshot(qLarge, (snap) => {
      setLargeCats(snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })).sort((a, b) => a.createdAt - b.createdAt));
    });
    return () => unsubLarge();
  }, [user]);

  useEffect(() => {
    if (!activeLargeId) return;
    // 2. 미디엄 카테고리 (현재 선택된 라지 기준)
    const qMedium = query(collection(db, 'boardMediumCategories'), where('largeId', '==', activeLargeId));
    const unsubMedium = onSnapshot(qMedium, (snap) => {
      setMediumCats(snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })).sort((a, b) => a.createdAt - b.createdAt));
    });
    // 3. 게시글 (현재 선택된 라지 기준)
    const qPosts = query(collection(db, 'boardPosts'), where('largeId', '==', activeLargeId));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })).sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => { unsubMedium(); unsubPosts(); };
  }, [activeLargeId]);

  // --- CRUD 로직 ---
  
  // ✅ 2. handleCreateSubmit 함수를 이걸로 통째로 덮어씌워 주세요 (보드 이름 수정 로직이 추가되었습니다)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (showModal.type === 'large') {
      await addDoc(collection(db, 'boardLargeCategories'), { name: inputText, createdAt: serverTimestamp(), authorId: user.id || user.email });
    } else if (showModal.type === 'edit_large') {
      await updateDoc(doc(db, 'boardLargeCategories', showModal.targetId), { name: inputText, updatedAt: serverTimestamp() });
    } else if (showModal.type === 'medium') {
      await addDoc(collection(db, 'boardMediumCategories'), { largeId: activeLargeId, name: inputText, createdAt: serverTimestamp(), authorId: user.id || user.email });
    } else if (showModal.type === 'post_add') {
      
      // ✅ [카테고리 동적 처리] 새 카테고리를 직접 입력해 생성하는 경우 처리
      let targetMediumId = selectedMediumId;
      if (isCreatingNewCat && newCategoryName.trim()) {
        const newCatRef = await addDoc(collection(db, 'boardMediumCategories'), {
          largeId: activeLargeId,
          name: newCategoryName.trim(),
          createdAt: serverTimestamp(),
          authorId: user.id || user.email
        });
        targetMediumId = newCatRef.id; // 신규 생성된 카테고리 ID 할당
      }

      if (!targetMediumId) targetMediumId = 'Uncategorized';

      // 게시글 생성
      const newPostRef = await addDoc(collection(db, 'boardPosts'), {
        largeId: activeLargeId,
        mediumId: targetMediumId, // ✅ 동적으로 매핑된 카테고리 ID 주입
        title: inputText,
        content: '',
        authorId: user.id || user.email,
        authorName: user.name || 'User',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      const newPost = { id: newPostRef.id, largeId: activeLargeId, mediumId: targetMediumId, title: inputText, content: '', authorId: user.id || user.email };
      setActivePost(newPost);
      setIsEditing(true);
    }
    
    setInputText('');
    setNewCategoryName('');
    setShowModal({ type: null, targetId: null });
  };

  // ✅ 3. 그리고 그 바로 밑에 이 함수들(삭제 및 롱프레스 이벤트)을 새로 붙여넣어 주세요!
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const confirmDeleteLarge = (id, e) => {
    e.stopPropagation();
    setDeleteTargetId(id); // 기본 알림창 대신 우리의 예쁜 팝업을 띄웁니다!
  };

  const executeDeleteLarge = async () => {
    if (!deleteTargetId) return;
    await deleteDoc(doc(db, 'boardLargeCategories', deleteTargetId));
    setDeleteTargetId(null);
    setActiveCardId(null);
  };

  const handlePressStart = (id) => {
    pressTimer.current = setTimeout(() => setActiveCardId(id), 500); // 0.5초 길게 누르면 발동
  };
  
  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('이 게시글을 삭제하시겠습니까?')) {
      await deleteDoc(doc(db, 'boardPosts', postId));
      setActivePost(null);
    }
  };

  // --- UI 렌더링 헬퍼 ---
  const filteredPosts = posts.filter(p => {
    const matchCategory = activeMediumId === 'All' || p.mediumId === activeMediumId;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const activeLargeName = largeCats.find(c => c.id === activeLargeId)?.name || 'Board';

  // =========================================================================
  // VIEW 1: 대분류 (Large Category) 선택 보드 (사이드바 없음)
  // =========================================================================
  if (viewState === 'large_grid') {
    return (
      <div 
        className="w-screen h-screen flex flex-col overflow-hidden animate-simple-fade bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('/project-bg.jpg')" }}
      >
        {/* 공통 헤더 */}
        <header className="h-20 px-8 flex justify-between items-center bg-[url('/header-bg.jpg')] bg-cover bg-[length:100%_100%] shrink-0 relative z-50 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]">
          <div className="flex items-center space-x-3"></div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-md cursor-default">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">1명 접속중</span>
            </div>

            <div className="flex items-center space-x-3 bg-white p-1 pr-3 rounded-full border border-gray-200 shadow-md">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-medium overflow-hidden">
                {user?.profileImage ? <img src={user.profileImage} alt="profile" className="w-full h-full object-cover" /> : user?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
            </div>

            <button onClick={onLogout} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 transition-colors" title="로그아웃"><LogOut className="w-4 h-4" /></button>
            <button onClick={onQuit} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 transition-colors" title="종료"><Power className="w-4 h-4" /></button>
          </div>
        </header>

        {/* ✅ 2. 서브 네비게이션 바 (경로 표시 및 뒤로 가기) */}
        <div className="h-14 px-8 flex items-center bg-white/60 backdrop-blur-md shrink-0 z-40">
          <div className="flex items-center space-x-2 text-sm font-semibold text-gray-500">
            <button onClick={() => onNavigate('board')} className="hover:text-blue-600 transition-colors">Functional Board</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">Knowledge Base</span>
          </div>
        </div>

        {/* ✅ 메인 영역 (배경 블러 제거 및 투명 처리) */}
        <main className="flex-1 overflow-y-auto bg-transparent p-10">
          <div className="w-full max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Knowledge Base</h1>
                <p className="text-gray-600 font-medium">팀의 지식과 가이드를 체계적으로 관리하세요.</p>
              </div>
              <button 
                onClick={() => { setInputText(''); setShowModal({ type: 'large', targetId: null }); }}
                className="bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-900 transition-all shadow-md flex items-center hover-breath"
              >
                <Plus className="w-4 h-4 mr-2" /> 새 보드 생성
              </button>
            </div>

            {/* ✅ 카드 영역 (기능 보드와 동일한 시네마틱 디자인 적용) */}
            {activeCardId && (
              <div className="fixed inset-0 z-10" onClick={() => setActiveCardId(null)}></div>
            )}
            
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 relative z-20">
              {largeCats.map(cat => (
                <div 
                  key={cat.id} 
                  onMouseDown={() => handlePressStart(cat.id)}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchStart={() => handlePressStart(cat.id)}
                  onTouchEnd={handlePressEnd}
                  onClick={() => { 
                    if (activeCardId === cat.id) return;
                    
                    // ✅ 버그 픽스: 상세 화면으로 넘어가기 전에 이전 보드의 데이터를 깨끗하게 지웁니다!
                    setPosts([]); 
                    setMediumCats([]);
                    
                    setActiveLargeId(cat.id); 
                    setViewState('detail'); 
                    setActivePost(null); 
                    setActiveMediumId('All'); 
                  }}
                  // 선택된 카드만 z-index를 높여서 투명 백드롭 위로 올라오게 합니다.
                  style={{ zIndex: activeCardId === cat.id ? 30 : 1 }}
                  className="relative overflow-hidden bg-white/60 backdrop-blur-md rounded-2xl p-6 cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 group select-none"
                >
                  <div className="absolute inset-0 bg-[url('/Functioncard.jpg')] bg-cover bg-center opacity-[0.4] mix-blend-multiply transition-opacity duration-500 group-hover:opacity-[0.6] pointer-events-none"></div>
                  
                  <div className="relative z-10 flex items-center">
                    <div className="w-12 h-12 shrink-0 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 group-hover:bg-gray-800 transition-colors duration-500 shadow-sm border border-white/50">
                      <Folder className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors tracking-tight truncate pr-4">
                      {cat.name}
                    </h3>
                  </div>

                  {/* 🌟 수정/삭제 우측 상단 미니 오버레이 (닫기 버튼 제거) */}
                  <div className={`absolute top-3 right-3 bg-white/90 backdrop-blur-md flex items-center space-x-1 px-2 py-1.5 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.12)] border border-white transition-all duration-300 z-30 ${activeCardId === cat.id ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95 pointer-events-none'}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowModal({type: 'edit_large', targetId: cat.id}); setInputText(cat.name); setActiveCardId(null); }} 
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors" title="수정"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-3 bg-gray-300"></div>
                    <button 
                      onClick={(e) => confirmDeleteLarge(cat.id, e)} 
                      className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* ✅ 보드 삭제 확인 시네마틱 모달 (경고를 위한 붉은 톤 그라데이션) */}
        {deleteTargetId && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[130] flex items-center justify-center animate-fast-fade p-4">
            <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-8 w-full max-w-[380px] border border-white/60 relative overflow-hidden flex flex-col animate-scale-up text-center">
              
              {/* 경고 느낌을 주는 빨간색 빛망울 효과 */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-red-100 backdrop-blur-sm relative z-10">
                <Trash2 className="w-8 h-8"/>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2 relative z-10 tracking-tight">보드 삭제</h3>
              <p className="text-sm text-gray-500 mb-8 relative z-10 font-medium leading-relaxed">
                이 보드를 정말 삭제하시겠습니까?<br/>내부의 모든 문서가 함께 삭제됩니다.
              </p>
              
              <div className="flex space-x-3 relative z-10">
                <button onClick={() => setDeleteTargetId(null)} className="flex-1 bg-white/70 backdrop-blur-sm text-gray-600 text-sm font-bold py-3.5 rounded-2xl hover:bg-white hover:text-gray-800 transition-colors border border-white/60 shadow-sm">취소</button>
                <button onClick={executeDeleteLarge} className="flex-1 bg-red-500/90 backdrop-blur-sm text-white text-sm font-bold py-3.5 rounded-2xl hover:bg-red-600 transition-colors shadow-md border border-red-500 hover:shadow-lg">삭제</button>
              </div>
            </div>
          </div>
        )}
        
{/* ✅ 업그레이드 된 카테고리 설정 분기형 글래스모피즘 모달 */}
        {showModal.type && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[120] flex items-center justify-center animate-fast-fade p-4">
            <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-8 w-full max-w-[420px] border border-white/60 relative overflow-hidden flex flex-col animate-scale-up">
              
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center mb-6 relative z-10">
                <div className="w-12 h-12 bg-white/80 text-gray-700 rounded-2xl flex items-center justify-center mr-4 shadow-sm border border-white/50 backdrop-blur-sm">
                  {showModal.type === 'large' || showModal.type === 'edit_large' ? <LayoutDashboard className="w-6 h-6"/> : showModal.type === 'medium' ? <Folder className="w-6 h-6"/> : <FileText className="w-6 h-6"/>}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 tracking-tight">
                    {showModal.type === 'large' ? '새 보드 생성' : showModal.type === 'edit_large' ? '보드 이름 수정' : showModal.type === 'medium' ? '새 폴더 생성' : '새 게시글 작성'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">분류 및 정보를 입력해 주세요.</p>
                </div>
              </div>
              
              <form id="boardCreateForm" onSubmit={handleCreateSubmit} className="relative z-10 space-y-4">
                {showModal.type === 'post_add' ? (
                  <>
                    {/* 게시글 제목 */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">게시글 제목</label>
                      <input 
                        type="text" autoFocus value={inputText} onChange={(e) => setInputText(e.target.value)}
                        placeholder="제목을 입력하세요..."
                        className="w-full bg-white/50 border border-white/60 text-gray-800 text-sm font-medium rounded-2xl px-4 py-3.5 outline-none focus:bg-white/80 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 caret-blue-600 transition-all duration-300 shadow-inner placeholder:text-gray-400"
                      />
                    </div>

                    {/* 카테고리 분류 및 직접 생성 토글 */}
                    <div>
                    {/* ✅ 커스텀 시네마틱 드롭다운으로 변경된 카테고리 선택 영역 */}
                    <div className="relative z-20">
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">카테고리 선택</label>
                    <div className="flex items-center space-x-2 mb-2">
                      
                      {/* 커스텀 셀렉트 박스 */}
                      <div className="relative flex-1">
                        {/* 배경 클릭 시 드롭다운 닫기 위한 투명 백드롭 */}
                        {isDropdownOpen && !isCreatingNewCat && (
                          <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                        )}
                        
                        <button
                          type="button"
                          disabled={isCreatingNewCat}
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          // ✅ px-4와 justify-between으로 화살표 여백을 안정감 있게 수정했습니다.
                          className={`w-full flex items-center justify-between bg-white/50 border border-white/60 text-gray-800 text-sm font-medium rounded-2xl px-4 py-3.5 outline-none transition-all ${isCreatingNewCat ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/80 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 shadow-inner'}`}
                        >
                          <span className="truncate pr-2">
                            {mediumCats.length === 0 ? '지정 가능한 폴더 없음' : (mediumCats.find(c => c.id === selectedMediumId)?.name || '카테고리 선택')}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* 시네마틱 드롭다운 메뉴 */}
                        <div className={`absolute left-0 right-0 top-full mt-2 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300 z-50 origin-top ${isDropdownOpen && !isCreatingNewCat ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'}`}>
                          <div className="max-h-48 overflow-y-auto no-scrollbar py-2">
                            {mediumCats.map(cat => (
                              <div
                                key={cat.id}
                                onClick={() => { setSelectedMediumId(cat.id); setIsDropdownOpen(false); }}
                                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center space-x-2 ${selectedMediumId === cat.id ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-gray-700 hover:bg-white hover:text-gray-900 font-medium'}`}
                              >
                                <Folder className={`w-4 h-4 ${selectedMediumId === cat.id ? 'text-blue-500' : 'text-gray-400'}`} />
                                <span className="truncate">{cat.name}</span>
                              </div>
                            ))}
                            {mediumCats.length === 0 && (
                              <div className="px-4 py-3 text-sm text-gray-500 font-medium text-center">폴더가 없습니다.</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <button type="button" onClick={() => setIsCreatingNewCat(!isCreatingNewCat)} className={`px-4 py-3.5 text-xs font-bold rounded-2xl border transition-all shrink-0 ${isCreatingNewCat ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white/70 text-gray-600 border-white/60 hover:bg-white'}`}> {isCreatingNewCat ? '기존 폴더' : '직접 생성'} </button>
                    </div>
                    
                    {isCreatingNewCat && (
                      <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} maxLength={15} placeholder="새 폴더 이름 입력..." className="w-full bg-white/50 border border-white/60 text-gray-800 text-sm font-medium rounded-2xl px-4 py-3 outline-none focus:bg-white/80 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 caret-blue-600 shadow-inner placeholder:text-gray-400 animate-fast-fade" />
                    )}
                  </div>
                  </>
                ) : (
                  /* 기존의 단일 필드 모달 (보드 생성, 수정 등) */
                  <input 
                    type="text" autoFocus value={inputText} onChange={(e) => setInputText(e.target.value)}
                    maxLength={15}
                    placeholder="이름을 입력하세요..."
                    className="w-full bg-white/50 border border-white/60 text-gray-800 text-sm font-medium rounded-2xl px-4 py-4 outline-none focus:bg-white/80 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 caret-blue-600 transition-all duration-300 shadow-inner placeholder:text-gray-400"
                  />
                )}

                {/* 하단 제어 버튼 (동적 비활성화 유효성 검사 적용) */}
                <div className="flex space-x-3 mt-8">
                  <button type="button" onClick={() => { setInputText(''); setNewCategoryName(''); setShowModal({ type: null, targetId: null }); }} className="flex-1 bg-white/70 backdrop-blur-sm text-gray-600 text-sm font-bold py-3.5 rounded-2xl hover:bg-white hover:text-gray-800 transition-colors border border-white/60 shadow-sm">취소</button>
                  <button 
                    type="submit" 
                    // ✅ 조건별 확인 버튼 활성/비활성 처리
                    disabled={showModal.type === 'post_add' ? (!inputText.trim() || (isCreatingNewCat && !newCategoryName.trim())) : !inputText.trim()}
                    className={`flex-1 text-sm font-bold py-3.5 rounded-2xl transition-all shadow-md border 
                      ${(showModal.type === 'post_add' ? (!inputText.trim() || (isCreatingNewCat && !newCategoryName.trim())) : !inputText.trim()) ? 'bg-gray-400/50 text-gray-200 border-gray-400/30 cursor-not-allowed opacity-60' : 'bg-gray-900/90 backdrop-blur-sm text-white border-gray-800 hover:bg-black hover:shadow-lg'}`}
                  >
                    확인
                  </button>
                </div>
              </form>
              
            </div>
          </div>
        )}
      </div>
    );
  }
  // =========================================================================
  // VIEW 2: 대분류 상세 보드 (사이드바 + 게시글 목록/에디터)
  // =========================================================================
  return (
    <div className="w-screen h-screen bg-[#f5f6f8] flex flex-col overflow-hidden animate-simple-fade">
      
      {/* ✅ 1. 앱 공통 메인 헤더 (위와 동일) */}
      <header className="h-20 px-8 flex justify-between items-center bg-[url('/header-bg.jpg')] bg-cover bg-[length:100%_100%] shrink-0 relative z-50 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-3"></div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-md cursor-default">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">1명 접속중</span>
          </div>
          <div className="flex items-center space-x-3 bg-white p-1 pr-3 rounded-full border border-gray-200 shadow-md">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-medium overflow-hidden">
              {user?.profileImage ? <img src={user.profileImage} alt="profile" className="w-full h-full object-cover" /> : user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
          </div>
          <button onClick={onLogout} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 transition-colors" title="로그아웃"><LogOut className="w-4 h-4" /></button>
          <button onClick={onQuit} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 transition-colors" title="종료"><Power className="w-4 h-4" /></button>
        </div>
      </header>

      {/* ✅ 2. 서브 네비게이션 바 (경로 표시 + 우측 검색창) */}
      <div className="h-14 px-8 flex justify-between items-center bg-white/60 backdrop-blur-md shrink-0 z-40">
        <div className="flex items-center space-x-2 text-sm font-semibold text-gray-500">
          
          <button onClick={() => onNavigate('board')} className="hover:text-blue-600 transition-colors">Functional Board</button>
          <ChevronRight className="w-4 h-4" />
          <button onClick={() => setViewState('large_grid')} className="hover:text-blue-600 transition-colors">Knowledge Base</button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{activeLargeName}</span>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" placeholder="게시글 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-gray-100 border-transparent rounded-full text-sm outline-none focus:bg-white focus:border-gray-300 focus:shadow-sm transition-all w-64"
          />
        </div>
      </div>

      <div 
        className="flex flex-1 overflow-hidden relative bg-[#f0f2f5] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/project-bg.jpg')" }}
      >
        
        {/* --- 좌측 사이드바 (너비 w-64로 수정 및 디바이스 화면과 동일한 스타일 적용) --- */}
        <aside className={`bg-white/60 backdrop-blur-xl rounded-r-2xl shadow-[-5px_0_30px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out flex flex-col justify-between z-10 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-64' : 'w-0'}`}>
          
          {/* 상단: 카테고리 트리 */}
          <div className="p-5 overflow-y-auto no-scrollbar w-64 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-xs font-bold text-gray-400 tracking-wider">FOLDERS</span>
              <button onClick={() => setShowModal({ type: 'medium', targetId: null })} className="text-gray-400 hover:text-gray-800 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            
            {/* 전체 게시글 버튼 */}
            <button 
              onClick={() => { setActiveMediumId('All'); setActivePost(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors select-none mb-4
                ${activeMediumId === 'All' && !activePost ? 'bg-blue-50/80 text-blue-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm font-medium">전체 게시글</span>
            </button>

            {/* 미디엄 카테고리 트리 */}
            <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar pb-4">
              {mediumCats.map(mCat => {
                const catPosts = posts.filter(p => p.mediumId === mCat.id);
                const isExpanded = activeMediumId === mCat.id;
                
                return (
                  <div key={mCat.id} className="mb-1 select-none">
                    <div 
                      onClick={() => { setActiveMediumId(mCat.id); setActivePost(null); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors group
                        ${isExpanded && !activePost ? 'bg-white/80 text-gray-900 font-bold shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}
                    >
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <Folder className={`w-4 h-4 shrink-0 ${isExpanded ? 'text-gray-800' : 'text-gray-400'}`} />
                        <span className="text-sm truncate w-36">{mCat.name}</span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowModal({ type: 'post_add', targetId: mCat.id }); }} 
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-opacity" title="이 폴더에 글쓰기"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    
                    {/* 하위 스몰 카테고리 (게시글) 목록 */}
                    {isExpanded && (
                      <div className="mt-1 ml-4 pl-3 border-l border-gray-300/50 space-y-1">
                        {catPosts.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-400 font-medium">게시글이 없습니다.</div>
                        ) : (
                          catPosts.map(post => (
                            <button 
                              key={post.id}
                              onClick={() => { setActivePost(post); setIsEditing(false); }}
                              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-left transition-colors truncate
                                ${activePost?.id === post.id ? 'bg-blue-50/80 text-blue-700 font-semibold shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'}`}
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{post.title}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 새 글 작성 버튼 (목록과 즐겨찾기 사이) */}
            <div className="pt-3 border-t border-gray-200/50">
              <button 
                onClick={() => setShowModal({ type: 'post_add', targetId: activeMediumId === 'All' ? null : activeMediumId })} 
                className="w-full flex items-center justify-center space-x-2 bg-gray-800/90 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-900 transition-all shadow-md backdrop-blur-sm"
              >
                <Edit3 className="w-4 h-4" /> <span>새 글 작성</span>
              </button>
            </div>
          </div>
          
          {/* 하단 즐겨찾기 컴포넌트 연결 */}
          <SidebarFavorites db={db} user={user} onNavigate={onNavigate} sidebarOpen={sidebarOpen} currentModule="board" />
        </aside>

        {/* ✅ 미니멀 시네마틱 폴딩 핸들 (디바이스 화면과 동일한 left-[256px] 너비 적용) */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className={`absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center transition-all duration-300 ease-in-out group outline-none w-3 h-14 rounded-r-lg backdrop-blur-md shadow-[3px_0_10px_-3px_rgba(0,0,0,0.05)] bg-white/30 hover:bg-white/50 hover:shadow-[4px_0_16px_-4px_rgba(0,0,0,0.1)] ${
            sidebarOpen ? 'left-[256px]' : 'left-0'
          }`}
        >
          <div className="w-[1.5px] h-5 bg-gray-400/40 rounded-full transition-colors duration-300 group-hover:bg-gray-500/60"></div>
        </button>

        {/* --- 우측 메인 콘텐츠 영역 --- */}
        <main className={`flex-1 relative overflow-hidden flex flex-col transition-all duration-300 ${!sidebarOpen ? 'ml-12' : ''}`}>
          
          {/* 상태 A: 아무 글도 선택하지 않고, 전체 게시글이나 특정 폴더를 보고 있을 때 (카드 뷰) */}
          {!activePost && (
            <div className="p-10 overflow-y-auto w-full h-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {activeMediumId === 'All' ? '전체 게시글' : mediumCats.find(m => m.id === activeMediumId)?.name}
                <span className="text-gray-400 text-lg ml-2 font-medium">({filteredPosts.length})</span>
              </h2>
              {/* ✅ 너비를 고정(max-w-[600px])하고 1열 세로 목록(flex-col)으로 변경했습니다. */}
              <div className="flex flex-col space-y-3 max-w-[600px]">
                {filteredPosts.map(post => {
                  const parentFolder = mediumCats.find(m => m.id === post.mediumId)?.name || '미분류';
                  return (
                    <div 
                      key={post.id} onClick={() => { setActivePost(post); setIsEditing(false); }}
                      // ✅ 패딩을 줄이고 가로 정렬(flex justify-between)로 변경하여 깔끔한 리스트 아이템 형태로 만들었습니다.
                      className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex flex-col overflow-hidden pr-4">
                        <div className="text-[10px] font-bold text-blue-500 mb-1 flex items-center tracking-wide">
                          <Folder className="w-3 h-3 mr-1"/> {parentFolder}
                        </div>
                        {/* ✅ 본문 미리보기와 작성자를 없애고, 제목만 깔끔하게 남겼습니다. (글자가 너무 길면 ...으로 잘리도록 truncate 적용) */}
                        <h3 className="text-base font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                          {post.title}
                        </h3>
                      </div>
                      
                      {/* 👉 우측 끝에 진입 화살표를 추가해 클릭할 수 있는 목록임을 시각적으로 강조 */}
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 상태 B: 특정 게시글을 선택해서 읽거나 편집할 때 (리더 / 에디터 뷰) */}
          {activePost && (
            <PostEditorViewer 
              post={activePost} 
              isEditing={isEditing} 
              setIsEditing={setIsEditing} 
              onClose={() => setActivePost(null)}
              onDelete={() => handleDeletePost(activePost.id)}
              currentUser={user}
              db={db}
            />
          )}
        </main>
      </div>

      {/* ✅ 보드 삭제 확인 모달 */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[130] flex items-center justify-center animate-fast-fade p-4">
          <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-8 w-full max-w-[380px] border border-white/60 relative overflow-hidden flex flex-col animate-scale-up text-center">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-red-100 backdrop-blur-sm relative z-10">
              <Trash2 className="w-8 h-8"/>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 relative z-10 tracking-tight">보드 삭제</h3>
            <p className="text-sm text-gray-500 mb-8 relative z-10 font-medium leading-relaxed">이 보드를 정말 삭제하시겠습니까?<br/>내부의 모든 문서가 함께 삭제됩니다.</p>
            <div className="flex space-x-3 relative z-10">
              <button onClick={() => setDeleteTargetId(null)} className="flex-1 bg-white/70 backdrop-blur-sm text-gray-600 text-sm font-bold py-3.5 rounded-2xl hover:bg-white transition-colors border border-white/60 shadow-sm">취소</button>
              <button onClick={executeDeleteLarge} className="flex-1 bg-red-500/90 backdrop-blur-sm text-white text-sm font-bold py-3.5 rounded-2xl hover:bg-red-600 transition-colors shadow-md border border-red-500 hover:shadow-lg">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 생성/수정/글쓰기 모달 */}
      {showModal.type && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[120] flex items-center justify-center animate-fast-fade p-4">
          <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-8 w-full max-w-[420px] border border-white/60 relative overflow-hidden flex flex-col animate-scale-up">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center mb-6 relative z-10">
              <div className="w-12 h-12 bg-white/80 text-gray-700 rounded-2xl flex items-center justify-center mr-4 shadow-sm border border-white/50 backdrop-blur-sm">
                {showModal.type === 'large' || showModal.type === 'edit_large' ? <LayoutDashboard className="w-6 h-6"/> : showModal.type === 'medium' ? <Folder className="w-6 h-6"/> : <FileText className="w-6 h-6"/>}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 tracking-tight">
                  {showModal.type === 'large' ? '새 보드 생성' : showModal.type === 'edit_large' ? '보드 이름 수정' : showModal.type === 'medium' ? '새 폴더 생성' : '새 게시글 작성'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">분류 및 정보를 입력해 주세요.</p>
              </div>
            </div>
            <form onSubmit={handleCreateSubmit} className="relative z-10 space-y-4">
              {showModal.type === 'post_add' ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">게시글 제목</label>
                    <input type="text" autoFocus value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="제목을 입력하세요..." className="w-full bg-white/50 border border-white/60 text-gray-800 text-sm font-medium rounded-2xl px-4 py-3.5 outline-none focus:border-blue-400 caret-blue-600 transition-all shadow-inner" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">카테고리 선택</label>
                    <div className="flex items-center space-x-2 mb-2">
                      <select disabled={isCreatingNewCat} value={selectedMediumId} onChange={(e) => setSelectedMediumId(e.target.value)} className="flex-1 bg-white/50 border border-white/60 text-gray-800 text-sm font-medium rounded-2xl px-3 py-3 outline-none focus:border-blue-400 cursor-pointer" >
                        {mediumCats.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        {mediumCats.length === 0 && <option value="">지정 가능한 폴더 없음</option>}
                      </select>
                      <button type="button" onClick={() => setIsCreatingNewCat(!isCreatingNewCat)} className={`px-4 py-3 text-xs font-bold rounded-2xl border transition-all ${isCreatingNewCat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/70 text-gray-600 border-white/60'}`}> {isCreatingNewCat ? '기존 폴더' : '직접 생성'} </button>
                    </div>
                    {isCreatingNewCat && (
                      <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} maxLength={15} placeholder="새 폴더 이름 입력..." className="w-full bg-white/50 border border-white/60 text-gray-800 text-sm font-medium rounded-2xl px-4 py-3 outline-none focus:border-blue-400 caret-blue-600 shadow-inner animate-fast-fade" />
                    )}
                  </div>
                </>
              ) : (
                <input type="text" autoFocus value={inputText} onChange={(e) => setInputText(e.target.value)} maxLength={15} placeholder="이름을 입력하세요..." className="w-full bg-white/50 border border-white/60 text-gray-800 text-sm font-medium rounded-2xl px-4 py-4 outline-none focus:border-blue-400 caret-blue-600 transition-all shadow-inner" />
              )}
              <div className="flex space-x-3 mt-8">
                <button type="button" onClick={() => { setInputText(''); setNewCategoryName(''); setShowModal({ type: null, targetId: null }); }} className="flex-1 bg-white/70 backdrop-blur-sm text-gray-600 text-sm font-bold py-3.5 rounded-2xl hover:bg-white transition-colors border border-white/60 shadow-sm">취소</button>
                <button type="submit" disabled={showModal.type === 'post_add' ? (!inputText.trim() || (isCreatingNewCat && !newCategoryName.trim())) : !inputText.trim()} className={`flex-1 text-sm font-bold py-3.5 rounded-2xl transition-all shadow-md border ${(!inputText.trim() || (showModal.type === 'post_add' && isCreatingNewCat && !newCategoryName.trim())) ? 'bg-gray-400/50 text-gray-200 border-transparent cursor-not-allowed' : 'bg-gray-900/90 text-white border-gray-800 hover:bg-black'}`} > 확인 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 서브 컴포넌트: 게시글 읽기 및 플로팅 에디터 ---
  const PostEditorViewer = ({ post, isEditing, setIsEditing, onClose, onDelete, currentUser, db }) => {
  const contentRef = useRef(null);
  const [localTitle, setLocalTitle] = useState(post.title);
  const isAuthor = currentUser?.id === post.authorId || currentUser?.email === post.authorId;

  const execCmd = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    contentRef.current?.focus();
  };

  const handleSave = async () => {
    if (!isAuthor) return;
    const finalContent = contentRef.current ? contentRef.current.innerHTML : post.content;
    await updateDoc(doc(db, 'boardPosts', post.id), { title: localTitle, content: finalContent, updatedAt: serverTimestamp() });
    setIsEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      <div className="h-14 px-8 flex justify-between items-center border-b border-gray-100 shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-sm font-semibold flex items-center"> <X className="w-4 h-4 mr-1"/> 닫기 </button>
        <div className="flex items-center space-x-3">
          {isAuthor && !isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-blue-600 text-sm font-semibold flex items-center"><Edit3 className="w-4 h-4 mr-1"/> 편집</button>
              <button onClick={onDelete} className="text-gray-400 hover:text-red-500 text-sm font-semibold flex items-center"><Trash2 className="w-4 h-4 mr-1"/> 삭제</button>
            </>
          )}
          {isAuthor && isEditing && (
            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm flex items-center"> <Save className="w-4 h-4 mr-1.5"/> 저장 </button>
          )}
          {!isAuthor && <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">읽기 전용 (작성자: {post.authorName})</span>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="max-w-3xl mx-auto py-12 px-8">
          {isEditing ? (
            <input type="text" value={localTitle} onChange={(e) => setLocalTitle(e.target.value)} className="w-full bg-transparent outline-none font-black text-4xl text-gray-900 mb-8 border-b border-dashed border-gray-300 pb-4 focus:border-blue-500" placeholder="제목을 입력하세요" />
          ) : (
            <h1 className="font-black text-4xl text-gray-900 mb-8 pb-4 border-b border-gray-100">{post.title}</h1>
          )}
          <div ref={contentRef} contentEditable={isEditing} suppressContentEditableWarning spellCheck={false} data-placeholder={isEditing ? "내용을 작성하세요..." : ""} className={`outline-none text-base leading-loose min-h-[500px] text-gray-800 ${isEditing ? 'cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300' : 'cursor-default'}`} dangerouslySetInnerHTML={{ __html: post.content || '' }} />
        </div>
      </div>
      {isEditing && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-1 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-200/80 animate-scale-up">
          <button onClick={() => execCmd('bold')} className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors" title="굵게"><Bold className="w-4 h-4" /></button>
          <button onClick={() => execCmd('italic')} className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors" title="기울임"><Italic className="w-4 h-4" /></button>
          <button onClick={() => execCmd('underline')} className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors" title="밑줄"><Underline className="w-4 h-4" /></button>
          <button onClick={() => execCmd('formatBlock', 'H2')} className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors font-bold text-sm" title="소제목">H2</button>
          <button onClick={() => execCmd('insertUnorderedList')} className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors font-bold text-sm" title="글머리 기호">•</button>
        </div>
      )}
    </div>
  );
};
