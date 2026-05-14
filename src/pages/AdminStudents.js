import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    setStudents(data || []);
    setLoading(false);
  }

  const levelClass = { beginner: 'level-beginner', intermediate: 'level-intermediate', advanced: 'level-advanced' };

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Students 👥</h1>

      {loading ? <p style={{ color: 'var(--muted)' }}>Loading...</p>
        : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>No students yet. Share the app link so they can register!</p>
          </div>
        ) : (
          <div className="card">
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{students.length} student{students.length !== 1 ? 's' : ''} registered</div>
            {students.map(s => (
              <div key={s.id} className="student-row">
                <div>
                  <div style={{ fontWeight: 600 }}>{s.full_name || 'No name'}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{s.email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`level-badge ${levelClass[s.level] || 'level-beginner'}`}>{s.level || 'beginner'}</span>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    Joined {new Date(s.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
