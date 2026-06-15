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
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const progressTimer = setTimeout(() => setProgress(100), 100);
    // ✨ 2.4초부터 퇴장(가라앉으며 흐려짐) 시작
    const exitTimer = setTimeout(() => setIsExiting(true), 2400);
    const completeTimer = setTimeout(onComplete, 3000);
    return () => {
      clearTimeout(progressTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="w-screen h-screen bg-[url('/login-bg.jpg')] bg-cover bg-center flex items-center justify-end pr-8 md:pr-16 lg:pr-24 relative overflow-hidden">
      
      {/* ✨ 퇴장 애니메이션: opacity-0, translate-y-4(아래로 이동), blur-sm(흐려짐) */}
      <div className={`relative w-full max-w-[320px] z-10 flex flex-col items-center justify-center transition-all duration-700 ease-out ${isExiting ? 'opacity-0 translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-0'}`}>
        
        <AppLogo className="w-28 h-28 mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
        <h1 className="text-3xl font-bold tracking-widest text-white mb-2 drop-shadow-md">QA BASE</h1>
        <p className="text-[10px] text-blue-200 tracking-widest font-medium opacity-80 uppercase">Quality Assurance Command Center</p>
        
        <div className="w-full max-w-[200px] h-1 bg-white/10 rounded-full mt-12 overflow-hidden shadow-inner relative border border-white/5">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.9)] transition-all ease-out"
            style={{ width: `${progress}%`, transitionDuration: '2800ms' }}
          ></div>
        </div>
        
      </div>
    </div>
  );
};

export const TransitionLoading = ({ title, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 1. 화면 켜지자마자 프로그레스 바 차오르기 시작
    const progressTimer = setTimeout(() => setProgress(100), 50);
    
    // ✨ 2. 2.0초 시점: 게이지가 다 차면 '글씨와 바'만 퇴장 애니메이션 시작
    const exitTimer = setTimeout(() => setIsExiting(true), 2000);
    
    // ✨ 3. 2.4초 시점: 내용물이 완전히 증발하면, 0.1초의 여운만 남기고 바로 다음 화면으로 교체
    const completeTimer = setTimeout(onComplete, 2400);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    // 1. 최상위 부모: 더 이상 투명해지거나 하얗게 변하지 않습니다! (배경 깜빡임, 섬광 원천 차단)
    <div className="w-screen h-screen bg-[url('/board-loading-bg.jpg')] bg-cover bg-center fixed inset-0 z-[100] overflow-hidden animate-fade-in opacity-100">

      {/* 2. 내용물 래퍼: 퇴장(isExiting) 시 배경은 가만히 놔두고, 글씨와 로딩바만 안개처럼 흩어집니다. */}
      <div className={`absolute inset-0 z-20 transition-all duration-400 ease-out flex ${isExiting ? 'opacity-0 -translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-0'}`}>
        
        {/* 타이틀 & 소개 문구 영역 */}
        <div className="absolute left-[25%] md:left-[30%] top-1/2 -translate-y-1/2 flex flex-col items-start w-full max-w-2xl px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-[0.2em] text-white/90 drop-shadow-md mb-4 flex items-end">
            QA BASE
            <span className="animate-pulse text-3xl ml-1">...</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-300 tracking-widest font-light leading-relaxed border-l-2 border-white/20 pl-4 py-1">
            Advanced Quality Assurance Platform. <br />
            Synchronizing functional modules <br />
            and empowering operational efficiency.
          </p>
          <p className="mt-8 text-[10px] md:text-xs text-gray-400/80 tracking-[0.3em] uppercase animate-pulse">
            {title} / Initializing...
          </p>
        </div>

        {/* 로딩 바 영역 (라운딩 및 두께 h-2 유지) */}
        <div className="absolute bottom-[32%] md:bottom-[35%] left-0 w-full px-12 md:px-32 lg:px-[20%] flex flex-col items-center">
          <div className="w-full h-2 bg-black/40 relative overflow-hidden shadow-inner backdrop-blur-sm border-b border-white/5 rounded-full">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-gray-500 via-white to-gray-200 shadow-[0_0_12px_rgba(255,255,255,0.8)] rounded-full"
              style={{ 
                width: `${progress}%`, 
                transition: 'width 2.0s cubic-bezier(0.25, 1, 0.5, 1)' 
              }}
            ></div>
          </div>
        </div>
        
      </div>
    </div>
  );
};
