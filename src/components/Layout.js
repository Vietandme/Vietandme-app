import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Layout({ profile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = profile?.role === 'admin';
  const [totalPending, setTotalPending] = useState(0);
  const [unreadFeedbacks, setUnreadFeedbacks] = useState(0);
  const [unreadAnswers, setUnreadAnswers] = useState(0);
  const [showBell, setShowBell] = useState(false);
  const bellRef = useRef(null);

  const loadPending = useCallback(async () => {
    if (!profile || isAdmin) return;
    const [f, a] = await Promise.all([
      supabase.from('recordings').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'reviewed').is('read_at', null),
      supabase.from('student_questions').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'answered').is('read_at', null),
    ]);
    setUnreadFeedbacks(f.count || 0);
    setUnreadAnswers(a.count || 0);
    setTotalPending((f.count || 0) + (a.count || 0));
  }, [profile, isAdmin]);

  useEffect(() => { loadPending(); }, [loadPending, location.key]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowBell(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  async function handleViewFeedbacks() {
    await supabase.from('recordings').update({ read_at: new Date().toISOString() }).eq('user_id', profile.id).eq('status', 'reviewed').is('read_at', null);
    setUnreadFeedbacks(0);
    setTotalPending(unreadAnswers);
    setShowBell(false);
    navigate('/recording?tab=submissions');
  }

  async function handleViewAnswers() {
    await supabase.from('student_questions').update({ read_at: new Date().toISOString() }).eq('user_id', profile.id).eq('status', 'answered').is('read_at', null);
    setUnreadAnswers(0);
    setTotalPending(unreadFeedbacks);
    setShowBell(false);
    navigate('/questions?tab=submissions');
  }

  const studentNav = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/flashcards', icon: '🗂️', label: 'Flashcards' },
    { path: '/quiz', icon: '✏️', label: 'Quiz' },
    { path: '/recording', icon: '🎙️', label: 'Record' },
    { path: '/questions', icon: '❓', label: 'Questions' },
  ];

  const adminNav = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/admin/feedback', icon: '🎙️', label: 'Feedback' },
    { path: '/admin/questions', icon: '❓', label: 'Questions' },
    { path: '/admin/prompts', icon: '📋', label: 'Prompts' },
    { path: '/admin/content', icon: '🗂️', label: 'Cards' },
    { path: '/admin/quiz', icon: '✏️', label: 'Quiz' },
    { path: '/admin/upload', icon: '📤', label: 'Upload' },
    { path: '/admin/students', icon: '👥', label: 'Students' },
  ];

  const navItems = isAdmin ? adminNav : studentNav;
  async function handleLogout() { await supabase.auth.signOut(); }

  return (
    <div className="layout">
      <div className="top-bar">
        <span className="top-bar-title">🇻🇳 Viet & Me</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Bell for students */}
          {!isAdmin && (
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowBell(!showBell)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1, position: 'relative' }}
              >
                🔔
                {totalPending > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -6,
                    background: 'var(--gold)', color: 'var(--dark)',
                    borderRadius: '50%', width: 16, height: 16,
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{totalPending}</span>
                )}
              </button>

              {/* Dropdown panel */}
              {showBell && (
                <div style={{
                  position: 'absolute', top: 36, right: 0,
                  background: 'var(--white)', borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  minWidth: 240, zIndex: 200, overflow: 'hidden',
                  border: '1px solid #E8E8F0',
                }}>
                  <div style={{ padding: '10px 14px', background: 'var(--dark)', color: 'var(--gold)', fontWeight: 700, fontSize: 13 }}>
                    🔔 Notifications
                  </div>
                  {totalPending === 0 ? (
                    <div style={{ padding: '16px 14px', fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                      All caught up! 🎉
                    </div>
                  ) : (
                    <div>
                      {unreadFeedbacks > 0 && (
                        <button onClick={handleViewFeedbacks} style={{
                          width: '100%', padding: '12px 14px', background: 'none', border: 'none',
                          borderBottom: '1px solid #E8E8F0', cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: 10,
                          fontFamily: 'DM Sans, sans-serif',
                        }}>
                          <span style={{ fontSize: 20 }}>🎙️</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                              {unreadFeedbacks} new feedback{unreadFeedbacks !== 1 ? 's' : ''}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Tap to view your recordings</div>
                          </div>
                        </button>
                      )}
                      {unreadAnswers > 0 && (
                        <button onClick={handleViewAnswers} style={{
                          width: '100%', padding: '12px 14px', background: 'none', border: 'none',
                          cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: 10,
                          fontFamily: 'DM Sans, sans-serif',
                        }}>
                          <span style={{ fontSize: 20 }}>💬</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                              {unreadAnswers} new answer{unreadAnswers !== 1 ? 's' : ''}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Tap to view your questions</div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <span className="top-bar-user">{profile?.full_name || profile?.email}</span>
          <button className="btn btn-sm btn-secondary" onClick={handleLogout} style={{ padding: '4px 12px', fontSize: 12 }}>Out</button>
        </div>
      </div>
      <div className="main-content"><Outlet /></div>
      <nav className="bottom-nav">
        {navItems.map(item => (
          <button key={item.path} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`} onClick={() => navigate(item.path)}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
