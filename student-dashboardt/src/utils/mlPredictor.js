// JS Ridge Model - يحسب prediction من coefficients
export function predictStudent(studentData, subject, ridgeModels) {
  const model = ridgeModels[subject];
  if (!model) return null;

  const features = [
    studentData.quiz1_lec || 0,
    studentData.quiz2_lec || 0,
    studentData.total_lecture || 0,
    studentData.quiz1_section || 0,
    studentData.quiz2_section || 0,
    studentData.total_section || 0,
    studentData.midterm || 0,
  ];

  // Standardize features
  const standardized = features.map((val, i) => {
    const mean = model.mean[i];
    const scale = model.scale[i];
    return scale !== 0 ? (val - mean) / scale : 0;
  });

  // Calculate prediction
  let predFinal = model.intercept;
  standardized.forEach((val, i) => {
    predFinal += val * model.coef[i];
  });

  // Clamp to valid range
  predFinal = Math.max(0, Math.min(40, predFinal));

  // Estimate total (simple heuristic - تقدر تعدلها)
  const predTotal = studentData.midterm + studentData.total_lecture + 
                    studentData.total_section + predFinal;

  // Risk level
  let risk;
  if (predTotal >= 85) risk = "Low Risk";
  else if (predTotal >= 70) risk = "Medium Risk";
  else if (predTotal >= 50) risk = "High Risk";
  else risk = "Critical Risk";

  // Recommendations
  const recs = [];
  if (studentData.midterm < 12) recs.push("Midterm critically low — intensive review required");
  else if (studentData.midterm < 16) recs.push("Midterm below average — focus on weak topics");
  
  if (studentData.total_lecture < 8) recs.push("Lecture participation very low — attend all sessions");
  else if (studentData.total_lecture < 14) recs.push("Lecture score improvable — engage more actively");
  
  if (studentData.total_section < 6) recs.push("Section score very weak — practice exercises regularly");
  else if (studentData.total_section < 12) recs.push("Section performance needs improvement");
  
  if (predTotal < 50) recs.push("⚠️ High fail risk — meet advisor urgently");
  if (recs.length === 0) recs.push("Good standing — maintain current performance");

  return {
    predFinal: Math.round(predFinal * 10) / 10,
    predTotal: Math.round(predTotal * 10) / 10,
    risk,
    recommendations: recs,
    passProbability: Math.round((predTotal / 100) * 100),
  };
}

export function getRiskColor(risk) {
  if (risk === "Critical Risk") return "#ef4444";
  if (risk === "High Risk") return "#f59e0b";
  if (risk === "Medium Risk") return "#eab308";
  return "#10b981";
}

export function getRiskBg(risk) {
  if (risk === "Critical Risk") return "rgba(239,68,68,0.15)";
  if (risk === "High Risk") return "rgba(245,158,11,0.15)";
  if (risk === "Medium Risk") return "rgba(234,179,8,0.15)";
  return "rgba(16,185,129,0.15)";
}