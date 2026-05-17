import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const LEVELS = ['beginner', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced'];
const LESSONS = Array.from({ length: 15 }, (_, i) => String(i + 1).padStart(2, '0'));

export default function AdminContent() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterLesson, setFilterLesson] = useState('all');

  const loadCards = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('flashcards').select('*').order('vietnamese');
    if (filterLevel !== 'all') query = query.eq('level', filterLevel);
    if (filterLesson !== 'all') query = query.eq('lesson', filterLesson);
    const { data } = await query;
    setCards(data || []);
    setLoading(false);
  }, [filterLevel, filterLesson]);

  useEffect(() => { loadCards(); }, [loadCards]);

  function startEdit(card) {
    setEditingId(card.id);
    setEditForm({
      vietnamese: card.vietnamese || '',
      english: card.english || '',
      pronunciation: card.pronunciation || '',
      example: card.example || '',
      level: card.level || 'beginner',
      lesson: card.lesson || '',
      category: card.category || '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit() {
    setSaving(true);
    const { error } = await supabase.from('flashcards').update({
      vietnamese: editForm.vietnamese,
      english: editForm.english,
      pronunciation: editForm.pronunciation,
      example: editForm.example,
      level: editForm.level,
      lesson: editForm.lesson || null,
      category: editForm.category,
    }).eq('id', editingId);
    if (error) {
      alert('Save failed: ' + error.message);
    } else {
      setMessage('Card updated!');
      setTimeout(() => setMessage(''), 2000);
      setEditingId(null);
      loadCards();
    }
    setSaving(false);
  }

  async function deleteCard(id) {
    if (!window.confirm('Delete this flashcard?')) return;
    await supabase.from('flashcards').delete().eq('id', id);
    loadCards();
  }

  const filtered = cards.filter(c =>
    c.vietnamese?.toLowerCase().includes(search.toLowerCase()) ||
    c.english?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Manage Flashcards 🃏</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>{cards.length} cards in database</p>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <input placeholder="🔍 Search Vietnamese or English..." value={search} onChange={e => setSearch(e.target.value)} />
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
          <div className="empty-state"><div className="empty-icon">🃏</div><p>No cards found.</p></div>
        ) : filtered.map(card => (
          <div key={card.id} className="card" style={{ marginBottom: 12 }}>
            {editingId === card.id ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Vietnamese</label>
                    <input value={editForm.vietnamese} onChange={e => setEditForm({ ...editForm, vietnamese: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>English</label>
                    <input value={editForm.english} onChange={e => setEditForm({ ...editForm, english: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Pronunciation</label>
                    <input value={editForm.pronunciation} onChange={e => setEditForm({ ...editForm, pronunciation: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Category</label>
                    <input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
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
                  <label>Example sentence</label>
                  <input value={editForm.example} onChange={e => setEditForm({ ...editForm, example: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : '✓ Save'}</button>
                  <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700 }}>{card.vietnamese}</span>
                    {card.pronunciation && <span style={{ fontSize: 12, color: 'var(--muted)' }}>/{card.pronunciation}/</span>}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{card.english}</div>
                  {card.example && <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>{card.example}</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, background: '#FDEAEA', color: 'var(--red)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{card.level}</span>
                    {card.lesson && <span style={{ fontSize: 11, background: '#E8E8F0', padding: '2px 8px', borderRadius: 10, color: 'var(--muted)' }}>Lesson {card.lesson}</span>}
                    {card.category && <span style={{ fontSize: 11, background: '#E8E8F0', padding: '2px 8px', borderRadius: 10, color: 'var(--muted)' }}>{card.category}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(card)}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteCard(card.id)}>🗑️</button>
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
