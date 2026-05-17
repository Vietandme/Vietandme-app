import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export default function Recording({ profile }) {
  const [status, setStatus] = useState('idle');
  const [note, setNote] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const loadSubmissions = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('recordings')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setSubmissions(data || []);
  }, [profile]);

  useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

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

  function stopRecording() {
    if (mediaRef.current) mediaRef.current.stop();
  }

  function discardRecording() {
    setStatus('idle');
    setAudioBlob(null);
    setAudioUrl(null);
  }

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
      status: 'pending'
    });
    setMessage('Recording submitted! Your teacher will review it soon.');
    setStatus('idle');
    setAudioBlob(null);
    setAudioUrl(null);
    setNote('');
    loadSubmissions();
    setUploading(false);
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Pronunciation 🎙️</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Record your voice and your teacher will give you feedback.</p>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card">
        <div className="recording-section">
          <button
            className={`record-btn ${status}`}
            onClick={status === 'idle' ? startRecording : status === 'recording' ? stopRecording : discardRecording}
          >
            {status === 'idle' ? '🎙️' : status === 'recording' ? '⏹️' : '🗑️'}
          </button>
          <div className="recording-status">
            {status === 'idle' && 'Tap to start recording'}
            {status === 'recording' && '● Recording... tap to stop'}
            {status === 'done' && 'Recording done — tap 🗑️ to discard'}
          </div>

          {audioUrl && (
            <audio controls src={audioUrl} style={{ width: '100%', marginBottom: 16 }} />
          )}

          {status === 'done' && (
            <>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label>Add a note (optional)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. I'm practising tones for lesson 3..."
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>
              <button className="btn btn-primary btn-full" onClick={submitRecording} disabled={uploading}>
                {uploading ? 'Uploading...' : '📤 Submit for Feedback'}
              </button>
            </>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>My Submissions</h2>
      {submissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎙️</div>
          <p>No recordings yet. Record your first one above!</p>
        </div>
      ) : submissions.map(s => (
        <div key={s.id} className="submission-card">
          <div className="submission-meta">
            {new Date(s.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {' · '}
            {s.status === 'pending' ? <span className="pending-badge">Awaiting feedback</span> : <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>✓ Reviewed</span>}
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
  );
}
