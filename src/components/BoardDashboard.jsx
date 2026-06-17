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
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (showModal.type === 'large') {
      await addDoc(collection(db, 'boardLargeCategories'), { name: inputText, createdAt: serverTimestamp(), authorId: user.id || user.email });
    } else if (showModal.type === 'medium') {
      await addDoc(collection(db, 'boardMediumCategories'), { largeId: activeLargeId, name: inputText, createdAt: serverTimestamp(), authorId: user.id || user.email });
    } else if (showModal.type === 'post_add') {
      // 새 게시글 작성 시작
      const newPostRef = await addDoc(collection(db, 'boardPosts'), {
        largeId: activeLargeId,
        mediumId: showModal.targetId || mediumCats[0]?.id || 'Uncategorized', // 특정 미디엄 카테고리 지정
        title: inputText,
        content: '',
        authorId: user.id || user.email,
        authorName: user.name || 'User',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      const newPost = { id: newPostRef.id, largeId: activeLargeId, mediumId: showModal.targetId, title: inputText, content: '', authorId: user.id || user.email };
      setActivePost(newPost);
      setIsEditing(true); // 바로 편집 모드로 진입
    }
    
    setInputText('');
    setShowModal({ type: null, targetId: null });
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
      <div className="w-screen h-screen bg-[#f8f9fa] flex flex-col overflow-hidden animate-simple-fade">
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
        <div className="h-14 px-8 flex items-center bg-white border-b border-gray-200 shrink-0 z-40">
          <div className="flex items-center space-x-2 text-sm font-semibold text-gray-500">
            <button onClick={() => onNavigate('board')} className="hover:text-blue-600 transition-colors">Functional Board</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">Knowledge Base</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#f5f6f8] p-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Knowledge Base</h1>
                <p className="text-gray-500">팀의 지식과 가이드를 체계적으로 관리하세요.</p>
              </div>
              <button 
                onClick={() => setShowModal({ type: 'large', targetId: null })}
                className="bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-900 transition-all shadow-md flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" /> 새 보드 생성
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {largeCats.map(cat => (
                <div 
                  key={cat.id} 
                  onClick={() => { setActiveLargeId(cat.id); setViewState('detail'); setActivePost(null); setActiveMediumId('All'); }}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Folder className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{cat.name}</h3>
                  <p className="text-xs text-gray-400">게시판 열기 &rarr;</p>
                </div>
              ))}
            </div>
          </div>
        </main>
        
        {/* 생성 모달 (공용) */}
        {showModal.type && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fast-fade">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scale-up text-center relative">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                {showModal.type === 'large' ? '새 보드 생성' : showModal.type === 'medium' ? '새 폴더 생성' : '새 게시글 작성'}
              </h3>
              <form onSubmit={handleCreateSubmit}>
                <input 
                  type="text" autoFocus value={inputText} onChange={(e) => setInputText(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full bg-gray-50 border border-gray-200 text-sm font-medium rounded-2xl px-4 py-3.5 mb-6 outline-none focus:border-gray-800 focus:bg-white transition-all"
                />
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setShowModal({ type: null, targetId: null })} className="flex-1 bg-gray-100 text-gray-600 font-semibold py-3.5 rounded-2xl hover:bg-gray-200">취소</button>
                  <button type="submit" className="flex-1 bg-gray-800 text-white font-semibold py-3.5 rounded-2xl hover:bg-gray-900">확인</button>
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
      <div className="h-14 px-8 flex justify-between items-center bg-white border-b border-gray-200 shrink-0 z-40">
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
        <aside className={`bg-white/60 backdrop-blur-xl rounded-r-2xl shadow-[-5px_0_30px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out flex flex-col justify-between z-10 overflow-hidden whitespace-nowrap border-r border-white/50 ${sidebarOpen ? 'w-64' : 'w-0'}`}>
          
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
        <main className={`flex-1 relative overflow-hidden bg-white/30 backdrop-blur-sm flex flex-col transition-all duration-300 ${!sidebarOpen ? 'ml-12' : ''}`}>
          
          {/* 상태 A: 아무 글도 선택하지 않고, 전체 게시글이나 특정 폴더를 보고 있을 때 (카드 뷰) */}
          {!activePost && (
            <div className="p-10 overflow-y-auto w-full h-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {activeMediumId === 'All' ? '전체 게시글' : mediumCats.find(m => m.id === activeMediumId)?.name}
                <span className="text-gray-400 text-lg ml-2 font-medium">({filteredPosts.length})</span>
              </h2>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredPosts.map(post => {
                  const parentFolder = mediumCats.find(m => m.id === post.mediumId)?.name || '미분류';
                  return (
                    <div 
                      key={post.id} onClick={() => { setActivePost(post); setIsEditing(false); }}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-semibold text-blue-600 mb-2 flex items-center"><Folder className="w-3 h-3 mr-1"/> {parentFolder}</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                      {/* HTML 태그를 제거하고 텍스트만 미리보기 */}
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                        {post.content ? post.content.replace(/<[^>]*>?/gm, '') : '내용이 없습니다.'}
                      </p>
                      <div className="mt-4 text-xs text-gray-400 font-medium">By {post.authorName}</div>
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

      {/* 생성 모달 (공용) 중복 코드 재활용 */}
      {showModal.type && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fast-fade">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scale-up text-center relative">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {showModal.type === 'medium' ? '새 폴더 생성' : '새 게시글 작성'}
            </h3>
            <form onSubmit={handleCreateSubmit}>
              <input 
                type="text" autoFocus value={inputText} onChange={(e) => setInputText(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full bg-gray-50 border border-gray-200 text-sm font-medium rounded-2xl px-4 py-3.5 mb-6 outline-none focus:border-gray-800 focus:bg-white transition-all"
              />
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowModal({ type: null, targetId: null })} className="flex-1 bg-gray-100 text-gray-600 font-semibold py-3.5 rounded-2xl hover:bg-gray-200">취소</button>
                <button type="submit" className="flex-1 bg-gray-800 text-white font-semibold py-3.5 rounded-2xl hover:bg-gray-900">확인</button>
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
  
  // ✅ 3. 작성자 본인만 편집/삭제 권한 부여
  const isAuthor = currentUser?.id === post.authorId || currentUser?.email === post.authorId;

  // 에디터 명령어
  const execCmd = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    contentRef.current?.focus();
  };

  // 저장 로직
  const handleSave = async () => {
    if (!isAuthor) return;
    const finalContent = contentRef.current ? contentRef.current.innerHTML : post.content;
    await updateDoc(doc(db, 'boardPosts', post.id), {
      title: localTitle,
      content: finalContent,
      updatedAt: serverTimestamp()
    });
    setIsEditing(false); // 저장 후 읽기 모드로 전환
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      {/* 뷰어 상단 액션바 */}
      <div className="h-14 px-8 flex justify-between items-center border-b border-gray-100 shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-sm font-semibold flex items-center">
          <X className="w-4 h-4 mr-1"/> 닫기
        </button>
        <div className="flex items-center space-x-3">
          {isAuthor && !isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-blue-600 text-sm font-semibold flex items-center"><Edit3 className="w-4 h-4 mr-1"/> 편집</button>
              <button onClick={onDelete} className="text-gray-400 hover:text-red-500 text-sm font-semibold flex items-center"><Trash2 className="w-4 h-4 mr-1"/> 삭제</button>
            </>
          )}
          {isAuthor && isEditing && (
            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm flex items-center">
              <Save className="w-4 h-4 mr-1.5"/> 저장
            </button>
          )}
          {!isAuthor && (
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">읽기 전용 (작성자: {post.authorName})</span>
          )}
        </div>
      </div>

      {/* 본문 영역 */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="max-w-3xl mx-auto py-12 px-8">
          
          {isEditing ? (
            <input 
              type="text" value={localTitle} onChange={(e) => setLocalTitle(e.target.value)}
              className="w-full bg-transparent outline-none font-black text-4xl text-gray-900 mb-8 border-b border-dashed border-gray-300 pb-4 focus:border-blue-500"
              placeholder="제목을 입력하세요"
            />
          ) : (
            <h1 className="font-black text-4xl text-gray-900 mb-8 pb-4 border-b border-gray-100">{post.title}</h1>
          )}

          <div 
            ref={contentRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            spellCheck={false}
            data-placeholder={isEditing ? "내용을 작성하세요..." : ""}
            className={`outline-none text-base leading-loose min-h-[500px] text-gray-800
              ${isEditing ? 'cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300' : 'cursor-default'}`}
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
        </div>
      </div>

      {/* 플로팅 에디터 툴바 (편집 모드일 때만, 그리고 하단 중앙에 메모앱과 동일한 디자인으로 등장) */}
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
