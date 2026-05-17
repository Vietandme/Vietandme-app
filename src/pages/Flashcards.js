import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const LEVELS = ['all', 'beginner', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced'];
const LESSONS = ['all', ...Array.from({ length: 15 }, (_, i) => String(i + 1).padStart(2, '0'))];

export default function Flashcards() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [level, setLevel] = useState('all');
  const [lesson, setLesson] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadCards = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('flashcards').select('*');
    if (level !== 'all') query = query.eq('level', level);
    if (lesson !== 'all') query = query.eq('lesson', lesson);
    const { data } = await query;
    setCards(data ? shuffle(data) : []);
    setIndex(0);
    setFlipped(false);
    setLoading(false);
  }, [level, lesson]);

  useEffect(() => { loadCards(); }, [loadCards]);

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function next() { setFlipped(false); setTimeout(() => setIndex(i => Math.min(i + 1, cards.length - 1)), 100); }
  function prev() { setFlipped(false); setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 100); }

  const card = cards[index];

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Flashcards 🃏</h1>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Level</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {LEVELS.map(l => (
            <button key={l} className={`level-tab ${level === l ? 'active' : ''}`} onClick={() => { setLevel(l); setLesson('all'); }} style={{ fontSize: 12, padding: '4px 12px' }}>
              {l === 'all' ? 'All' : l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Lesson</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {LESSONS.map(ls => (
            <button key={ls} className={`level-tab ${lesson === ls ? 'active' : ''}`} onClick={() => setLesson(ls)} style={{ fontSize: 12, padding: '4px 10px', minWidth: 40 }}>
              {ls === 'all' ? 'All' : ls}
            </button>
          ))}
        </div>
      </div>
      {loading ? <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading cards...</p>
        : cards.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🃏</div><p>No flashcards yet for this selection.</p></div>
        ) : (
          <>
            <div className="flashcard-progress">{index + 1} / {cards.length}</div>
            <div className="flashcard-container">
              <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
                <div className="flashcard-face flashcard-front">
                  {card?.lesson && <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 11, opacity: 0.5 }}>Lesson {card.lesson}</div>}
                  <div className="flashcard-word">{card?.vietnamese}</div>
                  {card?.pronunciation && <div className="flashcard-hint">/{card.pronunciation}/</div>}
                  <div className="flashcard-hint" style={{ marginTop: 16 }}>Tap to reveal</div>
                </div>
                <div className="flashcard-face flashcard-back">
                  <div className="flashcard-meaning">{card?.english}</div>
                  {card?.example && <div style={{ fontSize: 13, marginTop: 12, opacity: 0.7, textAlign: 'center' }}>{card.example}</div>}
                </div>
              </div>
            </div>
            <div className="flashcard-controls">
              <button className="btn btn-secondary" onClick={prev} disabled={index === 0}>← Prev</button>
              <button className="btn btn-secondary" onClick={() => setFlipped(!flipped)}>Flip</button>
              <button className="btn btn-primary" onClick={next} disabled={index === cards.length - 1}>Next →</button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button className="btn btn-secondary btn-sm" onClick={loadCards}>🔀 Shuffle</button>
            </div>
          </>
        )}
    </div>
  );
}
