import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bug, Activity, CheckCircle2, AlertCircle, 
  ChevronUp, Equal, ChevronDown as ChevronDownIcon,
  ChevronLeft, ChevronRight, LayoutDashboard, Server, Kanban, LogOut, Power, User, Plus, MonitorSmartphone, X, Edit, Filter, Search, ExternalLink
} from 'lucide-react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";

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

const AppLogo = ({ className }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) return <MonitorSmartphone className={`text-gray-800 ${className}`} strokeWidth={1.5} />;
  return <img src="/icon-192x192.png" alt="QA Base" className={`object-contain ${className}`} onError={() => setImgError(true)} />;
};

const CustomSelect = ({ value, onChange, options, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`relative ${className} p-0 cursor-pointer`} tabIndex={0} onBlur={(e) => { if(!e.currentTarget.contains(e.relatedTarget)) setIsOpen(false); }}>
      <div className="flex justify-between items-center w-full h-full px-3 py-1.5" onClick={() => setIsOpen(!isOpen)}>
        <span className="truncate">{options.find(o => o.value === value)?.label || value}</span>
        <ChevronDownIcon className={`w-3.5 h-3.5 ml-2 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
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
          <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{total} Issues</span>
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

const JiraBadge = ({ children, className }) => (
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

const SpaceModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isEdit, onDelete }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center shrink-0"><Server className="w-5 h-5 mr-2 text-gray-600"/> 스페이스 {isEdit ? '수정' : '생성'}</h3>
        <form id="spaceForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">스페이스 타입</label>
            <CustomSelect 
              value={formData.spaceType || 'Type 1'} 
              onChange={val=>setFormData({...formData, spaceType: val})} 
              options={[
                {value:'Type 1', label:'타입1 (에픽 + 개발결함)'}, 
                {value:'Type 2', label:'타입2 (에픽 + 버그)'}
              ]}
              className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg shadow-sm transition-colors focus-within:border-gray-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">스페이스 명</label>
            <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: v1.5 메인화면 개편" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">에픽 키 (JIRA)</label>
            <input required value={formData.epicKey} onChange={e=>setFormData({...formData, epicKey: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: EPIC-1204" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">담당 부서</label>
            <input required value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: QA 1팀" />
          </div>
        </form>
        <div className="flex space-x-2 pt-4 border-t border-gray-100 mt-4">
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm">취소</button>
          {isEdit && <button type="button" onClick={() => onDelete(formData.id)} className="flex-1 bg-red-50 text-red-600 text-sm font-medium py-2.5 rounded-xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm">삭제</button>}
          <button type="submit" form="spaceForm" className="flex-1 bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors shadow-md">{isEdit ? '수정' : '생성'}</button>
        </div>
      </div>
    </div>
  );
};

const EpicModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isEdit, onDelete }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center shrink-0"><Kanban className="w-5 h-5 mr-2 text-gray-600"/> 프로젝트 {isEdit ? '수정' : '추가'}</h3>
        <form id="epicForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">프로젝트 명</label>
            <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: 결제 모듈 개편" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">에픽 키 (JIRA)</label>
            <input required value={formData.epicKey} onChange={e=>setFormData({...formData, epicKey: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors" placeholder="예: EPIC-1205" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">상태</label>
            <CustomSelect 
              value={formData.status} 
              onChange={val=>setFormData({...formData, status: val})} 
              options={[
                {value:'예정', label:'예정'}, {value:'진행중', label:'진행중'}, 
                {value:'HOLD', label:'HOLD'}, {value:'완료', label:'완료'}
              ]}
              className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg shadow-sm transition-colors focus-within:border-gray-400"
            />
          </div>
        </form>
        <div className="flex space-x-2 pt-4 border-t border-gray-100 mt-4">
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm">취소</button>
          {isEdit && <button type="button" onClick={() => onDelete(formData.id)} className="flex-1 bg-red-50 text-red-600 text-sm font-medium py-2.5 rounded-xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm">삭제</button>}
          <button type="submit" form="epicForm" className="flex-1 bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors shadow-md">{isEdit ? '수정' : '추가'}</button>
        </div>
      </div>
    </div>
  );
};

export const ProjectsDashboard = ({ user, onNavigate, onLogout, onQuit }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('space'); 
  const [view, setView] = useState('spaces'); 
  
  const [activeSpace, setActiveSpace] = useState(null);
  const [activeEpic, setActiveEpic] = useState(null);
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jiraDomain, setJiraDomain] = useState(''); 

  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterReporter, setFilterReporter] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  
  const [searchInput, setSearchInput] = useState(''); 
  const [searchSummary, setSearchSummary] = useState(''); 
  
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);

  const [tooltipInfo, setTooltipInfo] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [selectedIssue, setSelectedIssue] = useState(null);

  const [spaces, setSpaces] = useState([]);
  const [spaceModal, setSpaceModal] = useState({ isOpen: false, isEdit: false });
  const [spaceFormData, setSpaceFormData] = useState({ id: '', name: '', epicKey: '', department: '', spaceType: 'Type 1' });

  const [epics, setEpics] = useState([]);
  const [epicModal, setEpicModal] = useState({ isOpen: false, isEdit: false });
  const [epicFormData, setEpicFormData] = useState({ id: '', spaceKey: '', name: '', epicKey: '', status: '예정', progress: 0 });

  const currentSpaceData = spaces.find(s => s.epicKey === activeSpace);
  const isType2 = currentSpaceData?.spaceType === 'Type 2';

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchSummary(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const spacesRef = collection(db, 'jira_spaces');
    const unsubscribeSpaces = onSnapshot(spacesRef, (snapshot) => {
      setSpaces(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    const epicsRef = collection(db, 'jira_epics');
    const unsubscribeEpics = onSnapshot(epicsRef, (snapshot) => {
      setEpics(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    return () => {
      unsubscribeSpaces();
      unsubscribeEpics();
    };
  }, []);

  useEffect(() => {
    if (view === 'issues' && activeEpic) {
      setSelectedIssue(null); 
      const fetchJiraIssues = async () => {
        setIssues([]); 
        setLoading(true);
        try {
          const issueTypeParam = isType2 ? encodeURIComponent('솔루션 버그') : encodeURIComponent('개발결함');
          const res = await fetch(`/api/jira?epicKey=${activeEpic}&issueType=${issueTypeParam}`);
          const data = await res.json();
          if (res.ok) {
            setIssues(data.issues || data); 
            setJiraDomain(data.domain || ''); 
          } else { 
            console.error("JIRA API 에러:", data.error); 
            setIssues([]); 
          }
        } catch (error) {
          console.error("JIRA 서버 통신 에러:", error);
          setIssues([]);
        } finally {
          setLoading(false);
        }
      };
      fetchJiraIssues();
    }
  }, [view, activeEpic, isType2]);

  useEffect(() => {
    if (view === 'issues' && activeEpic && !loading && issues.length > 0) {
      const total = issues.length;
      const resolved = issues.filter(i => {
        if (isType2) return i.status.includes('종료') || i.status.includes('Closed');
        return i.status.includes('완료') || i.status.includes('Closed');
      }).length;
      const calcProgress = Math.round((resolved / total) * 100);

      const currentEpic = epics.find(e => e.epicKey === activeEpic);
      if (currentEpic && currentEpic.progress !== calcProgress) {
        updateDoc(doc(db, 'jira_epics', currentEpic.id), { progress: calcProgress })
          .catch(err => console.error("Error updating epic progress:", err));
      }
    }
  }, [issues, activeEpic, loading, epics, isType2]);

  const handleSpaceSubmit = async (data) => {
    try {
      const { id, ...saveData } = data;
      if (!saveData.spaceType) saveData.spaceType = 'Type 1'; 
      if (spaceModal.isEdit) await updateDoc(doc(db, 'jira_spaces', id), saveData);
      else await addDoc(collection(db, 'jira_spaces'), saveData);
      setSpaceModal({ isOpen: false, isEdit: false });
    } catch(err) { console.error("Error saving space", err); }
  };
  
  const handleSpaceDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'jira_spaces', id));
      setSpaceModal({ isOpen: false, isEdit: false });
    } catch(err) { console.error("Error deleting space", err); }
  };

  const handleEpicSubmit = async (data) => {
    try {
      const { id, ...saveData } = data;
      if (epicModal.isEdit) await updateDoc(doc(db, 'jira_epics', id), saveData);
      else {
        saveData.spaceKey = activeSpace;
        saveData.progress = 0;
        await addDoc(collection(db, 'jira_epics'), saveData);
      }
      setEpicModal({ isOpen: false, isEdit: false });
    } catch(err) { console.error("Error saving epic", err); }
  };
  
  const handleEpicDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'jira_epics', id));
      setEpicModal({ isOpen: false, isEdit: false });
    } catch(err) { console.error("Error deleting epic", err); }
  };

  const filteredEpics = epics.filter(e => e.spaceKey === activeSpace);

  const totalIssues = issues.length;
  const statusCounts = issues.reduce((acc, cur) => { acc[cur.status] = (acc[cur.status] || 0) + 1; return acc; }, {});
  const platformCounts = issues.reduce((acc, cur) => { acc[cur.component] = (acc[cur.component] || 0) + 1; return acc; }, {});
  const reporterCounts = issues.reduce((acc, cur) => { acc[cur.reporter] = (acc[cur.reporter] || 0) + 1; return acc; }, {});
  const priorityCounts = issues.reduce((acc, cur) => { acc[cur.priority] = (acc[cur.priority] || 0) + 1; return acc; }, {});

  const statusColorMap = {
    'QA 완료': 'bg-green-500', 'Closed': 'bg-green-500', '완료': 'bg-green-500', 'Resolved': 'bg-green-500',
    '진행중': 'bg-blue-500', '수정중': 'bg-blue-500', 'In Progress': 'bg-blue-500',
    'REOPEN': 'bg-red-500', '정지': 'bg-red-500', 'Block': 'bg-red-500',
    '작업 예정': 'bg-gray-400', 'QA 대기': 'bg-gray-400', 'Open': 'bg-gray-400'
  };
  
  const platformColorMap = { 'Android': 'bg-green-400', 'iOS': 'bg-gray-800', 'Backend': 'bg-orange-500', 'Web': 'bg-blue-400' };
  const priorityColorMap = { 'Critical': 'bg-red-600', 'High': 'bg-orange-500', 'Medium': 'bg-yellow-500', 'Low': 'bg-blue-400' };

  const resolvedIssues = issues.filter(i => {
    if (isType2) return i.status.includes('종료') || i.status.includes('Closed');
    return i.status.includes('완료') || i.status.includes('Closed');
  }).length;
  const progressPercent = totalIssues === 0 ? 0 : Math.round((resolvedIssues / totalIssues) * 100);

  const currentEpicData = epics.find(e => e.epicKey === activeEpic);
  const displayProgress = loading ? (currentEpicData?.progress || 0) : progressPercent;

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'Critical': return <ChevronUp className="w-3 h-3 text-red-600 inline mr-1" strokeWidth={3} />;
      case 'High': return <ChevronUp className="w-3 h-3 text-orange-500 inline mr-1" strokeWidth={3} />;
      case 'Medium': return <Equal className="w-3 h-3 text-yellow-500 inline mr-1" strokeWidth={3} />;
      case 'Low': return <ChevronDownIcon className="w-3 h-3 text-blue-500 inline mr-1" strokeWidth={3} />;
      default: return null;
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status.includes('완료') || status === 'Closed') return 'bg-green-50 text-green-600 border-green-200';
    if (status.includes('REOPEN') || status === '정지') return 'bg-red-50 text-red-600 border-red-200';
    if (status.includes('진행중') || status.includes('수정중')) return 'bg-blue-50 text-blue-600 border-blue-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  // [수정] 보고자(Reporter) 필터가 전역으로 동작하도록 로직 수정
  const filteredIssues = issues.filter(issue => {
    if (filterStatus !== 'All' && issue.status !== filterStatus) return false;
    if (filterPriority !== 'All' && issue.priority !== filterPriority) return false;
    if (filterReporter !== 'All' && issue.reporter !== filterReporter) return false; // 모든 타입에서 동작
    
    if (!isType2) {
      if (filterPlatform !== 'All' && issue.component !== filterPlatform) return false;
    }
    
    if (searchSummary) {
      const term = searchSummary.toLowerCase();
      const inSummary = issue.summary?.toLowerCase().includes(term);
      const targetDesc = isType2 ? issue.issueContent : issue.description;
      const inDesc = targetDesc?.toLowerCase().includes(term);
      if (!inSummary && !inDesc) return false;
    }
    return true;
  });

  const statusOptions = [{value: 'All', label: '상태 전체'}, ...Array.from(new Set(issues.map(i => i.status))).filter(Boolean).map(s => ({value: s, label: s}))];
  const platformOptions = [{value: 'All', label: '플랫폼 전체'}, ...Array.from(new Set(issues.map(i => i.component))).filter(Boolean).map(p => ({value: p, label: p}))];
  const reporterOptions = [{value: 'All', label: '보고자 전체'}, ...Array.from(new Set(issues.map(i => i.reporter))).filter(Boolean).map(p => ({value: p, label: p}))];
  const priorityOptions = [{value: 'All', label: '우선순위 전체'}, ...Array.from(new Set(issues.map(i => i.priority))).filter(Boolean).map(p => ({value: p, label: p}))];

  const handleTooltip = React.useCallback((e, text) => {
    const textSpan = e.currentTarget.querySelector('.truncate-summary');
    let isTruncated = false;
    if (textSpan && textSpan.scrollWidth > textSpan.clientWidth) isTruncated = true;

    if (isTruncated) {
      setTooltipInfo(prev => {
        // 마우스가 조금 움직였을 때 불필요한 화면 재렌더링(Lag)을 완벽 차단하는 핀셋 로직
        if (prev.visible && prev.text === text && Math.abs(prev.x - e.clientX) < 5 && Math.abs(prev.y - e.clientY) < 5) {
          return prev;
        }
        return { visible: true, x: e.clientX, y: e.clientY, text: text };
      });
    } else {
      setTooltipInfo(prev => prev.visible ? { visible: false, x: 0, y: 0, text: '' } : prev);
    }
  }, []);

  const handleOpenJiraIssue = React.useCallback((issueKey) => {
    if (jiraDomain && issueKey) {
      window.open(`https://${jiraDomain}/browse/${issueKey}`, '_blank');
    }
  }, [jiraDomain]);

  const renderedIssues = React.useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td colSpan={isType2 ? "6" : "8"} className="px-5 py-20 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 relative">
                <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <span className="text-sm font-medium text-gray-500">JIRA 데이터를 불러오는 중입니다...</span>
            </div>
          </td>
        </tr>
      );
    }

    if (filteredIssues.length === 0) {
      return (
        <tr>
          <td colSpan={isType2 ? "6" : "8"} className="px-5 py-10 text-center text-sm text-gray-500 font-medium">
            등록/검색된 개발결함 내역이 없습니다.
          </td>
        </tr>
      );
    }

    return filteredIssues.map(issue => (
      <tr 
        key={issue.id} 
        className="hover:bg-blue-50/30 transition-colors group cursor-pointer" 
        onClick={() => setSelectedIssue(issue)}
      >
        {isType2 ? (
          <>
            <td className="px-5 py-4">
              <span 
                className="text-xs font-bold text-blue-600 hover:underline underline-offset-2 flex items-center cursor-pointer w-max"
                onClick={(e) => { e.stopPropagation(); handleOpenJiraIssue(issue.key); }}
              >
                {issue.key} <ExternalLink className="w-3 h-3 ml-1 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </span>
            </td>
            <td className="px-5 py-4 text-xs text-gray-400 font-medium whitespace-nowrap">{issue.date}</td>
            <td 
              className="px-5 py-4 text-sm font-bold text-gray-800"
              onMouseEnter={(e) => handleTooltip(e, issue.summary)}
              onMouseMove={(e) => handleTooltip(e, issue.summary)}
              onMouseLeave={() => setTooltipInfo({ visible: false, x: 0, y: 0, text: '' })}
            >
              <div className="truncate-summary truncate max-w-[200px] xl:max-w-sm"><HighlightText text={issue.summary} highlight={searchSummary} /></div>
            </td>
            <td className="px-5 py-4 text-xs font-medium text-gray-700 mt-1">
              <div className="flex items-center">{getPriorityIcon(issue.priority)} {issue.priority}</div>
            </td>
            <td className="px-5 py-4"><JiraBadge className={getStatusBadgeClass(issue.status)}>{issue.status}</JiraBadge></td>
            <td className="px-5 py-4">
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-medium text-gray-700 flex items-center"><User className="w-3 h-3 mr-1 text-gray-400"/> {issue.reporter}</span>
              </div>
            </td>
          </>
        ) : (
          <>
            <td className="px-5 py-4">
              <span 
                className="text-xs font-bold text-blue-600 hover:underline underline-offset-2 flex items-center cursor-pointer w-max"
                onClick={(e) => { e.stopPropagation(); handleOpenJiraIssue(issue.key); }}
              >
                {issue.key} <ExternalLink className="w-3 h-3 ml-1 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </span>
            </td>
            <td className="px-5 py-4"><JiraBadge className={getStatusBadgeClass(issue.status)}>{issue.status}</JiraBadge></td>
            <td className="px-5 py-4 text-xs font-medium text-gray-700 mt-1">
              <div className="flex items-center">{getPriorityIcon(issue.priority)} {issue.priority}</div>
            </td>
            <td className="px-5 py-4">
              <span className="text-[10px] px-1.5 py-0.5 rounded border bg-purple-50 text-purple-600 border-purple-200 font-bold whitespace-nowrap">{issue.phenomenon || '-'}</span>
            </td>
            <td 
              className="px-5 py-4 text-sm font-bold text-gray-800"
              onMouseEnter={(e) => handleTooltip(e, issue.summary)}
              onMouseMove={(e) => handleTooltip(e, issue.summary)}
              onMouseLeave={() => setTooltipInfo({ visible: false, x: 0, y: 0, text: '' })}
            >
              <div className="truncate-summary truncate max-w-[200px] xl:max-w-sm"><HighlightText text={issue.summary} highlight={searchSummary} /></div>
            </td>
            <td className="px-5 py-4">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${issue.platform === 'iOS' ? 'bg-gray-100 text-gray-700 border-gray-200' : issue.platform === 'Android' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>{issue.component}</span>
            </td>
            <td className="px-5 py-4">
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-medium text-gray-700 flex items-center"><User className="w-3 h-3 mr-1 text-gray-400"/> {issue.assignee}</span>
              </div>
            </td>
            <td className="px-5 py-4 text-xs text-gray-400 font-medium whitespace-nowrap">{issue.date}</td>
          </>
        )}
      </tr>
    ));
  }, [loading, filteredIssues, isType2, searchSummary, handleOpenJiraIssue, handleTooltip]);

  const renderTooltip = () => {
    if (!tooltipInfo.visible) return null;
    let x = tooltipInfo.x + 15;
    let y = tooltipInfo.y + 15;
    
    if (x + 350 > window.innerWidth) x = tooltipInfo.x - 350;
    if (y + 80 > window.innerHeight) y = tooltipInfo.y - 80;
    
    return createPortal(
      <div 
        className="fixed z-[99999] px-4 py-3 bg-gray-900/95 backdrop-blur-sm text-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] pointer-events-none animate-fast-fade border border-gray-700/50 max-w-sm"
        style={{ left: x, top: y }}
      >
        <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap"><HighlightText text={tooltipInfo.text} highlight={searchSummary} /></p>
      </div>,
      document.body
    );
  };

  // [수정] 보고자 필터가 항상 리셋 조건에 포함되도록 반영
  const hasFilters = filterStatus !== 'All' || filterPriority !== 'All' || filterReporter !== 'All' || searchInput || (!isType2 && filterPlatform !== 'All');

  return (
    <div className="w-screen h-screen bg-[#f8f9fa] flex flex-col overflow-hidden animate-simple-fade">
      <header className="h-16 px-6 flex justify-between items-center bg-white border-b border-gray-100 z-20 shrink-0 shadow-sm relative">
        <div className="flex items-center space-x-3">
          <AppLogo className="w-6 h-6" />
          <span className="text-lg font-medium tracking-wide text-gray-800">QA BASE</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm hover-breath cursor-default">
            {/* [수정됨] 프로필 이미지가 등록되어 있으면 이미지를, 없으면 이니셜을 보여주도록 핀셋 적용 (overflow-hidden 추가) */}
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

      <div 
        className="flex flex-1 overflow-hidden relative bg-[#f0f2f5] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-projects.png')" }}
      >
        <aside className={`bg-white border-r border-gray-100 transition-all duration-300 ease-in-out flex flex-col z-10 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}`}>
          <div className="p-4 space-y-1 w-64">
            <div className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-3 mt-2">MENU</div>
            <button onClick={() => onNavigate('board')} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"><LayoutDashboard className="w-4 h-4" /><span className="text-sm font-medium">Functional Board</span></button>
            <div className="h-px bg-gray-100 my-2 mx-3"></div>
            <button onClick={() => { setActiveMenu('space'); setView('spaces'); setActiveSpace(null); setActiveEpic(null); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${activeMenu === 'space' ? 'bg-blue-50/50 text-blue-700 font-medium border border-blue-100 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><Server className={`w-4 h-4 ${activeMenu === 'space' ? 'text-blue-600' : ''}`} /><span className="text-sm">Space Board</span></button>
            {activeSpace && (
              <button onClick={() => { setActiveMenu('epic'); setView('epics'); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ml-2 w-[calc(100%-8px)] ${activeMenu === 'epic' ? 'bg-gray-50 text-gray-900 font-medium border border-gray-200 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><Kanban className="w-4 h-4" /><span className="text-sm">Project Board</span></button>
            )}
          </div>
        </aside>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`absolute top-6 z-20 bg-white border border-gray-200 shadow-md rounded-full p-1.5 text-gray-600 hover:text-gray-900 transition-all duration-300 ${sidebarOpen ? 'left-[244px]' : 'left-4'}`}>
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <main className={`flex-1 overflow-hidden flex flex-col p-8 transition-all duration-300 ${!sidebarOpen ? 'ml-12' : ''}`}>
          
          {view === 'spaces' && (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-800">Space Board</h1>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">결함을 추적할 스페이스를 선택하거나 새로 생성하세요.</p>
                </div>
                <button onClick={() => { setSpaceFormData({ id: '', name: '', epicKey: '', department: '', spaceType: 'Type 1' }); setSpaceModal({isOpen: true, isEdit: false}); }} className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors shadow-md flex items-center">
                  <Plus className="w-4 h-4 mr-1.5" /> 스페이스 생성
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto no-scrollbar pb-6">
                {spaces.length > 0 ? spaces.map(space => (
                  <div key={space.id} onClick={() => { setActiveSpace(space.epicKey); setView('epics'); setActiveMenu('epic'); }} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md cursor-pointer hover-breath group relative">
                    <div className="absolute top-5 right-5 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={(e) => { e.stopPropagation(); setSpaceFormData(space); setSpaceModal({isOpen: true, isEdit: true}); }} className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"><Edit className="w-4 h-4"/></button>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600 transition-colors duration-500 shadow-sm border border-blue-100">
                      <Server className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors duration-500" strokeWidth={2} />
                    </div>
                    <div className="flex justify-between items-start mb-2 pr-8">
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 font-bold">{space.epicKey}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${space.spaceType === 'Type 2' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-teal-50 text-teal-600 border-teal-200'}`}>
                          {space.spaceType === 'Type 2' ? '타입2' : '타입1'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-400">{space.department}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors pr-8 truncate" title={space.name}>{space.name}</h3>
                  </div>
                )) : (
                  <div className="col-span-3 text-center py-16 text-gray-400 font-medium bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">등록된 스페이스가 없습니다.</div>
                )}
              </div>
            </div>
          )}

          {view === 'epics' && (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded border border-blue-200">{activeSpace}</span>
                    <h1 className="text-2xl font-bold text-gray-800">Project Board</h1>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">추적할 프로젝트(에픽)를 선택하거나 새로 등록하세요.</p>
                </div>
                <button onClick={() => { setEpicFormData({ id: '', spaceKey: activeSpace, name: '', epicKey: '', status: '예정', progress: 0 }); setEpicModal({isOpen: true, isEdit: false}); }} className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors shadow-md flex items-center">
                  <Plus className="w-4 h-4 mr-1.5" /> 프로젝트 추가
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 overflow-y-auto no-scrollbar pb-6">
                {filteredEpics.length > 0 ? filteredEpics.map(epic => (
                  <div key={epic.id} onClick={() => { setActiveEpic(epic.epicKey); setView('issues'); }} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md cursor-pointer hover-breath group relative">
                    <div className="absolute top-5 right-5 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={(e) => { e.stopPropagation(); setEpicFormData(epic); setEpicModal({isOpen: true, isEdit: true}); }} className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"><Edit className="w-4 h-4"/></button>
                    </div>
                    <div className="flex justify-between items-start mb-4 pr-10">
                      <span className={`text-[10px] px-2 py-1 rounded-md border font-bold ${epic.status === '완료' ? 'bg-green-50 text-green-600 border-green-100' : epic.status === '진행중' ? 'bg-blue-50 text-blue-600 border-blue-100' : epic.status === 'HOLD' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>{epic.status}</span>
                      <span className="text-xs font-bold text-gray-400">{epic.epicKey}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors truncate" title={epic.name}>{epic.name}</h3>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 mt-4"><div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000" style={{width: `${epic.progress || 0}%`}}></div></div>
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>결함 추적 중</span><span>{epic.progress || 0}% 완료</span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-3 text-center py-16 text-gray-400 font-medium bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">등록된 프로젝트(에픽)가 없습니다.</div>
                )}
              </div>
            </div>
          )}

          {view === 'issues' && (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="flex justify-between items-end mb-6 shrink-0">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <button onClick={() => setView('epics')} className="p-1 hover:bg-gray-200 rounded-md text-gray-500 transition-colors bg-white border border-gray-200 shadow-sm"><ChevronLeft className="w-4 h-4"/></button>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded border border-blue-200">{activeEpic || activeSpace}</span>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {epics.find(e => e.epicKey === activeEpic)?.name || (isType2 ? '솔루션 버그 추적 보드' : '개발결함 추적 보드')}
                    </h1>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-64 bg-white rounded-full h-2 shadow-inner border border-gray-100 overflow-hidden relative">
                      <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${displayProgress}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-500">QA 완료율 {displayProgress}%</span>
                  </div>
                </div>
                {!isType2 && (
                  <div className="flex space-x-2">
                    <div className="bg-white border border-gray-200 rounded-lg p-1.5 flex shadow-sm items-center px-3 space-x-2">
                      <span className="flex items-center text-[10px] font-bold text-gray-600"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>Android ({issues.filter(i=>i.platform==='Android').length})</span>
                      <span className="flex items-center text-[10px] font-bold text-gray-600 ml-2"><div className="w-2 h-2 rounded-full bg-gray-800 mr-1.5"></div>iOS ({issues.filter(i=>i.platform==='iOS').length})</span>
                      <span className="flex items-center text-[10px] font-bold text-gray-600 ml-2"><div className="w-2 h-2 rounded-full bg-orange-500 mr-1.5"></div>Backend ({issues.filter(i=>i.platform==='Backend').length})</span>
                    </div>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-md flex flex-col items-center justify-center animate-fade-in relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white opacity-60"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-8 flex items-center justify-center w-24 h-24">
                      <div className="absolute inset-0 border-4 border-gray-100 rounded-full shadow-inner"></div>
                      <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                      <Server className="w-8 h-8 text-blue-500 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3 tracking-tight">JIRA 실시간 동기화 중</h3>
                    <p className="text-sm text-gray-500 font-medium">해당 프로젝트의 모든 하위 결함 데이터를 불러오고 있습니다...</p>
                    <div className="w-48 h-1.5 bg-gray-100 rounded-full mt-6 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full w-full origin-left animate-[scaleX_1s_ease-in-out_infinite_alternate]"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
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
                            <DetailedStatCard title="상태별 통계" icon={Activity} total={totalIssues} data={statusCounts} colorMap={statusColorMap} defaultColor="bg-blue-400" />
                          </div>
                          <div className="flex-1">
                            {isType2 ? (
                              <DetailedStatCard title="보고자별 통계" icon={User} total={totalIssues} data={reporterCounts} colorMap={{}} defaultColor="bg-indigo-400" />
                            ) : (
                              <DetailedStatCard title="플랫폼별 통계" icon={Server} total={totalIssues} data={platformCounts} colorMap={platformColorMap} defaultColor="bg-purple-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <DetailedStatCard title="우선순위별 통계" icon={AlertCircle} total={totalIssues} data={priorityCounts} colorMap={priorityColorMap} defaultColor="bg-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-white p-3 px-5 rounded-t-2xl shadow-sm border border-gray-200 border-b-0 shrink-0 relative z-20">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                    <CustomSelect value={filterStatus} onChange={setFilterStatus} options={statusOptions} className="bg-transparent text-xs font-medium text-gray-700 outline-none w-32 hover:bg-gray-50 rounded-md transition-colors" />
                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                    {!isType2 && (
                      <>
                        <CustomSelect value={filterPlatform} onChange={setFilterPlatform} options={platformOptions} className="bg-transparent text-xs font-medium text-gray-700 outline-none w-32 hover:bg-gray-50 rounded-md transition-colors" />
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                      </>
                    )}
                    {/* [수정] 보고자(Reporter) 셀렉터가 모든 타입의 스페이스에 항상 노출되도록 추가 */}
                    <CustomSelect value={filterReporter} onChange={setFilterReporter} options={reporterOptions} className="bg-transparent text-xs font-medium text-gray-700 outline-none w-32 hover:bg-gray-50 rounded-md transition-colors" />
                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                    <CustomSelect value={filterPriority} onChange={setFilterPriority} options={priorityOptions} className="bg-transparent text-xs font-medium text-gray-700 outline-none w-32 hover:bg-gray-50 rounded-md transition-colors" />
                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 transition-colors focus-within:border-gray-400 relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                      <input type="text" placeholder="요약/설명 검색..." value={searchInput} onChange={e=>setSearchInput(e.target.value)} className="text-xs bg-transparent outline-none w-48 placeholder:text-gray-400 text-gray-700 pr-6" />
                      {searchInput && (
                        <button onClick={() => { setSearchInput(''); setSearchSummary(''); }} className="absolute right-2 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors flex items-center justify-center">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {(hasFilters) && (
                      <button onClick={() => { setFilterStatus('All'); setFilterPlatform('All'); setFilterReporter('All'); setFilterPriority('All'); setSearchInput(''); setSearchSummary(''); }} className="text-[10px] text-gray-500 hover:text-gray-800 underline ml-2 font-medium">초기화</button>
                    )}
                  </div>

                  <div className="flex-1 bg-white rounded-b-2xl border border-gray-200 shadow-md overflow-hidden flex flex-col relative z-0">
                <div className="overflow-y-auto no-scrollbar flex-1 relative">
                  <table className="w-full text-left border-collapse relative">
                    <thead className="sticky top-0 bg-gray-50/95 backdrop-blur z-10 shadow-sm">
                      <tr>
                        {isType2 ? (
                          <>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Key</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">생성일</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/3">요약 (Summary)</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">우선순위</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">상태</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">보고자</th>
                          </>
                        ) : (
                          <>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Key</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">상태</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">우선순위</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">현상분류</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/3">요약 (Summary)</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">플랫폼</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">담당/보고</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">생성일</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {renderedIssues}
                    </tbody>
                  </table>
                </div>

                {selectedIssue && (
                  <div className="absolute inset-y-0 right-0 w-[420px] bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.08)] border-l border-gray-200 z-50 flex flex-col animate-fast-fade">
                    <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                          <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            이슈 상세 정보
                          </h3>
                          <button onClick={() => setSelectedIssue(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Key & Status</span>
                            <div className="flex items-center space-x-3">
                              <span 
                                className="text-sm font-bold text-blue-600 flex items-center cursor-pointer hover:underline" 
                                onClick={() => handleOpenJiraIssue(selectedIssue.key)}
                              >
                                {selectedIssue.key} <ExternalLink className="w-3 h-3 ml-1" />
                              </span>
                              <JiraBadge className={getStatusBadgeClass(selectedIssue.status)}>{selectedIssue.status}</JiraBadge>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Summary</span>
                            <div className="text-sm font-bold text-gray-800 leading-relaxed">
                              <HighlightText text={selectedIssue.summary} highlight={searchSummary} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-5">
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Priority</span>
                              <div className="text-sm font-medium text-gray-700 flex items-center mt-1">
                                {getPriorityIcon(selectedIssue.priority)} {selectedIssue.priority}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Reporter</span>
                              <div className="text-sm font-medium text-gray-700 flex items-center mt-1"><User className="w-3 h-3 mr-1 text-gray-400"/>{selectedIssue.reporter}</div>
                            </div>
                            {!isType2 && (
                              <>
                                <div>
                                  <span className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Platform</span>
                                  <div className="text-sm font-medium text-gray-700 mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${selectedIssue.platform === 'iOS' ? 'bg-gray-100 text-gray-700 border-gray-200' : selectedIssue.platform === 'Android' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>{selectedIssue.component}</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Phenomenon</span>
                                  <div className="text-sm font-medium text-gray-700 mt-1">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border bg-purple-50 text-purple-600 border-purple-200 font-bold whitespace-nowrap">{selectedIssue.phenomenon || '-'}</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Assignee</span>
                                  <div className="text-sm font-medium text-gray-700 flex items-center mt-1"><User className="w-3 h-3 mr-1 text-gray-400"/>{selectedIssue.assignee}</div>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="border-t border-gray-100 pt-6">
                            <span className="text-[10px] font-bold text-gray-400 mb-3 block uppercase tracking-wider">
                              {isType2 ? '이슈 내용' : 'Description'}
                            </span>
                            <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[150px]">
                              <HighlightText text={isType2 ? selectedIssue.issueContent : selectedIssue.description} highlight={searchSummary} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          {renderTooltip()}
        </main>
      </div>

      <SpaceModal 
        isOpen={spaceModal.isOpen} 
        onClose={() => setSpaceModal({ ...spaceModal, isOpen: false })} 
        formData={spaceFormData} 
        setFormData={setSpaceFormData} 
        onSubmit={handleSpaceSubmit} 
        isEdit={spaceModal.isEdit}
        onDelete={handleSpaceDelete}
      />
      <EpicModal 
        isOpen={epicModal.isOpen} 
        onClose={() => setEpicModal({ ...epicModal, isOpen: false })} 
        formData={epicFormData} 
        setFormData={setEpicFormData} 
        onSubmit={handleEpicSubmit} 
        isEdit={epicModal.isEdit}
        onDelete={handleEpicDelete}
      />
    </div>
  );
};
