import React, { useState, useEffect } from 'react';
import { Download, X, User, Upload, ShieldCheck } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from '../firebaseConfig';
import { AppLogo } from './SharedUI';

export const LoginScreen = ({ onLogin, onInstallApp }) => {
  const [tab, setTab] = useState('login');
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem('qaBaseId');
    const savedPw = localStorage.getItem('qaBasePw');
    if (savedId && savedPw) {
      setId(savedId);
      setPw(savedPw);
      setRemember(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!id.trim() || !pw.trim()) return;

    if (remember) {
      localStorage.setItem('qaBaseId', id);
      localStorage.setItem('qaBasePw', pw);
    } else {
      localStorage.removeItem('qaBaseId');
      localStorage.removeItem('qaBasePw');
    }

    let userRole = 'user';
    let userName = name || id;

    if (id.trim() === 'wow1324332' && pw === 'djslzja1!') {
      userRole = 'admin';
      userName = 'ADMIN';
    }

    try {
      const userRef = doc(db, 'users', id.trim());
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.name) userName = userData.name;
        if (userData.role) userRole = userData.role;
        if (id.trim() === 'wow1324332' && pw === 'djslzja1!') userRole = 'admin';
        onLogin({ id: id.trim(), name: userName, role: userRole, profileImage: userData.profileImage || null });
        return;
      } else if (tab === 'create') {
         userRole = 'viewer';
         await setDoc(userRef, { name: userName, role: userRole, status: 'pending' });
      }
    } catch (error) {
      console.error("Error fetching user", error);
    }
    onLogin({ id: id.trim(), name: userName, role: userRole, profileImage: null });
  };

  const handleGuest = () => {
    onLogin({ id: 'guest', name: 'Guest', role: 'viewer', profileImage: null });
  };

  // 1. 최상위 배경: 우측에 착 붙도록 여백(pr)을 적당히 조절했습니다.
  return (
    <div className="w-screen h-screen bg-[url('/login-bg.jpg')] bg-cover bg-center flex items-center justify-end pr-8 md:pr-16 lg:pr-24 relative animate-simple-fade">
      
      {/* 2. 앱 설치 버튼: 사이버네틱하고 고급스러운 블루 네온 톤 */}
      <button 
        onClick={onInstallApp}
        className="absolute top-8 right-8 flex items-center space-x-2 text-blue-100 hover:text-white transition-all duration-300 bg-blue-900/30 hover:bg-blue-800/50 px-5 py-2.5 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(0,100,255,0.2)] border border-blue-400/30 hover:border-blue-400/60"
      >
        <Download className="w-4 h-4" />
        <span className="text-xs font-bold tracking-wide">앱 설치</span>
      </button>

        {/* 3. 로그인 모달 래퍼 (숨쉬기 광원 효과 + 투명한 글래스모피즘) */}
        <div className="relative w-full max-w-[320px] animate-fade-in z-10 mt-16">
        
        {/* ✨ 마법의 숨쉬기 광원 */}
        <div className="absolute -inset-2 bg-blue-500/30 rounded-[24px] blur-xl animate-pulse pointer-events-none"></div>
        
        {/* 🪟 실제 로그인 모달 박스 */}
        <div className="relative w-full bg-white/25 backdrop-blur-lg rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/40 p-6">

        <div className="flex w-full mb-8 relative border-b border-gray-200">
          <button 
            type="button"
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${tab === 'login' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setTab('login')}
          >
            Login
          </button>
          <button 
            type="button"
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${tab === 'create' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setTab('create')}
          >
            Create
          </button>
          <div className={`absolute bottom-0 h-[2px] bg-gray-800 w-1/2 transition-transform duration-300 ease-out ${tab === 'login' ? 'translate-x-0' : 'translate-x-full'}`}></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="ID" 
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-gray-400 focus:bg-white transition-all placeholder:text-gray-400 shadow-sm"
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password" 
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-gray-400 focus:bg-white transition-all placeholder:text-gray-400 shadow-sm"
            />
          </div>
          
          {tab === 'create' && (
            <div className="animate-fade-in">
              <input 
                type="text" 
                placeholder="Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-gray-400 focus:bg-white transition-all placeholder:text-gray-400 shadow-sm"
              />
            </div>
          )}

          {tab === 'login' && (
            <div className="flex items-center space-x-2 pt-1">
              <input 
                type="checkbox" 
                id="remember" 
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="w-4 h-4 rounded border-gray-300 text-gray-800 focus:ring-gray-800 accent-gray-800 cursor-pointer shadow-sm"
              />
              <label htmlFor="remember" className="text-xs text-gray-500 cursor-pointer select-none">로그인 기억하기</label>
            </div>
          )}

          <div className="pt-4 space-y-3">
            <button 
              type="submit" 
              className="w-full bg-gray-800 text-white text-sm font-medium py-3 rounded-xl hover:bg-gray-900 transition-colors shadow-lg shadow-gray-300"
            >
              {tab === 'login' ? '로그인' : '계정 생성'}
            </button>
            <button 
              type="button" 
              onClick={handleGuest}
              className="w-full bg-white text-gray-600 border border-gray-200 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            >
              게스트로 시작 (Viewer)
            </button>
          </div>
        </form>
      </div>
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s'}}></div>
    </div>
  );
};

export const ProfileModal = ({ user, onClose, onUpdateProfile }) => {
  const [imagePreview, setImagePreview] = useState(user.profileImage);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    onUpdateProfile(imagePreview);
    try {
       const userRef = doc(db, 'users', user.id);
       await updateDoc(userRef, { profileImage: imagePreview }, { merge: true });
    } catch(err) {
       await setDoc(doc(db, 'users', user.id), { profileImage: imagePreview, name: user.name, role: user.role });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[340px] border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center"><User className="w-5 h-5 mr-2 text-gray-600"/> 프로필 수정</h3>
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden border border-gray-200 shadow-inner">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-gray-400 font-medium">{user.name.charAt(0)}</span>
            )}
          </div>
          <label className="cursor-pointer bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm flex items-center">
            <Upload className="w-4 h-4 mr-2" /> 이미지 선택
            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
          </label>
        </div>
        <button onClick={handleSave} className="w-full bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors shadow-md">저장하기</button>
      </div>
    </div>
  );
};

export const AdminModal = ({ onClose }) => {
  const [pendingUsers, setPendingUsers] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingUsers(users);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: 'user', status: 'approved' });
    } catch(err) {
      console.error("Error approving user", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fast-fade">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[340px] border border-gray-100 relative flex flex-col max-h-[80vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center shrink-0"><ShieldCheck className="w-5 h-5 mr-2 text-gray-600"/> 가입 신청 승인</h3>
        <div className="flex-1 overflow-y-auto no-scrollbar mb-6">
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-gray-500">현재 대기 중인 가입 신청이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm">
                  <div>
                    <div className="text-sm font-medium text-gray-800 truncate max-w-[120px]" title={u.name}>{u.name}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[120px]" title={u.id}>{u.id}</div>
                  </div>
                  <button onClick={() => handleApprove(u.id)} className="bg-gray-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-900 transition-colors shadow-sm">승인</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-full bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm shrink-0">닫기</button>
      </div>
    </div>
  );
};
