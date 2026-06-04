import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Smartphone, CreditCard, Activity, CheckCircle2, AlertCircle, 
  ChevronUp, Equal, ChevronDown as ChevronDownIcon,
  ChevronLeft, ChevronRight, LayoutDashboard, Server, Kanban, LogOut, Power, User, Plus, MonitorSmartphone, X, Edit, Filter, Search, ExternalLink, Cpu
} from 'lucide-react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";

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
        <span className={`truncate ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{options.find(o => o.value === value)?.label || value || '선택'}</span>
        <ChevronDownIcon className={`w-3.5 h-3.5 ml-2 ${disabled ? 'text-gray-300' : 'text-gray-400'} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto animate-fast-fade">
          {options.map(opt => (
            <div key={opt.value} className={`px-3 py-2 text-xs hover:bg-blue-50 transition-colors ${value === opt.value ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`} onClick={() => { onChange(opt.value); setIsOpen(false); }}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DetailedStatCard = ({ title, icon: Icon, total, data, colorMap, defaultColor }) => {
  const entries = Object.entries(data).sort((a,b)=>b[1]-a[1]);
  const displayEntries = entries.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-md flex flex-col hover-breath transition-all duration-300 h-full min-h-[12rem]">
      <div className="flex justify-between items-center mb-3 shrink-0 border-b border-gray-50 pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-100">
            <Icon className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-sm font-bold text-gray-800">{title}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{total} Total</span>
        </div>
      </div>
      <div className="flex flex-col space-y-2 pr-1 overflow-visible">
        {displayEntries.map(([label, count]) => {
          const colorClass = colorMap[label] || defaultColor;
          return (
            <div key={label} className="flex items-center justify-between group">
              <span className="text-[11px] font-medium text-gray-600 w-20 truncate group-hover:text-gray-900 transition-colors" title={label}>{label}</span>
              <div className="flex-1 mx-3 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}></div>
              </div>
              <span className="text-[11px] font-bold text-gray-800 w-6 text-right">{count}</span>
            </div>
          );
        })}
        {entries.length === 0 && <div className="text-xs text-gray-400 text-center py-4">데이터 없음</div>}
      </div>
    </div>
  );
};

const CustomBadge = ({ children, className }) => (
  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shadow-sm border whitespace-nowrap ${className}`}>
    {children}
  </span>
);

const HighlightText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim() || !text) return <>{text}</>;
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');
  const parts = String(text).split(regex);
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 text-gray-900 px-0.5 rounded-sm">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

// ==========================================
// [USIM 관리 전용 컴포넌트]
// ==========================================
const UsimModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isEdit, onDelete, devices }) => {
  if (!isOpen) return null;

  const isStored = formData.status === '보관중';
  const isAuthDisabled = formData.authEnabled === '비활성화';

  // 장착 시료 선택을 위한 디바이스 목록 (등록된 디바이스 배열 매핑)
  const deviceOptions = [
    { value: '', label: '선택 안함' },
    ...devices.map(d => ({ value: d.name, label: d.name }))
  ];

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[450px] border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center shrink-0"><CreditCard className="w-5 h-5 mr-2 text-gray-600"/> USIM {isEdit ? '수정' : '등록'}</h3>
        
        <form id="usimForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">유심 번호 (이름)</label>
              <input required value={formData.usimNo} onChange={e=>setFormData({...formData, usimNo: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: 562F" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">통신사</label>
              <CustomSelect 
                value={formData.carrier} 
                onChange={val=>setFormData({...formData, carrier: val})} 
                options={[{value:'SKT', label:'SKT'}, {value:'KT', label:'KT'}, {value:'LG', label:'LG'}, {value:'기타', label:'기타'}]}
                className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg shadow-sm transition-colors"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">전화 번호</label>
            <input required value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: 010-1234-5678" />
          </div>

          <div className="border-t border-gray-100 pt-4 mt-2">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">상태</label>
                <CustomSelect 
                  value={formData.status} 
                  onChange={(val) => setFormData(prev => ({...prev, status: val, currentUser: val === '보관중' ? '' : prev.currentUser, mountedDevice: val === '보관중' ? '' : prev.mountedDevice}))} 
                  options={[{value:'보관중', label:'보관중'}, {value:'사용중', label:'사용중'}, {value:'대여중', label:'대여중'}]}
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg shadow-sm transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">대여/사용자</label>
                <input 
                  disabled={isStored}
                  value={formData.currentUser} 
                  onChange={e=>setFormData({...formData, currentUser: e.target.value})} 
                  className={`w-full border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none shadow-sm transition-colors ${isStored ? 'bg-gray-100 cursor-not-allowed opacity-60 text-gray-400' : 'bg-gray-50 focus:border-gray-400'}`} 
                  placeholder={isStored ? "보관중 선택 불가" : "예: 홍길동"} 
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">장착 시료 (디바이스)</label>
              <CustomSelect 
                disabled={isStored}
                value={formData.mountedDevice} 
                onChange={val=>setFormData({...formData, mountedDevice: val})} 
                options={deviceOptions}
                className={`w-full border border-gray-200 text-sm rounded-lg shadow-sm transition-colors ${isStored ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-gray-50'}`}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-2 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">본인 인증 가능 여부</label>
              <CustomSelect 
                value={formData.authEnabled} 
                onChange={(val) => setFormData(prev => ({...prev, authEnabled: val, pin: val === '비활성화' ? '' : prev.pin}))} 
                options={[{value:'활성화', label:'활성화'}, {value:'비활성화', label:'비활성화'}]}
                className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg shadow-sm transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">PIN 번호</label>
              <input 
                disabled={isAuthDisabled}
                value={formData.pin} 
                onChange={e=>setFormData({...formData, pin: e.target.value})} 
                className={`w-full border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none shadow-sm transition-colors ${isAuthDisabled ? 'bg-gray-100 cursor-not-allowed opacity-60 text-gray-400' : 'bg-gray-50 focus:border-gray-400'}`} 
                placeholder={isAuthDisabled ? "비활성시 입력 불가" : "예: 123456"} 
              />
            </div>
          </div>

        </form>
        <div className="flex space-x-2 pt-5 border-t border-gray-100 mt-5">
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm">취소</button>
          {isEdit && <button type="button" onClick={() => onDelete(formData.id)} className="flex-1 bg-red-50 text-red-600 text-sm font-medium py-2.5 rounded-xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm">삭제</button>}
          <button type="submit" form="usimForm" className="flex-1 bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors shadow-md">{isEdit ? '수정' : '등록'}</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// [디바이스 관리 전용 컴포넌트] (형태 유지를 위한 뼈대)
// ==========================================
const DeviceModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isEdit, onDelete }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center shrink-0"><Smartphone className="w-5 h-5 mr-2 text-gray-600"/> 디바이스 {isEdit ? '수정' : '등록'}</h3>
        <form id="deviceForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">디바이스 명</label>
            <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none shadow-sm transition-colors" placeholder="예: Galaxy Z Fold 5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">OS</label>
              <CustomSelect value={formData.os} onChange={val=>setFormData({...formData, os: val})} options={[{value:'Android', label:'Android'}, {value:'iOS', label:'iOS'}, {value:'Other', label:'Other'}]} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg shadow-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">상태</label>
              <CustomSelect value={formData.status} onChange={val=>setFormData({...formData, status: val})} options={[{value:'보관중', label:'보관중'}, {value:'사용중', label:'사용중'}, {value:'수리중', label:'수리중'}, {value:'분실', label:'분실'}]} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg shadow-sm" />
            </div>
          </div>
        </form>
        <div className="flex space-x-2 pt-4 border-t border-gray-100 mt-4">
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm">취소</button>
          {isEdit && <button type="button" onClick={() => onDelete(formData.id)} className="flex-1 bg-red-50 text-red-600 text-sm font-medium py-2.5 rounded-xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm">삭제</button>}
          <button type="submit" form="deviceForm" className="flex-1 bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors shadow-md">{isEdit ? '수정' : '등록'}</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// [메인 모듈 컴포넌트]
// ==========================================
export const DevicesDashboard = ({ user, onNavigate, onLogout, onQuit }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('devices'); 
  
  // 데이터 상태
  const [devices, setDevices] = useState([]);
  const [usims, setUsims] = useState([]);

  // 필터 및 검색 상태 (USIM)
  const [filterCarrier, setFilterCarrier] = useState('All');
  const [filterUsimStatus, setFilterUsimStatus] = useState('All');
  const [filterAuth, setFilterAuth] = useState('All');
  const [searchInput, setSearchInput] = useState(''); 
  const [searchSummary, setSearchSummary] = useState(''); 

  const [isStatsExpanded, setIsStatsExpanded] = useState(true);

  // 디바이스 모달
  const [deviceModal, setDeviceModal] = useState({ isOpen: false, isEdit: false });
  const [deviceFormData, setDeviceFormData] = useState({ id: '', name: '', os: 'Android', status: '보관중' });

  // USIM 모달
  const [usimModal, setUsimModal] = useState({ isOpen: false, isEdit: false });
  const [usimFormData, setUsimFormData] = useState({ id: '', usimNo: '', carrier: 'SKT', phone: '', status: '보관중', currentUser: '', mountedDevice: '', authEnabled: '비활성화', pin: '' });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchSummary(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Firebase 동기화
  useEffect(() => {
    const devicesRef = collection(db, 'qa_devices');
    const unsubscribeDevices = onSnapshot(devicesRef, (snapshot) => {
      setDevices(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const usimsRef = collection(db, 'qa_usims');
    const unsubscribeUsims = onSnapshot(usimsRef, (snapshot) => {
      setUsims(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    return () => {
      unsubscribeDevices();
      unsubscribeUsims();
    };
  }, []);

  // 핸들러: 디바이스
  const handleDeviceSubmit = async (data) => {
    try {
      const { id, ...saveData } = data;
      if (deviceModal.isEdit) await updateDoc(doc(db, 'qa_devices', id), saveData);
      else await addDoc(collection(db, 'qa_devices'), saveData);
      setDeviceModal({ isOpen: false, isEdit: false });
    } catch(err) { console.error("Error saving device", err); }
  };
  const handleDeviceDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'qa_devices', id));
      setDeviceModal({ isOpen: false, isEdit: false });
    } catch(err) { console.error("Error deleting device", err); }
  };

  // 핸들러: USIM
  const handleUsimSubmit = async (data) => {
    try {
      const { id, ...saveData } = data;
      if (usimModal.isEdit) await updateDoc(doc(db, 'qa_usims', id), saveData);
      else await addDoc(collection(db, 'qa_usims'), saveData);
      setUsimModal({ isOpen: false, isEdit: false });
    } catch(err) { console.error("Error saving usim", err); }
  };
  const handleUsimDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'qa_usims', id));
      setUsimModal({ isOpen: false, isEdit: false });
    } catch(err) { console.error("Error deleting usim", err); }
  };

  // USIM 통계 및 렌더링 값 계산
  const totalUsims = usims.length;
  const statusCounts = usims.reduce((acc, cur) => { acc[cur.status] = (acc[cur.status] || 0) + 1; return acc; }, {});
  const carrierCounts = usims.reduce((acc, cur) => { acc[cur.carrier] = (acc[cur.carrier] || 0) + 1; return acc; }, {});
  const authCounts = usims.reduce((acc, cur) => { acc[cur.authEnabled] = (acc[cur.authEnabled] || 0) + 1; return acc; }, {});

  const statusColorMap = { '보관중': 'bg-gray-400', '사용중': 'bg-blue-500', '대여중': 'bg-purple-500' };
  const carrierColorMap = { 'SKT': 'bg-red-500', 'KT': 'bg-cyan-500', 'LG': 'bg-pink-500', '기타': 'bg-gray-500' };
  const authColorMap = { '활성화': 'bg-green-500', '비활성화': 'bg-gray-300' };

  const getCarrierBadgeClass = (carrier) => {
    switch(carrier) {
      case 'SKT': return 'bg-red-50 text-red-600 border-red-200';
      case 'KT': return 'bg-cyan-50 text-cyan-600 border-cyan-200';
      case 'LG': return 'bg-pink-50 text-pink-600 border-pink-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case '보관중': return 'bg-gray-50 text-gray-600 border-gray-200';
      case '사용중': return 'bg-blue-50 text-blue-600 border-blue-200';
      case '대여중': return 'bg-purple-50 text-purple-600 border-purple-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  // USIM 필터링
  const filteredUsims = usims.filter(usim => {
    if (filterStatus !== 'All' && usim.status !== filterStatus) return false;
    if (filterCarrier !== 'All' && usim.carrier !== filterCarrier) return false;
    if (filterAuth !== 'All' && usim.authEnabled !== filterAuth) return false;
    
    if (searchSummary) {
      const term = searchSummary.toLowerCase();
      const inNo = usim.usimNo?.toLowerCase().includes(term);
      const inPhone = usim.phone?.toLowerCase().includes(term);
      const inUser = usim.currentUser?.toLowerCase().includes(term);
      const inDevice = usim.mountedDevice?.toLowerCase().includes(term);
      if (!inNo && !inPhone && !inUser && !inDevice) return false;
    }
    return true;
  });

  const hasFilters = filterStatus !== 'All' || filterCarrier !== 'All' || filterAuth !== 'All' || searchInput;

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

      <div 
        className="flex flex-1 overflow-hidden relative bg-[#f0f2f5] bg-cover bg-center bg-no-repeat"
      >
        <aside className={`bg-white border-r border-gray-100 transition-all duration-300 ease-in-out flex flex-col z-10 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}`}>
          <div className="p-4 space-y-1 w-64">
            <div className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-3 mt-2">MENU</div>
            <button onClick={() => onNavigate('board')} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"><LayoutDashboard className="w-4 h-4" /><span className="text-sm font-medium">기능 보드 이동</span></button>
            <div className="h-px bg-gray-100 my-2 mx-3"></div>
            <button onClick={() => setActiveMenu('devices')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${activeMenu === 'devices' ? 'bg-blue-50/50 text-blue-700 font-medium border border-blue-100 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><Smartphone className={`w-4 h-4 ${activeMenu === 'devices' ? 'text-blue-600' : ''}`} /><span className="text-sm">디바이스 보드</span></button>
            <button onClick={() => setActiveMenu('usims')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${activeMenu === 'usims' ? 'bg-blue-50/50 text-blue-700 font-medium border border-blue-100 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><CreditCard className={`w-4 h-4 ${activeMenu === 'usims' ? 'text-blue-600' : ''}`} /><span className="text-sm">USIM 관리</span></button>
          </div>
        </aside>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`absolute top-6 z-20 bg-white border border-gray-200 shadow-md rounded-full p-1.5 text-gray-600 hover:text-gray-900 transition-all duration-300 ${sidebarOpen ? 'left-[244px]' : 'left-4'}`}>
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <main className={`flex-1 overflow-hidden flex flex-col p-8 transition-all duration-300 ${!sidebarOpen ? 'ml-12' : ''}`}>
          
          {/* 디바이스 뷰 */}
          {activeMenu === 'devices' && (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-800">디바이스 보드</h1>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">검증용 시료(디바이스) 현황 및 대여 상태를 관리합니다.</p>
                </div>
                <button onClick={() => { setDeviceFormData({ id: '', name: '', os: 'Android', status: '보관중' }); setDeviceModal({isOpen: true, isEdit: false}); }} className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors shadow-md flex items-center">
                  <Plus className="w-4 h-4 mr-1.5" /> 디바이스 등록
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto no-scrollbar pb-6">
                {devices.length > 0 ? devices.map(device => (
                  <div key={device.id} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md cursor-pointer hover-breath group relative">
                    <div className="absolute top-5 right-5 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={(e) => { e.stopPropagation(); setDeviceFormData(device); setDeviceModal({isOpen: true, isEdit: true}); }} className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"><Edit className="w-4 h-4"/></button>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600 transition-colors duration-500 shadow-sm border border-blue-100">
                      <Smartphone className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors duration-500" strokeWidth={2} />
                    </div>
                    <div className="flex justify-between items-start mb-2 pr-8">
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 font-bold">{device.os}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${device.status === '사용중' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {device.status}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors pr-8 truncate">{device.name}</h3>
                  </div>
                )) : (
                  <div className="col-span-3 text-center py-16 text-gray-400 font-medium bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">등록된 디바이스가 없습니다.</div>
                )}
              </div>
            </div>
          )}

          {/* USIM 뷰 */}
          {activeMenu === 'usims' && (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="flex justify-between items-end mb-6 shrink-0">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-800">USIM 관리 보드</h1>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">검증 데이터 확보용 USIM 카드 현황을 관리하세요.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-1.5 flex shadow-sm items-center px-4 space-x-4 h-9">
                    <span className="flex items-center text-xs font-bold text-gray-600"><div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div>SKT ({usims.filter(u=>u.carrier==='SKT').length})</span>
                    <span className="flex items-center text-xs font-bold text-gray-600"><div className="w-2 h-2 rounded-full bg-cyan-500 mr-1.5"></div>KT ({usims.filter(u=>u.carrier==='KT').length})</span>
                    <span className="flex items-center text-xs font-bold text-gray-600"><div className="w-2 h-2 rounded-full bg-pink-500 mr-1.5"></div>LG ({usims.filter(u=>u.carrier==='LG').length})</span>
                  </div>
                  <button onClick={() => { setUsimFormData({ id: '', usimNo: '', carrier: 'SKT', phone: '', status: '보관중', currentUser: '', mountedDevice: '', authEnabled: '비활성화', pin: '' }); setUsimModal({isOpen: true, isEdit: false}); }} className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors shadow-md flex items-center h-9">
                    <Plus className="w-4 h-4 mr-1.5" /> USIM 등록
                  </button>
                </div>
              </div>

              <div className="shrink-0 flex flex-col">
                <div className={`flex justify-between items-end px-1 ${isStatsExpanded ? 'mb-2' : 'mb-6'} transition-all duration-500`}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dashboard Statistics</span>
                  <button onClick={() => setIsStatsExpanded(!isStatsExpanded)} className="flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors bg-white p-1.5 rounded-lg shadow-sm border border-gray-200">
                    {isStatsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </button>
                </div>
                <div className={`grid transition-all duration-500 ease-in-out ${isStatsExpanded ? 'grid-rows-[1fr] opacity-100 mb-6' : 'grid-rows-[0fr] opacity-0 mb-0'}`}>
                  <div className="overflow-hidden">
                    <div className="flex space-x-6 items-stretch pb-1">
                      <div className="flex-1">
                        <DetailedStatCard title="통신사별 통계" icon={Cpu} total={totalUsims} data={carrierCounts} colorMap={carrierColorMap} defaultColor="bg-gray-400" />
                      </div>
                      <div className="flex-1">
                        <DetailedStatCard title="상태별 통계" icon={Activity} total={totalUsims} data={statusCounts} colorMap={statusColorMap} defaultColor="bg-gray-400" />
                      </div>
                      <div className="flex-1">
                        <DetailedStatCard title="본인인증 가능 통계" icon={CheckCircle2} total={totalUsims} data={authCounts} colorMap={authColorMap} defaultColor="bg-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-white p-3 px-5 rounded-t-2xl shadow-sm border border-gray-200 border-b-0 shrink-0 relative z-20">
                <Filter className="w-4 h-4 text-gray-400" />
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                <CustomSelect value={filterCarrier} onChange={setFilterCarrier} options={[{value:'All',label:'통신사 전체'},{value:'SKT',label:'SKT'},{value:'KT',label:'KT'},{value:'LG',label:'LG'},{value:'기타',label:'기타'}]} className="bg-transparent text-xs font-medium text-gray-700 outline-none w-32 hover:bg-gray-50 rounded-md transition-colors" />
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                <CustomSelect value={filterStatus} onChange={setFilterStatus} options={[{value:'All',label:'상태 전체'},{value:'보관중',label:'보관중'},{value:'사용중',label:'사용중'},{value:'대여중',label:'대여중'}]} className="bg-transparent text-xs font-medium text-gray-700 outline-none w-32 hover:bg-gray-50 rounded-md transition-colors" />
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                <CustomSelect value={filterAuth} onChange={setFilterAuth} options={[{value:'All',label:'본인인증 전체'},{value:'활성화',label:'활성화'},{value:'비활성화',label:'비활성화'}]} className="bg-transparent text-xs font-medium text-gray-700 outline-none w-32 hover:bg-gray-50 rounded-md transition-colors" />
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 transition-colors focus-within:border-gray-400 relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                  <input type="text" placeholder="번호, 사용자, 시료 검색..." value={searchInput} onChange={e=>setSearchInput(e.target.value)} className="text-xs bg-transparent outline-none w-full placeholder:text-gray-400 text-gray-700 pr-6" />
                  {searchInput && (
                    <button onClick={() => { setSearchInput(''); setSearchSummary(''); }} className="absolute right-2 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {(hasFilters) && (
                  <button onClick={() => { setFilterCarrier('All'); setFilterStatus('All'); setFilterAuth('All'); setSearchInput(''); setSearchSummary(''); }} className="text-[10px] text-gray-500 hover:text-gray-800 underline ml-2 font-medium whitespace-nowrap">초기화</button>
                )}
              </div>

              <div className="flex-1 bg-white rounded-b-2xl border border-gray-200 shadow-md overflow-hidden flex flex-col relative z-0">
                <div className="overflow-y-auto no-scrollbar flex-1 relative">
                  <table className="w-full text-left border-collapse relative">
                    <thead className="sticky top-0 bg-gray-50/95 backdrop-blur z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">유심 번호</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">통신사</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">전화 번호</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">대여/사용자</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">장착 시료</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">본인 인증</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">PIN 번호</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsims.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-10 text-center text-sm text-gray-500 font-medium">
                            등록/검색된 USIM 내역이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredUsims.map(usim => (
                          <tr key={usim.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => { setUsimFormData(usim); setUsimModal({isOpen: true, isEdit: true}); }}>
                            <td className="px-6 py-4 text-sm font-bold text-gray-800"><HighlightText text={usim.usimNo} highlight={searchSummary} /></td>
                            <td className="px-6 py-4"><CustomBadge className={getCarrierBadgeClass(usim.carrier)}>{usim.carrier}</CustomBadge></td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-600 tracking-wider"><HighlightText text={usim.phone} highlight={searchSummary} /></td>
                            <td className="px-6 py-4"><CustomBadge className={getStatusBadgeClass(usim.status)}>{usim.status}</CustomBadge></td>
                            <td className="px-6 py-4 text-xs font-medium text-gray-700">
                              {usim.currentUser ? <span className="flex items-center"><User className="w-3 h-3 mr-1.5 text-gray-400"/><HighlightText text={usim.currentUser} highlight={searchSummary} /></span> : <span className="text-gray-300">-</span>}
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-gray-700">
                              {usim.mountedDevice ? <span className="flex items-center"><Smartphone className="w-3 h-3 mr-1.5 text-gray-400"/><HighlightText text={usim.mountedDevice} highlight={searchSummary} /></span> : <span className="text-gray-300">-</span>}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${usim.authEnabled === '활성화' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{usim.authEnabled}</span>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-600 tracking-wider">
                              {usim.pin || <span className="text-gray-300">-</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      <DeviceModal 
        isOpen={deviceModal.isOpen} 
        onClose={() => setDeviceModal({ ...deviceModal, isOpen: false })} 
        formData={deviceFormData} 
        setFormData={setDeviceFormData} 
        onSubmit={handleDeviceSubmit} 
        isEdit={deviceModal.isEdit}
        onDelete={handleDeviceDelete}
      />
      <UsimModal 
        isOpen={usimModal.isOpen} 
        onClose={() => setUsimModal({ ...usimModal, isOpen: false })} 
        formData={usimFormData} 
        setFormData={setUsimFormData} 
        onSubmit={handleUsimSubmit} 
        isEdit={usimModal.isEdit}
        onDelete={handleUsimDelete}
        devices={devices}
      />
    </div>
  );
};
