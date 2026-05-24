import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Layout({ profile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = profile?.role === 'admin';

  const studentNav = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/flashcards', icon: '📇', label: 'Flashcards' },
    { path: '/quiz', icon: '✏️', label: 'Quiz' },
    { path: '/recording', icon: '🎙️', label: 'Record' },
    { path: '/questions', icon: '❓', label: 'Questions' },
  ];

  const adminNav = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/admin/feedback', icon: '🎙️', label: 'Feedback' },
    { path: '/admin/questions', icon: '❓', label: 'Questions' },
    { path: '/admin/prompts', icon: '📋', label: 'Prompts' },
    { path: '/admin/content', icon: '📇', label: 'Cards' },
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
