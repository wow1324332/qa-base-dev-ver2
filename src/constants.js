export const PROJECT_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 
  'bg-violet-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500'
];

export const HOLIDAYS = [
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', 
  '2026-03-01', '2026-05-05', '2026-05-24', '2026-06-06', 
  '2026-08-15', '2026-09-24', '2026-09-25', '2026-09-26', 
  '2026-10-03', '2026-10-09', '2026-12-25'
];

export const INITIAL_DEVICES = [
  { name: 'Galaxy Z Fold 5', type: 'Fold', os: 'Android', status: '보관중', renter: '', manufacturer: 'Samsung', serial: 'SM-F946N', customFields: [] },
  { name: 'iPhone 15 Pro', type: 'Bar', os: 'iOS', status: '사용중', renter: '홍길동', manufacturer: 'Apple', serial: 'A3102', customFields: [] },
  { name: 'Galaxy S24 Ultra', type: 'Bar', os: 'Android', status: '대여중', renter: '김철수', manufacturer: 'Samsung', serial: 'SM-S928N', customFields: [] },
  { name: 'Galaxy Z Flip 4', type: 'Flip', os: 'Android', status: '보관중', renter: '', manufacturer: 'Samsung', serial: 'SM-F721N', customFields: [] },
  { name: 'iPhone 13 Mini', type: 'Bar', os: 'iOS', status: '보관중', renter: '', manufacturer: 'Apple', serial: 'A2628', customFields: [] },
];

export const INITIAL_SCHEDULES = [
  { name: 'v1.0 기능 QA', startDate: '2026-05-01', endDate: '2026-05-15', assignee: '홍길동', department: 'QA 1팀', description: '주요 릴리즈 QA 및 결함 확인', status: '완료', color: 'bg-emerald-500' },
  { name: '결제 모듈 테스트', startDate: '2026-05-20', endDate: '2026-05-28', assignee: '김철수', department: 'QA 2팀', description: 'PG사 연동 및 예외 처리 테스트', status: '진행중', color: 'bg-orange-500' },
  { name: 'UI/UX 개편 검증', startDate: '2026-05-25', endDate: '2026-06-05', assignee: '이영희', department: 'QA 1팀', description: '디자인 개편에 따른 크로스 브라우징', status: '예정', color: 'bg-blue-500' },
];

export const globalStyles = `
  @import url('[https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&display=swap](https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&display=swap)');

  body {
    font-family: 'Pretendard', sans-serif;
    background-color: #f8f9fa;
    color: #1f2937;
    overflow: hidden;
  }

  @keyframes cinematicFadeIn {
    0% { opacity: 0; transform: translateY(15px); }
    100% { opacity: 1; transform: none; }
  }
  .animate-fade-in { animation: cinematicFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

  @keyframes fastFadeIn {
    0% { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: none; }
  }
  .animate-fast-fade { animation: fastFadeIn 0.2s ease-out forwards; }

  @keyframes simpleFade {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  .animate-simple-fade { animation: simpleFade 0.5s ease-in-out forwards; }

  @keyframes breathing {
    0% { box-shadow: 0 0 0px rgba(156, 163, 175, 0); border-color: transparent; }
    50% { box-shadow: 0 0 15px rgba(156, 163, 175, 0.4); border-color: rgba(209, 213, 219, 0.8); }
    100% { box-shadow: 0 0 0px rgba(156, 163, 175, 0); border-color: transparent; }
  }
  .hover-breath { transition: all 0.3s ease; }
  .hover-breath:hover { animation: breathing 2.5s infinite ease-in-out; transform: translateY(-2px); }

  @keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .bg-cinematic {
    background: linear-gradient(-45deg, #f8f9fa, #e9ecef, #dee2e6, #f8f9fa);
    background-size: 400% 400%;
    animation: gradientBG 10s ease infinite;
  }

  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;
