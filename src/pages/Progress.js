import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Progress({ profile }) {
  const [quizResults, setQuizResults] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    async function load() {
      const [q, r] = await Promise.all([
        supabase.from('quiz_results').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('recordings').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      ]);
      setQuizResults(q.data || []);
      setRecordings(r.data || []);
      setLoading(false);
    }
    load();
  }, [profile]);

  const avgScore = quizResults.length
    ? Math.round(quizResults.reduce((a, r) => a + (r.score / r.total) * 100, 0) / quizResults.length)
    : 0;

  const reviewed = recordings.filter(r => r.status === 'reviewed').length;

  if (loading) return <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 40 }}>Loading...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>My Progress 📊</h1>

      <div className="card">
        <h3 className="card-title">Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 32, fontFamily: 'Playfair Display, serif', color: 'var(--red)', fontWeight: 700 }}>{quizResults.length}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Quizzes</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontFamily: 'Playfair Display, serif', color: 'var(--red)', fontWeight: 700 }}>{avgScore}%</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Avg score</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontFamily: 'Playfair Display, serif', color: 'var(--red)', fontWeight: 700 }}>{recordings.length}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Recordings</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Quiz History</h3>
        {quizResults.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No quizzes completed yet.</p>
        ) : quizResults.slice(0, 8).map(r => (
          <div key={r.id} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--muted)' }}>{new Date(r.created_at).toLocaleDateString()}</span>
              <span style={{ fontWeight: 600 }}>{r.score}/{r.total} — {Math.round((r.score / r.total) * 100)}%</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${(r.score / r.total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="card-title">Recording Feedback</h3>
        {recordings.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No recordings submitted yet.</p>
        ) : recordings.slice(0, 5).map(r => (
          <div key={r.id} className="submission-card" style={{ marginBottom: 12 }}>
            <div className="submission-meta">
              {new Date(r.created_at).toLocaleDateString()} ·{' '}
              {r.status === 'pending'
                ? <span className="pending-badge">Pending</span>
                : <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>✓ Reviewed</span>}
            </div>
            {r.feedback && <div className="feedback-bubble"><strong>Feedback:</strong> {r.feedback}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
