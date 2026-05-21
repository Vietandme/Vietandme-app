import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const LEVELS = ['all', 'beginner', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced'];
const LESSONS = Array.from({ length: 15 }, (_, i) => String(i + 1).padStart(2, '0'));
const TYPES = ['sentence', 'question', 'topic'];

export default function AdminPrompts() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', instruction: '', type: 'sentence', level: 'all', lesson: '', category: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterLesson, setFilterLesson] = useState('all');
  const [search, setSearch] = useState('');

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('recording_prompts').select('*').order('created_at', { ascending: false });
    if (filterLevel !== 'all') query = query.eq('level', filterLevel);
    if (filterLesson !== 'all') query = query.eq('lesson', filterLesson);
    const { data } = await query;
    setPrompts(data || []);
    setLoading(false);
  }, [filterLevel, filterLesson]);

  useEffect(() => { loadPrompts(); }, [loadPrompts]);

  function startNew() {
    setEditingId(null);
    setForm({ title: '', instruction: '', type: 'sentence', level: 'all', lesson: '', category: '' });
    setShowForm(true);
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({ title: p.title, instruction: p.instruction, type: p.type, level: p.level, lesson: p.lesson || '', category: p.category || '' });
    setShowForm(true);
  }

  async function save() {
    if (!form.title || !form.instruction) return;
    setSaving(true);
    if (editingId) {
      await supabase.from('recording_prompts').update(form).eq('id', editingId);
    } else {
      await supabase.from('recording_prompts').insert(form);
    }
    setMessage(editingId ? 'Prompt updated!' : 'Prompt created!');
    setTimeout(() => setMessage(''), 2000);
    setShowForm(false);
    setEditingId(null);
    loadPrompts();
    setSaving(false);
  }

  async function deletePrompt(id) {
    if (!window.confirm('Delete this prompt?')) return;
    await supabase.from('recording_prompts').delete().eq('id', id);
    loadPrompts();
  }

  const typeLabel = { sentence: '📖 Read aloud', question: '❓ Answer question', topic: '🎤 Speak freely' };
  const typeColor = { sentence: '#E8F0FE', question: '#FEF3E2', topic: '#F0E8FE' };
  const typeText = { sentence: '#1A56DB', question: '#E67E22', topic: '#7C3AED' };

  const filtered = prompts.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.instruction?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24 }}>Recording Prompts 🎙️</h1>
        <button className="btn btn-primary btn-sm" onClick={startNew}>+ New</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 16, border: '2px solid var(--red)' }}>
          <h3 className="card-title">{editingId ? 'Edit Prompt' : 'New Prompt'}</h3>
          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Introduce yourself" />
          </div>
          <div className="form-group">
            <label>Instruction (what students see)</label>
            <textarea value={form.instruction} onChange={e => setForm({ ...form, instruction: e.target.value })} rows={3} style={{ resize: 'none' }} placeholder="e.g. Record yourself saying: Xin chào, tôi tên là..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {TYPES.map(t => <option key={t} value={t}>{typeLabel[t]}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Level</label>
              <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                {LEVELS.map(l => <option key={l} value={l}>{l === 'all' ? 'All levels' : l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Lesson</label>
              <select value={form.lesson} onChange={e => setForm({ ...form, lesson: e.target.value })}>
                <option value="">No lesson</option>
                {LESSONS.map(l => <option key={l} value={l}>Lesson {l}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Category</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. pronunciation, conversation..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !form.title || !form.instruction}>
              {saving ? 'Saving...' : '✓ Save'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 10 }}>
          <input placeholder="🔍 Search prompts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '2px solid #E8E8F0', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'var(--cream)' }}>
            <option value="all">All Levels</option>
            {LEVELS.filter(l => l !== 'all').map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
          <select value={filterLesson} onChange={e => setFilterLesson(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '2px solid #E8E8F0', fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: 'var(--cream)' }}>
            <option value="all">All Lessons</option>
            {LESSONS.map(l => <option key={l} value={l}>Lesson {l}</option>)}
          </select>
        </div>
      </div>

      {loading ? <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p>
        : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🎙️</div><p>No prompts found.</p></div>
        ) : filtered.map(p => (
          <div key={p.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 10, fontStyle: 'italic' }}>{p.instruction}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, background: typeColor[p.type], color: typeText[p.type], padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{typeLabel[p.type]}</span>
                  <span style={{ fontSize: 11, background: '#FDEAEA', color: 'var(--red)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{p.level === 'all' ? 'All levels' : p.level}</span>
                  {p.lesson && <span style={{ fontSize: 11, background: '#E8E8F0', color: 'var(--muted)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Lesson {p.lesson}</span>}
                  {p.category && <span style={{ fontSize: 11, background: '#E8E8F0', color: 'var(--muted)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{p.category}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => startEdit(p)}>✏️</button>
                <button className="btn btn-sm btn-danger" onClick={() => deletePrompt(p.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
