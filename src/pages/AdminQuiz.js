import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const LEVELS = ['beginner', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced'];
const LESSONS = Array.from({ length: 15 }, (_, i) => String(i + 1).padStart(2, '0'));

export default function AdminQuiz() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterLesson, setFilterLesson] = useState('all');

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('quiz_questions').select('*').order('level').order('question');
    if (filterLevel !== 'all') query = query.eq('level', filterLevel);
    if (filterLesson !== 'all') query = query.eq('lesson', filterLesson);
    const { data } = await query;
    setQuestions(data || []);
    setLoading(false);
  }, [filterLevel, filterLesson]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  function startEdit(q) {
    setEditingId(q.id);
    setEditForm({
      question: q.question || '',
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      correct_answer: q.correct_answer || '',
      explanation: q.explanation || '',
      level: q.level || 'beginner',
      lesson: q.lesson || '',
    });
  }

  function cancelEdit() { setEditingId(null); setEditForm({}); }

  async function saveEdit() {
    setSaving(true);
    const { error } = await supabase.from('quiz_questions').update({
      question: editForm.question,
      option_a: editForm.option_a,
      option_b: editForm.option_b,
      option_c: editForm.option_c,
      correct_answer: editForm.correct_answer,
      explanation: editForm.explanation,
      level: editForm.level,
      lesson: editForm.lesson || null,
    }).eq('id', editingId);
    if (error) { alert('Save failed: ' + error.message); }
    else {
      setMessage('Question updated!');
      setTimeout(() => setMessage(''), 2000);
      setEditingId(null);
      loadQuestions();
    }
    setSaving(false);
  }

  async function deleteQuestion(id) {
    if (!window.confirm('Delete this question?')) return;
    await supabase.from('quiz_questions').delete().eq('id', id);
    loadQuestions();
  }

  const filtered = questions.filter(q =>
    q.question?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Manage Quiz ✏️</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>{questions.length} questions in database</p>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <input placeholder="🔍 Search questions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '2px solid #E8E8F0', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'var(--cream)' }}>
            <option value="all">All Levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
          <select value={filterLesson} onChange={e => setFilterLesson(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '2px solid #E8E8F0', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'var(--cream)' }}>
            <option value="all">All Lessons</option>
            {LESSONS.map(l => <option key={l} value={l}>Lesson {l}</option>)}
          </select>
        </div>
      </div>

      {loading ? <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p>
        : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">✏️</div><p>No questions found.</p></div>
        ) : filtered.map(q => (
          <div key={q.id} className="card" style={{ marginBottom: 12 }}>
            {editingId === q.id ? (
              <div>
                <div className="form-group">
                  <label>Question</label>
                  <textarea value={editForm.question} onChange={e => setEditForm({ ...editForm, question: e.target.value })} rows={3} style={{ resize: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Option A</label>
                    <input value={editForm.option_a} onChange={e => setEditForm({ ...editForm, option_a: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Option B</label>
                    <input value={editForm.option_b} onChange={e => setEditForm({ ...editForm, option_b: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Option C</label>
                    <input value={editForm.option_c} onChange={e => setEditForm({ ...editForm, option_c: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>✓ Correct Answer</label>
                    <select value={editForm.correct_answer} onChange={e => setEditForm({ ...editForm, correct_answer: e.target.value })}>
                      <option value="">Select correct answer</option>
                      {[editForm.option_a, editForm.option_b, editForm.option_c].filter(Boolean).map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Level</label>
                    <select value={editForm.level} onChange={e => setEditForm({ ...editForm, level: e.target.value })}>
                      {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Lesson</label>
                    <select value={editForm.lesson} onChange={e => setEditForm({ ...editForm, lesson: e.target.value })}>
                      <option value="">No lesson</option>
                      {LESSONS.map(l => <option key={l} value={l}>Lesson {l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>💡 Explanation (shown to student after answering)</label>
                  <textarea value={editForm.explanation} onChange={e => setEditForm({ ...editForm, explanation: e.target.value })} rows={3} style={{ resize: 'none' }} placeholder="e.g. Chưa means not yet, while không means not at all..." />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : '✓ Save'}</button>
                  <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>{q.question}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                    {[q.option_a, q.option_b, q.option_c].filter(Boolean).map((opt, i) => (
                      <div key={i} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, color: 'var(--muted)' }}>{String.fromCharCode(65 + i)}.</span>
                        <span style={{ color: opt === q.correct_answer ? 'var(--success)' : 'var(--text)', fontWeight: opt === q.correct_answer ? 600 : 400 }}>
                          {opt} {opt === q.correct_answer && '✓'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <div style={{ background: '#E8F8EF', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#1A7A40', marginBottom: 8 }}>
                      💡 {q.explanation}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, background: '#FDEAEA', color: 'var(--red)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{q.level}</span>
                    {q.lesson && <span style={{ fontSize: 11, background: '#E8E8F0', padding: '2px 8px', borderRadius: 10, color: 'var(--muted)' }}>Lesson {q.lesson}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(q)}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteQuestion(q.id)}>🗑️</button>
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
