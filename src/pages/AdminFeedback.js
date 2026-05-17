import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminFeedback() {
  const [recordings, setRecordings] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [feedbackText, setFeedbackText] = useState({});
  const [saving, setSaving] = useState({});
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    let query = supabase
      .from('recordings')
      .select('*, profiles(full_name, email, level)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setRecordings(data || []);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  function handleFeedbackChange(id, val) {
    setFeedbackText(prev => ({ ...prev, [id]: val }));
  }

  async function submitFeedback(id) {
    if (!feedbackText[id]?.trim()) return;
    setSaving(prev => ({ ...prev, [id]: true }));
    await supabase.from('recordings').update({
      feedback: feedbackText[id],
      status: 'reviewed'
    }).eq('id', id);
    setMessage('Feedback sent!');
    setTimeout(() => setMessage(''), 2000);
    setSaving(prev => ({ ...prev, [id]: false }));
    load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Student Recordings 🎙️</h1>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="level-tabs" style={{ marginBottom: 20 }}>
        {['pending', 'reviewed', 'all'].map(f => (
          <button key={f} className={`level-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {recordings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎙️</div>
          <p>No {filter === 'all' ? '' : filter} recordings.</p>
        </div>
      ) : recordings.map(r => (
        <div key={r.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{r.profiles?.full_name || r.profiles?.email}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {r.profiles?.level} · {new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {r.status === 'pending'
              ? <span className="pending-badge">Pending</span>
              : <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>✓ Reviewed</span>}
          </div>

          {r.note && <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 10, fontStyle: 'italic' }}>"{r.note}"</div>}

          <audio controls src={r.audio_url} style={{ width: '100%', marginBottom: 12 }} />

          {r.feedback ? (
            <div className="feedback-bubble"><strong>Your feedback:</strong> {r.feedback}</div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <textarea
                  value={feedbackText[r.id] || ''}
                  onChange={e => handleFeedbackChange(r.id, e.target.value)}
                  placeholder="Write your feedback for this student..."
                  rows={3}
                  style={{ resize: 'none' }}
                />
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => submitFeedback(r.id)}
                disabled={saving[r.id] || !feedbackText[r.id]?.trim()}
              >
                {saving[r.id] ? 'Sending...' : '📤 Send Feedback'}
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
