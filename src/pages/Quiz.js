import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

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
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('quiz_questions').select('*');
    if (level !== 'all') query = query.eq('level', level);
    if (lesson !== 'all') query = query.eq('lesson', lesson);
    const { data } = await query;
    const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setIndex(0); setSelected(null); setScore(0); setDone(false);
    setLoading(false);
  }, [level, lesson]);

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

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
        <button className="btn btn-primary" onClick={loadQuiz}>Try Again</button>
      </div>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Quiz ✏️</h1>

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
