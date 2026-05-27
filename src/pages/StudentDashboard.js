import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function StudentDashboard({ profile }) {
  const [stats, setStats] = useState({ quizzes: 0, recordings: 0 });
  const [unreadFeedbacks, setUnreadFeedbacks] = useState(0);
  const [unreadAnswers, setUnreadAnswers] = useState(0);
  const navigate = useNavigate();

  const loadStats = useCallback(async () => {
    const [q, r] = await Promise.all([
      supabase.from('quiz_results').select('id', { count: 'exact' }).eq('user_id', profile.id),
      supabase.from('recordings').select('id', { count: 'exact' }).eq('user_id', profile.id),
    ]);
    setStats({ quizzes: q.count || 0, recordings: r.count || 0 });
  }, [profile]);

  const loadUnread = useCallback(async () => {
    const [f, a] = await Promise.all([
      supabase.from('recordings').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'reviewed').is('read_at', null),
      supabase.from('student_questions').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'answered').is('read_at', null),
    ]);
    setUnreadFeedbacks(f.count || 0);
    setUnreadAnswers(a.count || 0);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    loadStats();
    loadUnread();
  }, [profile, loadStats, loadUnread]);

  // Re-check unread counts every time the page becomes visible
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        loadUnread();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadUnread]);

  // Also re-check when window gets focus (e.g. switching back to tab)
  useEffect(() => {
    window.addEventListener('focus', loadUnread);
    return () => window.removeEventListener('focus', loadUnread);
  }, [loadUnread]);

  const totalPending = unreadFeedbacks + unreadAnswers;

  const levelClass = {
    beginner: 'level-beginner',
    intermediate: 'level-intermediate',
    advanced: 'level-advanced',
  }[profile?.level] || 'level-beginner';

  function handlePendingClick() {
    if (unreadFeedbacks > 0) navigate('/recording?tab=submissions');
    else if (unreadAnswers > 0) navigate('/questions?tab=submissions');
  }

  return (
    <div>
      <div className="dashboard-welcome">
        <h1>Chào {profile?.full_name?.split(' ')[0] || 'bạn'} 👋</h1>
        <p style={{ marginTop: 8 }}>
          <span className={`level-badge ${levelClass}`}>{profile?.level || 'beginner'}</span>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div className="card admin-stat" style={{ margin: 0 }}>
          <div className="num">{stats.quizzes}</div>
          <div className="label">Quizzes</div>
        </div>
        <div
          className="card admin-stat"
          style={{ margin: 0, cursor: totalPending > 0 ? 'pointer' : 'default' }}
          onClick={totalPending > 0 ? handlePendingClick : undefined}
        >
          <div className="num" style={{ color: totalPending > 0 ? 'var(--gold)' : 'var(--red)' }}>{totalPending}</div>
          <div className="label">Pending</div>
        </div>
        <div className="card admin-stat" style={{ margin: 0 }}>
          <div className="num">{stats.recordings}</div>
          <div className="label">Recordings</div>
        </div>
      </div>

      {totalPending > 0 && (
        <div className="card" style={{ background: 'var(--dark)', color: 'var(--white)', marginBottom: 16 }}>
          <div style={{ fontSize: 24, textAlign: 'center', marginBottom: 8 }}>🔔</div>
          <h3 style={{ color: 'var(--gold)', textAlign: 'center', marginBottom: 8 }}>
            {totalPending} new item{totalPending !== 1 ? 's' : ''} waiting!
          </h3>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            {unreadFeedbacks > 0 && (
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                🎙️ {unreadFeedbacks} new feedback{unreadFeedbacks !== 1 ? 's' : ''}
              </div>
            )}
            {unreadAnswers > 0 && (
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                💬 {unreadAnswers} new answer{unreadAnswers !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {unreadFeedbacks > 0 && (
              <Link to="/recording?tab=submissions" className="btn btn-gold btn-sm">View Feedbacks</Link>
            )}
            {unreadAnswers > 0 && (
              <Link to="/questions?tab=submissions" className="btn btn-secondary btn-sm">View Answers</Link>
            )}
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>What do you want to practice?</h2>
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
