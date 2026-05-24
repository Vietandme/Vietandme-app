import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function StudentDashboard({ profile }) {
  const [stats, setStats] = useState({ quizzes: 0, recordings: 0 });
  const [newFeedbacks, setNewFeedbacks] = useState([]);
  const [markingRead, setMarkingRead] = useState(null);

  useEffect(() => {
    if (!profile) return;
    loadStats();
    loadNewFeedbacks();
  }, [profile]);

  async function loadStats() {
    const [q, r] = await Promise.all([
      supabase.from('quiz_results').select('id', { count: 'exact' }).eq('user_id', profile.id),
      supabase.from('recordings').select('id', { count: 'exact' }).eq('user_id', profile.id),
    ]);
    setStats({ quizzes: q.count || 0, recordings: r.count || 0 });
  }

  async function loadNewFeedbacks() {
    const { data } = await supabase
      .from('recordings')
      .select('*')
      .eq('user_id', profile.id)
      .eq('status', 'reviewed')
      .is('read_at', null)
      .order('created_at', { ascending: false });
    setNewFeedbacks(data || []);
  }

  async function markAsRead(id) {
    setMarkingRead(id);
    await supabase.from('recordings').update({ read_at: new Date().toISOString() }).eq('id', id);
    setNewFeedbacks(prev => prev.filter(f => f.id !== id));
    setMarkingRead(null);
  }

  async function markAllRead() {
    const ids = newFeedbacks.map(f => f.id);
    await supabase.from('recordings').update({ read_at: new Date().toISOString() }).in('id', ids);
    setNewFeedbacks([]);
  }

  const levelClass = {
    beginner: 'level-beginner',
    intermediate: 'level-intermediate',
    advanced: 'level-advanced',
  }[profile?.level] || 'level-beginner';

  return (
    <div>
      <div className="dashboard-welcome">
        <h1>Chào {profile?.full_name?.split(' ')[0] || 'bạn'} 👋</h1>
        <p style={{ marginTop: 8 }}>
          <span className={`level-badge ${levelClass}`}>{profile?.level || 'beginner'}</span>
        </p>
      </div>

      {/* New feedback notifications */}
      {newFeedbacks.length > 0 && (
        <div className="card" style={{ marginBottom: 16, border: '2px solid var(--gold)', background: '#FFFBEA' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--dark)' }}>
                {newFeedbacks.length} new feedback{newFeedbacks.length !== 1 ? 's' : ''}!
              </span>
            </div>
            <button onClick={markAllRead} style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '1px solid #E8E8F0',
              background: 'var(--white)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--muted)', fontWeight: 600,
            }}>
              Mark all read
            </button>
          </div>
          {newFeedbacks.map(f => (
            <div key={f.id} style={{
              background: 'var(--white)', borderRadius: 10, padding: '12px 14px', marginBottom: 8,
              border: '1px solid #E8E8F0',
            }}>
              {f.prompt_title && (
                <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, marginBottom: 4 }}>📋 {f.prompt_title}</div>
              )}
              <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 8, fontStyle: 'italic' }}>
                "{f.feedback}"
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {new Date(f.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </span>
                <button
                  onClick={() => markAsRead(f.id)}
                  disabled={markingRead === f.id}
                  style={{
                    fontSize: 12, padding: '4px 12px', borderRadius: 8, border: 'none',
                    background: 'var(--success)', color: 'white', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                  }}
                >
                  {markingRead === f.id ? '...' : '✓ Got it'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
      </div>
    </div>
  );
}
