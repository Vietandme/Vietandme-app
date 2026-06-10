import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const LEVELS = ['all', 'beginner', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced'];
const LESSONS = ['all', ...Array.from({ length: 15 }, (_, i) => String(i + 1).padStart(2, '0'))];

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [level, setLevel] = useState('all');
  const [lesson, setLesson] = useState('all');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [completions, setCompletions] = useState([]);
  const [marking, setMarking] = useState(false);
  const navigate = useNavigate();

  const loadCompletions = useCallback(async (uid) => {
    if (!uid) return;
    const { data } = await supabase.from('lesson_completions').select('*').eq('user_id', uid).eq('type', 'quiz');
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
    const { data } = await supabase.from('quiz_questions').select('category').not('category', 'is', null).neq('category', '');
    const all = (data || []).flatMap(d => (d.category || '').split(',').map(c => c.trim())).filter(Boolean);
    const unique = ['all', ...new Set(all.sort())];
    setCategories(unique);
  }

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('quiz_questions').select('*');
    if (level !== 'all') query = query.eq('level', level);
    if (lesson !== 'all') query = query.eq('lesson', lesson);
    const { data } = await query;
    const filtered = category === 'all' ? (data || []) : (data || []).filter(q => (q.category || '').split(',').map(s => s.trim()).includes(category));
    const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setIndex(0); setSelected(null); setScore(0); setDone(false);
    setLoading(false);
  }, [level, lesson, category]);

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  function isCompleted(lvl, ls) {
    return completions.some(c => c.level === lvl && c.lesson === ls);
  }

  async function markCompleted() {
    if (!userId || level === 'all' || lesson === 'all') return;
    setMarking(true);
    await supabase.from('lesson_completions').upsert({
      user_id: userId, level, lesson, type: 'quiz'
    }, { onConflict: 'user_id,level,lesson,type' });
    setMarking(false);
    navigate('/');
  }

  async function markIncomplete() {
    if (!userId || level === 'all' || lesson === 'all') return;
    setMarking(true);
    await supabase.from('lesson_completions').delete()
      .eq('user_id', userId).eq('level', level).eq('lesson', lesson).eq('type', 'quiz');
    setMarking(false);
    navigate('/');
  }

  function handleSelect(option) {
    if (selected) return;
    setSelected(option);
    if (option === questions[index].correct_answer) setScore(s => s + 1);
  }

  async function handleNext() {
    if (index + 1 >= questions.length) {
      setDone(true);
      if (userId) {
        await supabase.from('quiz_results').insert({
          user_id: userId, score, total: questions.length, level
        });
      }
    } else {
      setIndex(i => i + 1);
      setSelected(null);
    }
  }

  const q = questions[index];
  const currentlyDone = level !== 'all' && lesson !== 'all' && isCompleted(level, lesson);

  if (loading) return <p style={{ textAlign: 'center', marginTop: 40, color: 'var(--muted)' }}>Loading quiz...</p>;

  if (done) return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Quiz ✏️</h1>
      <div className="card quiz-score">
        <div className="score-num">{score}/{questions.length}</div>
        <div style={{ fontSize: 20, margin: '12px 0', fontFamily: 'Playfair Display, serif' }}>
          {score === questions.length ? '🏆 Perfect!' : score >= questions.length * 0.7 ? '🎉 Great job!' : '💪 Keep practising!'}
        </div>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{Math.round((score / questions.length) * 100)}% correct</p>
        <button className="btn btn-primary" onClick={loadQuiz} style={{ marginBottom: 8 }}>Try Again</button>
      </div>
      {level !== 'all' && lesson !== 'all' && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Quiz ✏️</h1>

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

      {questions.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">✏️</div><p>No questions for this selection.</p></div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Question {index + 1} of {questions.length}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>Score: {score}</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          <div className="quiz-question">{q.question}</div>

          <div className="quiz-options">
            {[q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean).map((option, i) => {
              let cls = 'quiz-option';
              if (selected) {
                if (option === q.correct_answer) cls += ' correct';
                else if (option === selected) cls += ' wrong';
              }
              return (
                <button key={i} className={cls} onClick={() => handleSelect(option)} disabled={!!selected}>
                  <span style={{ fontWeight: 600, marginRight: 8, color: 'var(--muted)' }}>{String.fromCharCode(65 + i)}.</span>
                  {option}
                </button>
              );
            })}
          </div>

          {selected && (
            <>
              <div className="quiz-feedback" style={{ color: selected === q.correct_answer ? 'var(--success)' : 'var(--error)' }}>
                {selected === q.correct_answer ? '✓ Correct!' : `✗ The answer is: ${q.correct_answer}`}
              </div>
              {q.explanation && (
                <div style={{ background: '#E8F8EF', borderRadius: 12, padding: '12px 16px', marginTop: 12, fontSize: 14, color: '#1A7A40', borderLeft: '3px solid var(--success)' }}>
                  <strong>💡 Explanation:</strong> {q.explanation}
                </div>
              )}
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button className="btn btn-primary" onClick={handleNext}>
                  {index + 1 >= questions.length ? 'See Results' : 'Next Question →'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
