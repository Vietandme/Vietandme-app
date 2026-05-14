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

      // Process Flashcards sheet
      if (wb.SheetNames.includes('Flashcards')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['Flashcards']);
        const flashcards = rows.map(r => ({
          vietnamese: r['Vietnamese'] || r['vietnamese'] || '',
          english: r['English'] || r['english'] || '',
          pronunciation: r['Pronunciation'] || r['pronunciation'] || '',
          example: r['Example'] || r['example'] || '',
          level: (r['Level'] || r['level'] || 'beginner').toLowerCase(),
          category: r['Category'] || r['category'] || '',
        })).filter(f => f.vietnamese && f.english);

        if (flashcards.length > 0) {
          const { error } = await supabase.from('flashcards').insert(flashcards);
          if (!error) counts.flashcards = flashcards.length;
        }
      }

      // Process Quiz sheet
      if (wb.SheetNames.includes('Quiz')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['Quiz']);
        const questions = rows.map(r => ({
          question: r['Question'] || r['question'] || '',
          option_a: r['Option A'] || r['option_a'] || '',
          option_b: r['Option B'] || r['option_b'] || '',
          option_c: r['Option C'] || r['option_c'] || '',
          option_d: r['Option D'] || r['option_d'] || '',
          correct_answer: r['Correct Answer'] || r['correct_answer'] || '',
          level: (r['Level'] || r['level'] || 'beginner').toLowerCase(),
        })).filter(q => q.question && q.correct_answer);

        if (questions.length > 0) {
          const { error } = await supabase.from('quiz_questions').insert(questions);
          if (!error) counts.quiz = questions.length;
        }
      }

      setResult(counts);
    } catch (err) {
      setError('Failed to process file. Please check the format and try again.');
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
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>Your Excel file needs these sheet names and columns:</p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--dark)' }}>Sheet 1: "Flashcards"</div>
          <div style={{ background: 'var(--cream)', borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'monospace' }}>
            Vietnamese | English | Pronunciation | Example | Level | Category
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Level values: beginner / intermediate / advanced</div>
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--dark)' }}>Sheet 2: "Quiz"</div>
          <div style={{ background: 'var(--cream)', borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'monospace' }}>
            Question | Option A | Option B | Option C | Option D | Correct Answer | Level
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Correct Answer must exactly match one of the options</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">💡 Example Row (Flashcards)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--cream)' }}>
                {['Vietnamese', 'English', 'Pronunciation', 'Level'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', borderBottom: '1px solid #E8E8F0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px 10px' }}>Xin chào</td>
                <td style={{ padding: '8px 10px' }}>Hello</td>
                <td style={{ padding: '8px 10px' }}>sin chow</td>
                <td style={{ padding: '8px 10px' }}>beginner</td>
              </tr>
              <tr style={{ background: 'var(--cream)' }}>
                <td style={{ padding: '8px 10px' }}>Cảm ơn</td>
                <td style={{ padding: '8px 10px' }}>Thank you</td>
                <td style={{ padding: '8px 10px' }}>kahm uhn</td>
                <td style={{ padding: '8px 10px' }}>beginner</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
