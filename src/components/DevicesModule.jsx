import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Smartphone, CreditCard, Activity, CheckCircle2, AlertCircle, 
  ChevronUp, Equal, ChevronDown as ChevronDownIcon,
  ChevronLeft, ChevronRight, LayoutDashboard, Server, Kanban, LogOut, Power, User, Plus, MonitorSmartphone, X, Edit, Filter, Search, ExternalLink, Cpu, Grid, List
} from 'lucide-react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, writeBatch } from "firebase/firestore";

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

const INITIAL_DEVICES = [
  { name: 'Galaxy Z Fold 5', type: 'Fold', os: 'Android', status: '보관중', renter: '', manufacturer: 'Samsung', serial: 'SM-F946N', customFields: [] },
  { name: 'iPhone 15 Pro', type: 'Bar', os: 'iOS', status: '사용중', renter: '홍길동', manufacturer: 'Apple', serial: 'A3102', customFields: [] },
  { name: 'Galaxy S24 Ultra', type: 'Bar', os: 'Android', status: '대여중', renter: '김철수', manufacturer: 'Samsung', serial: 'SM-S928N', customFields: [] },
  { name: 'Galaxy Z Flip 4', type: 'Flip', os: 'Android', status: '보관중', renter: '', manufacturer: 'Samsung', serial: 'SM-F721N', customFields: [] },
  { name: 'iPhone 13 Mini', type: 'Bar', os: 'iOS', status: '보관중', renter: '', manufacturer: 'Apple', serial: 'A2628', customFields: [] },
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
        <ChevronDownIcon className={`w-3.5 h-3.5 ml-2 shrink-0 ${disabled ? 'text-gray-300' : 'text-gray-400'} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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

const DeviceAddModal = ({ isOpen, onClose, formData, setFormData, onSubmit }) => {
  if (!isOpen) return null;

  const handleAddCustomField = () => {
    const currentFields = formData.customFields || [];
    setFormData({ ...formData, customFields: [...currentFields, { key: '', value: '' }] });
  };

  const handleRemoveCustomField = (index) => {
    const currentFields = formData.customFields || [];
    setFormData({ ...formData, customFields: currentFields.filter((_, i) => i !== index) });
  };

  const handleUpdateCustomField = (index, field, value) => {
    const currentFields = [...(formData.customFields || [])];
    currentFields[index][field] = value;
    setFormData({ ...formData, customFields: currentFields });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] border border-gray-100 relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center shrink-0"><Plus className="w-5 h-5 mr-2 text-gray-600"/> 디바이스 추가</h3>
        <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-2">
          <form id="deviceAddForm" onSubmit={onSubmit} className="space-y-4">
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">디바이스명</label><input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">제조사</label><input required value={formData.manufacturer} onChange={e=>setFormData({...formData, manufacturer: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" /></div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">OS</label>
                <CustomSelect 
                  value={formData.os} onChange={val=>setFormData({...formData, os: val})} 
                  options={[{value:'Android', label:'Android'}, {value:'iOS', label:'iOS'}]}
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 shadow-sm transition-colors hover:border-gray-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">형태</label>
                <CustomSelect 
                  value={formData.type} onChange={val=>setFormData({...formData, type: val})} 
                  options={[{value:'Bar', label:'Bar'}, {value:'Fold', label:'Fold'}, {value:'Flip', label:'Flip'}]}
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 shadow-sm transition-colors hover:border-gray-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">상태</label>
                <CustomSelect 
                  value={formData.status} 
                  onChange={val=>{
                    if(val === '보관중') setFormData({...formData, status: val, renter: ''});
                    else setFormData({...formData, status: val});
                  }} 
                  options={[{value:'보관중', label:'보관중'}, {value:'사용중', label:'사용중'}, {value:'대여중', label:'대여중'}]}
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 shadow-sm transition-colors hover:border-gray-300"
                />
              </div>
            </div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">시리얼 번호</label><input required value={formData.serial} onChange={e=>setFormData({...formData, serial: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" /></div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">사용/대여자</label>
              <input 
                value={formData.renter} onChange={e=>setFormData({...formData, renter: e.target.value})} 
                disabled={formData.status === '보관중'}
                placeholder={formData.status === '보관중' ? '보관중에는 입력할 수 없습니다' : '이름을 입력하세요'} 
                className={`w-full text-sm rounded-lg px-3 py-2 outline-none transition-colors shadow-sm ${formData.status === '보관중' ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-800'}`} 
              />
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold text-gray-700">커스텀 필드</label>
                <button type="button" onClick={handleAddCustomField} className="text-[10px] text-gray-600 hover:text-gray-900 flex items-center bg-gray-100 px-2 py-1 rounded-md border border-gray-200 transition-colors"><Plus className="w-3 h-3 mr-0.5"/> 필드 추가</button>
              </div>
              <div className="space-y-2">
                {(formData.customFields || []).map((f, i) => (
                  <div key={i} className="flex gap-2 items-center animate-fast-fade">
                    <input required placeholder="필드명 (예: 버전)" value={f.key} onChange={(e) => handleUpdateCustomField(i, 'key', e.target.value)} className="w-1/3 text-xs bg-white border border-gray-200 rounded-md px-2 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" />
                    <input required placeholder="값 입력" value={f.value} onChange={(e) => handleUpdateCustomField(i, 'value', e.target.value)} className="flex-1 text-xs bg-white border border-gray-200 rounded-md px-2 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" />
                    <button type="button" onClick={() => handleRemoveCustomField(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 rounded-md border border-gray-200 hover:border-red-200"><X className="w-3 h-3"/></button>
                  </div>
                ))}
                {(!formData.customFields || formData.customFields.length === 0) && (
                  <div className="text-center py-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400">등록된 추가 정보가 없습니다.</div>
                )}
              </div>
            </div>
          </form>
        </div>
        <button type="submit" form="deviceAddForm" className="w-full bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors mt-4 shrink-0 shadow-md">저장하기</button>
      </div>
    </div>
  );
};

const DeviceDetailModal = ({ device, onClose, onUpdate, onDelete, user, customKeys }) => {
  if (!device) return null;
  const isViewer = user.role === 'viewer';
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState(() => {
    const fields = [...(device.customFields || [])];
    customKeys?.forEach(k => {
      if (!fields.some(f => f.key === k)) fields.push({ key: k, value: '' });
    });
    return {...device, customFields: fields};
  });

  useEffect(() => {
    if (device) {
      const fields = [...(device.customFields || [])];
      customKeys?.forEach(k => {
        if (!fields.some(f => f.key === k)) fields.push({ key: k, value: '' });
      });
      setFormData({...device, customFields: fields});
      setEditMode(false);
    }
  }, [device?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    setEditMode(false);
    onClose();
  };

  const handleAddCustomField = () => {
    const currentFields = formData.customFields || [];
    setFormData({ ...formData, customFields: [...currentFields, { key: '', value: '' }] });
  };

  const handleRemoveCustomField = (index) => {
    const currentFields = formData.customFields || [];
    setFormData({ ...formData, customFields: currentFields.filter((_, i) => i !== index) });
  };

  const handleUpdateCustomField = (index, field, value) => {
    const currentFields = [...(formData.customFields || [])];
    currentFields[index][field] = value;
    setFormData({ ...formData, customFields: currentFields });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] border border-gray-100 relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 shrink-0">디바이스 상세 정보</h3>
        <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-2">
          {editMode ? (
            <form id="deviceEditForm" onSubmit={handleSubmit} className="space-y-4">
               <div><label className="text-xs font-medium text-gray-500 mb-1 block">디바이스명</label><input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" /></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs font-medium text-gray-500 mb-1 block">제조사</label><input required value={formData.manufacturer} onChange={e=>setFormData({...formData, manufacturer: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" /></div>
                 <div>
                   <label className="text-xs font-medium text-gray-500 mb-1 block">OS</label>
                   <CustomSelect value={formData.os} onChange={val=>setFormData({...formData, os: val})} options={[{value:'Android', label:'Android'}, {value:'iOS', label:'iOS'}]} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 shadow-sm transition-colors hover:border-gray-300" />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-medium text-gray-500 mb-1 block">형태</label>
                   <CustomSelect value={formData.type} onChange={val=>setFormData({...formData, type: val})} options={[{value:'Bar', label:'Bar'}, {value:'Fold', label:'Fold'}, {value:'Flip', label:'Flip'}]} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 shadow-sm transition-colors hover:border-gray-300" />
                 </div>
                 <div>
                   <label className="text-xs font-medium text-gray-500 mb-1 block">상태</label>
                   <CustomSelect 
                      value={formData.status} 
                      onChange={val=>{ if(val === '보관중') setFormData({...formData, status: val, renter: ''}); else setFormData({...formData, status: val}); }} 
                      options={[{value:'보관중', label:'보관중'}, {value:'사용중', label:'사용중'}, {value:'대여중', label:'대여중'}]}
                      className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 shadow-sm transition-colors hover:border-gray-300"
                   />
                 </div>
               </div>
               <div><label className="text-xs font-medium text-gray-500 mb-1 block">시리얼 번호</label><input required value={formData.serial || ''} onChange={e=>setFormData({...formData, serial: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" /></div>
               <div>
                 <label className="text-xs font-medium text-gray-500 mb-1 block">사용/대여자</label>
                 <input 
                    value={formData.renter} onChange={e=>setFormData({...formData, renter: e.target.value})} 
                    disabled={formData.status === '보관중'}
                    placeholder={formData.status === '보관중' ? '보관중에는 입력할 수 없습니다' : '이름을 입력하세요'}
                    className={`w-full text-sm rounded-lg px-3 py-2 outline-none transition-colors shadow-sm ${formData.status === '보관중' ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-800'}`} 
                 />
               </div>
               <div className="pt-2 border-t border-gray-100">
                 <div className="flex justify-between items-center mb-3">
                   <label className="text-xs font-bold text-gray-700">커스텀 필드</label>
                   <button type="button" onClick={handleAddCustomField} className="text-[10px] text-gray-600 hover:text-gray-900 flex items-center bg-gray-100 px-2 py-1 rounded-md border border-gray-200 transition-colors"><Plus className="w-3 h-3 mr-0.5"/> 필드 추가</button>
                 </div>
                 <div className="space-y-2">
                   {(formData.customFields || []).map((f, i) => (
                     <div key={i} className="flex gap-2 items-center animate-fast-fade">
                       <input required placeholder="필드명 (예: 버전)" value={f.key} onChange={(e) => handleUpdateCustomField(i, 'key', e.target.value)} className="w-1/3 text-xs bg-white border border-gray-200 rounded-md px-2 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" />
                       <input required placeholder="값 입력" value={f.value} onChange={(e) => handleUpdateCustomField(i, 'value', e.target.value)} className="flex-1 text-xs bg-white border border-gray-200 rounded-md px-2 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" />
                       <button type="button" onClick={() => handleRemoveCustomField(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 rounded-md border border-gray-200 hover:border-red-200"><X className="w-3 h-3"/></button>
                     </div>
                   ))}
                   {(!formData.customFields || formData.customFields.length === 0) && (
                     <div className="text-center py-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400">등록된 추가 정보가 없습니다.</div>
                   )}
                 </div>
               </div>
            </form>
          ) : (
            <div className="space-y-4">
               <div><span className="text-xs text-gray-400 block mb-1">디바이스명</span><div className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm truncate" title={device.name}>{device.name}</div></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><span className="text-xs text-gray-400 block mb-1">제조사</span><div className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm truncate" title={device.manufacturer}>{device.manufacturer}</div></div>
                 <div><span className="text-xs text-gray-400 block mb-1">OS</span><div className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm truncate" title={device.os}>{device.os}</div></div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div><span className="text-xs text-gray-400 block mb-1">상태</span><div className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm truncate" title={device.status}>{device.status}</div></div>
                 <div><span className="text-xs text-gray-400 block mb-1">대여자</span><div className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm truncate" title={device.renter || '-'}>{device.renter || '-'}</div></div>
               </div>
               <div><span className="text-xs text-gray-400 block mb-1">시리얼 번호</span><div className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm truncate" title={device.serial || '-'}>{device.serial || '-'}</div></div>
               
               {(formData.customFields && formData.customFields.length > 0) && (
                 <div className="pt-2 border-t border-gray-100">
                   <span className="text-xs font-bold text-gray-700 block mb-3">커스텀 필드</span>
                   <div className="space-y-2">
                     {formData.customFields.map((f, i) => (
                       <div key={i} className="flex gap-3 items-center">
                         <span className="text-xs text-gray-400 w-1/3 shrink-0 truncate">{f.key}</span>
                         <div className="text-sm font-medium text-gray-800 truncate flex-1" title={f.value || '-'}>{f.value || '-'}</div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
               
            </div>
          )}
        </div>
        
        {editMode ? (
          <div className="flex space-x-2 pt-4 border-t border-gray-100 shrink-0 mt-2">
            <button type="button" onClick={() => setEditMode(false)} className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-200 transition-colors">취소</button>
            <button type="submit" form="deviceEditForm" className="flex-1 bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl shadow-md hover:bg-gray-900 transition-colors">저장</button>
          </div>
        ) : (
          !isViewer && (
            <div className="flex space-x-2 pt-4 border-t border-gray-100 shrink-0 mt-2">
              <button onClick={() => setEditMode(true)} className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm">수정하기</button>
              <button onClick={() => { onDelete(device.id); onClose(); }} className="flex-1 bg-red-50 text-red-600 text-sm font-medium py-2.5 rounded-xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm">삭제하기</button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

const KanbanBoard = ({ devices, user, onStatusChange, onShowDetails }) => {
  const columns = [{ id: '보관중', title: '보관중' }, { id: '사용중', title: '사용중' }, { id: '대여중', title: '대여중' }];

  const handleDragStart = (e, deviceId) => e.dataTransfer.setData('deviceId', deviceId);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (user.role === 'viewer') return;
    const deviceId = e.dataTransfer.getData('deviceId');
    onStatusChange(deviceId, targetStatus);
  };

  const calculateDDay = (dateString) => {
    if (!dateString) return '';
    const start = new Date(dateString);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 'D-Day' : `D+${diffDays}`;
  };

  return (
    <div className="flex h-full gap-6 w-full animate-fade-in pb-4 overflow-x-auto no-scrollbar">
      {columns.map(col => (
        <div key={col.id} className="flex-1 min-w-[300px] bg-gray-100/80 rounded-2xl p-4 flex flex-col border border-gray-200 shadow-md" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-medium text-gray-700">{col.title}</h3>
            <span className="bg-white text-xs px-2 py-1 rounded-full shadow-sm text-gray-600 border border-gray-200 font-semibold">{devices.filter(d => d.status === col.id).length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-2">
            {devices.filter(d => d.status === col.id).map(device => (
              <div key={device.id} draggable={user.role !== 'viewer'} onDragStart={(e) => handleDragStart(e, device.id)} onClick={() => onShowDetails(device)} className={`bg-white p-4 rounded-xl shadow-md border border-gray-200 ${user.role !== 'viewer' ? 'cursor-grab active:cursor-grabbing hover-breath' : ''} group`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-gray-400 tracking-wider truncate max-w-[100px]" title={device.manufacturer}>{device.manufacturer}</span>
                  <div className="flex items-center space-x-1.5">
                    {device.status !== '보관중' && device.statusUpdatedAt && (
                      <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100 font-bold shadow-sm whitespace-nowrap">
                        {calculateDDay(device.statusUpdatedAt)}
                      </span>
                    )}
                    <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100 font-medium truncate" title={device.type}>{device.type}</span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-gray-800 mb-3 truncate" title={device.name}>{device.name}</h4>
                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-50 pt-3">
                  <span className="font-medium text-gray-600 truncate max-w-[80px]" title={device.os}>{device.os}</span>
                  {device.renter ? (
                    <span className="flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium border border-blue-100 shadow-sm truncate max-w-[140px]" title={device.renter}><User className="w-3 h-3 mr-1 shrink-0" /> <span className="truncate">{device.renter}</span></span>
                  ) : <span className="text-gray-400 italic">미할당</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ListView = ({ devices, onShowDetails }) => {
  const customKeys = Array.from(new Set(devices.flatMap(d => (d.customFields || []).map(f => f.key).filter(Boolean))));

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden animate-fade-in flex flex-col h-full relative">
      <div className="overflow-y-auto flex-1 relative no-scrollbar">
        <table className="w-full text-left border-collapse relative">
          <thead className="sticky top-0 bg-gray-100/95 backdrop-blur shadow-sm z-10">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider w-24">상태</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider">디바이스명</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider">제조사</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider">OS</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider">형태</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider">시리얼 번호</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider">사용/대여자</th>
              {customKeys.map(key => (
                <th key={key} className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider truncate max-w-[120px]" title={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {devices.map(device => (
              <tr key={device.id} onClick={() => onShowDetails(device)} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm whitespace-nowrap ${device.status === '보관중' ? 'bg-gray-100 text-gray-600 border border-gray-200' : device.status === '사용중' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>{device.status}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-800"><div className="truncate max-w-[160px]" title={device.name}>{device.name}</div></td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600"><div className="truncate max-w-[120px]" title={device.manufacturer}>{device.manufacturer}</div></td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600"><div className="truncate max-w-[100px]" title={device.os}>{device.os}</div></td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600"><div className="truncate max-w-[100px]" title={device.type}>{device.type}</div></td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600"><div className="truncate max-w-[120px]" title={device.serial || '-'}>{device.serial || '-'}</div></td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600"><div className="truncate max-w-[120px]" title={device.renter || '-'}>{device.renter || '-'}</div></td>
                {customKeys.map(key => {
                  const field = device.customFields?.find(f => f.key === key);
                  return (
                    <td key={key} className="px-6 py-4 text-sm font-medium text-gray-600"><div className="truncate max-w-[120px]" title={field && field.value ? field.value : '-'}>{field && field.value ? field.value : '-'}</div></td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UsimModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isEdit, onDelete, devices }) => {
  if (!isOpen) return null;

  const isStored = formData.status === '보관중';
  const isAuthDisabled = formData.authEnabled === '비활성화';

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

export const DevicesDashboard = ({ user, onNavigate, onLogout, onQuit }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [viewType, setViewType] = useState('kanban'); 
  
  const [devices, setDevices] = useState([]);
  const [usims, setUsims] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [deviceFormData, setDeviceFormData] = useState({ name: '', type: 'Bar', os: 'Android', status: '보관중', serial: '', manufacturer: '', renter: '', customFields: [] });
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [rentModal, setRentModal] = useState({ isOpen: false, deviceId: null, targetStatus: '' });
  const [renterName, setRenterName] = useState('');

  const [osFilter, setOsFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); 
  const [searchRenter, setSearchRenter] = useState('');
  const [searchManufacturer, setSearchManufacturer] = useState('');

  const [filterCarrier, setFilterCarrier] = useState('All');
  const [filterUsimStatus, setFilterUsimStatus] = useState('All');
  const [filterAuth, setFilterAuth] = useState('All');
  const [searchInput, setSearchInput] = useState(''); 
  const [searchSummary, setSearchSummary] = useState(''); 

  const [isStatsExpanded, setIsStatsExpanded] = useState(true);

  const [usimModal, setUsimModal] = useState({ isOpen: false, isEdit: false });
  const [usimFormData, setUsimFormData] = useState({ id: '', usimNo: '', carrier: 'SKT', phone: '', status: '보관중', currentUser: '', mountedDevice: '', authEnabled: '비활성화', pin: '' });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchSummary(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const devicesRef = collection(db, 'devices');
    const unsubscribeDevices = onSnapshot(devicesRef, (snapshot) => {
      if (snapshot.empty) {
        const seedData = async () => {
          const batch = writeBatch(db);
          INITIAL_DEVICES.forEach(device => batch.set(doc(devicesRef), device));
          await batch.commit();
        };
        seedData();
      } else {
        setDevices(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      }
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

  const handleDeviceSubmit = async (e) => {
    e.preventDefault();
    try {
      const deviceToSave = { ...deviceFormData, statusUpdatedAt: deviceFormData.status === '보관중' ? null : new Date().toISOString() };
      await addDoc(collection(db, 'devices'), deviceToSave);
      setShowAddModal(false);
      setDeviceFormData({ name: '', type: 'Bar', os: 'Android', status: '보관중', serial: '', manufacturer: '', renter: '', customFields: [] });
    } catch(err) { console.error("Error adding device", err); }
  };

  const handleUpdateDevice = async (updatedData) => {
    try {
      const { id, ...dataToSave } = updatedData;
      const originalDevice = devices.find(d => d.id === id);
      if (originalDevice && originalDevice.status !== dataToSave.status) {
        dataToSave.statusUpdatedAt = dataToSave.status === '보관중' ? null : new Date().toISOString();
      }
      await updateDoc(doc(db, 'devices', id), dataToSave);
    } catch(err) { console.error("Error updating device", err); }
  };

  const handleDeleteDevice = async (id) => {
    try { await deleteDoc(doc(db, 'devices', id)); } catch(err) { console.error("Error deleting device", err); }
  };

  const handleStatusChangeRequest = (deviceId, targetStatus) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || device.status === targetStatus) return;
    if (targetStatus === '보관중') {
      updateDoc(doc(db, 'devices', deviceId), { status: targetStatus, renter: '', statusUpdatedAt: null }).catch(console.error);
    } else {
      setRentModal({ isOpen: true, deviceId, targetStatus });
    }
  };

  const handleRentSubmit = async (e) => {
    e.preventDefault();
    if (!renterName.trim()) return;
    try { await updateDoc(doc(db, 'devices', rentModal.deviceId), { status: rentModal.targetStatus, renter: renterName, statusUpdatedAt: new Date().toISOString() }); } catch (err) { console.error("Error updating rent", err); }
    setRentModal({ isOpen: false, deviceId: null, targetStatus: '' });
    setRenterName('');
  };

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

  const filteredDevices = devices.filter(d => {
    if (activeMenu === 'android' && d.os !== 'Android') return false;
    if (activeMenu === 'ios' && d.os !== 'iOS') return false;
    if (activeMenu === 'dashboard' && osFilter !== 'All' && d.os !== osFilter) return false;
    if (typeFilter !== 'All' && d.type !== typeFilter) return false;
    if (statusFilter !== 'All' && d.status !== statusFilter) return false;
    if (searchRenter && !d.renter?.toLowerCase().includes(searchRenter.toLowerCase())) return false;
    if (searchManufacturer && !d.manufacturer?.toLowerCase().includes(searchManufacturer.toLowerCase())) return false;
    return true;
  });

  const deviceSummary = {
    total: filteredDevices.length,
    storage: filteredDevices.filter(d => d.status === '보관중').length,
    inUse: filteredDevices.filter(d => d.status === '사용중').length,
    rented: filteredDevices.filter(d => d.status === '대여중').length,
  };

  const filteredUsims = usims.filter(usim => {
    if (filterUsimStatus !== 'All' && usim.status !== filterUsimStatus) return false;
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

  const usimSummary = {
    total: filteredUsims.length,
    storage: filteredUsims.filter(u => u.status === '보관중').length,
    inUse: filteredUsims.filter(u => u.status === '사용중').length,
    rented: filteredUsims.filter(u => u.status === '대여중').length,
  };

  const getCarrierBadgeClass = (carrier) => {
    switch(carrier) {
      case 'SKT': return 'bg-red-50 text-red-600 border-red-200';
      case 'KT': return 'bg-cyan-50 text-cyan-600 border-cyan-200';
      case 'LG': return 'bg-pink-50 text-pink-600 border-pink-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getUsimStatusBadgeClass = (status) => {
    switch(status) {
      case '보관중': return 'bg-gray-50 text-gray-600 border-gray-200';
      case '사용중': return 'bg-blue-50 text-blue-600 border-blue-200';
      case '대여중': return 'bg-purple-50 text-purple-600 border-purple-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const hasUsimFilters = filterUsimStatus !== 'All' || filterCarrier !== 'All' || filterAuth !== 'All' || searchInput;

  return (
    <div className="w-screen h-screen bg-[#f8f9fa] flex flex-col overflow-hidden animate-simple-fade">
      <header className="h-20 px-8 flex justify-between items-center bg-[url('/header-bg.jpg')] bg-cover bg-[length:100%_100%] shrink-0 relative z-50 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-3"></div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm hover-breath cursor-default">
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

      <div className="flex flex-1 overflow-hidden relative bg-[#f0f2f5]">
        
        {/* 블러 처리된 배경 레이어 (블러 2px로 조절 완료) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[2px] scale-[1.02] z-0 pointer-events-none"
          style={{ backgroundImage: "url('/project-bg.jpg')" }}
        ></div>

        <aside className={`bg-white/60 backdrop-blur-xl border-r border-gray-100/50 shadow-[-5px_0_30px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out flex flex-col z-10 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}`}>
          <div className="p-4 space-y-1 w-64">
            <div className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-3 mt-2">MENU</div>
            <button onClick={() => onNavigate('board')} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50/50 hover:text-gray-900 transition-colors"><LayoutDashboard className="w-4 h-4" /><span className="text-sm font-medium">Functional Board</span></button>
            <div className="h-px bg-gray-100/50 my-2 mx-3"></div>
            
            <button onClick={() => setActiveMenu('dashboard')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${activeMenu === 'dashboard' ? 'bg-gray-50/50 text-gray-900 font-medium border border-gray-200/50 shadow-sm' : 'text-gray-500 hover:bg-gray-50/50 hover:text-gray-900'}`}><Server className={`w-4 h-4 ${activeMenu === 'dashboard' ? 'text-gray-700' : ''}`} /><span className="text-sm">Deivce manager</span></button>
            <button onClick={() => { setActiveMenu('android'); if(!sidebarOpen) setSidebarOpen(true); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${activeMenu === 'android' ? 'bg-green-50/50 text-green-700 font-medium border border-green-100/50 shadow-sm' : 'text-gray-500 hover:bg-gray-50/50 hover:text-gray-900'}`}><div className="flex items-center space-x-3"><div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-sm"></div><span className="text-sm">Android</span></div></button>
            <button onClick={() => { setActiveMenu('ios'); if(!sidebarOpen) setSidebarOpen(true); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${activeMenu === 'ios' ? 'bg-blue-50/50 text-blue-700 font-medium border border-blue-100/50 shadow-sm' : 'text-gray-500 hover:bg-gray-50/50 hover:text-gray-900'}`}><div className="flex items-center space-x-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm"></div><span className="text-sm">iOS</span></div></button>
            
            <button onClick={() => setActiveMenu('usims')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${activeMenu === 'usims' ? 'bg-purple-50/50 text-purple-700 font-medium border border-purple-100/50 shadow-sm' : 'text-gray-500 hover:bg-gray-50/50 hover:text-gray-900'}`}><CreditCard className={`w-4 h-4 ${activeMenu === 'usims' ? 'text-purple-600' : ''}`} /><span className="text-sm">USIM manager</span></button>
          </div>
        </aside>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`absolute top-6 z-20 bg-white border border-gray-200 shadow-md rounded-full p-1.5 text-gray-600 hover:text-gray-900 transition-all duration-300 ${sidebarOpen ? 'left-[244px]' : 'left-4'}`}>
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* relative z-10을 추가하여 배경에 묻히지 않도록 끌어올림 */}
        <main className={`relative z-10 flex-1 overflow-hidden flex flex-col p-8 transition-all duration-300 ${!sidebarOpen ? 'ml-12' : ''}`}>
          
          {(activeMenu === 'dashboard' || activeMenu === 'android' || activeMenu === 'ios') && (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-800">{activeMenu === 'android' ? 'Android 디바이스' : activeMenu === 'ios' ? 'iOS 디바이스' : (osFilter === 'All' ? '전체 디바이스' : osFilter)}</h1>
                    {user?.role === 'viewer' && <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded border border-gray-200 font-semibold uppercase tracking-wider shadow-sm">Read Only</span>}
                  </div>
                  <p className="text-sm text-gray-500 font-medium">테스트 단말기의 상태를 모니터링하고 관리합니다.</p>
                </div>
                <div className="flex items-center space-x-4">
                  {activeMenu === 'dashboard' && (
                    <div className="bg-white border border-gray-200 rounded-lg p-1 flex shadow-sm">
                      <button onClick={() => setViewType('kanban')} className={`p-1.5 rounded-md transition-colors ${viewType === 'kanban' ? 'bg-gray-100 text-gray-800 shadow-sm font-semibold' : 'text-gray-400 hover:text-gray-600'}`}><Grid className="w-4 h-4" /></button>
                      <button onClick={() => setViewType('list')} className={`p-1.5 rounded-md transition-colors ${viewType === 'list' ? 'bg-gray-100 text-gray-800 shadow-sm font-semibold' : 'text-gray-400 hover:text-gray-600'}`}><List className="w-4 h-4" /></button>
                    </div>
                  )}
                  {user?.role !== 'viewer' && (
                    <button onClick={() => { const presetOs = activeMenu === 'android' ? 'Android' : activeMenu === 'ios' ? 'iOS' : 'Android'; setDeviceFormData({ name: '', type: 'Bar', os: presetOs, status: '보관중', serial: '', manufacturer: '', renter: '', customFields: [] }); setShowAddModal(true); }} className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors shadow-md hover-breath flex items-center">
                      <Plus className="w-4 h-4 mr-1.5" /> 추가
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-100/50 mb-6 shrink-0 animate-fade-in relative z-30">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-8">
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Total</span><span className="text-xl font-bold text-gray-800">{deviceSummary.total}</span></div><div className="w-px bg-gray-200 my-1"></div>
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">사용중</span><span className="text-xl font-bold text-green-600">{deviceSummary.inUse}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">대여중</span><span className="text-xl font-bold text-blue-600">{deviceSummary.rented}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">보관중</span><span className="text-xl font-bold text-gray-600">{deviceSummary.storage}</span></div>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 shadow-sm mr-1">
                    <Filter className="w-4 h-4 text-gray-400 ml-2" />
                    <CustomSelect value={statusFilter} onChange={setStatusFilter} options={[{value:'All', label:'상태 전체'}, {value:'보관중', label:'보관중'}, {value:'사용중', label:'사용중'}, {value:'대여중', label:'대여중'}]} className="bg-transparent text-xs font-medium text-gray-700 py-1 px-2 outline-none hover:bg-gray-100 rounded-md transition-colors" />
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    {activeMenu === 'dashboard' && (
                      <>
                        <CustomSelect value={osFilter} onChange={setOsFilter} options={[{value:'All', label:'OS 전체'}, {value:'Android', label:'Android'}, {value:'iOS', label:'iOS'}]} className="bg-transparent text-xs font-medium text-gray-700 py-1 px-2 outline-none hover:bg-gray-100 rounded-md transition-colors" />
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                      </>
                    )}
                    <CustomSelect value={typeFilter} onChange={setTypeFilter} options={[{value:'All', label:'형태 전체'}, {value:'Fold', label:'폴드'}, {value:'Flip', label:'플립'}, {value:'Bar', label:'바'}]} className="bg-transparent text-xs font-medium text-gray-700 py-1 px-2 outline-none hover:bg-gray-100 rounded-md transition-colors" />
                  </div>
                </div>
                <div className="flex items-center space-x-3 pt-3 border-t border-gray-100">
                  <input type="text" placeholder="제조사 검색..." value={searchManufacturer} onChange={e=>setSearchManufacturer(e.target.value)} className="text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 outline-none focus:border-gray-400 transition-colors w-32 placeholder:text-gray-400" />
                  <input type="text" placeholder="사용/대여자 검색..." value={searchRenter} onChange={e=>setSearchRenter(e.target.value)} className="text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 outline-none focus:border-gray-400 transition-colors w-32 placeholder:text-gray-400" />
                  {(statusFilter !== 'All' || osFilter !== 'All' || typeFilter !== 'All' || searchManufacturer || searchRenter) && (
                    <button onClick={() => { setStatusFilter('All'); setOsFilter('All'); setTypeFilter('All'); setSearchManufacturer(''); setSearchRenter(''); }} className="text-[10px] text-gray-500 hover:text-gray-800 underline ml-2 font-medium">초기화</button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                 {(viewType === 'kanban' && activeMenu === 'dashboard') ? <KanbanBoard devices={filteredDevices} user={user} onStatusChange={handleStatusChangeRequest} onShowDetails={setSelectedDevice} /> : <div className="h-full overflow-auto no-scrollbar"><ListView devices={filteredDevices} onShowDetails={setSelectedDevice} /></div>}
              </div>
            </div>
          )}

          {activeMenu === 'usims' && (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="flex justify-between items-end mb-6 shrink-0">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-800">USIM Manager</h1>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">USIM 카드 현황을 관리하세요.</p>
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

              <div className="flex flex-col space-y-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-100/50 mb-6 shrink-0 animate-fade-in relative z-30">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-8">
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Total</span><span className="text-xl font-bold text-gray-800">{usimSummary.total}</span></div><div className="w-px bg-gray-200 my-1"></div>
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">사용중</span><span className="text-xl font-bold text-green-600">{usimSummary.inUse}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">대여중</span><span className="text-xl font-bold text-blue-600">{usimSummary.rented}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">보관중</span><span className="text-xl font-bold text-gray-600">{usimSummary.storage}</span></div>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 shadow-sm mr-1">
                    <Filter className="w-4 h-4 text-gray-400 ml-2" />
                    <CustomSelect value={filterCarrier} onChange={setFilterCarrier} options={[{value:'All',label:'통신사 전체'},{value:'SKT',label:'SKT'},{value:'KT',label:'KT'},{value:'LG',label:'LG'},{value:'기타',label:'기타'}]} className="bg-transparent text-xs font-medium text-gray-700 py-1 px-2 outline-none hover:bg-gray-100 rounded-md transition-colors" />
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <CustomSelect value={filterUsimStatus} onChange={setFilterUsimStatus} options={[{value:'All',label:'상태 전체'},{value:'보관중',label:'보관중'},{value:'사용중',label:'사용중'},{value:'대여중',label:'대여중'}]} className="bg-transparent text-xs font-medium text-gray-700 py-1 px-2 outline-none hover:bg-gray-100 rounded-md transition-colors" />
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <CustomSelect value={filterAuth} onChange={setFilterAuth} options={[{value:'All',label:'본인인증 전체'},{value:'활성화',label:'활성화'},{value:'비활성화',label:'비활성화'}]} className="bg-transparent text-xs font-medium text-gray-700 py-1 px-2 outline-none hover:bg-gray-100 rounded-md transition-colors" />
                  </div>
                </div>
                <div className="flex items-center space-x-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 transition-colors focus-within:border-gray-400 relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                    <input type="text" placeholder="번호, 사용자, 시료 검색..." value={searchInput} onChange={e=>setSearchInput(e.target.value)} className="text-xs bg-transparent outline-none w-full placeholder:text-gray-400 text-gray-700 pr-6" />
                    {searchInput && (
                      <button onClick={() => { setSearchInput(''); setSearchSummary(''); }} className="absolute right-2 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {(hasUsimFilters) && (
                    <button onClick={() => { setFilterCarrier('All'); setFilterUsimStatus('All'); setFilterAuth('All'); setSearchInput(''); setSearchSummary(''); }} className="text-[10px] text-gray-500 hover:text-gray-800 underline ml-2 font-medium whitespace-nowrap">초기화</button>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden flex flex-col relative z-0">
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
                            <td className="px-6 py-4"><CustomBadge className={getUsimStatusBadgeClass(usim.status)}>{usim.status}</CustomBadge></td>
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

      {rentModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[320px] transform transition-all border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-2">{rentModal.targetStatus === '사용중' ? '사용자 정보 입력' : '대여자 정보 입력'}</h3>
            <p className="text-xs text-gray-500 mb-5">상태를 변경하려면 이름을 입력해주세요.</p>
            <form onSubmit={handleRentSubmit}>
              <input autoFocus type="text" placeholder="이름 (예: 홍길동)" value={renterName} onChange={(e) => setRenterName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-gray-400 focus:bg-white transition-all mb-6 shadow-sm" />
              <div className="flex space-x-3">
                <button type="button" onClick={() => setRentModal({ isOpen: false, deviceId: null, targetStatus: '' })} className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm">취소</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-xl hover:bg-gray-900 transition-colors shadow-md">확인</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <DeviceAddModal isOpen={showAddModal} onClose={()=>setShowAddModal(false)} formData={deviceFormData} setFormData={setDeviceFormData} onSubmit={handleDeviceSubmit} />
      
      <DeviceDetailModal 
        device={selectedDevice} 
        onClose={()=>setSelectedDevice(null)} 
        onUpdate={handleUpdateDevice} 
        onDelete={handleDeleteDevice} 
        user={user} 
        customKeys={Array.from(new Set(devices.flatMap(d => (d.customFields || []).map(f => f.key).filter(Boolean))))} 
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
