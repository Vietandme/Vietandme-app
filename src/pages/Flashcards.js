import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const LEVELS = ['all', 'beginner', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced'];
const LESSONS = ['all', ...Array.from({ length: 15 }, (_, i) => String(i + 1).padStart(2, '0'))];

export default function Flashcards() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [level, setLevel] = useState('all');
  const [lesson, setLesson] = useState('all');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [frontLang, setFrontLang] = useState('english');
  const [completions, setCompletions] = useState([]);
  const [userId, setUserId] = useState(null);
  const [marking, setMarking] = useState(false);
  const navigate = useNavigate();

  const loadCompletions = useCallback(async (uid) => {
    if (!uid) return;
    const { data } = await supabase.from('lesson_completions').select('*').eq('user_id', uid).eq('type', 'flashcards');
    setCompletions(data || []);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
      loadCompletions(data.user?.id);
    });
    loadCategories();
  }, [loadCompletions]);

  async function loadCategories() {
    const { data } = await supabase.from('flashcards').select('category').not('category', 'is', null).neq('category', '');
    const all = (data || []).flatMap(d => (d.category || '').split(',').map(c => c.trim())).filter(Boolean);
    const unique = ['all', ...new Set(all.sort())];
    setCategories(unique);
  }

  const loadCards = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('flashcards').select('*');
    if (level !== 'all') query = query.eq('level', level);
    if (lesson !== 'all') query = query.eq('lesson', lesson);
    const { data } = await query;
    const filtered = category === 'all' ? data : (data || []).filter(c => (c.category || '').split(',').map(s => s.trim().toLowerCase()).includes(category.toLowerCase()));
    setCards(filtered ? shuffle(filtered) : []);
    setIndex(0);
    setFlipped(false);
    setLoading(false);
  }, [level, lesson, category]);

  useEffect(() => { loadCards(); }, [loadCards]);

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function next() { setFlipped(false); setTimeout(() => setIndex(i => Math.min(i + 1, cards.length - 1)), 100); }
  function prev() { setFlipped(false); setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 100); }
  function toggleLang(lang) { setFrontLang(lang); setFlipped(false); }

  function isCompleted(lvl, ls) {
    return completions.some(c => c.level === lvl && c.lesson === ls);
  }

  async function markCompleted() {
    if (!userId || level === 'all' || lesson === 'all') return;
    setMarking(true);
    await supabase.from('lesson_completions').upsert({
      user_id: userId, level, lesson, type: 'flashcards'
    }, { onConflict: 'user_id,level,lesson,type' });
    setMarking(false);
    navigate('/');
  }

  async function markIncomplete() {
    if (!userId || level === 'all' || lesson === 'all') return;
    setMarking(true);
    await supabase.from('lesson_completions').delete()
      .eq('user_id', userId).eq('level', level).eq('lesson', lesson).eq('type', 'flashcards');
    setMarking(false);
    navigate('/');
  }

  const card = cards[index];
  const showVietnamese = frontLang === 'vietnamese';
  const isLastCard = index === cards.length - 1;
  const currentlyDone = level !== 'all' && lesson !== 'all' && isCompleted(level, lesson);

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Flashcards 📇</h1>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Show first</div>
        <div style={{ display: 'flex', background: '#E8E8F0', borderRadius: 10, padding: 3, width: 'fit-content' }}>
          <button onClick={() => toggleLang('vietnamese')} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: frontLang === 'vietnamese' ? 'var(--red)' : 'transparent', color: frontLang === 'vietnamese' ? 'white' : 'var(--muted)' }}>
            🇻🇳 Vietnamese
          </button>
          <button onClick={() => toggleLang('english')} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: frontLang === 'english' ? 'var(--red)' : 'transparent', color: frontLang === 'english' ? 'white' : 'var(--muted)' }}>
            🇬🇧 English
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Level</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {LEVELS.map(l => (
            <button key={l} onClick={() => { setLevel(l); setLesson('all'); }} style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 20, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: 'pointer',
              border: '2px solid ' + (level === l ? 'var(--red)' : '#E8E8F0'),
              background: level === l ? 'var(--red)' : 'var(--white)',
              color: level === l ? 'white' : 'var(--text)',
            }}>
              {l === 'all' ? 'All' : l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Lesson</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {LESSONS.map(ls => {
            const done = ls !== 'all' && level !== 'all' && isCompleted(level, ls);
            const active = lesson === ls;
            return (
              <button key={ls} onClick={() => setLesson(ls)} style={{
                fontSize: 12, padding: '4px 10px', minWidth: 40, borderRadius: 20,
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: 'pointer',
                border: '2px solid ' + (active ? (done ? '#27AE60' : 'var(--red)') : done ? '#27AE60' : '#E8E8F0'),
                background: active ? (done ? '#27AE60' : 'var(--red)') : done ? '#E8F8EF' : 'var(--white)',
                color: active ? 'white' : done ? '#27AE60' : 'var(--text)',
              }}>
                {ls === 'all' ? 'All' : ls}{done ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Category</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 20, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: 'pointer',
              border: '2px solid ' + (category === c ? 'var(--gold)' : '#E8E8F0'),
              background: category === c ? 'var(--gold)' : 'var(--white)',
              color: category === c ? 'var(--dark)' : 'var(--text)',
            }}>
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading cards...</p>
        : cards.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📇</div><p>No flashcards yet for this selection.</p></div>
        ) : (
          <>
            <div className="flashcard-progress">{index + 1} / {cards.length}</div>
            <div className="flashcard-container">
              <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
                <div className="flashcard-face flashcard-front">
                  {card?.lesson && <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 11, opacity: 0.5 }}>Lesson {card.lesson}</div>}
                  <div className="flashcard-word">{showVietnamese ? card?.vietnamese : card?.english}</div>
                  {showVietnamese && card?.pronunciation && <div className="flashcard-hint">/{card.pronunciation}/</div>}
                  <div className="flashcard-hint" style={{ marginTop: 16 }}>Tap to reveal</div>
                </div>
                <div className="flashcard-face flashcard-back">
                  <div className="flashcard-meaning">{showVietnamese ? card?.english : card?.vietnamese}</div>
                  {!showVietnamese && card?.pronunciation && <div style={{ fontSize: 13, marginTop: 8, opacity: 0.7 }}>/{card.pronunciation}/</div>}
                  {card?.example && <div style={{ fontSize: 13, marginTop: 12, opacity: 0.7, textAlign: 'center' }}>{card.example}</div>}
                </div>
              </div>
            </div>

            <div className="flashcard-controls">
              <button className="btn btn-secondary" onClick={prev} disabled={index === 0}>← Prev</button>
              <button className="btn btn-secondary" onClick={() => setFlipped(!flipped)}>Flip</button>
              <button className="btn btn-primary" onClick={next} disabled={isLastCard}>Next →</button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" onClick={loadCards}>🔀 Shuffle</button>
            </div>

            {isLastCard && level !== 'all' && lesson !== 'all' && (
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={markCompleted} disabled={marking} style={{
                  width: '100%', padding: '14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600,
                  border: '2px solid ' + (currentlyDone ? '#27AE60' : '#E8E8F0'),
                  background: currentlyDone ? '#27AE60' : 'var(--white)',
                  color: currentlyDone ? 'white' : 'var(--muted)',
                }}>
                  {currentlyDone ? '✓ Lesson Completed!' : '🎉 Mark Lesson as Completed'}
                </button>
                <button onClick={markIncomplete} disabled={marking} style={{
                  width: '100%', padding: '14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600,
                  border: '2px solid ' + (!currentlyDone ? 'var(--red)' : '#E8E8F0'),
                  background: !currentlyDone ? '#FFF0F0' : 'var(--white)',
                  color: !currentlyDone ? 'var(--red)' : 'var(--muted)',
                }}>
                  ↩️ Mark as Incomplete — I want to do it again
                </button>
              </div>
            )}
          </>
        )}
    </div>
  );
}
