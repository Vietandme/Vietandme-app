import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [answerText, setAnswerText] = useState({});
  const [saving, setSaving] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    let query = supabase
      .from('student_questions')
      .select('*, profiles(full_name, email, level)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setQuestions(data || []);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function submitAnswer(id) {
    if (!answerText[id]?.trim()) return;
    setSaving(prev => ({ ...prev, [id]: true }));
    await supabase.from('student_questions').update({
      answer: answerText[id],
      status: 'answered',
    }).eq('id', id);
    setMessage('Answer sent!');
    setTimeout(() => setMessage(''), 2000);
    setSaving(prev => ({ ...prev, [id]: false }));
    load();
  }

  async function deleteQuestion(id) {
    if (!window.confirm('Delete this question?')) return;
    setDeleting(id);
    await supabase.from('student_questions').delete().eq('id', id);
    setDeleting(null);
    load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Student Questions ❓</h1>
      {message && <div className="alert alert-success">{message}</div>}

      <div className="level-tabs" style={{ marginBottom: 20 }}>
        {['pending', 'answered', 'all'].map(f => (
          <button key={f} className={`level-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {questions.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">❓</div><p>No {filter === 'all' ? '' : filter} questions.</p></div>
      ) : questions.map(q => (
        <div key={q.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{q.profiles?.full_name || q.profiles?.email}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {q.profiles?.level} · {new Date(q.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {q.status === 'pending'
                ? <span className="pending-badge">Pending</span>
                : <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>✓ Answered</span>}
              <button className="btn btn-sm btn-danger" onClick={() => deleteQuestion(q.id)} disabled={deleting === q.id}>
                {deleting === q.id ? '...' : '🗑️'}
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 15, fontWeight: 500 }}>
            {q.question}
          </div>

          {q.answer ? (
            <div style={{ background: '#E8F8EF', borderRadius: 10, padding: '10px 14px', borderLeft: '3px solid var(--success)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>Your answer:</div>
              <div style={{ fontSize: 14, color: '#1A7A40' }}>{q.answer}</div>
            </div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <textarea
                  value={answerText[q.id] || ''}
                  onChange={e => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Type your answer..."
                  rows={3}
                  style={{ resize: 'none' }}
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => submitAnswer(q.id)} disabled={saving[q.id] || !answerText[q.id]?.trim()}>
                {saving[q.id] ? 'Sending...' : '📤 Send Answer'}
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
