import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const LEVELS = ['beginner', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced'];

export default function StudentDashboard({ profile }) {
  const [unreadFeedbacks, setUnreadFeedbacks] = useState(0);
  const [unreadAnswers, setUnreadAnswers] = useState(0);
  const [flashcardProgress, setFlashcardProgress] = useState([]);
  const [quizProgress, setQuizProgress] = useState([]);
  const [recordingProgress, setRecordingProgress] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const loadUnread = useCallback(async () => {
    const [f, a] = await Promise.all([
      supabase.from('recordings').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'reviewed').is('read_at', null),
      supabase.from('student_questions').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'answered').is('read_at', null),
    ]);
    setUnreadFeedbacks(f.count || 0);
    setUnreadAnswers(a.count || 0);
  }, [profile]);

  const loadProgress = useCallback(async () => {
    const [completions, fcLessons, qLessons, recLessons] = await Promise.all([
      supabase.from('lesson_completions').select('*').eq('user_id', profile.id),
      supabase.from('flashcards').select('level, lesson').not('lesson', 'is', null).neq('lesson', ''),
      supabase.from('quiz_questions').select('level, lesson').not('lesson', 'is', null).neq('lesson', ''),
      supabase.from('recording_prompts').select('level, lesson').not('lesson', 'is', null).neq('lesson', ''),
    ]);

    function uniqueLessonsPerLevel(data) {
      const map = {};
      (data || []).forEach(r => {
        if (!r.level || !r.lesson) return;
        if (!map[r.level]) map[r.level] = new Set();
        // Normalize lesson to always be zero-padded e.g. "1" -> "01"
        const lesson = String(r.lesson).padStart(2, '0');
        map[r.level].add(lesson);
      });
      return map;
    }

    const fcAvail = uniqueLessonsPerLevel(fcLessons.data);
    const qAvail = uniqueLessonsPerLevel(qLessons.data);
    const recAvail = uniqueLessonsPerLevel(recLessons.data);

    const fcDone = {}, qDone = {}, recDone = {};
    (completions.data || []).forEach(c => {
      const lesson = String(c.lesson || '').padStart(2, '0');
      if (c.type === 'flashcards') { if (!fcDone[c.level]) fcDone[c.level] = new Set(); fcDone[c.level].add(lesson); }
      if (c.type === 'quiz') { if (!qDone[c.level]) qDone[c.level] = new Set(); qDone[c.level].add(lesson); }
      if (c.type === 'recording') { if (!recDone[c.level]) recDone[c.level] = new Set(); recDone[c.level].add(lesson); }
    });

    setFlashcardProgress(LEVELS.filter(l => fcAvail[l]?.size > 0).map(l => ({ level: l, completed: (fcDone[l] || new Set()).size, total: fcAvail[l].size })));
    setQuizProgress(LEVELS.filter(l => qAvail[l]?.size > 0).map(l => ({ level: l, completed: (qDone[l] || new Set()).size, total: qAvail[l].size })));
    setRecordingProgress(LEVELS.filter(l => recAvail[l]?.size > 0).map(l => ({ level: l, completed: (recDone[l] || new Set()).size, total: recAvail[l].size })));
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    loadUnread();
    loadProgress();
  }, [profile, loadUnread, loadProgress, location.key]);


  const levelClass = { beginner: 'level-beginner', intermediate: 'level-intermediate', advanced: 'level-advanced' }[profile?.level] || 'level-beginner';

  const shortLevel = l => ({ 'beginner': 'Beginner', 'pre-intermediate': 'Pre-Int', 'intermediate': 'Intermediate', 'upper-intermediate': 'Upper-Int', 'advanced': 'Advanced' }[l] || l);

  function ProgressSection({ title, data }) {
    if (data.length === 0) return null;
    return (
      <div className="card" style={{ marginBottom: 12 }}>
        <h3 className="card-title" style={{ marginBottom: 12 }}>{title}</h3>
        {data.map(p => (
          <div key={p.level} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{shortLevel(p.level)}</span>
              <span style={{ color: p.completed === p.total ? 'var(--success)' : 'var(--muted)' }}>
                {p.completed}/{p.total} lessons {p.completed === p.total ? '🏆' : ''}
              </span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${p.total > 0 ? (p.completed / p.total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-welcome">
        <h1>Chào {profile?.full_name?.split(' ')[0] || 'bạn'} 👋</h1>
        <p style={{ marginTop: 8 }}>
          <span className={`level-badge ${levelClass}`}>{profile?.level || 'beginner'}</span>
        </p>
      </div>



      <h2 style={{ fontSize: 18, marginBottom: 12 }}>What do you want to practice?</h2>
      <div className="menu-grid">
        <Link to="/flashcards" className="menu-card">
          <span className="icon">🗂️</span>
          <span className="label">Flashcards</span>
          <span className="sub">Vocab & phrases</span>
        </Link>
        <Link to="/quiz" className="menu-card">
          <span className="icon">✏️</span>
          <span className="label">Quiz</span>
          <span className="sub">Test yourself</span>
        </Link>
        <Link to="/recording" className="menu-card">
          <span className="icon">🎙️</span>
          <span className="label">Record</span>
          <span className="sub">Get feedback</span>
        </Link>
        <Link to="/questions" className="menu-card">
          <span className="icon">❓</span>
          <span className="label">Questions</span>
          <span className="sub">Ask V anything</span>
        </Link>
      </div>

      <ProgressSection title="🗂️ Flashcard progress" data={flashcardProgress} />
      <ProgressSection title="✏️ Quiz progress" data={quizProgress} />
      <ProgressSection title="🎙️ Recording progress" data={recordingProgress} />
    </div>
  );
}
