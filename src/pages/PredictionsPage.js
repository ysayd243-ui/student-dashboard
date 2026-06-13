import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getRiskColor, getRiskBg } from '../utils/mlPredictor';

const theme = {
  bg: '#f8fafc', surface: '#ffffff', surface2: '#f1f5f9',
  border: '#e2e8f0', accent: '#6366f1', danger: '#ef4444',
  warn: '#f59e0b', safe: '#22c55e', text: '#1e293b', muted: '#94a3b8',
};

export default function PredictionsPage({ userRole, userProfile }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [predictions, setPredictions] = useState([]);
  const [ridgeModels, setRidgeModels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('All');

  const [formData, setFormData] = useState({
    quiz1_lec: '', quiz2_lec: '', total_lecture: '',
    quiz1_section: '', quiz2_section: '', total_section: '', midterm: ''
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [predSubject, setPredSubject] = useState('Linear');

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortBy, setSortBy] = useState('pass_probability_desc');

  useEffect(() => { loadData(); }, [userRole, userProfile]);

  async function loadData() {
    setLoading(true);

    // تحميل الموديل
    try {
      const res = await fetch('/ridge_models.json');
      const models = await res.json();
      setRidgeModels(models);
    } catch (e) { console.error('Failed to load ridge models:', e); }

    // ✅ الحل: جيب كل الداتا بـ pagination صحيح بدون limit
    let all = [], from = 0, limit = 5000; // زودت الـ limit لـ 5000
    while (true) {
      let query = supabase.from('predictions').select('*');
      if (userRole === 'advisor' && userProfile?.student_ids?.length > 0)
        query = query.in('student_id', userProfile.student_ids);
      
      // ✅ مفيش .limit() هنا - range بس
      const { data: chunk, error } = await query.range(from, from + limit - 1).limit(limit);
      if (error) { console.error('Supabase error:', error); break; }
      if (!chunk || chunk.length === 0) break;
      all = [...all, ...chunk];
      if (chunk.length < limit) break;
      from += limit;
    }

    console.log('✅ Total predictions loaded:', all.length);
    console.log('📚 Unique subjects:', [...new Set(all.map(p => p.subject))]);

    setPredictions(all);
    setLoading(false);
  }

  // subjects من الداتا الفعلية
  const subjects = [...new Set(predictions.map(p => p.subject).filter(Boolean))].sort();

  // ✅ فلتر بالـ subject - شيلت أي limit زيادة
  const filtered_by_subject = selectedSubject === 'All'
    ? predictions
    : predictions.filter(p => (p.subject || '').trim() === selectedSubject.trim());

  // ✅ إحصائيات على كل الداتا المفلترة
  const stats = {
    total: filtered_by_subject.length,
    lowRisk: filtered_by_subject.filter(p =>
      p.risk_level === 'Low Risk' || p.risk_level === 'خطر منخفض').length,
    mediumRisk: filtered_by_subject.filter(p =>
      p.risk_level === 'Medium Risk' || p.risk_level === 'خطر متوسط').length,
    highRisk: filtered_by_subject.filter(p =>
      p.risk_level === 'High Risk' || p.risk_level === 'Critical Risk' || p.risk_level === 'خطر عالي').length,
    avgTotal: filtered_by_subject.length
      ? (filtered_by_subject.reduce((a, p) => a + (p.pass_probability || 0), 0) / filtered_by_subject.length).toFixed(1)
      : 0,
    passRate: filtered_by_subject.length
      ? ((filtered_by_subject.filter(p => p.predicted_result === 1).length / filtered_by_subject.length) * 100).toFixed(1)
      : 0,
  };

  // ✅ فلتر الـ students table - شيلت أي حدود
  const filtered = filtered_by_subject
    .filter(p => {
      const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.student_id || '').toString().includes(search);
      const matchRisk = riskFilter === 'All' || p.risk_level === riskFilter;
      return matchSearch && matchRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'pass_probability_desc': return (b.pass_probability || 0) - (a.pass_probability || 0);
        case 'pass_probability_asc':  return (a.pass_probability || 0) - (b.pass_probability || 0);
        case 'midterm_desc': return (b.midterm || 0) - (a.midterm || 0);
        case 'name_asc': return (a.name || '').localeCompare(b.name || '');
        default: return 0;
      }
    });

  // ✅ pagination للـ table لو الداتا كبيرة جداً
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100; // عرض 100 في الصفحة
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Predict Tab
  function handlePredict() {
    if (!ridgeModels) return;
    const M = ridgeModels[predSubject];
    if (!M) { setPredictionResult({ error: 'Model not found for ' + predSubject }); return; }

    const features = [
      Number(formData.quiz1_lec) || 0,
      Number(formData.quiz2_lec) || 0,
      Number(formData.total_lecture) || 0,
      Number(formData.quiz1_section) || 0,
      Number(formData.quiz2_section) || 0,
      Number(formData.total_section) || 0,
      Number(formData.midterm) || 0,
    ];

    const scaled = features.map((v, i) => M.scale[i] !== 0 ? (v - M.mean[i]) / M.scale[i] : 0);
    let predFinal = M.intercept;
    scaled.forEach((v, i) => { predFinal += v * M.coef[i]; });
    predFinal = Math.max(0, Math.min(40, predFinal));

    const predTotal = Math.max(0, Math.min(100,
      Number(formData.midterm) + Number(formData.total_lecture) + Number(formData.total_section) + predFinal
    ));

    let risk;
    if (predTotal >= 85) risk = 'Low Risk';
    else if (predTotal >= 70) risk = 'Medium Risk';
    else if (predTotal >= 50) risk = 'High Risk';
    else risk = 'Critical Risk';

    const recs = [];
    if (Number(formData.midterm) < 12) recs.push('Midterm critically low — intensive review required');
    else if (Number(formData.midterm) < 16) recs.push('Midterm below average — focus on weak topics');
    if (Number(formData.total_lecture) < 8) recs.push('Lecture participation very low — attend all sessions');
    if (Number(formData.total_section) < 6) recs.push('Section score very weak — practice regularly');
    if (predTotal < 50) recs.push('⚠️ High fail risk — meet advisor urgently');
    if (recs.length === 0) recs.push('Good standing — maintain current performance');

    setPredictionResult({
      predFinal: Math.round(predFinal * 10) / 10,
      predTotal: Math.round(predTotal * 10) / 10,
      risk,
      recommendations: recs,
    });
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
      <div style={{ fontSize: 32 }}>🤖</div>
      <div style={{ fontSize: 14, color: theme.muted }}>Loading predictions...</div>
    </div>
  );

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: 'Inter, sans-serif' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 24px', borderBottom: `1px solid ${theme.border}`, background: theme.surface, flexWrap: 'wrap' }}>
        {[
          { key: 'overview', label: 'Overview', icon: '📊' },
          { key: 'students', label: 'Students', icon: '👥' },
          { key: 'predict',  label: 'Predict',  icon: '🤖' },
          { key: 'alerts',   label: 'Alerts',   icon: '⚠️' },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: activeTab === tab.key ? '#eef2ff' : 'transparent',
            color: activeTab === tab.key ? theme.accent : theme.muted,
            cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ padding: '28px 32px' }}>
          <div className="dash-hdr">
            <div>
              <h1 className="dash-title">Student Performance Warning System</h1>
              <p className="dash-sub">
                ML-powered academic risk detection across all subjects
                <span style={{ marginLeft: 12, background: '#eef2ff', color: theme.accent, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {predictions.length} total students
                </span>
              </p>
            </div>
          </div>

          {/* Subject Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {['All', ...subjects].map(sub => (
              <button key={sub} onClick={() => setSelectedSubject(sub)} style={{
                padding: '8px 20px', borderRadius: 8,
                border: `2px solid ${selectedSubject === sub ? theme.accent : theme.border}`,
                background: selectedSubject === sub ? '#eef2ff' : theme.surface,
                color: selectedSubject === sub ? theme.accent : theme.muted,
                cursor: 'pointer', fontSize: 13, fontWeight: selectedSubject === sub ? 700 : 500,
              }}>
                {sub}
                {sub !== 'All' && (
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
                    ({predictions.filter(p => (p.subject || '').trim() === sub.trim()).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="stat-grid" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Students',       value: stats.total,           sub: selectedSubject === 'All' ? 'All subjects' : selectedSubject, color: theme.accent, bg: '#eef2ff', icon: '🎓' },
              { label: 'Low Risk',             value: stats.lowRisk,         sub: `${stats.total ? ((stats.lowRisk/stats.total)*100).toFixed(0) : 0}% of class`,    color: theme.safe,   bg: '#f0fdf4', icon: '✅' },
              { label: 'Medium Risk',          value: stats.mediumRisk,      sub: `${stats.total ? ((stats.mediumRisk/stats.total)*100).toFixed(0) : 0}% of class`, color: theme.warn,   bg: '#fffbeb', icon: '⚠️' },
              { label: 'High Risk',            value: stats.highRisk,        sub: `${stats.total ? ((stats.highRisk/stats.total)*100).toFixed(0) : 0}% of class`,   color: theme.danger, bg: '#fef2f2', icon: '🚨' },
              { label: 'Avg Pass Probability', value: stats.avgTotal + '%',  sub: 'predicted',     color: theme.accent, bg: '#eef2ff', icon: '📊' },
              { label: 'Pass Rate',            value: stats.passRate + '%',  sub: 'predicted',     color: theme.safe,   bg: '#f0fdf4', icon: '🏆' },
            ].map((stat, i) => (
              <div key={i} className="stat-card-l">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: theme.muted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: stat.color, letterSpacing: -1 }}>{stat.value}</div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{stat.icon}</div>
                </div>
                <div style={{ fontSize: 11, color: theme.muted }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          <div className="dash-card">
            <div style={{ fontSize: 14, fontWeight: 800, color: theme.text, marginBottom: 16 }}>📊 Risk Distribution</div>
            {['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'].map(risk => {
              const count = filtered_by_subject.filter(p => p.risk_level === risk).length;
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={risk} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{risk}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: getRiskColor(risk) }}>
                      {count} <span style={{ color: theme.muted, fontWeight: 400 }}>({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: theme.surface2, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: getRiskColor(risk), transition: 'width 1s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STUDENTS */}
      {activeTab === 'students' && (
        <div style={{ padding: '28px 32px' }}>
          <div className="dash-hdr">
            <div>
              <h1 className="dash-title">Student Results</h1>
              <p className="dash-sub">ML predictions and risk classification</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: theme.surface2, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '8px 14px' }}>
              <span style={{ color: theme.muted }}>🔍</span>
              <input type="text" placeholder="Search by name or ID..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                style={{ border: 'none', outline: 'none', background: 'none', fontSize: 13, color: theme.text, width: '100%', fontFamily: 'inherit' }} />
            </div>
            <select value={riskFilter} onChange={e => { setRiskFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12, color: theme.text, background: theme.surface, fontFamily: 'inherit', outline: 'none' }}>
              <option value="All">All Risk Levels</option>
              <option value="Low Risk">Low Risk</option>
              <option value="Medium Risk">Medium Risk</option>
              <option value="High Risk">High Risk</option>
              <option value="Critical Risk">Critical Risk</option>
            </select>
            <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setCurrentPage(1); }}
              style={{ padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12, color: theme.text, background: theme.surface, fontFamily: 'inherit', outline: 'none' }}>
              <option value="All">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12, color: theme.text, background: theme.surface, fontFamily: 'inherit', outline: 'none' }}>
              <option value="pass_probability_desc">Pass % ↓</option>
              <option value="pass_probability_asc">Pass % ↑</option>
              <option value="midterm_desc">Midterm ↓</option>
              <option value="name_asc">Name A-Z</option>
            </select>
            <div style={{ background: theme.surface2, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: theme.muted, display: 'flex', alignItems: 'center' }}>
              {filtered.length} / {predictions.length} students
            </div>
          </div>

          <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, background: theme.surface2 }}>
                    {['ID', 'Name', 'Subject', 'Midterm', 'Pass %', 'Risk Level', 'Prediction'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.muted, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((s, i) => (
                    <tr key={s.id || i} style={{ borderBottom: `1px solid ${theme.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = theme.surface2}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: theme.muted, fontFamily: 'monospace' }}>{s.student_id}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: theme.text }}>{s.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: theme.muted }}>{s.subject}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: theme.text }}>{s.midterm}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 50, height: 5, background: theme.surface2, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${s.pass_probability}%`, height: '100%', background: s.pass_probability >= 80 ? theme.safe : s.pass_probability >= 60 ? theme.warn : theme.danger, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: s.pass_probability >= 80 ? theme.safe : s.pass_probability >= 60 ? theme.warn : theme.danger }}>{s.pass_probability}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: getRiskBg(s.risk_level), color: getRiskColor(s.risk_level) }}>
                          {s.risk_level}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: s.predicted_result === 1 ? theme.safe : theme.danger }}>
                        {s.predicted_result === 1 ? '✅ Pass' : '❌ Fail'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: theme.muted, fontSize: 13 }}>No students found</div>
              )}
            </div>
            
            {/* ✅ Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '16px', borderTop: `1px solid ${theme.border}` }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.surface, color: currentPage === 1 ? theme.muted : theme.text, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: 12, color: theme.muted }}>
                  Page {currentPage} of {totalPages} ({filtered.length} total)
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.surface, color: currentPage === totalPages ? theme.muted : theme.text, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 12 }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREDICT */}
      {activeTab === 'predict' && (
        <div style={{ padding: '28px 32px' }}>
          <div className="dash-hdr">
            <div>
              <h1 className="dash-title">Predict Student</h1>
              <p className="dash-sub">Enter scores to get instant AI prediction</p>
            </div>
          </div>

          <div className="dash-card" style={{ maxWidth: 800 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.muted, fontWeight: 700, display: 'block', marginBottom: 8 }}>Subject</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Linear', 'Big Data'].map(sub => (
                  <button key={sub} onClick={() => setPredSubject(sub)} style={{
                    padding: '8px 20px', borderRadius: 8,
                    border: `2px solid ${predSubject === sub ? theme.accent : theme.border}`,
                    background: predSubject === sub ? '#eef2ff' : theme.surface2,
                    color: predSubject === sub ? theme.accent : theme.muted,
                    cursor: 'pointer', fontSize: 13, fontWeight: predSubject === sub ? 700 : 500, fontFamily: 'inherit',
                  }}>{sub}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { field: 'quiz1_lec',     label: 'Quiz 1 (Lecture)',  max: 10 },
                { field: 'quiz2_lec',     label: 'Quiz 2 (Lecture)',  max: 10 },
                { field: 'total_lecture', label: 'Total Lecture',     max: 20 },
                { field: 'quiz1_section', label: 'Quiz 1 (Section)',  max: 10 },
                { field: 'quiz2_section', label: 'Quiz 2 (Section)',  max: 10 },
                { field: 'total_section', label: 'Total Section',     max: 20 },
                { field: 'midterm',       label: 'Midterm',           max: 20 },
              ].map(input => (
                <div key={input.field} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.muted, fontWeight: 700 }}>{input.label}</label>
                  <input type="number" min="0" max={input.max} value={formData[input.field]}
                    onChange={e => setFormData(prev => ({ ...prev, [input.field]: e.target.value }))}
                    placeholder={`0-${input.max}`}
                    style={{ background: theme.surface2, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '10px 14px', color: theme.text, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  <span style={{ fontSize: 11, color: theme.muted }}>Max: {input.max}</span>
                </div>
              ))}
            </div>

            <button onClick={handlePredict} disabled={!ridgeModels} style={{
              padding: '12px 32px', background: theme.accent, border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              opacity: ridgeModels ? 1 : 0.5, boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
            }}>
              {ridgeModels ? 'Predict Now →' : 'Loading Model...'}
            </button>

            {predictionResult && (
              <div style={{ marginTop: 24, padding: 24, background: theme.surface2, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: 'Predicted Final (40)',  value: predictionResult.predFinal,  color: theme.accent },
                    { label: 'Predicted Total (100)', value: predictionResult.predTotal,  color: theme.accent },
                    { label: 'Risk Level',            value: predictionResult.risk,       color: getRiskColor(predictionResult.risk) },
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: 16, background: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}` }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: 11, color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 16, background: '#eef2ff', borderRadius: 8, borderLeft: `3px solid ${theme.accent}` }}>
                  <h4 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.accent, marginBottom: 10 }}>Recommendations</h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {predictionResult.recommendations?.map((rec, i) => (
                      <li key={i} style={{ fontSize: 13, color: theme.text, display: 'flex', gap: 8 }}>
                        <span style={{ color: theme.accent }}>→</span>{rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALERTS */}
      {activeTab === 'alerts' && (
        <div style={{ padding: '28px 32px' }}>
          <div className="dash-hdr">
            <div>
              <h1 className="dash-title">⚠️ Alerts</h1>
              <p className="dash-sub">High risk students that need attention</p>
            </div>
          </div>
          <div className="dash-card">
            {predictions.filter(p => p.risk_level === 'High Risk' || p.risk_level === 'Critical Risk').length === 0
              ? <p style={{ color: theme.muted, fontSize: 13 }}>🎉 No high risk students!</p>
              : predictions
                  .filter(p => p.risk_level === 'High Risk' || p.risk_level === 'Critical Risk')
                  .map((s, i) => (
                <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${theme.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: theme.danger }}>
                    {(s.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: theme.muted }}>{s.subject} · ID: {s.student_id}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#fef2f2', color: theme.danger }}>{s.risk_level}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: theme.danger }}>{s.pass_probability}%</span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}