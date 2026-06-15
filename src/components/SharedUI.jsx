import React, { useState, useEffect, useRef } from 'react';
import { MonitorSmartphone, ShieldCheck, ChevronDown, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

export const AppLogo = ({ className }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return <MonitorSmartphone className={`text-gray-800 ${className}`} strokeWidth={1.5} />;
  }
  return (
    <img 
      src="/icon-192x192.png" 
      alt="QA Base" 
      className={`object-contain ${className}`} 
      onError={() => setImgError(true)} 
    />
  );
};

export const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-gray-100 flex items-center space-x-3">
      <ShieldCheck className="w-5 h-5 text-gray-700" />
      <span className="text-sm font-medium text-gray-800">{message}</span>
    </div>
  );
};

export const CustomSelect = ({ value, onChange, options, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={selectRef}>
      <div
        className={`flex items-center justify-between cursor-pointer select-none ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{options.find(o => o.value === value)?.label || value}</span>
        <ChevronDown className={`w-4 h-4 ml-2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-[60] w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] py-1.5 animate-fast-fade overflow-hidden left-0 min-w-max">
          {options.map(opt => (
            <div
              key={opt.value}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const CustomDatePicker = ({ value, onChange, disabled, alignRight }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (selectRef.current && !selectRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = Array(firstDay).fill(null).concat(Array.from({length: daysInMonth}, (_, i) => i + 1));

  return (
    <div className="relative" ref={selectRef}>
      <div 
        className={`flex items-center justify-between cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-800'} text-sm rounded-lg px-3 py-2 shadow-sm transition-colors`} 
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span>{value || '날짜 선택'}</span>
        <CalendarDays className="w-4 h-4 text-gray-400" />
      </div>
      {isOpen && !disabled && (
        <div className={`absolute z-[70] mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-3 animate-fast-fade w-64 ${alignRight ? 'right-0' : 'left-0'}`}>
          <div className="flex justify-between items-center mb-2">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-500"><ChevronLeft className="w-4 h-4"/></button>
            <span className="text-sm font-bold text-gray-700">{year}년 {month + 1}월</span>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-500"><ChevronRight className="w-4 h-4"/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-1">
            {['일','월','화','수','목','금','토'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const isSelected = value === dateStr;
              return (
                <button
                  key={i} type="button"
                  onClick={() => { onChange(dateStr); setIsOpen(false); }}
                  className={`h-8 w-full rounded-md text-xs font-medium transition-colors ${isSelected ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const SplashScreen = ({ onComplete }) => {
    // ✨ 로딩 바 애니메이션을 위한 상태값 추가
    const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 컴포넌트가 나타나자마자(0.1초 뒤) 로딩 바를 100%로 스르륵 채우기 시작
    const progressTimer = setTimeout(() => setProgress(100), 100);
    
    // 3초 뒤에 로그인 화면으로 넘기기
    const completeTimer = setTimeout(onComplete, 3000);
    
    return () => {
      clearTimeout(progressTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    // 1. 로그인 화면(Auth.jsx)과 완전히 똑같은 정렬 속성 적용 (우측 밀착: justify-end pr-8...)
    <div className="w-screen h-screen bg-[url('/login-bg.png')] bg-cover bg-center flex items-center justify-end pr-8 md:pr-16 lg:pr-24 relative animate-simple-fade overflow-hidden">
      
      {/* (옵션) 로그인 모달 자리에 은은하게 퍼져있는 푸른빛 */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-pulse pointer-events-none"></div>
      
      {/* 2. 로그인 모달과 완전히 똑같은 너비(max-w-[320px]) 설정 & 배경(유리 패널) 삭제 */}
      <div className="relative w-full max-w-[320px] animate-fade-in z-10 flex flex-col items-center justify-center">
        
        {/* 앱 로고 */}
        <AppLogo className="w-28 h-28 mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
        
        <h1 className="text-3xl font-bold tracking-widest text-white mb-2 drop-shadow-md">QA BASE</h1>
        <p className="text-[10px] text-blue-200 tracking-widest font-medium opacity-80 uppercase">Quality Assurance Command Center</p>
        
        {/* 3. 시네마틱 로딩 바 (상태값 progress에 따라 물리적으로 차오름) */}
        <div className="w-full max-w-[200px] h-1 bg-white/10 rounded-full mt-12 overflow-hidden shadow-inner relative border border-white/5">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.9)] transition-all ease-out"
            style={{ 
              width: `${progress}%`,           // 0% 에서 100% 로 변경됨
              transitionDuration: '2800ms'     // 2.8초 동안 아주 부드럽게 차오름
            }}
          ></div>
        </div>
        
      </div>
    </div>
  );
};

export const TransitionLoading = ({ title, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="w-screen h-screen bg-[#f8f9fa] flex flex-col items-center justify-center animate-simple-fade absolute inset-0 z-50">
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 border-2 border-gray-200 rounded-full shadow-inner"></div>
        <div className="absolute inset-0 border-2 border-gray-800 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-6 text-sm text-gray-500 tracking-widest uppercase animate-pulse">{title} 로딩중...</p>
    </div>
  );
};
