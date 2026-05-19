import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const LEVELS = ['all', 'beginner', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced'];
const TYPES = ['sentence', 'question', 'topic'];

export default function AdminPrompts() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', instruction: '', type: 'sentence', level: 'all' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('recording_prompts').select('*').order('created_at', { ascending: false });
    setPrompts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadPrompts(); }, [loadPrompts]);

  function startNew() {
    setEditingId(null);
    setForm({ title: '', instruction: '', type: 'sentence', level: 'all' });
    setShowForm(true);
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({ title: p.title, instruction: p.instruction, type: p.type, level: p.level });
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
            <textarea value={form.instruction} onChange={e => setForm({ ...form, instruction: e.target.value })} rows={3} style={{ resize: 'none' }} placeholder="e.g. Record yourself saying: Xin chào, tôi tên là... Tôi đến từ..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
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
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !form.title || !form.instruction}>
              {saving ? 'Saving...' : '✓ Save'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Loading...</p>
        : prompts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎙️</div>
            <p>No prompts yet. Create one above!</p>
          </div>
        ) : prompts.map(p => (
          <div key={p.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 10, fontStyle: 'italic' }}>{p.instruction}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, background: typeColor[p.type], color: typeText[p.type], padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{typeLabel[p.type]}</span>
                  <span style={{ fontSize: 11, background: '#FDEAEA', color: 'var(--red)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{p.level === 'all' ? 'All levels' : p.level}</span>
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
