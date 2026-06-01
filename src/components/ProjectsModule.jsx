import React, { useState, useEffect } from 'react';
import { 
  Bug, Activity, CheckCircle2, AlertCircle, 
  ChevronUp, Equal, ChevronDown as ChevronDownIcon,
  ChevronLeft, ChevronRight, LayoutDashboard, Server, Kanban, LogOut, Power, User, Plus, MonitorSmartphone, X, Edit
} from 'lucide-react';

const AppLogo = ({ className }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) return <MonitorSmartphone className={`text-gray-800 ${className}`} strokeWidth={1.5} />;
  return <img src="/icon-192x192.png" alt="QA Base" className={`object-contain ${className}`} onError={() => setImgError(true)} />;
};

const JiraStatsCard = ({ title, count, colorClass, icon: Icon }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-md flex items-center justify-between hover-breath">
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{count}</p>
    </div>
    <div className={`p-3 rounded-2xl ${colorClass.replace('text-', 'bg-').replace('600', '50')} border ${colorClass.replace('text-', 'border-').replace('600', '100')}`}>
      <Icon className={`w-6 h-6 ${colorClass}`} strokeWidth={2} />
    </div>
  </div>
);

const JiraBadge = ({ children, className }) => (
  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shadow-sm border whitespace-nowrap ${className}`}>
    {children}
  </span>
);

const SpaceModal = ({ isOpen, onClose, formData, setFormData, onSubmit, isEdit, onDelete }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center shrink-0"><Server className="w-5 h-5 mr-2 text-gray-600"/> 스페이스 {isEdit ? '수정' : '생성'}</h3>
        <form id="spaceForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
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
            <select required value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-gray-400 shadow-sm transition-colors appearance-none">
              <option value="예정">예정</option>
              <option value="진행중">진행중</option>
              <option value="HOLD">HOLD</option>
              <option value="완료">완료</option>
            </select>
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
  const [view, setView] = useState('spaces'); // 'spaces', 'epics', 'issues'
  
  const [activeSpace, setActiveSpace] = useState(null);
  const [activeEpic, setActiveEpic] = useState(null);
  
  // API Fetch를 위한 State 업데이트 (가짜 데이터 제거)
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  // JIRA 데이터 패칭 useEffect 추가
  useEffect(() => {
    if (view === 'issues' && activeEpic) {
      const fetchJiraIssues = async () => {
        setLoading(true);
        try {
          // Vercel Serverless Function 호출
          const res = await fetch(`/api/jira?epicKey=${activeEpic}`);
          const data = await res.json();
          
          if (res.ok) {
            setIssues(data);
          } else {
            console.error("JIRA API 에러:", data.error);
          }
        } catch (error) {
          console.error("JIRA 서버 통신 에러:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchJiraIssues();
    }
  }, [view, activeEpic]);

  // Spaces State
  const [spaces, setSpaces] = useState([
    { id: '1', name: 'v1.5 메인화면 개편 QA', epicKey: 'EPIC-1204', department: 'QA 1팀' }
  ]);
  const [spaceModal, setSpaceModal] = useState({ isOpen: false, isEdit: false });
  const [spaceFormData, setSpaceFormData] = useState({ id: '', name: '', epicKey: '', department: '' });

  // Epics State
  const [epics, setEpics] = useState([
    { id: '1', spaceKey: 'EPIC-1204', name: 'v1.5 메인화면 개편 QA', epicKey: 'EPIC-1204', status: '진행중', progress: 45 }
  ]);
  const [epicModal, setEpicModal] = useState({ isOpen: false, isEdit: false });
  const [epicFormData, setEpicFormData] = useState({ id: '', spaceKey: '', name: '', epicKey: '', status: '예정', progress: 0 });

  // Space Handlers
  const handleSpaceSubmit = (data) => {
    if (spaceModal.isEdit) {
      setSpaces(spaces.map(s => s.id === data.id ? data : s));
    } else {
      setSpaces([...spaces, { ...data, id: Date.now().toString() }]);
    }
    setSpaceModal({ isOpen: false, isEdit: false });
  };
  const handleSpaceDelete = (id) => {
    setSpaces(spaces.filter(s => s.id !== id));
    setSpaceModal({ isOpen: false, isEdit: false });
  };

  // Epic Handlers
  const handleEpicSubmit = (data) => {
    if (epicModal.isEdit) {
      setEpics(epics.map(e => e.id === data.id ? data : e));
    } else {
      setEpics([...epics, { ...data, id: Date.now().toString(), spaceKey: activeSpace, progress: 0 }]);
    }
    setEpicModal({ isOpen: false, isEdit: false });
  };
  const handleEpicDelete = (id) => {
    setEpics(epics.filter(e => e.id !== id));
    setEpicModal({ isOpen: false, isEdit: false });
  };

  const filteredEpics = epics.filter(e => e.spaceKey === activeSpace);

  // 통계 계산
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(i => i.status.includes('완료') || i.status.includes('Closed')).length;
  const openIssues = issues.filter(i => i.status.includes('진행중') || i.status.includes('예정') || i.status.includes('수정중')).length;
  const criticalIssues = issues.filter(i => i.priority === 'Critical' || i.priority === 'High').length;
  
  const progressPercent = totalIssues === 0 ? 0 : Math.round((resolvedIssues / totalIssues) * 100);

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
    return 'bg-gray-100 text-gray-600 border-gray-200'; // 예정, 대기 등
  };

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
        <aside className={`bg-white border-r border-gray-100 transition-all duration-300 ease-in-out flex flex-col z-10 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}`}>
          <div className="p-4 space-y-1 w-64">
            <div className="text-xs font-semibold text-gray-400 tracking-wider mb-4 px-3 mt-2">MENU</div>
            <button onClick={() => onNavigate('board')} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"><LayoutDashboard className="w-4 h-4" /><span className="text-sm font-medium">기능 보드 이동</span></button>
            <div className="h-px bg-gray-100 my-2 mx-3"></div>
            <button onClick={() => { setActiveMenu('space'); setView('spaces'); setActiveSpace(null); setActiveEpic(null); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${activeMenu === 'space' ? 'bg-blue-50/50 text-blue-700 font-medium border border-blue-100 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><Server className={`w-4 h-4 ${activeMenu === 'space' ? 'text-blue-600' : ''}`} /><span className="text-sm">스페이스 보드</span></button>
            {activeSpace && (
              <button onClick={() => { setActiveMenu('epic'); setView('epics'); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ml-2 w-[calc(100%-8px)] ${activeMenu === 'epic' ? 'bg-gray-50 text-gray-900 font-medium border border-gray-200 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><Kanban className="w-4 h-4" /><span className="text-sm">프로젝트(에픽) 메인보드</span></button>
            )}
          </div>
        </aside>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`absolute top-6 z-20 bg-white border border-gray-200 shadow-md rounded-full p-1.5 text-gray-600 hover:text-gray-900 transition-all duration-300 ${sidebarOpen ? 'left-[244px]' : 'left-4'}`}>
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <main className={`flex-1 overflow-hidden flex flex-col p-8 transition-all duration-300 bg-[#f0f2f5] ${!sidebarOpen ? 'ml-12' : ''}`}>
          
          {view === 'spaces' && (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-800">JIRA 스페이스 보드</h1>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">결함을 추적할 스페이스를 선택하거나 새로 생성하세요.</p>
                </div>
                <button onClick={() => { setSpaceFormData({ id: '', name: '', epicKey: '', department: '' }); setSpaceModal({isOpen: true, isEdit: false}); }} className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors shadow-md flex items-center">
                  <Plus className="w-4 h-4 mr-1.5" /> 스페이스 생성
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto no-scrollbar pb-6">
                {spaces.map(space => (
                  <div key={space.id} onClick={() => { setActiveSpace(space.epicKey); setView('epics'); setActiveMenu('epic'); }} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md cursor-pointer hover-breath group relative">
                    <div className="absolute top-5 right-5 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={(e) => { e.stopPropagation(); setSpaceFormData(space); setSpaceModal({isOpen: true, isEdit: true}); }} className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"><Edit className="w-4 h-4"/></button>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600 transition-colors duration-500 shadow-sm border border-blue-100">
                      <Server className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors duration-500" strokeWidth={2} />
                    </div>
                    <div className="flex justify-between items-start mb-2 pr-8">
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 font-bold">{space.epicKey}</span>
                      <span className="text-xs font-bold text-gray-400">{space.department}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors pr-8 truncate" title={space.name}>{space.name}</h3>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'epics' && (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded border border-blue-200">{activeSpace}</span>
                    <h1 className="text-2xl font-bold text-gray-800">프로젝트(에픽) 보드</h1>
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
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 mt-4"><div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{width: `${epic.progress || 0}%`}}></div></div>
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>결함 추적 중</span><span>{epic.progress || 0}% 완료</span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-3 text-center py-16 text-gray-400 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">등록된 프로젝트(에픽)가 없습니다.</div>
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
                    <h1 className="text-2xl font-bold text-gray-800">개발결함 추적 보드</h1>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-64 bg-white rounded-full h-2 shadow-inner border border-gray-100 overflow-hidden relative">
                      <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-500">QA 완료율 {progressPercent}%</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="bg-white border border-gray-200 rounded-lg p-1.5 flex shadow-sm items-center px-3 space-x-2">
                    <span className="flex items-center text-[10px] font-bold text-gray-600"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>Android ({issues.filter(i=>i.platform==='Android').length})</span>
                    <span className="flex items-center text-[10px] font-bold text-gray-600 ml-2"><div className="w-2 h-2 rounded-full bg-gray-800 mr-1.5"></div>iOS ({issues.filter(i=>i.platform==='iOS').length})</span>
                    <span className="flex items-center text-[10px] font-bold text-gray-600 ml-2"><div className="w-2 h-2 rounded-full bg-orange-500 mr-1.5"></div>Backend ({issues.filter(i=>i.platform==='Backend').length})</span>
                  </div>
                </div>
              </div>

              {/* 통계 대시보드 카드 */}
              <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
                <JiraStatsCard title="전체 결함" count={totalIssues} colorClass="text-gray-800" icon={Bug} />
                <JiraStatsCard title="진행/대기 중" count={openIssues} colorClass="text-blue-600" icon={Activity} />
                <JiraStatsCard title="QA 완료" count={resolvedIssues} colorClass="text-green-600" icon={CheckCircle2} />
                <JiraStatsCard title="치명적 결함" count={criticalIssues} colorClass="text-red-600" icon={AlertCircle} />
              </div>

              {/* 아름다운 리스트 뷰 */}
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden flex flex-col">
                <div className="overflow-y-auto no-scrollbar flex-1 relative">
                  <table className="w-full text-left border-collapse relative">
                    <thead className="sticky top-0 bg-gray-50/95 backdrop-blur z-10 shadow-sm">
                      <tr>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Key</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">우선순위</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/3">요약 (Summary)</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">플랫폼/분류</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">담당/보고</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">생성일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="px-5 py-10 text-center text-sm text-gray-500 font-medium animate-pulse">
                            JIRA 데이터를 실시간으로 불러오는 중입니다...
                          </td>
                        </tr>
                      ) : issues.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-5 py-10 text-center text-sm text-gray-500 font-medium">
                            등록된 개발결함 내역이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        issues.map(issue => (
                          <tr key={issue.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
                            <td className="px-5 py-4 text-xs font-bold text-blue-600 underline-offset-2 group-hover:underline">{issue.key}</td>
                            <td className="px-5 py-4"><JiraBadge className={getStatusBadgeClass(issue.status)}>{issue.status}</JiraBadge></td>
                            <td className="px-5 py-4 text-xs font-medium text-gray-700 flex items-center mt-1">
                              {getPriorityIcon(issue.priority)} {issue.priority}
                            </td>
                            <td className="px-5 py-4 text-sm font-bold text-gray-800">
                              <div className="truncate max-w-sm" title={issue.summary}>{issue.summary}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex space-x-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${issue.platform === 'iOS' ? 'bg-gray-100 text-gray-700 border-gray-200' : issue.platform === 'Android' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>{issue.component}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded border bg-gray-50 text-gray-500 border-gray-200 font-medium">{issue.type}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col space-y-1">
                                <span className="text-xs font-medium text-gray-700 flex items-center"><User className="w-3 h-3 mr-1 text-gray-400"/> {issue.assignee}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs text-gray-400 font-medium whitespace-nowrap">{issue.date}</td>
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
