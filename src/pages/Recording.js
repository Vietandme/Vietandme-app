import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export default function Recording({ profile }) {
  const [status, setStatus] = useState('idle');
  const [note, setNote] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [view, setView] = useState('prompts');
  const [deleting, setDeleting] = useState(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const loadSubmissions = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('recordings').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
    setSubmissions(data || []);
  }, [profile]);

  useEffect(() => {
    loadSubmissions();
    loadPrompts();
  }, [loadSubmissions]);

  async function loadPrompts() {
    const { data } = await supabase.from('recording_prompts').select('*').order('created_at', { ascending: false });
    setPrompts(data || []);
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
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
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
    const fileName = `${profile.id}/${Date.now()}.webm`;
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
          }}>
            {v === 'prompts' ? '📋 Prompts' : v === 'record' ? '🎙️ Record' : '📬 My Submissions'}
          </button>
        ))}
      </div>

      {view === 'prompts' && (
        <div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>Choose a prompt to record:</p>
          {prompts.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎙️</div><p>No prompts yet. Your teacher will add them soon!</p></div>
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
              </div>
              <span className="btn btn-primary btn-sm">🎙️ Record this</span>
            </div>
          ))}
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
              {s.feedback && <div className="feedback-bubble"><strong>Teacher's feedback:</strong> {s.feedback}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
