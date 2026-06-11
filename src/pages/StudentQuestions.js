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
  const [dailyCount, setDailyCount] = useState(0);
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [newAnswerCount, setNewAnswerCount] = useState(0);

  const loadDailyCount = useCallback(async () => {
    if (!profile) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('student_questions')
      .select('id', { count: 'exact' })
      .eq('user_id', profile.id)
      .gte('created_at', today.toISOString());
    setDailyCount(count || 0);
  }, [profile]);

  const loadQuestions = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('student_questions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setQuestions(data || []);
    const unread = (data || []).filter(q => q.status === 'answered' && !q.read_at).length;
    setNewAnswerCount(unread);
  }, [profile]);

  useEffect(() => { loadQuestions(); loadDailyCount(); }, [loadQuestions, loadDailyCount]);

  // Auto mark all answers as read when submissions tab is opened
  useEffect(() => {
    if (view === 'submissions' && profile) {
      supabase.from('student_questions')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', profile.id)
        .eq('status', 'answered')
        .is('read_at', null)
        .then(() => {
          setNewAnswerCount(0);
          loadQuestions();
        });
    }
  }, [view, profile, loadQuestions]);

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
    loadDailyCount();
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
                {newAnswerCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -8, right: -10,
                    background: 'var(--gold)', color: 'var(--dark)',
                    borderRadius: '50%', width: 16, height: 16,
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{newAnswerCount}</span>
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
            {dailyCount >= 2 && (
              <div className="alert alert-error" style={{marginBottom: 8}}>You have reached the daily limit of 2 questions.</div>
            )}
            <button className="btn btn-primary btn-full" onClick={sendQuestion} disabled={sending || !newQuestion.trim() || dailyCount >= 2}>
              {sending ? 'Sending...' : '📤 Send Question'}
            </button>
          </div>
        </div>
      )}

      {view === 'submissions' && (
        <div>
          {questions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">❓</div>
              <p>No questions yet. Ask something!</p>
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
      )}
    </div>
  );
}
