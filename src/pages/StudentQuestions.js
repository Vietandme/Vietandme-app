import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function StudentQuestions({ profile }) {
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get('tab') || 'ask';

  const [view, setView] = useState(initialTab);
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
    setView('submissions');
  }

  async function deleteQuestion(id) {
    if (!window.confirm('Delete this question?')) return;
    setDeleting(id);
    await supabase.from('student_questions').delete().eq('id', id);
    setDeleting(null);
    loadQuestions();
  }

  async function markAnswerRead(id) {
    await supabase.from('student_questions').update({ read_at: new Date().toISOString() }).eq('id', id);
    loadQuestions();
  }

  const newAnswers = questions.filter(q => q.status === 'answered' && !q.read_at);

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Questions to Vi ❓</h1>

      <div style={{ display: 'flex', background: '#E8E8F0', borderRadius: 10, padding: 3, marginBottom: 20, width: 'fit-content' }}>
        {['ask', 'submissions'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            background: view === v ? 'var(--red)' : 'transparent',
            color: view === v ? 'white' : 'var(--muted)',
            position: 'relative',
          }}>
            {v === 'ask' ? '✏️ Ask a Question' : (
              <span style={{ position: 'relative' }}>
                📬 My Submissions
                {newAnswers.length > 0 && (
                  <span style={{
                    position: 'absolute', top: -8, right: -10,
                    background: 'var(--gold)', color: 'var(--dark)',
                    borderRadius: '50%', width: 16, height: 16,
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{newAnswers.length}</span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {view === 'ask' && (
        <div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>Ask your teacher anything about Vietnamese!</p>
          {message && <div className="alert alert-success">{message}</div>}
          <div className="card">
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Your question</label>
              <textarea
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                placeholder="e.g. What is the difference between 'và' and 'với'?"
                rows={4}
                style={{ resize: 'none' }}
              />
            </div>
            <button className="btn btn-primary btn-full" onClick={sendQuestion} disabled={sending || !newQuestion.trim()}>
              {sending ? 'Sending...' : '📤 Send Question'}
            </button>
          </div>
        </div>
      )}

      {view === 'submissions' && (
        <div>
          {newAnswers.length > 0 && (
            <div style={{ background: '#FFFBEA', border: '2px solid var(--gold)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>
              🔔 You have {newAnswers.length} new answer{newAnswers.length !== 1 ? 's' : ''} below!
            </div>
          )}
          {questions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">❓</div>
              <p>No questions yet. Ask something!</p>
            </div>
          ) : questions.map(q => (
            <div key={q.id} className="card" style={{ marginBottom: 12, border: q.status === 'answered' && !q.read_at ? '2px solid var(--gold)' : '1px solid transparent' }}>
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
                  <div style={{ fontSize: 14, color: '#1A7A40', marginBottom: q.read_at ? 0 : 8 }}>{q.answer}</div>
                  {!q.read_at && (
                    <button onClick={() => markAnswerRead(q.id)} style={{
                      fontSize: 12, padding: '4px 12px', borderRadius: 8, border: 'none',
                      background: 'var(--success)', color: 'white', cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                    }}>✓ Got it</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
