import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';

const LEVELS = ['all', 'beginner', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced'];
const LESSONS = ['all', ...Array.from({ length: 15 }, (_, i) => String(i + 1).padStart(2, '0'))];

export default function Recording({ profile }) {
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get('tab') || 'prompts';

  const [status, setStatus] = useState('idle');
  const [note, setNote] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [allPrompts, setAllPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [view, setView] = useState(initialTab);
  const [deleting, setDeleting] = useState(null);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterLesson, setFilterLesson] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [userId, setUserId] = useState(null);
  const [marking, setMarking] = useState(false);
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const navigate = useNavigate();

  const loadSubmissions = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('recordings').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
    setSubmissions(data || []);
    const unread = (data || []).filter(s => s.status === 'reviewed' && !s.read_at).length;
    setNewFeedbackCount(unread);
  }, [profile]);

  const loadCompletions = useCallback(async (uid) => {
    if (!uid) return;
    const { data } = await supabase.from('lesson_completions').select('*').eq('user_id', uid).eq('type', 'recording');
    setCompletions(data || []);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
      loadCompletions(data.user?.id);
    });
    loadSubmissions();
    loadAllPrompts();
  }, [loadSubmissions, loadCompletions]);

  // Mark all as read when submissions tab opens
  useEffect(() => {
    if (view !== 'submissions' || !profile) return;
    supabase.from('recordings')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', profile.id)
      .eq('status', 'reviewed')
      .is('read_at', null)
      .then(() => setNewFeedbackCount(0));
  }, [view, profile]);

  async function loadAllPrompts() {
    const { data } = await supabase.from('recording_prompts').select('*').order('created_at', { ascending: false });
    setAllPrompts(data || []);
    const cats = ['all', ...new Set((data || []).map(p => p.category).filter(Boolean).sort())];
    setCategories(cats);
  }

  useEffect(() => {
    let filtered = allPrompts;
    if (filterLevel !== 'all') filtered = filtered.filter(p => p.level === filterLevel || p.level === 'all');
    if (filterLesson !== 'all') filtered = filtered.filter(p => p.lesson === filterLesson);
    if (filterCategory !== 'all') filtered = filtered.filter(p => p.category === filterCategory);
    setPrompts(filtered);
  }, [allPrompts, filterLevel, filterLesson, filterCategory]);

  function isCompleted(lvl, ls) {
    return completions.some(c => c.level === lvl && c.lesson === ls);
  }

  async function markCompleted() {
    if (!userId || filterLevel === 'all' || filterLesson === 'all') return;
    setMarking(true);
    await supabase.from('lesson_completions').upsert({
      user_id: userId, level: filterLevel, lesson: filterLesson, type: 'recording'
    }, { onConflict: 'user_id,level,lesson,type' });
    setMarking(false);
    navigate('/');
  }

  async function markIncomplete() {
    if (!userId || filterLevel === 'all' || filterLesson === 'all') return;
    setMarking(true);
    await supabase.from('lesson_completions').delete()
      .eq('user_id', userId).eq('level', filterLevel).eq('lesson', filterLesson).eq('type', 'recording');
    setMarking(false);
    navigate('/');
  }

  function selectPrompt(prompt) {
    setSelectedPrompt(prompt);
    setView('record');
    setStatus('idle');
    setAudioBlob(null);
    setAudioUrl(null);
    setNote('');
    setMessage('');
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setStatus('done');
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setStatus('recording');
      setAudioBlob(null);
      setAudioUrl(null);
    } catch (err) {
      alert('Microphone access denied. Please allow microphone permission.');
    }
  }

  function stopRecording() { if (mediaRef.current) mediaRef.current.stop(); }
  function discardRecording() { setStatus('idle'); setAudioBlob(null); setAudioUrl(null); }

  async function submitRecording() {
    if (!audioBlob || !profile) return;
    setUploading(true);
    setMessage('');
    const mimeType = audioBlob ? audioBlob.type : 'audio/webm';
    const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
    const fileName = `${profile.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('recordings').upload(fileName, audioBlob);
    if (uploadError) { setMessage('Upload failed. Try again.'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(fileName);
    await supabase.from('recordings').insert({
      user_id: profile.id,
      audio_url: urlData.publicUrl,
      note: note,
      status: 'pending',
      prompt_id: selectedPrompt?.id || null,
      prompt_title: selectedPrompt?.title || null,
    });
    setMessage('Recording submitted! Your teacher will review it soon.');
    setStatus('idle');
    setAudioBlob(null);
    setAudioUrl(null);
    setNote('');
    setView('submissions');
    loadSubmissions();
    setUploading(false);
  }

  async function deleteSubmission(id) {
    if (!window.confirm('Delete this recording?')) return;
    setDeleting(id);
    await supabase.from('recordings').delete().eq('id', id);
    setDeleting(null);
    loadSubmissions();
  }

  const typeLabel = { sentence: '📖 Read aloud', question: '❓ Answer question', topic: '🎤 Speak freely' };
  const typeColor = { sentence: '#E8F0FE', question: '#FEF3E2', topic: '#F0E8FE' };
  const typeText = { sentence: '#1A56DB', question: '#E67E22', topic: '#7C3AED' };
  const currentlyDone = filterLevel !== 'all' && filterLesson !== 'all' && isCompleted(filterLevel, filterLesson);

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Pronunciation 🎙️</h1>

      <div style={{ display: 'flex', background: '#E8E8F0', borderRadius: 10, padding: 3, marginBottom: 20, width: 'fit-content' }}>
        {['prompts', 'record', 'submissions'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            background: view === v ? 'var(--red)' : 'transparent',
            color: view === v ? 'white' : 'var(--muted)',
            position: 'relative',
          }}>
            {v === 'prompts' ? '📋 Prompts' : v === 'record' ? '🎙️ Record' : (
              <span style={{ position: 'relative' }}>
                📬 My Submissions
                {newFeedbackCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -8, right: -10,
                    background: 'var(--gold)', color: 'var(--dark)',
                    borderRadius: '50%', width: 16, height: 16,
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{newFeedbackCount}</span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {view === 'prompts' && (
        <div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Level</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {LEVELS.map(l => (
                <button key={l} onClick={() => { setFilterLevel(l); setFilterLesson('all'); }} style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 20, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: 'pointer',
                  border: '2px solid ' + (filterLevel === l ? 'var(--red)' : '#E8E8F0'),
                  background: filterLevel === l ? 'var(--red)' : 'var(--white)',
                  color: filterLevel === l ? 'white' : 'var(--text)',
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
                const done = ls !== 'all' && filterLevel !== 'all' && isCompleted(filterLevel, ls);
                const active = filterLesson === ls;
                return (
                  <button key={ls} onClick={() => setFilterLesson(ls)} style={{
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

          {categories.length > 1 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Category</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {categories.map(c => (
                  <button key={c} onClick={() => setFilterCategory(c)} style={{
                    fontSize: 12, padding: '4px 12px', borderRadius: 20, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: 'pointer',
                    border: '2px solid ' + (filterCategory === c ? 'var(--gold)' : '#E8E8F0'),
                    background: filterCategory === c ? 'var(--gold)' : 'var(--white)',
                    color: filterCategory === c ? 'var(--dark)' : 'var(--text)',
                  }}>
                    {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12, marginTop: 8 }}>{prompts.length} prompt{prompts.length !== 1 ? 's' : ''} — tap one to record:</p>

          {prompts.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎙️</div><p>No prompts for this selection.</p></div>
          ) : prompts.map(p => (
            <div key={p.id} className="card" style={{ marginBottom: 12, cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.2s' }}
              onClick={() => selectPrompt(p)}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--red)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 10 }}>{p.instruction}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ fontSize: 11, background: typeColor[p.type], color: typeText[p.type], padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{typeLabel[p.type]}</span>
                {p.level !== 'all' && <span style={{ fontSize: 11, background: '#FDEAEA', color: 'var(--red)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{p.level}</span>}
                {p.lesson && <span style={{ fontSize: 11, background: '#E8E8F0', color: 'var(--muted)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Lesson {p.lesson}</span>}
                {p.category && <span style={{ fontSize: 11, background: '#E8E8F0', color: 'var(--muted)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{p.category}</span>}
              </div>
              <span className="btn btn-primary btn-sm">🎙️ Record this</span>
            </div>
          ))}

          {filterLevel !== 'all' && filterLesson !== 'all' && (
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
                border: '2px solid ' + (currentlyDone ? '#E8E8F0' : 'var(--red)'),
                background: currentlyDone ? 'var(--white)' : '#FFF0F0',
                color: currentlyDone ? 'var(--muted)' : 'var(--red)',
              }}>
                ↩️ Mark as Incomplete — I want to do it again
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'record' && (
        <div>
          {selectedPrompt && (
            <div className="card" style={{ marginBottom: 16, background: 'var(--dark)', color: 'var(--white)' }}>
              <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Your prompt</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{selectedPrompt.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{selectedPrompt.instruction}</div>
            </div>
          )}
          {message && <div className="alert alert-success">{message}</div>}
          <div className="card">
            <div className="recording-section">
              <button className={`record-btn ${status}`} onClick={status === 'idle' ? startRecording : status === 'recording' ? stopRecording : discardRecording}>
                {status === 'idle' ? '🎙️' : status === 'recording' ? '⏹️' : '🗑️'}
              </button>
              <div className="recording-status">
                {status === 'idle' && 'Tap to start recording'}
                {status === 'recording' && '● Recording... tap to stop'}
                {status === 'done' && 'Recording done — tap 🗑️ to discard'}
              </div>
              {audioUrl && <audio controls src={audioUrl} style={{ width: '100%', marginBottom: 16 }} />}
              {status === 'done' && (
                <>
                  <div className="form-group" style={{ textAlign: 'left' }}>
                    <label>Add a note (optional)</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Any extra info for your teacher..." rows={2} style={{ resize: 'none' }} />
                  </div>
                  <button className="btn btn-primary btn-full" onClick={submitRecording} disabled={uploading}>
                    {uploading ? 'Uploading...' : '📤 Submit for Feedback'}
                  </button>
                </>
              )}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setView('prompts')} style={{ marginTop: 8 }}>← Back to Prompts</button>
        </div>
      )}

      {view === 'submissions' && (
        <div>
          {submissions.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎙️</div><p>No recordings yet!</p></div>
          ) : submissions.map(s => (
            <div key={s.id} className="submission-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  {s.prompt_title && <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, color: 'var(--dark)' }}>📋 {s.prompt_title}</div>}
                  <div className="submission-meta" style={{ marginBottom: 0 }}>
                    {new Date(s.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {s.status === 'pending' ? <span className="pending-badge">Awaiting feedback</span> : <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>✓ Reviewed</span>}
                  </div>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => deleteSubmission(s.id)} disabled={deleting === s.id} style={{ marginLeft: 8, flexShrink: 0 }}>
                  {deleting === s.id ? '...' : '🗑️'}
                </button>
              </div>
              {s.note && <div style={{ fontSize: 14, marginBottom: 8, color: 'var(--text)' }}>📝 {s.note}</div>}
              <audio controls src={s.audio_url} style={{ width: '100%' }} />
              {s.feedback && (
                <div className="feedback-bubble">
                  <strong>Teacher's feedback:</strong> {s.feedback}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
