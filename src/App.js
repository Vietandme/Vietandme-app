import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import Flashcards from './pages/Flashcards';
import Quiz from './pages/Quiz';
import Recording from './pages/Recording';
import Progress from './pages/Progress';
import AdminDashboard from './pages/AdminDashboard';
import AdminFeedback from './pages/AdminFeedback';
import AdminUpload from './pages/AdminUpload';
import AdminStudents from './pages/AdminStudents';
import Layout from './components/Layout';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
    setLoading(false);
  }

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-logo">🇻🇳</div>
      <div className="loading-text">Viet & Me</div>
    </div>
  );

  const isAdmin = profile?.role === 'admin';

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/" />} />
        {session ? (
          <Route element={<Layout profile={profile} />}>
            {isAdmin ? (
              <>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/admin/feedback" element={<AdminFeedback />} />
                <Route path="/admin/upload" element={<AdminUpload />} />
                <Route path="/admin/students" element={<AdminStudents />} />
              </>
            ) : (
              <>
                <Route path="/" element={<StudentDashboard profile={profile} />} />
                <Route path="/flashcards/:level?" element={<Flashcards />} />
                <Route path="/quiz/:level?" element={<Quiz />} />
                <Route path="/recording" element={<Recording profile={profile} />} />
                <Route path="/progress" element={<Progress profile={profile} />} />
              </>
            )}
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
