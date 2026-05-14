import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, pending: 0, questions: 0, flashcards: 0 });

  useEffect(() => {
    async function load() {
      const [students, pending, questions, flashcards] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('recordings').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('quiz_questions').select('id', { count: 'exact' }),
        supabase.from('flashcards').select('id', { count: 'exact' }),
      ]);
      setStats({
        students: students.count || 0,
        pending: pending.count || 0,
        questions: questions.count || 0,
        flashcards: flashcards.count || 0,
      });
    }
    load();
  }, []);

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
          <div className="num" style={{ color: stats.pending > 0 ? 'var(--gold)' : 'var(--red)' }}>{stats.pending}</div>
          <div className="label">Pending</div>
        </div>
        <div className="card admin-stat">
          <div className="num">{stats.questions}</div>
          <div className="label">Questions</div>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', background: 'var(--dark)', color: 'var(--white)' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎙️</div>
        <h3 style={{ color: 'var(--gold)', marginBottom: 4 }}>{stats.pending} recording{stats.pending !== 1 ? 's' : ''} waiting</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 16 }}>Your students are waiting for pronunciation feedback</p>
        <a href="/admin/feedback" className="btn btn-gold">Give Feedback</a>
      </div>

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
