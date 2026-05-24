import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function StudentDashboard({ profile }) {
  const [stats, setStats] = useState({ quizzes: 0, recordings: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  const loadStats = useCallback(async () => {
    const [q, r] = await Promise.all([
      supabase.from('quiz_results').select('id', { count: 'exact' }).eq('user_id', profile.id),
      supabase.from('recordings').select('id', { count: 'exact' }).eq('user_id', profile.id),
    ]);
    setStats({ quizzes: q.count || 0, recordings: r.count || 0 });
  }, [profile]);

  const loadUnread = useCallback(async () => {
    const { count } = await supabase
      .from('recordings')
      .select('id', { count: 'exact' })
      .eq('user_id', profile.id)
      .eq('status', 'reviewed')
      .is('read_at', null);
    setUnreadCount(count || 0);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    loadStats();
    loadUnread();
  }, [profile, loadStats, loadUnread]);

  const levelClass = {
    beginner: 'level-beginner',
    intermediate: 'level-intermediate',
    advanced: 'level-advanced',
  }[profile?.level] || 'level-beginner';

  return (
    <div>
      <div className="dashboard-welcome">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1>Chào {profile?.full_name?.split(' ')[0] || 'bạn'} 👋</h1>
          {unreadCount > 0 && (
            <Link to="/recording" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--gold)', borderRadius: 20, padding: '6px 12px',
                fontWeight: 700, fontSize: 13, color: 'var(--dark)',
              }}>
                🔔 {unreadCount} new feedback{unreadCount !== 1 ? 's' : ''}
              </div>
            </Link>
          )}
        </div>
        <p style={{ marginTop: 8 }}>
          <span className={`level-badge ${levelClass}`}>{profile?.level || 'beginner'}</span>
        </p>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 8px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', color: 'var(--red)', fontWeight: 700 }}>{stats.quizzes}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Quizzes done</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', color: 'var(--red)', fontWeight: 700 }}>{stats.recordings}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Recordings sent</div>
        </div>
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 12, marginTop: 8 }}>What do you want to practice?</h2>
      <div className="menu-grid">
        <Link to="/flashcards" className="menu-card">
          <span className="icon">📇</span>
          <span className="label">Flashcards</span>
          <span className="sub">Vocab & phrases</span>
        </Link>
        <Link to="/quiz" className="menu-card">
          <span className="icon">✏️</span>
          <span className="label">Quiz</span>
          <span className="sub">Test yourself</span>
        </Link>
        <Link to="/recording" className="menu-card">
          <span className="icon">🎙️</span>
          <span className="label">Record</span>
          <span className="sub">Get feedback</span>
        </Link>
        <Link to="/questions" className="menu-card">
          <span className="icon">❓</span>
          <span className="label">Questions</span>
          <span className="sub">Ask Vi anything</span>
        </Link>
      </div>
    </div>
  );
}
