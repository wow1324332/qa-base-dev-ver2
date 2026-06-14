import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, X, CalendarDays, Filter, LayoutDashboard, 
  Calendar, List, Kanban, ChevronLeft, ChevronRight, 
  User, LogOut, Power, ChevronDown, MonitorSmartphone
} from 'lucide-react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, writeBatch, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { SidebarFavorites } from './SidebarFavorites';

// Firebase 초기화
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

// 상수 정의
const PROJECT_COLORS = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-cyan-500', 'bg-orange-500', 'bg-gray-800'];
const HOLIDAYS = [
  '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12', '2024-03-01', '2024-05-05', '2024-05-15', '2024-06-06', '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18', '2024-10-03', '2024-10-09', '2024-12-25',
  '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-03-01', '2025-05-05', '2025-05-06', '2025-06-06', '2025-08-15', '2025-10-03', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08', '2025-10-09', '2025-12-25',
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-03-01', '2026-05-05', '2026-05-24', '2026-06-06', '2026-08-15', '2026-09-24', '2026-09-25', '2026-09-26', '2026-10-03', '2026-10-09', '2026-12-25'
];
const INITIAL_SCHEDULES = [
  { id: 'sch_1', name: 'v1.0 앱 리뉴얼 QA', startDate: '2026-05-10', endDate: '2026-05-20', assignees: ['홍진의', '김철수'], department: 'QA 1팀', status: '진행중', color: 'bg-blue-500', progressStage: '검증 중', description: '앱 전체 리뉴얼에 따른 통합 테스트 진행' },
  { id: 'sch_2', name: '결제 모듈 업데이트', startDate: '2026-05-15', endDate: '2026-05-25', assignees: ['이영희'], department: 'QA 2팀', status: '예정', color: 'bg-green-500', progressStage: '대기 중', description: '신규 PG사 연동 테스트' }
];

// 공통 컴포넌트
const AppLogo = ({ className }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) return <MonitorSmartphone className={`text-gray-800 ${className}`} strokeWidth={1.5} />;
  return <img src="/icon-192x192.png" alt="QA Base" className={`object-contain ${className}`} onError={() => setImgError(true)} />;
};

const CustomSelect = ({ value, onChange, options, className, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`relative ${className} p-0 ${disabled ? 'cursor-not-allowed opacity-60 bg-gray-100' : 'cursor-pointer'}`} tabIndex={disabled ? -1 : 0} onBlur={(e) => { if(!e.currentTarget.contains(e.relatedTarget)) setIsOpen(false); }}>
      <div className="flex justify-between items-center w-full h-full px-3 py-1.5" onClick={() => !disabled && setIsOpen(!isOpen)}>
        <span className="truncate">{options.find(o => o.value === value)?.label || value}</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-2 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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

const CustomDatePicker = ({ value, onChange, disabled, alignRight }) => {
  return (
    <input 
      type="date" 
      disabled={disabled}
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)} 
      className={`w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm disabled:bg-gray-100 disabled:text-gray-500 ${alignRight ? 'text-right' : ''}`} 
    />
  );
};

// 메인 모듈 로직
const ProjectModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isViewer, isEdit, onDelete, allAssigneesList, onAddCustomAssignee }) => {
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState('');
  const assigneeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (assigneeRef.current && !assigneeRef.current.contains(e.target)) setIsAssigneeOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const currentAssignees = formData.assignees || (formData.assignee ? [formData.assignee] : []);

  const toggleAssignee = (name) => {
    let newAssignees;
    if (currentAssignees.includes(name)) {
      newAssignees = currentAssignees.filter(n => n !== name);
    } else {
      if (currentAssignees.length < 3) newAssignees = [...currentAssignees, name];
      else newAssignees = currentAssignees;
    }
    setFormData({ ...formData, assignees: newAssignees });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[450px] border border-gray-100 relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center shrink-0">
          <CalendarDays className="w-5 h-5 mr-2 text-gray-600"/> 
          {isEdit ? '프로젝트 상세 정보' : '새 프로젝트 등록'}
        </h3>
        <div className="overflow-visible flex-1 pb-2">
          <form id="projectForm" onSubmit={(e) => { e.preventDefault(); if(!isViewer) onSubmit(formData); }} className="space-y-4 relative">
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">프로젝트명</label><input required disabled={isViewer} value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm disabled:bg-gray-100 disabled:text-gray-500" /></div>
            <div className="grid grid-cols-2 gap-4 relative z-50">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">시작일</label>
                <CustomDatePicker disabled={isViewer} value={formData.startDate} onChange={val=>setFormData({...formData, startDate: val})} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">종료일</label>
                <CustomDatePicker disabled={isViewer} value={formData.endDate} onChange={val=>setFormData({...formData, endDate: val})} alignRight />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 relative z-40">
              <div ref={assigneeRef} className="relative">
                <label className="text-xs font-medium text-gray-500 mb-1 block">담당자</label>
                {/* 폼 유효성 검사를 위한 숨김 입력 필드 */}
                <input type="hidden" required value={currentAssignees.length > 0 ? 'valid' : ''} />
                <div 
                  className={`w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 shadow-sm flex items-center justify-between ${isViewer ? 'bg-gray-100 text-gray-500' : 'cursor-pointer'}`}
                  onClick={() => !isViewer && setIsAssigneeOpen(!isAssigneeOpen)}
                >
                  <div className="flex gap-1 overflow-hidden">
                    {currentAssignees.length > 0 ? currentAssignees.map(a => (
                      <span key={a} className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs truncate max-w-[60px]">{a}</span>
                    )) : <span className="text-gray-400">선택 (최대 3명)</span>}
                  </div>
                  {!isViewer && <ChevronDown className="w-4 h-4 text-gray-400 shrink-0"/>}
                </div>
                {isAssigneeOpen && !isViewer && (
                  <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] py-1.5 flex flex-col">
                    <div className="max-h-32 overflow-y-auto no-scrollbar">
                      {allAssigneesList.length > 0 ? allAssigneesList.map(a => (
                        <div key={a} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center"
                             onClick={() => toggleAssignee(a)}>
                          <input type="checkbox" checked={currentAssignees.includes(a)} readOnly className="mr-2 rounded border-gray-300 text-gray-800 focus:ring-gray-800" />
                          <span className="truncate">{a}</span>
                        </div>
                      )) : <div className="px-4 py-2 text-xs text-gray-400">등록된 담당자가 없습니다.</div>}
                    </div>
                    <div className="border-t border-gray-100 p-2 flex gap-2">
                      <input type="text" value={newAssigneeName} onChange={e=>setNewAssigneeName(e.target.value)} 
                             placeholder="새 담당자 이름" className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-gray-400 transition-colors"/>
                      <button type="button" onClick={(e) => {
                        e.preventDefault();
                        if(newAssigneeName.trim()) {
                          onAddCustomAssignee(newAssigneeName.trim());
                          toggleAssignee(newAssigneeName.trim());
                          setNewAssigneeName('');
                        }
                      }} className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-md hover:bg-gray-900 transition-colors font-medium shrink-0">추가</button>
                    </div>
                  </div>
                )}
              </div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">유관부서</label><input required disabled={isViewer} value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm disabled:bg-gray-100 disabled:text-gray-500" /></div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-30">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">상태</label>
                {isViewer ? (
                  <div className="w-full bg-gray-100 border border-gray-200 text-sm rounded-lg px-3 py-2 text-gray-500 truncate" title={formData.status}>{formData.status}</div>
                ) : (
                  <CustomSelect 
                    value={formData.status} onChange={val=>setFormData({...formData, status: val})} 
                    options={[{value:'예정', label:'예정'}, {value:'진행중', label:'진행중'}, {value:'HOLD', label:'HOLD'}, {value:'완료', label:'완료'}]}
                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 shadow-sm"
                  />
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">진행 단계</label>
                {isViewer ? (
                  <div className="w-full bg-gray-100 border border-gray-200 text-sm rounded-lg px-3 py-2 text-gray-500 truncate" title={formData.progressStage || '없음'}>{formData.progressStage || '없음'}</div>
                ) : (
                  <CustomSelect 
                    value={formData.progressStage || '없음'} onChange={val=>setFormData({...formData, progressStage: val})} 
                    options={[{value:'없음', label:'없음'}, {value:'분석 중', label:'분석 중'}, {value:'설계 중', label:'설계 중'}, {value:'대기 중', label:'대기 중'}, {value:'검증 중', label:'검증 중'}, {value:'완료 됨', label:'완료 됨'}]}
                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 shadow-sm"
                  />
                )}
              </div>
            </div>
            
            {/* 프로젝트 색상 선택 */}
            {!isViewer && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">프로젝트 라벨 색상</label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_COLORS.map(c => (
                    <button 
                      key={c} type="button" 
                      onClick={() => setFormData({...formData, color: c})} 
                      className={`w-6 h-6 rounded-full transition-all ${c} ${formData.color === c ? 'ring-2 ring-offset-2 ring-gray-800 scale-110 shadow-md' : 'hover:scale-110 shadow-sm opacity-80 hover:opacity-100'}`} 
                    />
                  ))}
                </div>
              </div>
            )}

            <div><label className="text-xs font-medium text-gray-500 mb-1 block">프로젝트 설명</label><textarea required disabled={isViewer} value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm resize-none disabled:bg-gray-100 disabled:text-gray-500" /></div>
          </form>
        </div>
        {!isViewer && (
          <div className="flex space-x-2 pt-4 border-t border-gray-100 shrink-0 mt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-200 transition-colors">취소</button>
            {isEdit && (
              <button type="button" onClick={() => onDelete(formData.id)} className="flex-1 bg-red-50 text-red-600 text-sm font-medium py-2.5 rounded-xl border border-red-100 shadow-sm hover:bg-red-100 transition-colors">삭제</button>
            )}
            <button type="submit" form="projectForm" className="flex-1 bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl shadow-md hover:bg-gray-900 transition-colors">저장</button>
          </div>
        )}
      </div>
    </div>
  );
};

const ScheduleCalendar = ({ schedules, onShowDetails, user, onUpdateEndDate, onUpdateStartDate, onCellClick }) => {
  // [수정] 캘린더 진입 시 고정된 '5월'이 아닌 현재(오늘)를 기준으로 렌더링되도록 핀셋 수정 완료
  const [currentDate, setCurrentDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); 
  const [showWeekend, setShowWeekend] = useState(true);
  
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [tooltipInfo, setTooltipInfo] = useState({ visible: false, x: 0, y: 0, text: '', assignee: '' });
  const [isDragging, setIsDragging] = useState(false);
  const calendarRef = useRef(null);

  const uniqueAssignees = Array.from(new Set(schedules.flatMap(s => s.assignees || (s.assignee ? [s.assignee] : []))));
  const assigneeOptions = [{ value: 'All', label: '담당자 전체' }, ...uniqueAssignees.map(a => ({ value: a, label: a }))];

  const filteredSchedules = assigneeFilter === 'All' ? schedules : schedules.filter(s => {
    const assignees = s.assignees || (s.assignee ? [s.assignee] : []);
    return assignees.includes(assigneeFilter);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNext = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDaysArray = (y, m) => {
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();
    let days = [];
    
    // Prev month filling
    const prevMonthDays = new Date(y, m, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(y, m - 1, prevMonthDays - i), isCurrentMonth: false });
    }
    
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(y, m, i), isCurrentMonth: true });
    }
    
    // Next month filling to complete the grid (usually 42 cells total for 6 rows)
    const totalCellsNeeded = Math.ceil(days.length / 7) * 7;
    let nextMonthDay = 1;
    while (days.length < totalCellsNeeded) {
      days.push({ date: new Date(y, m + 1, nextMonthDay++), isCurrentMonth: false });
    }
    
    return days.map(day => {
      const d = day.date;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { ...day, dateStr };
    });
  };

  const renderMonthGrid = (y, m) => {
    const daysArray = getDaysArray(y, m);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const filteredDayNames = showWeekend ? dayNames : dayNames.slice(1, 6);

    const rows = [];
    let currentRow = [];
    daysArray.forEach(day => {
      const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
      if (!showWeekend && isWeekend) return;
      
      currentRow.push(day);
      if (currentRow.length === (showWeekend ? 7 : 5)) {
        rows.push(currentRow);
        currentRow = [];
      }
    });
    if (currentRow.length > 0) rows.push(currentRow);

    return (
      <div 
        className="flex-1 rounded-2xl border border-gray-200 bg-gray-200 flex flex-col relative z-0" 
        style={{ overflow: 'hidden', isolation: 'isolate', maskImage: 'radial-gradient(white, black)', WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
      >
        <div className={`grid ${showWeekend ? 'grid-cols-7' : 'grid-cols-5'} bg-gray-100 border-b border-gray-200 shrink-0`}>
          {filteredDayNames.map((day, i) => (
            <div key={i} className="py-3 text-center text-xs font-extrabold text-gray-700 tracking-widest uppercase">{day}</div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-[1px] bg-gray-200">
          {rows.map((row, rowIdx) => {
            const rowStartDate = row[0].dateStr;
            const rowEndDate = row[row.length - 1].dateStr;
            const rowProjects = filteredSchedules.filter(s => s.startDate <= rowEndDate && s.endDate >= rowStartDate)
              .sort((a, b) => new Date(a.startDate) - new Date(b.startDate) || new Date(b.endDate) - new Date(a.endDate));
            
            const slots = []; 
            const rowScheduleToSlot = {};
            rowProjects.forEach(s => {
              let assignedSlot = 0;
              while (true) {
                if (!slots[assignedSlot]) {
                  slots[assignedSlot] = [s];
                  rowScheduleToSlot[s.id] = assignedSlot;
                  break;
                }
                const overlaps = slots[assignedSlot].some(existing => (s.startDate <= existing.endDate && s.endDate >= existing.startDate));
                if (!overlaps) {
                  slots[assignedSlot].push(s);
                  rowScheduleToSlot[s.id] = assignedSlot;
                  break;
                }
                assignedSlot++;
              }
            });
            const maxRowSlot = slots.length;

            return (
              <div 
                key={rowIdx} 
                className={`grid ${showWeekend ? 'grid-cols-7' : 'grid-cols-5'} gap-[1px] bg-gray-200 shrink-0`}
                style={{ gridAutoRows: 'minmax(120px, max-content)' }}
              >
                {row.map((dayObj, colIndex) => {
                  const { date, isCurrentMonth, dateStr } = dayObj;
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isHoliday = HOLIDAYS.includes(dateStr);
                  const isSun = date.getDay() === 0;
                  const isSat = date.getDay() === 6;

                  let dateNumColor = 'text-gray-800';
                  if (!isCurrentMonth) dateNumColor = 'text-gray-300';
                  else if (isSun || isHoliday) dateNumColor = 'text-red-500';
                  else if (isSat) dateNumColor = 'text-blue-500';
                  
                  const dayProjects = [];
                  for (let i = 0; i < maxRowSlot; i++) {
                    const proj = rowProjects.find(s => s.startDate <= dateStr && s.endDate >= dateStr && rowScheduleToSlot[s.id] === i);
                    dayProjects.push(proj || null);
                  }

                  return (
                    <div 
                      key={dateStr} 
                      className={`group flex flex-col bg-white h-full relative cursor-pointer ${!isCurrentMonth ? 'bg-gray-50/80' : 'transition-colors duration-300'}`}
                      style={{ zIndex: 50 - colIndex }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const resizeProjectId = e.dataTransfer.getData('resizeProjectId');
                        if (resizeProjectId && onUpdateEndDate) {
                          onUpdateEndDate(resizeProjectId, dateStr);
                        }
                        const resizeStartProjectId = e.dataTransfer.getData('resizeStartProjectId');
                        if (resizeStartProjectId && onUpdateStartDate) {
                          onUpdateStartDate(resizeStartProjectId, dateStr);
                        }
                      }}
                    >
                      {/* 빈공간 클릭 배경 층 */}
                      <div 
                        className="absolute inset-0 z-0 flex flex-col pointer-events-auto"
                        onClick={() => onCellClick && onCellClick(dateStr)}
                      >
                        <div className="absolute inset-0 bg-transparent hover:bg-gray-50/50 transition-colors pointer-events-none"></div>
                      </div>

                      {/* 날짜 숫자 */}
                      <div className="h-8 pt-2 px-2 flex justify-start shrink-0 z-10 pointer-events-none">
                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-gray-900 text-white shadow-lg' : dateNumColor}`}>
                          {date.getDate()}
                        </span>
                      </div>
                      
                      {/* 프로젝트 밴드 층 */}
                      <div className="flex flex-col space-y-[2px] py-1 pb-2 flex-1 z-20 pointer-events-none overflow-visible">
                        {dayProjects.map((s, sIdx) => {
                          if (!s) return <div key={`empty-${sIdx}`} className="h-[24px] shrink-0 pointer-events-none"></div>;
                          
                          const isActualStart = s.startDate === dateStr;
                          const isRowStart = colIndex === 0;
                          const isStart = isActualStart || isRowStart;

                          if (!isStart) {
                            return <div key={s.id} className="h-[24px] shrink-0 pointer-events-none"></div>;
                          }

                          let segmentDuration = 0;
                          for (let i = colIndex; i < row.length; i++) {
                            if (row[i].dateStr <= s.endDate) segmentDuration++;
                            else break;
                          }

                          const baseColor = s.color || 'bg-blue-500';
                          let bandBg = baseColor;
                          if (s.status === '완료') bandBg = 'bg-gray-400 opacity-60'; 
                          else if (s.status === '예정') bandBg = `${baseColor} opacity-40`; 

                          const isProjectEnd = s.endDate === row[colIndex + segmentDuration - 1].dateStr;
                          const isRowEnd = (colIndex + segmentDuration) === row.length;
                          
                          let deduct = 0;
                          let leftClass = 'left-0';
                          let roundedClasses = '';

                          if (isActualStart || isRowStart) {
                            deduct += 4;
                            leftClass = 'left-1';
                            roundedClasses += 'rounded-l-md ';
                          }
                          
                          if (isProjectEnd || isRowEnd) {
                            deduct += 4;
                            roundedClasses += 'rounded-r-md ';
                          }

                          const widthStyle = `calc(${segmentDuration * 100}% + ${segmentDuration - 1}px - ${deduct}px)`;

                          const assignees = s.assignees || (s.assignee ? [s.assignee] : []);
                          const mainAssignee = assignees[0];
                          const extraCount = assignees.length - 1;

                          const handleTooltip = (e, s) => {
                            if (!calendarRef.current) return;
                            const container = e.currentTarget.querySelector('.project-content-container');
                            const textSpan = e.currentTarget.querySelector('.project-name-text');
                            
                            let isTruncated = false;
                            if (textSpan && textSpan.scrollWidth > textSpan.clientWidth) isTruncated = true;
                            if (container && container.scrollWidth > container.clientWidth) isTruncated = true;

                            const assigneesText = (s.assignees || (s.assignee ? [s.assignee] : [])).join(', ');

                            if (isTruncated) {
                              setTooltipInfo({ visible: true, x: e.clientX, y: e.clientY, text: s.name, assignee: assigneesText });
                            } else {
                              setTooltipInfo(prev => prev.visible ? { visible: false, x: 0, y: 0, text: '', assignee: '' } : prev);
                            }
                          };

                          return (
                            <div key={s.id} className="h-[24px] shrink-0 relative w-full z-20 pointer-events-auto">
                              <div 
                                onClick={(e) => { e.stopPropagation(); onShowDetails(s); }}
                                onMouseEnter={(e) => handleTooltip(e, s)}
                                onMouseMove={(e) => handleTooltip(e, s)}
                                onMouseLeave={() => setTooltipInfo({ visible: false, x: 0, y: 0, text: '', assignee: '' })}
                                className={`absolute top-0 bottom-0 flex items-center cursor-pointer transition-all hover:brightness-110 ${bandBg} text-white shadow-sm text-[11px] font-bold tracking-wide ${leftClass} ${roundedClasses} ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'}`}
                                style={{ width: widthStyle }}
                              >
                                {isActualStart && user?.role !== 'viewer' && (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      e.dataTransfer.setData('resizeStartProjectId', s.id);
                                      setTimeout(() => setIsDragging(true), 0);
                                    }}
                                    onDragEnd={() => setIsDragging(false)}
                                    className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 z-30 rounded-l-md transition-colors pointer-events-auto"
                                    title="드래그하여 시작일 변경"
                                  />
                                )}

                                <span className="project-content-container w-full flex items-center pr-1 pl-2 h-full pointer-events-none min-w-0">
                                  <span className="truncate project-name-text shrink leading-none">{s.name}</span>
                                  {mainAssignee && (
                                    <span className="ml-1.5 px-[5px] h-[15px] bg-white/25 text-white rounded flex items-center justify-center text-[9px] font-bold tracking-wider shrink-0 shadow-sm border border-white/20 drop-shadow-md">
                                      {mainAssignee}{extraCount > 0 ? ` +${extraCount}` : ''}
                                    </span>
                                  )}
                                  {s.progressStage && s.progressStage !== '없음' && s.progressStage !== '완료 됨' && (
                                    <span className="ml-1.5 text-[9px] font-medium text-white/90 italic animate-pulse whitespace-nowrap tracking-wide shrink-0">
                                      {s.progressStage}...
                                    </span>
                                  )}
                                </span>
                                
                                {isProjectEnd && user?.role !== 'viewer' && (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      e.dataTransfer.setData('resizeProjectId', s.id);
                                      setTimeout(() => setIsDragging(true), 0);
                                    }}
                                    onDragEnd={() => setIsDragging(false)}
                                    className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 z-30 rounded-r-md transition-colors pointer-events-auto"
                                    title="드래그하여 종료일 변경"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTooltip = () => {
    if (!tooltipInfo.visible) return null;
    let x = tooltipInfo.x + 15;
    let y = tooltipInfo.y + 15;
    
    // 브라우저 뷰포트 크기를 벗어나지 않도록 방어 로직
    if (x + 160 > window.innerWidth) x = tooltipInfo.x - 160;
    if (y + 60 > window.innerHeight) y = tooltipInfo.y - 60;
    
    // React Portal을 사용하여 모든 레이아웃 간섭을 피하고 최상위에 툴팁 렌더링
    return createPortal(
      <div 
        className="fixed z-[99999] px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] pointer-events-none animate-fast-fade border border-gray-700/50 flex flex-col gap-1 whitespace-nowrap"
        style={{ left: x, top: y }}
      >
        <span className="text-xs font-bold">{tooltipInfo.text}</span>
        {tooltipInfo.assignee && (
          <div className="flex items-center text-[10px] text-gray-300 font-medium">
            <User className="w-3 h-3 mr-1" /> {tooltipInfo.assignee}
          </div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div ref={calendarRef} className="h-full flex flex-col bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-200 overflow-hidden animate-fade-in p-5 isolate relative">
      <div className="flex justify-between items-center mb-5 px-2 shrink-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{year}년 {month + 1}월</h2>
          <div className="flex space-x-1">
            <button onClick={handlePrev} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
            <button onClick={handleNext} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><ChevronRight className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <CustomSelect 
            value={assigneeFilter} 
            onChange={setAssigneeFilter} 
            options={assigneeOptions}
            className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 py-1.5 px-3 rounded-xl shadow-sm hover:bg-gray-100 transition-colors min-w-[110px]"
          />
          <button onClick={() => setShowWeekend(!showWeekend)} className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all shadow-sm ${showWeekend ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            주말 포함
          </button>
        </div>
      </div>
      {renderMonthGrid(year, month)}
      {renderTooltip()}
    </div>
  );
};

const ProjectKanban = ({ projects, user, onStatusChange, onShowDetails }) => {
  const columns = [{ id: '예정', title: '예정' }, { id: '진행중', title: '진행중' }, { id: 'HOLD', title: 'HOLD' }, { id: '완료', title: '완료' }];

  const handleDragStart = (e, projectId) => e.dataTransfer.setData('projectId', projectId);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (user.role === 'viewer') return;
    const projectId = e.dataTransfer.getData('projectId');
    onStatusChange(projectId, targetStatus);
  };

  return (
    <div className="flex h-full gap-6 w-full animate-fade-in pb-4 overflow-x-auto no-scrollbar">
      {columns.map(col => (
        <div key={col.id} className="flex-1 min-w-[280px] bg-gray-100/80 rounded-2xl p-4 flex flex-col border border-gray-200 shadow-md" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-medium text-gray-700">{col.title}</h3>
            <span className="bg-white text-xs px-2 py-1 rounded-full shadow-sm text-gray-600 border border-gray-200 font-semibold">{projects.filter(p => p.status === col.id).length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-2">
            {projects.filter(p => p.status === col.id).map(project => {
              const assignees = project.assignees || (project.assignee ? [project.assignee] : []);
              const mainAssignee = assignees[0];
              const extraCount = assignees.length - 1;

              return (
                <div key={project.id} draggable={user.role !== 'viewer'} onDragStart={(e) => handleDragStart(e, project.id)} onClick={() => onShowDetails(project)} className={`bg-white p-4 rounded-xl shadow-md border border-gray-200 ${user.role !== 'viewer' ? 'cursor-grab active:cursor-grabbing hover-breath' : ''} group`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-gray-400 tracking-wider truncate max-w-[120px]" title={project.department}>{project.department}</span>
                    <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100 font-medium whitespace-nowrap shrink-0">{project.startDate.slice(5)} ~ {project.endDate.slice(5)}</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3 truncate" title={project.name}>{project.name}</h4>
                  <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-50 pt-3">
                    <div className="flex items-center space-x-2 truncate">
                      {mainAssignee && (
                        <span className="flex items-center bg-gray-50 text-gray-600 px-2 py-1 rounded-md font-medium border border-gray-100 shadow-sm truncate max-w-[150px]" title={assignees.join(', ')}>
                          <User className="w-3 h-3 mr-1 shrink-0" /> 
                          <span className="truncate">{mainAssignee}{extraCount > 0 ? ` +${extraCount}` : ''}</span>
                        </span>
                      )}
                      {project.progressStage && project.progressStage !== '없음' && project.progressStage !== '완료 됨' && (
                        <span className="text-[10px] font-medium text-blue-500 italic animate-pulse whitespace-nowrap tracking-wide shrink-0">
                          {project.progressStage}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const ProjectList = ({ projects, onShowDetails }) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden animate-fade-in">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100/80 border-b border-gray-200">
            <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider w-24">상태</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider">진행 단계</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider">프로젝트명</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider">기간</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider">담당자</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-600 tracking-wider">유관부서</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => {
            const colorMap = { '예정': 'bg-gray-100 text-gray-600 border-gray-200', '진행중': 'bg-blue-50 text-blue-600 border-blue-200', 'HOLD': 'bg-orange-50 text-orange-600 border-orange-200', '완료': 'bg-green-50 text-green-600 border-green-200' };
            const assigneesText = (project.assignees || (project.assignee ? [project.assignee] : [])).join(', ');
            
            return (
            <tr key={project.id} onClick={() => onShowDetails(project)} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group">
              <td className="px-6 py-4"><span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm border whitespace-nowrap ${colorMap[project.status]}`}>{project.status}</span></td>
              <td className="px-6 py-4 text-sm font-medium text-gray-600 whitespace-nowrap">{project.progressStage || '없음'}</td>
              <td className="px-6 py-4 text-sm font-bold text-gray-800"><div className="truncate max-w-[280px]" title={project.name}>{project.name}</div></td>
              <td className="px-6 py-4 text-sm font-medium text-gray-600 whitespace-nowrap">{project.startDate} ~ {project.endDate}</td>
              <td className="px-6 py-4 text-sm font-medium text-gray-600"><div className="truncate max-w-[150px]" title={assigneesText}>{assigneesText}</div></td>
              <td className="px-6 py-4 text-sm font-medium text-gray-600"><div className="truncate max-w-[150px]" title={project.department}>{project.department}</div></td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
};

export const ScheduleDashboard = ({ user, onNavigate, onLogout, onQuit }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('calendar'); 
  const [schedules, setSchedules] = useState([]);
  const [customAssignees, setCustomAssignees] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', assignees: [], department: '', description: '', status: '예정', color: 'bg-blue-500', progressStage: '없음' });

  const [filterStatus, setFilterStatus] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterDept, setFilterDept] = useState('');

  const allDbAssignees = Array.from(new Set(schedules.flatMap(s => s.assignees || (s.assignee ? [s.assignee] : []))));
  const allAssigneesList = Array.from(new Set([...allDbAssignees, ...customAssignees])).filter(Boolean);

  useEffect(() => {
    const schedulesRef = collection(db, 'schedules');
    const unsubscribe = onSnapshot(schedulesRef, (snapshot) => {
      if (snapshot.empty) {
        const seedData = async () => {
          const batch = writeBatch(db);
          INITIAL_SCHEDULES.forEach(s => batch.set(doc(schedulesRef), s));
          await batch.commit();
        };
        seedData();
      } else {
        setSchedules(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveSubmit = async (dataToSave) => {
    try {
      if (isEditMode) {
        const { id, ...updateData } = dataToSave;
        await updateDoc(doc(db, 'schedules', id), updateData);
      } else {
        await addDoc(collection(db, 'schedules'), dataToSave);
      }
      setShowModal(false);
    } catch(err) { console.error("Error saving schedule", err); }
  };

  const handleStatusChange = async (id, targetStatus) => {
    try { await updateDoc(doc(db, 'schedules', id), { status: targetStatus }); } 
    catch(err) { console.error("Error updating schedule status", err); }
  };

  const handleUpdateEndDate = async (id, newEndDate) => {
    try {
      const schedule = schedules.find(s => s.id === id);
      if (schedule && newEndDate >= schedule.startDate) {
        await updateDoc(doc(db, 'schedules', id), { endDate: newEndDate });
      }
    } catch(err) { console.error("Error updating end date", err); }
  };

  const handleUpdateStartDate = async (id, newStartDate) => {
    try {
      const schedule = schedules.find(s => s.id === id);
      if (schedule && newStartDate <= schedule.endDate) {
        await updateDoc(doc(db, 'schedules', id), { startDate: newStartDate });
      }
    } catch(err) { console.error("Error updating start date", err); }
  };

  const handleDeleteSchedule = async (id) => {
    try { await deleteDoc(doc(db, 'schedules', id)); setShowModal(false); }
    catch(err) { console.error("Error deleting schedule", err); }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({ name: '', startDate: '', endDate: '', assignees: [], department: '', description: '', status: '예정', color: 'bg-blue-500', progressStage: '없음' });
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setIsEditMode(true);
    const currentAssignees = project.assignees || (project.assignee ? [project.assignee] : []);
    setFormData({ progressStage: '없음', ...project, assignees: currentAssignees });
    setShowModal(true);
  };

  const handleCellClick = (dateStr) => {
    if (user.role === 'viewer') return;
    setIsEditMode(false);
    setFormData({ name: '', startDate: dateStr, endDate: dateStr, assignees: [], department: '', description: '', status: '예정', color: 'bg-blue-500', progressStage: '없음' });
    setShowModal(true);
  };

  return (
    <div className="w-screen h-screen bg-[#f8f9fa] flex flex-col overflow-hidden animate-simple-fade">
      <header className="h-20 px-8 flex justify-between items-center bg-[url('/header-bg.jpg')] bg-cover bg-[length:100%_100%] shrink-0 relative z-50 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-3"></div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 mr-4 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm cursor-default">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-medium text-gray-700">1명 접속중</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm hover-breath cursor-default">
            <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-white text-[10px] font-medium overflow-hidden">
              {user.profileImage ? <img src={user.profileImage} alt="profile" className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>
            <span className="text-xs font-medium text-gray-700">{user.name}</span>
          </div>
          <div className="h-4 w-px bg-gray-200"></div>
          <button onClick={onLogout} className="text-gray-400 hover:text-gray-800 transition-colors p-1.5 hover-breath rounded-md"><LogOut className="w-4 h-4" /></button>
          <button onClick={onQuit} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover-breath rounded-md"><Power className="w-4 h-4" /></button>
        </div>
      </header>

      <div 
        className="flex flex-1 overflow-hidden relative bg-[#f0f2f5] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/project-bg.jpg')" }}
      >
        <aside className={`bg-white/60 backdrop-blur-xl rounded-r-2xl shadow-[-5px_0_30px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out flex flex-col justify-between z-10 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-64' : 'w-0'}`}>
          
          {/* 상단 메인 메뉴 */}
          <div className="p-4 space-y-1 w-64">
            <div className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-3 mt-2">MENU</div>
            <button onClick={() => onNavigate('board')} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"><LayoutDashboard className="w-4 h-4" /><span className="text-sm font-medium">Functional Board</span></button>
            <div className="h-px bg-gray-100 my-2 mx-3"></div>
            <button onClick={() => setActiveMenu('calendar')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${activeMenu === 'calendar' ? 'bg-gray-50 text-gray-900 font-medium border border-gray-200 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><CalendarDays className={`w-4 h-4 ${activeMenu === 'calendar' ? 'text-gray-700' : ''}`} /><span className="text-sm">QA Calendar</span></button>
            <button onClick={() => setActiveMenu('list')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${activeMenu === 'list' ? 'bg-gray-50 text-gray-900 font-medium border border-gray-200 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><List className={`w-4 h-4 ${activeMenu === 'list' ? 'text-gray-700' : ''}`} /><span className="text-sm">Project List</span></button>
            <button onClick={() => setActiveMenu('kanban')} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${activeMenu === 'kanban' ? 'bg-gray-50 text-gray-900 font-medium border border-gray-200 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><Kanban className={`w-4 h-4 ${activeMenu === 'kanban' ? 'text-gray-700' : ''}`} /><span className="text-sm">Project Board</span></button>
          </div>

          {/* ▼ 하단 퀵링크 (즐겨찾기) 공통 컴포넌트 추가 ▼ */}
          <SidebarFavorites 
            db={db} 
            user={user} 
            onNavigate={onNavigate} 
            sidebarOpen={sidebarOpen} 
            currentModule="schedule" 
          />
        </aside>

          {/* 미니멀 시네마틱 폴딩 핸들 (아이콘 및 테두리 제거, 사이즈 축소) */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className={`absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center transition-all duration-300 ease-in-out group outline-none w-3 h-14 rounded-r-lg backdrop-blur-md shadow-[3px_0_10px_-3px_rgba(0,0,0,0.05)] bg-white/30 hover:bg-white/50 hover:shadow-[4px_0_16px_-4px_rgba(0,0,0,0.1)] ${
            sidebarOpen ? 'left-[256px]' : 'left-0'
          }`}
        >
          {/* 화살표 없이 정중앙에 위치한 얇은 세로 그립 라인 */}
          <div className="w-[1.5px] h-5 bg-gray-400/40 rounded-full transition-colors duration-300 group-hover:bg-gray-500/60"></div>
        </button>

        <main className={`flex-1 overflow-hidden flex flex-col p-8 transition-all duration-300 ${!sidebarOpen ? 'ml-12' : ''}`}>
          <div className="flex justify-between items-end mb-8 shrink-0">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-800">
                  {activeMenu === 'calendar' ? 'QA Calendar' : activeMenu === 'list' ? 'Project List' : 'Project Board'}
                </h1>
                {user.role === 'viewer' && <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded border border-gray-200 font-semibold uppercase tracking-wider shadow-sm">Read Only</span>}
              </div>
              <p className="text-sm text-gray-500 font-medium">프로젝트 일정 및 진행 상태를 통합 관리합니다.</p>
            </div>
            <div className="flex items-center space-x-4">
              {user.role !== 'viewer' && (
                <button onClick={openAddModal} className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors shadow-md hover-breath flex items-center">
                  <Plus className="w-4 h-4 mr-1.5" /> 프로젝트 추가
                </button>
              )}
            </div>
          </div>

          {activeMenu === 'list' && (
            <div className="flex items-center space-x-3 bg-white p-3 px-5 rounded-2xl shadow-sm border border-gray-100 mb-6 shrink-0 animate-fade-in relative z-30">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="w-px h-4 bg-gray-200 mx-1"></div>
              <CustomSelect 
                value={filterStatus} onChange={setFilterStatus} 
                options={[{value:'All', label:'상태 전체'}, {value:'예정', label:'예정'}, {value:'진행중', label:'진행중'}, {value:'HOLD', label:'HOLD'}, {value:'완료', label:'완료'}]}
                className="bg-transparent text-xs font-medium text-gray-700 py-1 px-2 outline-none w-28 hover:bg-gray-50 rounded-md transition-colors"
              />
              <div className="w-px h-4 bg-gray-200 mx-1"></div>
              <input 
                type="text" placeholder="담당자 검색..." value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 outline-none focus:border-gray-400 transition-colors w-32 placeholder:text-gray-400"
              />
              <input 
                type="text" placeholder="유관부서 검색..." value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 outline-none focus:border-gray-400 transition-colors w-32 placeholder:text-gray-400"
              />
              {(filterStatus !== 'All' || filterAssignee || filterDept) && (
                <button onClick={() => { setFilterStatus('All'); setFilterAssignee(''); setFilterDept(''); }} className="text-[10px] text-gray-500 hover:text-gray-800 underline ml-2 font-medium">초기화</button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-hidden">
             {activeMenu === 'calendar' && (
               <div className="w-full max-w-5xl mx-auto h-full overflow-hidden">
                 <ScheduleCalendar schedules={schedules} onShowDetails={openEditModal} user={user} onUpdateEndDate={handleUpdateEndDate} onUpdateStartDate={handleUpdateStartDate} onCellClick={handleCellClick} />
               </div>
             )}
             {activeMenu === 'kanban' && <ProjectKanban projects={schedules} user={user} onStatusChange={handleStatusChange} onShowDetails={openEditModal} />}
             {activeMenu === 'list' && (
               <div className="h-full overflow-auto no-scrollbar">
                 <ProjectList 
                   projects={schedules.filter(p => {
                     if (filterStatus !== 'All' && p.status !== filterStatus) return false;
                     if (filterAssignee) {
                       const assigneesStr = (p.assignees || (p.assignee ? [p.assignee] : [])).join(', ');
                       if (!assigneesStr.toLowerCase().includes(filterAssignee.toLowerCase())) return false;
                     }
                     if (filterDept && !p.department.toLowerCase().includes(filterDept.toLowerCase())) return false;
                     return true;
                   })} 
                   onShowDetails={openEditModal} 
                 />
               </div>
             )}
          </div>
        </main>
      </div>

      <ProjectModal 
        isOpen={showModal} onClose={()=>setShowModal(false)} formData={formData} setFormData={setFormData} onSubmit={handleSaveSubmit} 
        isViewer={user.role === 'viewer'} isEdit={isEditMode} onDelete={handleDeleteSchedule} 
        allAssigneesList={allAssigneesList}
        onAddCustomAssignee={(name) => setCustomAssignees(prev => [...prev, name])}
      />
    </div>
  );
};
