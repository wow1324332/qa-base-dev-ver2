import React, { useState } from 'react';
import { 
  Bug, Activity, CheckCircle2, AlertCircle, 
  ChevronUp, Equal, ChevronDown as ChevronDownIcon,
  ChevronLeft, ChevronRight, LayoutDashboard, Server, Kanban, LogOut, Power, User, Plus, MonitorSmartphone
} from 'lucide-react';

const AppLogo = ({ className }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) return <MonitorSmartphone className={`text-gray-800 ${className}`} strokeWidth={1.5} />;
  return <img src="/icon-192x192.png" alt="QA Base" className={`object-contain ${className}`} onError={() => setImgError(true)} />;
};

const INITIAL_JIRA_ISSUES = [
  { id: '1', key: 'DEVSCRUM-13600', summary: '원패스 모의기간 이용 상태에서 사용자 목록 진입 시 이용가능 기간 정렬 오류', component: 'iOS', priority: 'Medium', type: 'UI/UX', status: '작업 예정', reporter: '김정근', assignee: '홍길동', date: '2026-05-29 16:28', platform: 'iOS' },
  { id: '2', key: 'DEVSCRUM-13595', summary: '원패스 앱 사용 권한 안내 팝업에 "기능" 문구가 보여짐', component: 'Android', priority: 'Low', type: 'UI/UX', status: 'QA 완료', reporter: '김정근', assignee: '김철수', date: '2026-05-29 16:07', platform: 'Android' },
  { id: '3', key: 'DEVSCRUM-13593', summary: '원패스 모의기간이 이용 상태에서 해지 시 원패스 해지 안내 팝업이 발생함', component: 'Backend', priority: 'High', type: 'Function', status: 'REOPEN', reporter: '이영희', assignee: '박개발', date: '2026-05-29 15:50', platform: 'Backend' },
  { id: '4', key: 'DEVSCRUM-13588', summary: '원패스 관리비 결제완료 화면에서 이용 시작일에 년도 표시가 [YYYY]로 노출됨', component: 'iOS', priority: 'Critical', type: 'Function', status: '수정중', reporter: '김정근', assignee: '홍길동', date: '2026-05-29 14:59', platform: 'iOS' },
  { id: '5', key: 'DEVSCRUM-13586', summary: '원패스 관리비 결제 진행 시 "신청중입니다" 텍스트가 발생됨', component: 'Android', priority: 'Medium', type: 'UI/UX', status: 'QA 대기', reporter: '최테스트', assignee: '김철수', date: '2026-05-29 14:47', platform: 'Android' },
  { id: '6', key: 'DEVSCRUM-13580', summary: '로그인 화면에서 비밀번호 찾기 진입 시 500 에러 발생', component: 'Backend', priority: 'Critical', type: 'Crash', status: '작업 예정', reporter: '김정근', assignee: '박개발', date: '2026-05-29 11:20', platform: 'Backend' },
  { id: '7', key: 'DEVSCRUM-13575', summary: '푸시 알림 터치 시 해당 화면으로 이동하지 않고 메인으로 이동됨', component: 'Android', priority: 'High', type: 'Function', status: '진행중', reporter: '이영희', assignee: '김철수', date: '2026-05-28 17:15', platform: 'Android' },
];

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

export const ProjectsDashboard = ({ user, onNavigate, onLogout, onQuit }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('space'); 
  const [view, setView] = useState('spaces'); // 'spaces', 'epics', 'issues'
  
  const [spaceKey, setSpaceKey] = useState('');
  const [activeSpace, setActiveSpace] = useState(null);
  const [activeEpic, setActiveEpic] = useState(null);
  
  // Mock Data
  const [issues, setIssues] = useState(INITIAL_JIRA_ISSUES);

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
            <button onClick={() => { setActiveMenu('space'); setView('spaces'); setActiveEpic(null); }} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${activeMenu === 'space' ? 'bg-blue-50/50 text-blue-700 font-medium border border-blue-100 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><Server className={`w-4 h-4 ${activeMenu === 'space' ? 'text-blue-600' : ''}`} /><span className="text-sm">스페이스 보드</span></button>
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
            <div className="animate-fade-in h-full flex flex-col items-center justify-center -mt-10">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-200">
                <Bug className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">JIRA 스페이스 연결</h2>
              <p className="text-sm text-gray-500 mb-8 text-center">결함을 추적할 JIRA 스페이스 Key를 입력하세요.<br/>(예: DEVSCRUM, QA, PROJ)</p>
              
              <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-200 flex w-full max-w-sm">
                <input 
                  type="text" placeholder="Space Key 입력..." value={spaceKey} onChange={e=>setSpaceKey(e.target.value.toUpperCase())}
                  className="flex-1 bg-transparent px-4 py-2 outline-none text-gray-800 font-bold tracking-wider placeholder:font-normal"
                />
                <button 
                  onClick={() => { if(spaceKey) { setActiveSpace(spaceKey); setView('epics'); setActiveMenu('epic'); } }}
                  className="bg-gray-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-900 transition-colors shadow-md"
                >
                  연결
                </button>
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
                  <p className="text-sm text-gray-500 font-medium">추적할 에픽(프로젝트)을 선택하거나 새로 등록하세요.</p>
                </div>
                <button className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors shadow-md flex items-center">
                  <Plus className="w-4 h-4 mr-1.5" /> 에픽 연동
                </button>
              </div>

              {/* 임시 에픽 카드 */}
              <div className="grid grid-cols-3 gap-6">
                <div onClick={() => setView('issues')} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md cursor-pointer hover-breath group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100 font-bold">진행중</span>
                    <span className="text-xs font-bold text-gray-400">EPIC-1204</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">v1.5 메인화면 개편 QA</h3>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 mt-4"><div className="bg-blue-500 h-1.5 rounded-full w-[45%]"></div></div>
                  <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>결함 추적 중</span><span>45% 완료</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'issues' && (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="flex justify-between items-end mb-6 shrink-0">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <button onClick={() => setView('epics')} className="p-1 hover:bg-gray-200 rounded-md text-gray-500 transition-colors bg-white border border-gray-200 shadow-sm"><ChevronLeft className="w-4 h-4"/></button>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded border border-blue-200">EPIC-1204</span>
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
                      {issues.map(issue => (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
