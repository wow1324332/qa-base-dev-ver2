import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Shield, Eye, EyeOff, Copy, Check, 
  ChevronRight, ChevronDown, ChevronLeft, MonitorSmartphone,
  LogOut, Power, Plus, Search, X, Edit, Trash2, Folder,
  LayoutDashboard, User
} from 'lucide-react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { SidebarFavorites } from './SidebarFavorites'; // 경로 확인 필요

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBIsBcW0eBceMAJdhGsKmdNew7vvMPbwB4",
  authDomain: "qa-base-prd.firebaseapp.com",
  projectId: "qa-base-prd",
  storageBucket: "qa-base-prd.firebasestorage.app",
  messagingSenderId: "138324755275",
  appId: "1:138324755275:web:ead26c4202fad8c0885ece"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// 서비스 태그 색상 팔레트 정의 (11종)
const TAG_PALETTE = [
  { name: 'Gray', class: 'bg-gray-100 text-gray-600 border-gray-200', picker: 'bg-gray-400' },
  { name: 'Dark', class: 'bg-gray-800 text-white border-gray-700', picker: 'bg-gray-800' },
  { name: 'Red', class: 'bg-red-50 text-red-600 border-red-200', picker: 'bg-red-500' },
  { name: 'Orange', class: 'bg-orange-50 text-orange-600 border-orange-200', picker: 'bg-orange-500' },
  { name: 'Yellow', class: 'bg-yellow-100 text-yellow-800 border-yellow-300', picker: 'bg-yellow-400' },
  { name: 'Green', class: 'bg-green-50 text-green-600 border-green-200', picker: 'bg-green-500' },
  { name: 'Emerald', class: 'bg-emerald-50 text-emerald-600 border-emerald-200', picker: 'bg-emerald-500' },
  { name: 'Blue', class: 'bg-blue-50 text-blue-600 border-blue-200', picker: 'bg-blue-500' },
  { name: 'Indigo', class: 'bg-indigo-50 text-indigo-600 border-indigo-200', picker: 'bg-indigo-500' },
  { name: 'Purple', class: 'bg-purple-50 text-purple-600 border-purple-200', picker: 'bg-purple-500' },
  { name: 'Pink', class: 'bg-pink-50 text-pink-600 border-pink-200', picker: 'bg-pink-500' },
];

const INITIAL_CATEGORIES = [
  { id: 'cat_common', name: 'COMMON', isOpen: true, parentId: null, order: 1 },
  { id: 'cat_platform', name: 'PLATFORM', isOpen: false, parentId: null, order: 2 },
  { id: 'cat_platform_web', name: 'WEB account', isOpen: false, parentId: 'cat_platform', order: 1 },
  { id: 'cat_platform_app', name: 'APP account', isOpen: false, parentId: 'cat_platform', order: 2 },
  { id: 'cat_solution', name: 'SOLUTION', isOpen: false, parentId: null, order: 3 },
  { id: 'cat_solution_web', name: 'WEB account', isOpen: false, parentId: 'cat_solution', order: 1 },
];

const INITIAL_ACCOUNTS = [
  { id: 'acc_1', categoryId: 'cat_common', accountType: 'Type1', service: 'Google', loginId: 'qaptner01@gmail.com', password: 'qaptner12!', owner: '홍진의', admin: '홍진의', memo: '플레이스토어 결제 테스트용', tagColor: TAG_PALETTE[2].class },
  { id: 'acc_2', categoryId: 'cat_common', accountType: 'Type1', service: 'Apple', loginId: 'qaptner01@gmail.com', password: 'Qaptner12!', owner: '홍진의', admin: '홍진의', memo: 'TestFlight 배포용', tagColor: TAG_PALETTE[1].class },
  { id: 'acc_3', categoryId: 'cat_common', accountType: 'Type1', service: 'Kakao', loginId: 'qa_kakao@kakao.com', password: 'Kakao1234!', owner: '김철수', admin: '김철수', memo: '소셜 로그인 테스트', tagColor: TAG_PALETTE[4].class },
  { id: 'acc_4', categoryId: 'cat_platform_web', accountType: 'Type1', service: 'Admin', loginId: 'admin_master', password: 'admin_test_123', owner: '플랫폼파트', admin: '홍진의', memo: '스테이징 환경 전용', tagColor: TAG_PALETTE[9].class },
];

const AppLogo = ({ className }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) return <MonitorSmartphone className={`text-gray-800 ${className}`} strokeWidth={1.5} />;
  return <img src="/icon-192x192.png" alt="QA Base" className={`object-contain ${className}`} onError={() => setImgError(true)} />;
};

const CustomSelect = ({ value, onChange, options, className, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`relative ${className} p-0 ${disabled ? 'cursor-not-allowed opacity-60 bg-gray-100' : 'cursor-pointer hover:border-gray-300'}`} tabIndex={disabled ? -1 : 0} onBlur={(e) => { if(!e.currentTarget.contains(e.relatedTarget)) setIsOpen(false); }}>
      <div className="flex justify-between items-center w-full h-full px-3 py-1.5" onClick={() => !disabled && setIsOpen(!isOpen)}>
        <span className={`whitespace-nowrap ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{options.find(o => o.value === value)?.label || value || '선택'}</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-2 shrink-0 ${disabled ? 'text-gray-300' : 'text-gray-400'} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 min-w-full w-max bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto animate-fast-fade">
          {options.map(opt => (
            <div key={opt.value} className={`px-3 py-2 text-xs hover:bg-blue-50 transition-colors whitespace-nowrap ${value === opt.value ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`} onClick={() => { onChange(opt.value); setIsOpen(false); }}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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

const ServiceBadge = ({ service, colorClass }) => {
  const appliedClass = colorClass || TAG_PALETTE[0].class;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shadow-sm border whitespace-nowrap ${appliedClass}`}>
      {service}
    </span>
  );
};

const CategoryModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isEdit, onDelete }) => {
  if (!isOpen) return null;
  const isRoot = formData.parentId === null;

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center shrink-0">
          <Folder className="w-5 h-5 mr-2 text-gray-600"/> {isRoot ? '대분류' : '소분류'} 폴더 {isEdit ? '수정' : '등록'}
        </h3>
        <form id="categoryForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">폴더 이름</label>
            <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder={isRoot ? "예: COMMON" : "예: WEB account"} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">정렬 순서 (숫자)</label>
            <input type="number" required value={formData.order} onChange={e=>setFormData({...formData, order: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" />
          </div>
        </form>
        <div className="flex space-x-2 pt-5 border-t border-gray-100 mt-5">
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm">취소</button>
          {isEdit && <button type="button" onClick={() => onDelete(formData.id)} className="flex-1 bg-red-50 text-red-600 text-sm font-medium py-2.5 rounded-xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm">삭제</button>}
          <button type="submit" form="categoryForm" className="flex-1 bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors shadow-md">{isEdit ? '수정' : '등록'}</button>
        </div>
      </div>
    </div>
  );
};

const AccountModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isEdit, onDelete, categories }) => {
  if (!isOpen) return null;

  const selectableCategories = categories.filter(c => c.parentId !== null || !categories.some(child => child.parentId === c.id));
  const currentType = formData.accountType || 'Type1';

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[450px] border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center shrink-0">
          <KeyRound className="w-5 h-5 mr-2 text-gray-600"/> 테스트 계정 {isEdit ? '수정' : '등록'}
        </h3>
        
        <form id="accountForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <div className="border-b border-gray-100 pb-4">
            <label className="text-xs font-bold text-blue-600 mb-2 block">계정 구조 타입</label>
            <CustomSelect 
              value={currentType} 
              onChange={val => setFormData({...formData, accountType: val})} 
              options={[
                {value: 'Type1', label: '타입1 (ID / PW / Owner / Admin)'},
                {value: 'Type2', label: '타입2 (APT / ID / PW / Admin)'},
                {value: 'Type3', label: '타입3 (Module / ID / PW / Site URL)'}
              ]}
              className="w-full bg-blue-50 border border-blue-100 text-sm rounded-lg shadow-sm transition-colors text-blue-800 font-medium"
            />
          </div>

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
            <label className="text-xs font-medium text-gray-500 mb-2 block">서비스 태그 색상</label>
            <div className="flex flex-wrap gap-2">
              {TAG_PALETTE.map(c => (
                <button 
                  key={c.class} type="button" 
                  onClick={() => setFormData({...formData, tagColor: c.class})} 
                  className={`w-6 h-6 rounded-full transition-all border border-gray-100 shadow-sm ${c.picker} ${formData.tagColor === c.class ? 'ring-2 ring-offset-2 ring-gray-800 scale-110 shadow-md' : 'opacity-80 hover:opacity-100 hover:scale-110'}`} 
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {currentType === 'Type1' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">서비스 태그</label>
                <input required value={formData.service || ''} onChange={e=>setFormData({...formData, service: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: Google, Admin" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">관리자 (Admin)</label>
                <input required value={formData.admin || ''} onChange={e=>setFormData({...formData, admin: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: 홍진의" />
              </div>
            </div>
          )}

          {currentType === 'Type2' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">아파트명 (APT)</label>
                <input required value={formData.aptName || ''} onChange={e=>setFormData({...formData, aptName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: 래미안 첼리투스" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">관리자 (Admin)</label>
                <input required value={formData.admin || ''} onChange={e=>setFormData({...formData, admin: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: 홍진의" />
              </div>
            </div>
          )}

          {currentType === 'Type3' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">모듈명 (Module)</label>
                <input required value={formData.moduleName || ''} onChange={e=>setFormData({...formData, moduleName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: 통합 결제 어드민" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">사이트 (Site URL)</label>
                <input required value={formData.siteUrl || ''} onChange={e=>setFormData({...formData, siteUrl: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: admin.example.com" />
              </div>
            </div>
          )}
          
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
            {currentType === 'Type1' ? (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">현재 점유자 (Owner)</label>
                <input value={formData.owner || ''} onChange={e=>setFormData({...formData, owner: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="현재 사용중인 분 (선택)" />
              </div>
            ) : <div></div>}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">용도 / 메모</label>
              <input value={formData.memo || ''} onChange={e=>setFormData({...formData, memo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: 결제 테스트 전용" />
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
  // [추가] 뷰어 모드 및 핀 번호 검증 상태
  const isViewer = user?.role === 'viewer';
  const [isPinVerified, setIsPinVerified] = useState(!isViewer);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // [추가] 사이드바 폴딩 상태 관리
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  const [activeCategoryId, setActiveCategoryId] = useState(null); 
  const [searchInput, setSearchInput] = useState('');
  
  const [accountModal, setAccountModal] = useState({ isOpen: false, isEdit: false });
  const [accountFormData, setAccountFormData] = useState({ id: '', categoryId: '', accountType: 'Type1', service: '', loginId: '', password: '', owner: '', admin: '', memo: '', aptName: '', moduleName: '', siteUrl: '', tagColor: TAG_PALETTE[0].class });

  const [categoryModal, setCategoryModal] = useState({ isOpen: false, isEdit: false });
  const [categoryFormData, setCategoryFormData] = useState({ id: '', name: '', order: 1, parentId: null, isOpen: false });

  // [추가] 핀 번호 입력 핸들러 로직 (1324)
  const handlePinClick = (num) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + num;
      setPinInput(newPin);
      setPinError(false);
      if (newPin.length === 4) {
        if (newPin === '1324') {
          setTimeout(() => setIsPinVerified(true), 200);
        } else {
          setPinError(true);
          setTimeout(() => setPinInput(''), 500);
        }
      }
    }
  };

  useEffect(() => {
    const categoriesRef = collection(db, 'qa_account_categories');
    const unsubscribeCats = onSnapshot(categoriesRef, (snapshot) => {
      if (snapshot.empty) {
        const seedData = async () => {
          const batch = writeBatch(db);
          INITIAL_CATEGORIES.forEach(cat => batch.set(doc(categoriesRef, cat.id), cat));
          await batch.commit();
        };
        seedData();
      } else {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.order - b.order));
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

  const toggleCategory = async (id, currentState) => {
    try { await updateDoc(doc(db, 'qa_account_categories', id), { isOpen: !currentState }); } 
    catch (err) { console.error("Error toggling category", err); }
  };

  const handleCategorySubmit = async (data) => {
    try {
      const { id, ...saveData } = data;
      if (categoryModal.isEdit) await updateDoc(doc(db, 'qa_account_categories', id), saveData);
      else await addDoc(collection(db, 'qa_account_categories'), saveData);
      setCategoryModal({ isOpen: false, isEdit: false });
    } catch(err) { console.error("Error saving category", err); }
  };

  const handleCategoryDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'qa_account_categories', id));
      setCategoryModal({ isOpen: false, isEdit: false });
    } catch(err) { console.error("Error deleting category", err); }
  };

  const handleAccountSubmit = async (data) => {
    try {
      const { id, ...saveData } = data; 
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

  const rootCategories = categories.filter(c => c.parentId === null);

  const filteredAccounts = accounts.filter(acc => {
    if (activeCategoryId) {
      const childCats = categories.filter(c => c.parentId === activeCategoryId).map(c => c.id);
      if (acc.categoryId !== activeCategoryId && !childCats.includes(acc.categoryId)) return false;
    }
    if (searchInput) {
      const term = searchInput.toLowerCase();
      const inId = acc.loginId?.toLowerCase().includes(term);
      const inOwner = acc.owner?.toLowerCase().includes(term);
      const inService = acc.service?.toLowerCase().includes(term);
      const inApt = acc.aptName?.toLowerCase().includes(term);
      const inModule = acc.moduleName?.toLowerCase().includes(term);
      if (!inId && !inOwner && !inService && !inApt && !inModule) return false;
    }
    return true;
  });

  const getDisplayTitle = () => {
    if (!activeCategoryId) return "Accounts";
    const activeCat = categories.find(c => c.id === activeCategoryId);
    if (!activeCat) return "Accounts";
    if (activeCat.parentId) {
      const parentCat = categories.find(c => c.id === activeCat.parentId);
      return parentCat ? `${parentCat.name} > ${activeCat.name}` : activeCat.name;
    }
    return activeCat.name;
  };

  // [추가] 핀 번호 인증이 안 된 뷰어 사용자를 위한 핀 패드 렌더링
  if (!isPinVerified) {
    return (
      <div className="w-screen h-screen bg-[#f8f9fa] flex flex-col items-center justify-center animate-fade-in relative">
        <button onClick={() => onNavigate('board')} className="absolute top-6 left-6 flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium">
          <ChevronLeft className="w-5 h-5 mr-1" /> Functional Board
        </button>
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center w-[340px]">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">보안 PIN 입력</h2>
          <p className="text-xs text-gray-500 mb-6 text-center">계정 금고 열람을 위해<br/>PIN 번호를 입력해주세요.</p>
          
          <div className="flex space-x-4 mb-6 h-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${pinInput.length > i ? 'bg-blue-600 scale-110' : 'bg-gray-200'}`} />
            ))}
          </div>

          <div className="h-4 mb-4">
            {pinError && <p className="text-xs text-red-500 animate-bounce font-medium">PIN 번호가 일치하지 않습니다.</p>}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button key={num} onClick={() => handlePinClick(num.toString())} className="h-14 bg-gray-50 hover:bg-gray-100 rounded-2xl text-xl font-bold text-gray-700 transition-colors active:scale-95">{num}</button>
            ))}
            <button onClick={() => setPinInput('')} className="h-14 bg-gray-50 hover:bg-gray-100 rounded-2xl text-xs font-bold text-gray-500 transition-colors active:scale-95 uppercase tracking-wider">Clear</button>
            <button onClick={() => handlePinClick('0')} className="h-14 bg-gray-50 hover:bg-gray-100 rounded-2xl text-xl font-bold text-gray-700 transition-colors active:scale-95">0</button>
            <button onClick={() => setPinInput(prev => prev.slice(0, -1))} className="h-14 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 transition-colors active:scale-95"><X className="w-5 h-5"/></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#f8f9fa] flex flex-col overflow-hidden animate-simple-fade">
      <header className="h-20 px-8 flex justify-between items-center bg-[url('/header-bg.jpg')] bg-cover bg-[length:100%_100%] shrink-0 relative z-50 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-3"></div>
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

      <div className="flex flex-1 overflow-hidden relative bg-[#f0f2f5]">
        {/* [추가] 블러 처리된 독립적인 배경 레이어 */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[2px] scale-[1.02] z-0 pointer-events-none"
          style={{ backgroundImage: "url('/project-bg.jpg')" }}
        ></div>
  
        <aside className={`bg-white/60 backdrop-blur-xl border-r border-gray-100/50 transition-all duration-300 ease-in-out flex flex-col justify-between z-10 overflow-hidden shrink-0 shadow-[-5px_0_30px_rgba(0,0,0,0.02)] ${sidebarOpen ? 'w-64' : 'w-0'}`}>
          <div className="p-4 flex flex-col relative z-10 overflow-y-auto no-scrollbar flex-1 w-64">
            <div className="text-[10px] font-bold text-gray-400 tracking-wider mb-4 px-3 mt-2 uppercase">Menu</div>
            <button onClick={() => onNavigate('board')} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50/50 hover:text-gray-900 transition-colors mb-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm font-medium">Functional Board</span>
            </button>
            
            <div className="h-px bg-gray-100/50 my-2 mx-3"></div>
            
            <div className="text-[10px] font-bold text-blue-500 tracking-wider mb-2 px-3 mt-4 flex items-center justify-between uppercase">
              <div className="flex items-center"><Shield className="w-3 h-3 mr-1.5" /> Vault Folders</div>
              {!isViewer && (
                <button 
                  onClick={() => { setCategoryFormData({ id: '', name: '', order: categories.length + 1, parentId: null, isOpen: true }); setCategoryModal({ isOpen: true, isEdit: false }); }}
                  className="p-1 hover:bg-gray-100/50 rounded text-gray-500 hover:text-gray-800 transition-colors"
                  title="대분류 추가"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className="pr-1">
              <button 
                onClick={() => setActiveCategoryId(null)} 
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${activeCategoryId === null ? 'bg-blue-50/70 text-blue-700 font-bold border border-blue-100/50 shadow-sm' : 'text-gray-600 hover:bg-gray-50/50'}`}
              >
                <Folder className="w-4 h-4 shrink-0" />
                <span className="text-sm">All Acounts</span>
              </button>

              {rootCategories.map(rootCat => (
                <div key={rootCat.id} className="mt-2 group/cat">
                  <div 
                    className={`flex items-center justify-between w-full pl-2 pr-1 py-1.5 rounded-lg transition-colors cursor-pointer ${activeCategoryId === rootCat.id ? 'bg-blue-50/70 text-blue-700 border border-blue-100/50 shadow-sm' : 'text-gray-800 hover:bg-gray-50/50'}`}
                    onClick={() => setActiveCategoryId(rootCat.id)}
                  >
                    <div className="flex items-center truncate">
                      <button onClick={(e) => { e.stopPropagation(); toggleCategory(rootCat.id, rootCat.isOpen); }} className="p-1 mr-1 text-gray-400 hover:text-gray-800 transition-colors shrink-0">
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${rootCat.isOpen ? 'rotate-90' : ''}`} />
                      </button>
                      <span className="text-xs font-bold tracking-wide uppercase truncate">{rootCat.name}</span>
                    </div>
                    {!isViewer && (
                      <div className="hidden group-hover/cat:flex items-center space-x-0.5 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setCategoryFormData({ id: '', name: '', order: categories.length + 1, parentId: rootCat.id, isOpen: false }); setCategoryModal({ isOpen: true, isEdit: false }); }} className="text-gray-400 hover:text-blue-600 transition-colors bg-white/80 p-0.5 rounded shadow-sm" title="소분류 추가"><Plus className="w-3.5 h-3.5"/></button>
                        <button onClick={(e) => { e.stopPropagation(); setCategoryFormData(rootCat); setCategoryModal({ isOpen: true, isEdit: true }); }} className="text-gray-400 hover:text-green-600 transition-colors bg-white/80 p-0.5 rounded shadow-sm"><Edit className="w-3.5 h-3.5"/></button>
                        <button onClick={(e) => { e.stopPropagation(); handleCategoryDelete(rootCat.id); }} className="text-gray-400 hover:text-red-600 transition-colors bg-white/80 p-0.5 rounded shadow-sm"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    )}
                  </div>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${rootCat.isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    {categories.filter(c => c.parentId === rootCat.id).map(childCat => (
                      <div 
                        key={childCat.id}
                        className={`group/subcat flex items-center justify-between w-full pl-9 pr-1 py-1.5 rounded-lg transition-colors cursor-pointer ${activeCategoryId === childCat.id ? 'bg-blue-50/70 text-blue-700 font-bold shadow-sm border border-blue-100/50' : 'hover:bg-gray-50/50 text-gray-500 hover:text-gray-900'}`}
                        onClick={() => setActiveCategoryId(childCat.id)}
                      >
                        <div className="flex items-center truncate">
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 shadow-sm shrink-0 ${activeCategoryId === childCat.id ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <span className="text-xs truncate">{childCat.name}</span>
                        </div>
                        {!isViewer && (
                          <div className="hidden group-hover/subcat:flex items-center space-x-0.5 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); setCategoryFormData(childCat); setCategoryModal({ isOpen: true, isEdit: true }); }} className="text-gray-400 hover:text-green-600 transition-colors bg-white/80 p-0.5 rounded shadow-sm"><Edit className="w-3.5 h-3.5"/></button>
                            <button onClick={(e) => { e.stopPropagation(); handleCategoryDelete(childCat.id); }} className="text-gray-400 hover:text-red-600 transition-colors bg-white/80 p-0.5 rounded shadow-sm"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SidebarFavorites 
            db={db} 
            user={user} 
            onNavigate={onNavigate} 
            sidebarOpen={sidebarOpen} 
            currentModule="accounts" 
          />
        </aside>

        {/* 미니멀 시네마틱 폴딩 핸들 */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className={`absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center transition-all duration-300 ease-in-out group outline-none w-3 h-14 rounded-r-lg backdrop-blur-md shadow-[3px_0_10px_-3px_rgba(0,0,0,0.05)] bg-white/30 hover:bg-white/50 hover:shadow-[4px_0_16px_-4px_rgba(0,0,0,0.1)] ${
            sidebarOpen ? 'left-[256px]' : 'left-0'
          }`}
        >
          <div className="w-[1.5px] h-5 bg-gray-400/40 rounded-full transition-colors duration-300 group-hover:bg-gray-500/60"></div>
        </button>

        <main className={`relative z-10 flex-1 overflow-hidden flex flex-col p-8 transition-all duration-300 ${!sidebarOpen ? 'ml-12' : ''}`}>
          <div className="animate-fade-in h-full flex flex-col max-w-7xl mx-auto w-full">
            
            <div className="flex justify-between items-end mb-6 shrink-0">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    {getDisplayTitle()}
                    <span className="ml-3 text-xs bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full font-bold shadow-inner">
                      {filteredAccounts.length} 개
                    </span>
                    {isViewer && <span className="ml-2 bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded border border-gray-200 font-semibold uppercase tracking-wider shadow-sm">Read Only</span>}
                  </h1>
                </div>
                <p className="text-sm text-gray-500 font-medium">보안이 유지된 테스트용 공용 계정들을 빠르고 쉽게 관리하세요.</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-white/90 backdrop-blur-md border border-gray-200/50 rounded-lg px-3 py-1.5 transition-colors focus-within:border-gray-400 shadow-sm h-10 w-64">
                  <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input type="text" placeholder="서비스, ID 검색..." value={searchInput} onChange={e=>setSearchInput(e.target.value)} className="text-sm bg-transparent outline-none w-full placeholder:text-gray-400 text-gray-700" />
                  {searchInput && (
                    <button onClick={() => setSearchInput('')} className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X className="w-3 h-3" /></button>
                  )}
                </div>
                {!isViewer && (
                  <button onClick={() => { setAccountFormData({ id: '', categoryId: activeCategoryId && activeCategoryId !== 'cat_common' ? activeCategoryId : '', accountType: 'Type1', service: '', loginId: '', password: '', owner: '', admin: '', memo: '', aptName: '', moduleName: '', siteUrl: '', tagColor: TAG_PALETTE[0].class }); setAccountModal({isOpen: true, isEdit: false}); }} className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors shadow-md flex items-center h-10">
                    <Plus className="w-4 h-4 mr-1.5" /> 계정 등록
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-md overflow-hidden flex flex-col relative z-0">
              <div className="overflow-y-auto no-scrollbar flex-1 relative p-2">
                <div className="space-y-4 p-4">
                  {filteredAccounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Shield className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium">등록된 계정이 없거나 검색 결과가 없습니다.</p>
                    </div>
                  ) : (
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
                        <h4 className="text-sm font-bold text-gray-700 border-b-2 border-gray-100/50 pb-2 mb-4 pl-2 tracking-wide text-blue-800 uppercase">
                          {catName}
                        </h4>
                        <div className="space-y-3">
                          {accs.map(acc => {
                            const type = acc.accountType || 'Type1';
                            return (
                            <div key={acc.id} className="group relative bg-white border border-gray-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300/50">
                              {!isViewer && (
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                                  <button onClick={() => { setAccountFormData(acc); setAccountModal({isOpen: true, isEdit: true}); }} className="p-1.5 text-gray-500 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-md border border-gray-200 shadow-sm transition-colors"><Edit className="w-3.5 h-3.5"/></button>
                                  <button onClick={() => { handleAccountDelete(acc.id); }} className="p-1.5 text-gray-500 bg-white hover:bg-red-50 hover:text-red-600 rounded-md border border-gray-200 shadow-sm transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                                </div>
                              )}
                              
                              <div className="flex items-start justify-between mb-4 pr-16">
                                <div className="flex items-center space-x-2">
                                  {type === 'Type1' && <ServiceBadge service={acc.service || 'Default'} colorClass={acc.tagColor} />}
                                  {type === 'Type2' && <ServiceBadge service="APT" colorClass={acc.tagColor} />}
                                  {type === 'Type3' && <ServiceBadge service="WEB" colorClass={acc.tagColor} />}
                                </div>
                                {acc.memo && <span className="text-xs font-medium text-gray-600 bg-gray-50/50 px-3 py-1.5 rounded-lg border border-gray-100 max-w-[250px] truncate shadow-sm" title={acc.memo}>{acc.memo}</span>}
                              </div>

                              <div className="grid grid-cols-12 gap-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100 items-center shadow-inner mt-2">
                                {/* Type1 렌더링 */}
                                {type === 'Type1' && (
                                  <>
                                    <div className="col-span-4 flex flex-col">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">ID / Email</span>
                                      <div className="flex items-center group/id">
                                        <span className="text-sm font-bold text-gray-700 truncate w-48" title={acc.loginId}>{acc.loginId}</span>
                                        <div className="ml-2"><CopyButton text={acc.loginId} tooltipText="ID 복사" /></div>
                                      </div>
                                    </div>
                                    <div className="col-span-4 flex flex-col">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Password</span>
                                      <PasswordMask password={acc.password} />
                                    </div>
                                    <div className="col-span-2 flex flex-col border-l border-gray-200/50 pl-4">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Owner</span>
                                      <span className="text-xs font-semibold text-blue-600 flex items-center">
                                        <User className="w-3 h-3 mr-1 opacity-70" /> {acc.owner || '-'}
                                      </span>
                                    </div>
                                    <div className="col-span-2 flex flex-col border-l border-gray-200/50 pl-4">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Admin</span>
                                      <span className="text-xs font-medium text-gray-700">{acc.admin}</span>
                                    </div>
                                  </>
                                )}

                                {/* Type2 렌더링 */}
                                {type === 'Type2' && (
                                  <>
                                    <div className="col-span-3 flex flex-col">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">APT Name</span>
                                      <span className="text-sm font-bold text-gray-700 truncate" title={acc.aptName}>{acc.aptName}</span>
                                    </div>
                                    <div className="col-span-3 flex flex-col border-l border-gray-200/50 pl-4">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">ID / Email</span>
                                      <div className="flex items-center group/id">
                                        <span className="text-sm font-bold text-gray-700 truncate max-w-[120px]" title={acc.loginId}>{acc.loginId}</span>
                                        <div className="ml-2"><CopyButton text={acc.loginId} tooltipText="ID 복사" /></div>
                                      </div>
                                    </div>
                                    <div className="col-span-4 flex flex-col border-l border-gray-200/50 pl-4">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Password</span>
                                      <PasswordMask password={acc.password} />
                                    </div>
                                    <div className="col-span-2 flex flex-col border-l border-gray-200/50 pl-4">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Admin</span>
                                      <span className="text-xs font-medium text-gray-700">{acc.admin}</span>
                                    </div>
                                  </>
                                )}

                                {/* Type3 렌더링 */}
                                {type === 'Type3' && (
                                  <>
                                    <div className="col-span-3 flex flex-col">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Module Name</span>
                                      <span className="text-sm font-bold text-gray-700 truncate" title={acc.moduleName}>{acc.moduleName}</span>
                                    </div>
                                    <div className="col-span-3 flex flex-col border-l border-gray-200/50 pl-4">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">ID / Email</span>
                                      <div className="flex items-center group/id">
                                        <span className="text-sm font-bold text-gray-700 truncate max-w-[120px]" title={acc.loginId}>{acc.loginId}</span>
                                        <div className="ml-2"><CopyButton text={acc.loginId} tooltipText="ID 복사" /></div>
                                      </div>
                                    </div>
                                    <div className="col-span-3 flex flex-col border-l border-gray-200/50 pl-4">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Password</span>
                                      <PasswordMask password={acc.password} />
                                    </div>
                                    <div className="col-span-3 flex flex-col border-l border-gray-200/50 pl-4">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Site URL</span>
                                      <div className="flex items-center group/url">
                                        <a href={acc.siteUrl?.startsWith('http') ? acc.siteUrl : `https://${acc.siteUrl}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-600 hover:underline truncate max-w-[120px]" title={acc.siteUrl}>
                                          {acc.siteUrl}
                                        </a>
                                        <div className="ml-2"><CopyButton text={acc.siteUrl} tooltipText="URL 복사" /></div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )})}
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
      
      <CategoryModal 
        isOpen={categoryModal.isOpen} 
        onClose={() => setCategoryModal({ ...categoryModal, isOpen: false })} 
        formData={categoryFormData} 
        setFormData={setCategoryFormData} 
        onSubmit={handleCategorySubmit} 
        isEdit={categoryModal.isEdit}
        onDelete={handleCategoryDelete}
      />
    </div>
  );
};
