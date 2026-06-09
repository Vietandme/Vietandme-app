import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';

export default function AdminUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    setError('');

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      let counts = { flashcards: 0, quiz: 0 };

      if (wb.SheetNames.includes('Flashcards')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['Flashcards']);
        const flashcards = rows.map(r => ({
          vietnamese: r['Vietnamese'] || r['vietnamese'] || '',
          english: r['English'] || r['english'] || '',
          pronunciation: r['Pronunciation'] || r['pronunciation'] || '',
          example: r['Example'] || r['example'] || '',
          level: (r['Level'] || r['level'] || 'beginner').toLowerCase().trim(),
          category: r['Category'] || r['category'] || '',
          lesson: String(r['Lesson'] || r['lesson'] || '').trim().padStart(2, '0').replace(/^0+$/, '') || '',
          audio_url: r['Audio URL'] || r['audio_url'] || '',
        })).filter(f => f.vietnamese && f.english);

        if (flashcards.length > 0) {
          const { error } = await supabase.from('flashcards').insert(flashcards);
          if (!error) counts.flashcards = flashcards.length;
          else setError('Flashcards error: ' + error.message);
        }
      }

      if (wb.SheetNames.includes('Quiz')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['Quiz']);
        const questions = rows.map(r => ({
          question: r['Question'] || r['question'] || '',
          option_a: r['Option A'] || r['option_a'] || '',
          option_b: r['Option B'] || r['option_b'] || '',
          option_c: r['Option C'] || r['option_c'] || '',
          correct_answer: r['Correct Answer'] || r['correct_answer'] || '',
          category: r['Category'] || r['category'] || '',
          audio_url: r['Audio URL'] || r['audio_url'] || '',
          explanation: r['Explanation'] || r['explanation'] || '',
          level: (r['Level'] || r['level'] || 'beginner').toLowerCase().trim(),
          lesson: String(r['Lesson'] || r['lesson'] || '').trim().padStart(2, '0').replace(/^0+$/, '') || '',
        })).filter(q => q.question && q.correct_answer);

        if (questions.length > 0) {
          const { error } = await supabase.from('quiz_questions').insert(questions);
          if (!error) counts.quiz = questions.length;
          else setError('Quiz error: ' + error.message);
        }
      }

      setResult(counts);
    } catch (err) {
      setError('Failed to process file: ' + err.message);
    }
    setUploading(false);
    e.target.value = '';
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Upload Content 📤</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Upload an Excel file with your flashcards and quiz questions.</p>

      {error && <div className="alert alert-error">{error}</div>}
      {result && (
        <div className="alert alert-success">
          ✓ Uploaded: <strong>{result.flashcards} flashcards</strong> and <strong>{result.quiz} quiz questions</strong>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Upload Excel File</h3>
        <div className="upload-area" onClick={() => fileRef.current.click()}>
          <div className="upload-icon">📊</div>
          <div style={{ fontWeight: 600 }}>{uploading ? 'Processing...' : 'Tap to select your Excel file'}</div>
          <div className="upload-hint">.xlsx or .xls files accepted</div>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
      </div>

      <div className="card">
        <h3 className="card-title">📋 Required Format</h3>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--dark)' }}>Sheet 1: "Flashcards"</div>
          <div style={{ background: 'var(--cream)', borderRadius: 8, padding: 10, fontSize: 12, fontFamily: 'monospace', overflowX: 'auto' }}>
            Vietnamese | English | Pronunciation | Example | Level | Category | Lesson | Audio URL
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Level: beginner / pre-intermediate / intermediate / upper-intermediate / advanced</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Lesson: 1–15 · Audio URL: leave blank for now</div>
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--dark)' }}>Sheet 2: "Quiz"</div>
          <div style={{ background: 'var(--cream)', borderRadius: 8, padding: 10, fontSize: 12, fontFamily: 'monospace', overflowX: 'auto' }}>
            Question | Option A | Option B | Option C | Correct Answer | Explanation | Level | Lesson
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Correct Answer must exactly match one of the options · Explanation is optional</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">💡 Tips</h3>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          <p>• You can upload multiple times — new rows are always added on top</p>
          <p>• Lesson numbers like 1, 2, 10 are all fine — no need for leading zeros</p>
          <p>• Leave Audio URL blank — you can add it later via the Cards tab</p>
          <p>• If upload shows 0 items, check your sheet tab names are exactly "Flashcards" and "Quiz"</p>
        </div>
      </div>
    </div>
  );
}
