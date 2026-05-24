import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, pendingRecordings: 0, pendingQuestions: 0, questions: 0, flashcards: 0 });

  useEffect(() => {
    async function load() {
      const [students, pendingRec, pendingQ, questions, flashcards] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('recordings').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('student_questions').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('quiz_questions').select('id', { count: 'exact' }),
        supabase.from('flashcards').select('id', { count: 'exact' }),
      ]);
      setStats({
        students: students.count || 0,
        pendingRecordings: pendingRec.count || 0,
        pendingQuestions: pendingQ.count || 0,
        questions: questions.count || 0,
        flashcards: flashcards.count || 0,
      });
    }
    load();
  }, []);

  const totalPending = stats.pendingRecordings + stats.pendingQuestions;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Teacher Dashboard 👩‍🏫</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>Manage your students and content</p>

      <div className="stats-grid">
        <div className="card admin-stat">
          <div className="num">{stats.students}</div>
          <div className="label">Students</div>
        </div>
        <div className="card admin-stat">
          <div className="num" style={{ color: totalPending > 0 ? 'var(--gold)' : 'var(--red)' }}>{totalPending}</div>
          <div className="label">Pending</div>
        </div>
        <div className="card admin-stat">
          <div className="num">{stats.questions}</div>
          <div className="label">Questions</div>
        </div>
      </div>

      {totalPending > 0 && (
        <div className="card" style={{ background: 'var(--dark)', color: 'var(--white)', marginBottom: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 8, textAlign: 'center' }}>🔔</div>
          <h3 style={{ color: 'var(--gold)', marginBottom: 8, textAlign: 'center' }}>
            {totalPending} item{totalPending !== 1 ? 's' : ''} waiting
          </h3>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            {stats.pendingRecordings > 0 && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                🎙️ {stats.pendingRecordings} recording{stats.pendingRecordings !== 1 ? 's' : ''}
              </div>
            )}
            {stats.pendingQuestions > 0 && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                ❓ {stats.pendingQuestions} question{stats.pendingQuestions !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {stats.pendingRecordings > 0 && (
              <a href="/admin/feedback" className="btn btn-gold btn-sm">Give Feedback</a>
            )}
            {stats.pendingQuestions > 0 && (
              <a href="/admin/questions" className="btn btn-secondary btn-sm">Answer Questions</a>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Quick Stats</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--red)' }}>{stats.flashcards}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Flashcards</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--red)' }}>{stats.questions}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Quiz questions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
