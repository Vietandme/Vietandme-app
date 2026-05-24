import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export default function StudentQuestions({ profile }) {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(null);

  const loadQuestions = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('student_questions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setQuestions(data || []);
  }, [profile]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  async function sendQuestion() {
    if (!newQuestion.trim() || !profile) return;
    setSending(true);
    await supabase.from('student_questions').insert({
      user_id: profile.id,
      question: newQuestion.trim(),
      status: 'pending',
    });
    setNewQuestion('');
    setMessage('Question sent! Vi will answer soon.');
    setTimeout(() => setMessage(''), 3000);
    loadQuestions();
    setSending(false);
  }

  async function deleteQuestion(id) {
    if (!window.confirm('Delete this question?')) return;
    setDeleting(id);
    await supabase.from('student_questions').delete().eq('id', id);
    setDeleting(null);
    loadQuestions();
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Questions to Vi ❓</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>Ask your teacher anything about Vietnamese!</p>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label>Your question</label>
          <textarea
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            placeholder="e.g. What is the difference between 'và' and 'với'?"
            rows={3}
            style={{ resize: 'none' }}
          />
        </div>
        <button className="btn btn-primary btn-full" onClick={sendQuestion} disabled={sending || !newQuestion.trim()}>
          {sending ? 'Sending...' : '📤 Send Question'}
        </button>
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>My Questions</h2>
      {questions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">❓</div>
          <p>No questions yet. Ask anything above!</p>
        </div>
      ) : questions.map(q => (
        <div key={q.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{q.question}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {new Date(q.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}
                {q.status === 'pending'
                  ? <span className="pending-badge">Awaiting answer</span>
                  : <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>✓ Answered</span>}
              </div>
            </div>
            <button className="btn btn-sm btn-danger" onClick={() => deleteQuestion(q.id)} disabled={deleting === q.id} style={{ marginLeft: 8, flexShrink: 0 }}>
              {deleting === q.id ? '...' : '🗑️'}
            </button>
          </div>
          {q.answer && (
            <div style={{ background: '#E8F8EF', borderRadius: 10, padding: '10px 14px', borderLeft: '3px solid var(--success)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>Vi's answer:</div>
              <div style={{ fontSize: 14, color: '#1A7A40' }}>{q.answer}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
