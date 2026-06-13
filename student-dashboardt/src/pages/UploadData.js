import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../supabaseClient";

// ── Ridge Regression Inference ──────────────────────────────
function runInference(M, studentRow) {
  // الـ features اللي الموديل اتدرب عليها (7 بس)
  const features = [
    parseFloat(studentRow.quiz1_lec) || 0,
    parseFloat(studentRow.quiz2_lec) || 0,
    parseFloat(studentRow.total_lecture) || 0,
    parseFloat(studentRow.quiz1_section) || 0,
    parseFloat(studentRow.quiz2_section) || 0,
    parseFloat(studentRow.total_section) || 0,
    parseFloat(studentRow.midterm) || 0,
  ];

  // Standardize
  const scaled = features.map((v, i) => {
    const scale = M.scale[i];
    return scale !== 0 ? (v - M.mean[i]) / scale : 0;
  });

  // Ridge prediction
  let predFinal = M.intercept;
  scaled.forEach((v, i) => { predFinal += v * M.coef[i]; });
  predFinal = Math.max(0, Math.min(40, predFinal));

  const midterm       = parseFloat(studentRow.midterm) || 0;
  const total_lecture = parseFloat(studentRow.total_lecture) || 0;
  const total_section = parseFloat(studentRow.total_section) || 0;

  const predTotal = Math.max(0, Math.min(100,
    midterm + total_lecture + total_section + predFinal
  ));

  let risk_level;
  if (predTotal >= 85)      risk_level = 'Low Risk';
  else if (predTotal >= 70) risk_level = 'Medium Risk';
  else if (predTotal >= 50) risk_level = 'High Risk';
  else                      risk_level = 'Critical Risk';

  return {
    pass_probability: Math.round(predTotal * 10) / 10,
    fail_probability: Math.round((100 - predTotal) * 10) / 10,
    risk_level,
    predicted_result: predTotal >= 50 ? 1 : 0
  };
}

export default function UploadData({ modelData }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [mode, setMode] = useState('add');

  async function handleUpload() {
    if (!file || !modelData) return;
    setLoading(true);
    setProgress(0);
    setSummary(null);

    try {
      setStatus('📖 جاري قراءة الملف...');
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);

      if (rows.length === 0) {
        setStatus('❌ الملف فاضي!');
        setLoading(false);
        return;
      }

      const subjects = [...new Set(rows.map(r => r.Subject || r.subject).filter(Boolean))];
      setStatus(`📚 وجدت ${subjects.length} مادة: ${subjects.join(', ')}`);

      if (mode === 'replace') {
        setStatus('🗑️ جاري مسح البيانات القديمة...');
        for (const subj of subjects) {
          await supabase.from('predictions').delete().eq('subject', subj);
        }
      }

      const records = [];
      let processed = 0;

      for (const row of rows) {
        const subjectName = row.Subject || row.subject;
        const M = modelData[subjectName];

        if (!M) { processed++; continue; }

        const result = runInference(M, row);

        records.push({
          student_id:       parseInt(row.student_ID || row.student_id) || 0,
          name:             String(row.name || ''),
          subject:          subjectName,
          midterm:          parseFloat(row.midterm) || 0,
          quiz1_lec:        parseFloat(row.quiz1_lec) || 0,
          quiz2_lec:        parseFloat(row.quiz2_lec) || 0,
          total_lecture:    parseFloat(row.total_lecture) || 0,
          quiz1_section:    parseFloat(row.quiz1_section) || 0,
          quiz2_section:    parseFloat(row.quiz2_section) || 0,
          quiz3_section:    parseFloat(row.quiz3_section) || 0,
          total_section:    parseFloat(row.total_section) || 0,
          sw:               parseFloat(row.SW || row.sw) || 0,
          sw_midterm:       parseFloat(row.sw_midterm) || 0,
          final:            parseFloat(row.final) || 0,
          pass_probability: result.pass_probability,
          fail_probability: result.fail_probability,
          risk_level:       result.risk_level,
          predicted_result: result.predicted_result,
        });

        processed++;
        setProgress(Math.round((processed / rows.length) * 80));
      }

      setStatus(`⬆️ جاري رفع ${records.length} طالب...`);
      const batchSize = 100;
      let uploaded = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from('predictions').insert(batch);
        if (error) console.error('Upload error:', error);
        uploaded += batch.length;
        setProgress(80 + Math.round((uploaded / records.length) * 20));
        setStatus(`⬆️ تم رفع ${uploaded} من ${records.length} طالب...`);
      }

      const highRisk = records.filter(r => r.risk_level === 'High Risk' || r.risk_level === 'Critical Risk').length;
      const passed = records.filter(r => r.predicted_result === 1).length;
      const subjectStats = subjects.map(s => ({
        name: s,
        count: records.filter(r => r.subject === s).length,
        highRisk: records.filter(r => r.subject === s && (r.risk_level === 'High Risk' || r.risk_level === 'Critical Risk')).length,
        passed: records.filter(r => r.subject === s && r.predicted_result === 1).length,
      }));

      setSummary({ total: records.length, highRisk, passed, subjects: subjectStats });
      setProgress(100);
      setStatus('✅ تم رفع البيانات بنجاح!');
      setFile(null);

    } catch (err) {
      console.error(err);
      setStatus('❌ حصل خطأ: ' + err.message);
    }

    setLoading(false);
  }

  return (
    <div className="page-fade">
      <div className="dash-hdr">
        <div>
          <h1 className="dash-title">📤 رفع البيانات</h1>
          <p className="dash-sub">ارفع ملف Excel وسيتم تحديث كل البيانات في Supabase تلقائياً</p>
        </div>
      </div>

      <div className="dash-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>📁 اختر ملف Excel</div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[
            { key: 'add',     label: '➕ إضافة للبيانات الموجودة', desc: 'يضيف الطلاب الجدد' },
            { key: 'replace', label: '🔄 استبدال البيانات',         desc: 'يمسح القديم ويضيف الجديد' },
          ].map(m => (
            <div key={m.key} onClick={() => setMode(m.key)} style={{
              flex: 1, padding: 14, borderRadius: 12, cursor: 'pointer',
              border: `2px solid ${mode === m.key ? '#6366f1' : '#e2e8f0'}`,
              background: mode === m.key ? '#eef2ff' : '#f8fafc',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: mode === m.key ? '#6366f1' : '#475569' }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{m.desc}</div>
            </div>
          ))}
        </div>

        <div
          style={{ border: '2px dashed #c7d2fe', borderRadius: 12, padding: 32, textAlign: 'center', background: '#f8faff', cursor: 'pointer', marginBottom: 16 }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById('excel-input').click()}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
            {file ? file.name : 'اسحب ملف Excel هنا أو اضغط للاختيار'}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {file ? `حجم الملف: ${(file.size / 1024).toFixed(1)} KB` : 'يدعم .xlsx و .xls'}
          </div>
          <input id="excel-input" type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])} />
        </div>

        {loading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{status}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>{progress}%</span>
            </div>
            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 4, transition: 'width .3s' }} />
            </div>
          </div>
        )}

        {status && !loading && (
          <div style={{
            padding: '10px 14px', borderRadius: 9, marginBottom: 16,
            background: status.includes('✅') ? '#f0fdf4' : status.includes('❌') ? '#fef2f2' : '#eef2ff',
            color: status.includes('✅') ? '#22c55e' : status.includes('❌') ? '#ef4444' : '#6366f1',
            fontSize: 13, fontWeight: 600,
          }}>
            {status}
          </div>
        )}

        <button onClick={handleUpload} disabled={!file || loading || !modelData} style={{
          width: '100%', padding: 13, borderRadius: 12, border: 'none',
          background: !file || loading || !modelData ? '#e2e8f0' : '#6366f1',
          color: !file || loading || !modelData ? '#94a3b8' : '#fff',
          fontWeight: 800, fontSize: 14, cursor: !file || loading || !modelData ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', transition: 'all .2s',
        }}>
          {loading ? '⏳ جاري الرفع...' : '🚀 رفع وتحديث البيانات'}
        </button>

        {!modelData && (
          <div style={{ fontSize: 12, color: '#f59e0b', textAlign: 'center', marginTop: 8 }}>
            ⚠️ جاري تحميل النموذج...
          </div>
        )}
      </div>

      {summary && (
        <div className="dash-card">
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>🎉 ملخص الرفع</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'إجمالي الطلاب', val: summary.total,                  color: '#6366f1', bg: '#eef2ff', icon: '🎓' },
              { label: 'خطر عالي',       val: summary.highRisk,               color: '#ef4444', bg: '#fef2f2', icon: '🚨' },
              { label: 'متوقع نجاحهم',  val: summary.passed,                 color: '#22c55e', bg: '#f0fdf4', icon: '✅' },
              { label: 'متوقع رسوبهم',  val: summary.total - summary.passed, color: '#f59e0b', bg: '#fffbeb', icon: '❌' },
            ].map((c, i) => (
              <div key={i} style={{ background: c.bg, borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: c.color }}>{c.val}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{c.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>تفاصيل المواد:</div>
          {summary.subjects.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📚</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.count} طالب</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>خطر عالي: {s.highRisk}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>ناجح: {s.passed}</div>
            </div>
          ))}
        </div>
      )}

      <div className="dash-card" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>📋 تعليمات</div>
        {[
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}