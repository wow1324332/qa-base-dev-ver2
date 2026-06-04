import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Shield, Eye, EyeOff, Copy, Check, 
  ChevronRight, ChevronDown, MonitorSmartphone,
  LogOut, Power, Plus, Search, X, Edit, Trash2, Folder,
  LayoutDashboard, User // [수정] 하얀 화면 원인이었던 누락된 아이콘 컴포넌트 추가
} from 'lucide-react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, writeBatch } from "firebase/firestore";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyATKKSrUm6NKATdZdJeDxhQ5Dj2Q32ujh0",
  authDomain: "q-base-dev.firebaseapp.com",
  projectId: "q-base-dev",
  storageBucket: "q-base-dev.firebasestorage.app",
  messagingSenderId: "756427289812",
  appId: "1:756427289812:web:217c6ebb1bfbd1d931f741"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// 초기 기본 카테고리 데이터 (시드용)
const INITIAL_CATEGORIES = [
  { id: 'cat_common', name: 'COMMON', isOpen: true, parentId: null, order: 1 },
  { id: 'cat_platform', name: 'PLATFORM', isOpen: false, parentId: null, order: 2 },
  { id: 'cat_platform_web', name: 'WEB account', isOpen: false, parentId: 'cat_platform', order: 1 },
  { id: 'cat_platform_app', name: 'APP account', isOpen: false, parentId: 'cat_platform', order: 2 },
  { id: 'cat_solution', name: 'SOLUTION', isOpen: false, parentId: null, order: 3 },
  { id: 'cat_solution_web', name: 'WEB account', isOpen: false, parentId: 'cat_solution', order: 1 },
];

const INITIAL_ACCOUNTS = [
  { id: 'acc_1', categoryId: 'cat_common', service: 'Google', title: 'QA TEAM GOOGLE ACCOUNT', loginId: 'qaptner01@gmail.com', password: 'qaptner12!', owner: '홍진의', admin: '홍진의', memo: '플레이스토어 결제 테스트용' },
  { id: 'acc_2', categoryId: 'cat_common', service: 'Apple', title: 'QA TEAM APPLE ACCOUNT', loginId: 'qaptner01@gmail.com', password: 'Qaptner12!', owner: '홍진의', admin: '홍진의', memo: 'TestFlight 배포용' },
  { id: 'acc_3', categoryId: 'cat_common', service: 'Kakao', title: 'QA TEAM KAKAO ACCOUNT', loginId: 'qa_kakao@kakao.com', password: 'Kakao1234!', owner: '김철수', admin: '김철수', memo: '소셜 로그인 테스트' },
  { id: 'acc_4', categoryId: 'cat_platform_web', service: 'Admin', title: '플랫폼 어드민 계정 (Staging)', loginId: 'admin_master', password: 'admin_test_123', owner: '플랫폼파트', admin: '홍진의', memo: '스테이징 환경 전용' },
];

const AppLogo = ({ className }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) return <MonitorSmartphone className={`text-gray-800 ${className}`} strokeWidth={1.5} />;
  return <img src="/icon-192x192.png" alt="QA Base" className={`object-contain ${className}`} onError={() => setImgError(true)} />;
};

// 클립보드 복사 툴팁 애니메이션 컴포넌트
const CopyButton = ({ text, tooltipText = "복사" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex items-center group/copy">
      <button 
        onClick={handleCopy}
        className={`p-1.5 rounded-md transition-all duration-300 ${copied ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100'}`}
        title={tooltipText}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-fade-in whitespace-nowrap z-50">
          복사 완료!
        </span>
      )}
    </div>
  );
};

// 비밀번호 마스킹 컴포넌트
const PasswordMask = ({ password }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="flex items-center space-x-2 group">
      <div className="font-mono tracking-wider text-sm font-medium text-gray-700 w-32 truncate">
        {show ? password : '••••••••'}
      </div>
      <button 
        onClick={() => setShow(!show)} 
        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all opacity-0 group-hover:opacity-100"
      >
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
      <CopyButton text={password} tooltipText="비밀번호 복사" />
    </div>
  );
};

// 커스텀 배지 컴포넌트
const ServiceBadge = ({ service }) => {
  let bgColor = 'bg-gray-100 text-gray-600 border-gray-200';
  if (service.toLowerCase().includes('google')) bgColor = 'bg-red-50 text-red-600 border-red-200';
  if (service.toLowerCase().includes('apple')) bgColor = 'bg-gray-800 text-white border-gray-700';
  if (service.toLowerCase().includes('kakao')) bgColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (service.toLowerCase().includes('admin')) bgColor = 'bg-purple-50 text-purple-600 border-purple-200';
  
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shadow-sm border whitespace-nowrap ${bgColor}`}>
      {service}
    </span>
  );
};

// 계정 추가/수정 모달
const AccountModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isEdit, onDelete, categories }) => {
  if (!isOpen) return null;

  // 하위 카테고리만 선택 가능하도록 필터링 (최상위이면서 자식이 있는 경우는 선택 불가)
  const selectableCategories = categories.filter(c => c.parentId !== null || !categories.some(child => child.parentId === c.id));

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[450px] border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center shrink-0">
          <KeyRound className="w-5 h-5 mr-2 text-gray-600"/> 테스트 계정 {isEdit ? '수정' : '등록'}
        </h3>
        
        <form id="accountForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">소속 폴더 (카테고리)</label>
            <select 
              required value={formData.categoryId} 
              onChange={e=>setFormData({...formData, categoryId: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors text-gray-700"
            >
              <option value="">카테고리 선택</option>
              {selectableCategories.map(cat => {
                const parent = categories.find(p => p.id === cat.parentId);
                const displayName = parent ? `${parent.name} > ${cat.name}` : cat.name;
                return <option key={cat.id} value={cat.id}>{displayName}</option>;
              })}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">계정 타이틀</label>
            <input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: QA TEAM GOOGLE ACCOUNT" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">서비스 태그</label>
              <input required value={formData.service} onChange={e=>setFormData({...formData, service: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: Google, Admin" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">관리자 (Admin)</label>
              <input required value={formData.admin} onChange={e=>setFormData({...formData, admin: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: 홍진의" />
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4 mt-2 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">로그인 ID</label>
              <input required value={formData.loginId} onChange={e=>setFormData({...formData, loginId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="ID 또는 Email" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">비밀번호</label>
              <input required value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="비밀번호" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">현재 점유자 (Owner)</label>
              <input value={formData.owner} onChange={e=>setFormData({...formData, owner: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="현재 사용중인 분 (선택)" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">용도 / 메모</label>
              <input value={formData.memo} onChange={e=>setFormData({...formData, memo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: 결제 테스트 전용" />
            </div>
          </div>
        </form>

        <div className="flex space-x-2 pt-5 border-t border-gray-100 mt-5">
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm">취소</button>
          {isEdit && <button type="button" onClick={() => onDelete(formData.id)} className="flex-1 bg-red-50 text-red-600 text-sm font-medium py-2.5 rounded-xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm">삭제</button>}
          <button type="submit" form="accountForm" className="flex-1 bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors shadow-md">{isEdit ? '수정' : '등록'}</button>
        </div>
      </div>
    </div>
  );
};

export const AccountsDashboard = ({ user, onNavigate, onLogout, onQuit }) => {
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  const [activeCategoryId, setActiveCategoryId] = useState(null); // null이면 전체 보기
  const [searchInput, setSearchInput] = useState('');
  
  const [accountModal, setAccountModal] = useState({ isOpen: false, isEdit: false });
  const [accountFormData, setAccountFormData] = useState({ id: '', categoryId: '', service: '', title: '', loginId: '', password: '', owner: '', admin: '', memo: '' });

  // Firebase 초기화 및 구독
  useEffect(() => {
    const categoriesRef = collection(db, 'qa_account_categories');
    const unsubscribeCats = onSnapshot(categoriesRef, (snapshot) => {
      if (snapshot.empty) {
        // 시드 데이터 생성
        const seedData = async () => {
          const batch = writeBatch(db);
          INITIAL_CATEGORIES.forEach(cat => batch.set(doc(categoriesRef, cat.id), cat));
          await batch.commit();
        };
        seedData();
      } else {
        setCategories(snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id })).sort((a, b) => a.order - b.order));
      }
    });

    const accountsRef = collection(db, 'qa_accounts');
    const unsubscribeAccs = onSnapshot(accountsRef, (snapshot) => {
      if (snapshot.empty) {
        const seedData = async () => {
          const batch = writeBatch(db);
          INITIAL_ACCOUNTS.forEach(acc => batch.set(doc(accountsRef, acc.id), acc));
          await batch.commit();
        };
        seedData();
      } else {
        setAccounts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      }
    });

    return () => {
      unsubscribeCats();
      unsubscribeAccs();
    };
  }, []);

  // 폴더 접기/펴기 핸들러
  const toggleCategory = async (docId, currentState) => {
    try {
      await updateDoc(doc(db, 'qa_account_categories', docId), { isOpen: !currentState });
    } catch (err) { console.error("Error toggling category", err); }
  };

  // 계정 저장/삭제 핸들러
  const handleAccountSubmit = async (data) => {
    try {
      const { id, docId, ...saveData } = data; // docId 제거
      if (accountModal.isEdit) await updateDoc(doc(db, 'qa_accounts', id), saveData);
      else await addDoc(collection(db, 'qa_accounts'), saveData);
      setAccountModal({ isOpen: false, isEdit: false });
    } catch(err) { console.error("Error saving account", err); }
  };

  const handleAccountDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'qa_accounts', id));
      setAccountModal({ isOpen: false, isEdit: false });
    } catch(err) { console.error("Error deleting account", err); }
  };

  // 트리 구조 렌더링을 위한 최상위 카테고리
  const rootCategories = categories.filter(c => c.parentId === null);

  // 검색 및 필터링
  const filteredAccounts = accounts.filter(acc => {
    // 1. 카테고리 필터링 (선택된 카테고리 또는 그 하위 카테고리인지)
    if (activeCategoryId) {
      const childCats = categories.filter(c => c.parentId === activeCategoryId).map(c => c.id);
      if (acc.categoryId !== activeCategoryId && !childCats.includes(acc.categoryId)) return false;
    }
    
    // 2. 검색어 필터링
    if (searchInput) {
      const term = searchInput.toLowerCase();
      const inTitle = acc.title?.toLowerCase().includes(term);
      const inId = acc.loginId?.toLowerCase().includes(term);
      const inOwner = acc.owner?.toLowerCase().includes(term);
      const inService = acc.service?.toLowerCase().includes(term);
      if (!inTitle && !inId && !inOwner && !inService) return false;
    }
    return true;
  });

  return (
    <div className="w-screen h-screen bg-[#f8f9fa] flex flex-col overflow-hidden animate-simple-fade">
      <header className="h-16 px-6 flex justify-between items-center bg-white border-b border-gray-100 z-20 shrink-0 shadow-sm relative">
        <div className="flex items-center space-x-3">
          <AppLogo className="w-6 h-6" />
          <span className="text-lg font-medium tracking-wide text-gray-800">QA BASE</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm hover-breath cursor-default">
            <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-white text-[10px] font-medium">{user?.name?.charAt(0) || 'U'}</div>
            <span className="text-xs font-medium text-gray-700">{user?.name || 'User'}</span>
          </div>
          <div className="h-4 w-px bg-gray-200"></div>
          <button onClick={onLogout} className="text-gray-400 hover:text-gray-800 transition-colors p-1.5 hover-breath rounded-md"><LogOut className="w-4 h-4" /></button>
          <button onClick={onQuit} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover-breath rounded-md"><Power className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* 좌측 트리형 폴더 사이드바 */}
        <aside className="w-64 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out flex flex-col z-10 overflow-hidden shrink-0 shadow-sm">
          <div className="p-4 flex flex-col h-full">
            <div className="text-[10px] font-bold text-gray-400 tracking-wider mb-4 px-3 mt-2 uppercase">Menu</div>
            <button onClick={() => onNavigate('board')} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors mb-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm font-medium">기능 보드 이동</span>
            </button>
            
            <div className="h-px bg-gray-100 my-2 mx-3"></div>
            
            <div className="text-[10px] font-bold text-blue-500 tracking-wider mb-2 px-3 mt-4 flex items-center uppercase">
              <Shield className="w-3 h-3 mr-1.5" /> Vault Folders
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
              <button 
                onClick={() => setActiveCategoryId(null)} 
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${activeCategoryId === null ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Folder className="w-4 h-4 shrink-0" />
                <span className="text-sm">전체 계정 보기</span>
              </button>

              {rootCategories.map(rootCat => (
                <div key={rootCat.id} className="mt-2">
                  <div 
                    className={`flex items-center w-full px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${activeCategoryId === rootCat.id ? 'bg-blue-50 text-blue-700' : 'text-gray-800 hover:bg-gray-50'}`}
                    onClick={() => setActiveCategoryId(rootCat.id)}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleCategory(rootCat.docId, rootCat.isOpen); }}
                      className="p-1 mr-1 text-gray-400 hover:text-gray-800 transition-colors"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${rootCat.isOpen ? 'rotate-90' : ''}`} />
                    </button>
                    <span className="text-xs font-bold tracking-wide uppercase">{rootCat.name}</span>
                  </div>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${rootCat.isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    {categories.filter(c => c.parentId === rootCat.id).map(childCat => (
                      <button 
                        key={childCat.id}
                        onClick={() => setActiveCategoryId(childCat.id)}
                        className={`w-full flex items-center pl-9 pr-3 py-2 rounded-lg transition-colors text-left ${activeCategoryId === childCat.id ? 'bg-blue-50/70 text-blue-700 font-bold border border-blue-100 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 shadow-sm ${activeCategoryId === childCat.id ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <span className="text-xs">{childCat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col p-8 transition-all duration-300 bg-[#f0f2f5]">
          <div className="animate-fade-in h-full flex flex-col max-w-7xl mx-auto w-full">
            
            {/* 상단 헤더 영역 */}
            <div className="flex justify-between items-end mb-6 shrink-0">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    계정 금고 (Accounts Vault) 
                    <span className="ml-3 text-xs bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full font-bold shadow-inner">
                      {filteredAccounts.length} 개
                    </span>
                  </h1>
                </div>
                <p className="text-sm text-gray-500 font-medium">보안이 유지된 테스트용 공용 계정들을 빠르고 쉽게 관리하세요.</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 transition-colors focus-within:border-gray-400 shadow-sm h-10 w-64">
                  <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input type="text" placeholder="서비스, 타이틀, ID 검색..." value={searchInput} onChange={e=>setSearchInput(e.target.value)} className="text-sm bg-transparent outline-none w-full placeholder:text-gray-400 text-gray-700" />
                  {searchInput && (
                    <button onClick={() => setSearchInput('')} className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X className="w-3 h-3" /></button>
                  )}
                </div>
                <button onClick={() => { setAccountFormData({ id: '', categoryId: activeCategoryId && activeCategoryId !== 'cat_common' ? activeCategoryId : '', service: '', title: '', loginId: '', password: '', owner: '', admin: '', memo: '' }); setAccountModal({isOpen: true, isEdit: false}); }} className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors shadow-md flex items-center h-10">
                  <Plus className="w-4 h-4 mr-1.5" /> 계정 등록
                </button>
              </div>
            </div>

            {/* 리스트 뷰 영역 */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden flex flex-col relative z-0">
              <div className="overflow-y-auto no-scrollbar flex-1 relative p-2">
                <div className="space-y-4 p-4">
                  {filteredAccounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Shield className="w-12 h-12 text-gray-200 mb-4" />
                      <p className="text-gray-500 font-medium">등록된 계정이 없거나 검색 결과가 없습니다.</p>
                    </div>
                  ) : (
                    // 컨플루언스와 유사하게 카테고리별로 묶어서 보여주기 위한 렌더링 로직
                    Object.entries(
                      filteredAccounts.reduce((acc, account) => {
                        const cat = categories.find(c => c.id === account.categoryId);
                        const catName = cat ? cat.name : '미분류';
                        if (!acc[catName]) acc[catName] = [];
                        acc[catName].push(account);
                        return acc;
                      }, {})
                    ).map(([catName, accs]) => (
                      <div key={catName} className="mb-8 animate-fade-in">
                        <h4 className="text-sm font-bold text-gray-700 border-b-2 border-gray-100 pb-2 mb-4 pl-2 tracking-wide text-blue-800 uppercase">
                          {catName}
                        </h4>
                        <div className="space-y-3">
                          {accs.map(acc => (
                            <div key={acc.id} className="group relative bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200 pl-5">
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                                <button onClick={() => { setAccountFormData(acc); setAccountModal({isOpen: true, isEdit: true}); }} className="p-1.5 text-gray-400 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-md border border-gray-100 shadow-sm transition-colors"><Edit className="w-3.5 h-3.5"/></button>
                              </div>
                              
                              <div className="flex items-start justify-between mb-3 pr-16">
                                <div className="flex items-center space-x-2">
                                  <ServiceBadge service={acc.service} />
                                  <h5 className="font-bold text-gray-800 text-[15px] tracking-tight">{acc.title}</h5>
                                </div>
                                {acc.memo && <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 max-w-[200px] truncate" title={acc.memo}>{acc.memo}</span>}
                              </div>

                              <div className="grid grid-cols-12 gap-4 bg-gray-50/50 rounded-lg p-3 border border-gray-50 items-center">
                                <div className="col-span-4 flex flex-col">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">ID / Email</span>
                                  <div className="flex items-center group/id">
                                    <span className="text-sm font-bold text-gray-700 truncate w-48" title={acc.loginId}>{acc.loginId}</span>
                                    <div className="ml-2"><CopyButton text={acc.loginId} tooltipText="ID 복사" /></div>
                                  </div>
                                </div>
                                
                                <div className="col-span-4 flex flex-col">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Password</span>
                                  <PasswordMask password={acc.password} />
                                </div>

                                <div className="col-span-2 flex flex-col border-l border-gray-200 pl-4">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Owner</span>
                                  <span className="text-xs font-semibold text-blue-600 flex items-center">
                                    <User className="w-3 h-3 mr-1 opacity-70" /> {acc.owner || '-'}
                                  </span>
                                </div>

                                <div className="col-span-2 flex flex-col border-l border-gray-200 pl-4">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Admin</span>
                                  <span className="text-xs font-medium text-gray-600">{acc.admin}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      <AccountModal 
        isOpen={accountModal.isOpen} 
        onClose={() => setAccountModal({ ...accountModal, isOpen: false })} 
        formData={accountFormData} 
        setFormData={setAccountFormData} 
        onSubmit={handleAccountSubmit} 
        isEdit={accountModal.isEdit}
        onDelete={handleAccountDelete}
        categories={categories}
      />
    </div>
  );
};
