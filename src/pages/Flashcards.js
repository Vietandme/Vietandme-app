import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Flashcards() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [level, setLevel] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, [level]);

  async function loadCards() {
    setLoading(true);
    let query = supabase.from('flashcards').select('*');
    if (level !== 'all') query = query.eq('level', level);
    const { data } = await query;
    setCards(data ? shuffle(data) : []);
    setIndex(0);
    setFlipped(false);
    setLoading(false);
  }

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function next() { setFlipped(false); setTimeout(() => setIndex(i => Math.min(i + 1, cards.length - 1)), 100); }
  function prev() { setFlipped(false); setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 100); }

  const card = cards[index];

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Flashcards 🃏</h1>

      <div className="level-tabs">
        {['all', 'beginner', 'intermediate', 'advanced'].map(l => (
          <button key={l} className={`level-tab ${level === l ? 'active' : ''}`} onClick={() => setLevel(l)}>
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading cards...</p>
        : cards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🃏</div>
            <p>No flashcards yet for this level.</p>
            <p style={{ marginTop: 8, fontSize: 13 }}>Your teacher will add them soon!</p>
          </div>
        ) : (
          <>
            <div className="flashcard-progress">{index + 1} / {cards.length}</div>
            <div className="flashcard-container">
              <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
                <div className="flashcard-face flashcard-front">
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
