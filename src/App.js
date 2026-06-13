import React, { useState, useEffect } from "react";
import "./App.css";
import { MdDashboard, MdPeople, MdChecklist, MdNotifications, MdBarChart, MdSettings, MdLogout, MdPictureAsPdf, MdAutoGraph } from "react-icons/md";
import sphinxLogo from "./sphinx-logo.jpeg";
import PredictionsPageFull from "./pages/PredictionsPage";
import UploadData from "./pages/UploadData";
import { supabase } from './supabaseClient';

const navItems = [
  { key:"dashboard",     label:"Home",            icon:"🏠" },
  { key:"students",      label:"Students",        icon:"👥" },
  { key:"notifications", label:"Notifications",   icon:"🔔" },
  { key:"reports",       label:"Reports",         icon:"📊" },
  { key:"settings",      label:"Settings",        icon:"⚙️" },
  { key:"predictions",   label:"AI Predictions",  icon:"🤖" },
  { key:"upload",        label:"Upload Data",     icon:"📤" },
];

const statusColor = s => s==="High Risk"?"#ef4444":s==="At Risk"?"#f59e0b":"#22c55e";
const statusBg    = s => s==="High Risk"?"#fef2f2":s==="At Risk"?"#fffbeb":"#f0fdf4";
const barColor    = p => p>=85?"#22c55e":p>=70?"#f59e0b":"#ef4444";
const gradeColor  = g => g==="A"?"#22c55e":g==="B"?"#6366f1":g==="C"?"#f59e0b":g==="D"?"#f97316":"#ef4444";

const riskColor = (r) => {
  if (r === "Critical Risk") return "#ef4444";
  if (r === "High Risk") return "#f59e0b";
  if (r === "Medium Risk") return "#f59e0b";
  if (r === "Low Risk") return "#22c55e";
  return "#6366f1";
};

const AV_COLORS = [
  ["#eef2ff","#6366f1"],["#f0fdf4","#22c55e"],["#fff7ed","#f97316"],
  ["#fdf2f8","#ec4899"],["#eff6ff","#3b82f6"],["#fefce8","#eab308"],
];
function Av({ name="?", i=0, size=36 }) {
  const [bg,fg] = AV_COLORS[i % AV_COLORS.length];
  const ini = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:fg,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*0.32,fontWeight:800,flexShrink:0,border:`2px solid ${fg}22`}}>
      {ini}
    </div>
  );
}

function MiniChart() {
  const pts=[30,45,38,55,48,62,58,72,65,80,74,88];
  const w=260,h=55,pad=4;
  const min=Math.min(...pts),max=Math.max(...pts);
  const coords=pts.map((v,i)=>{
    const x=pad+(i/(pts.length-1))*(w-2*pad);
    const y=h-pad-((v-min)/(max-min))*(h-2*pad);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{marginTop:10,display:"block",width:"100%"}}>
      <defs><linearGradient id="lcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity=".2"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0"/></linearGradient></defs>
      <polyline points={`${pad},${h} ${coords} ${w-pad},${h}`} fill="url(#lcg)"/>
      <polyline points={coords} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ══ LANDING ══ */
function LandingPage({ onEnter }) {
  return (
    <div className="lp">
      <nav className="lp-nav">
        <div className="lp-nav-in">
          <div className="lp-logo"><img src={sphinxLogo} alt="S" className="lp-logo-img"/><span className="lp-logo-txt">SPHINX</span></div>
          <div className="lp-links">
            {["Product","Solutions","Pricing","About"].map(l=><button key={l} className="lp-link">{l}</button>)}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="lp-ghost" onClick={onEnter}>Sign In</button>
            <button className="lp-pri" onClick={onEnter}>Get Started Free →</button>
          </div>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-badge"><span className="lp-dot"/>NEW — Version 2.0 is live!</div>
        <h1 className="lp-h1">Monitor. Analyze.<br/><span style={{color:"#6366f1"}}>Elevate Students.</span></h1>
        <p className="lp-sub">The all-in-one academic performance platform to track attendance, detect risk, and boost student outcomes — in real time.</p>
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap",marginBottom:12}}>
          <button className="lp-pri-lg" onClick={onEnter}>Get Started Free →</button>
          <button className="lp-out">▶ Watch Demo</button>
        </div>
        <p style={{fontSize:12,color:"#94a3b8",marginBottom:50}}>Trusted by 500+ universities worldwide</p>
        <div className="lp-preview-wrap">
          <div className="lp-card lp-card-main">
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <span style={{fontWeight:700,fontSize:13,color:"#1e293b"}}>Dashboard Overview</span>
              <span style={{fontSize:11,color:"#94a3b8"}}>● Live</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:4}}>
              {[["Total","248","#6366f1"],["On Track","189","#22c55e"],["At Risk","41","#f59e0b"],["High Risk","18","#ef4444"]].map(([l,v,c])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{fontSize:10,color:"#94a3b8"}}>{l}</div>
                  <div style={{fontSize:20,fontWeight:900,color:"#1e293b"}}>{v}</div>
                  <div style={{height:3,background:"#f1f5f9",borderRadius:2,marginTop:4}}>
                    <div style={{width:`${parseInt(v)/248*100}%`,height:"100%",background:c,borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>
            <MiniChart/>
          </div>
        </div>
      </section>

      <div className="lp-logos">
        <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:2,marginBottom:16}}>Trusted by leading universities</div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          {["Cairo University","AUC","Sphinx Uni","Ain Shams","Alexandria Uni","Helwan Uni"].map(l=>(
            <div key={l} style={{padding:"7px 16px",borderRadius:20,background:"#f8fafc",border:"1px solid #e2e8f0",fontSize:12,fontWeight:600,color:"#64748b"}}>{l}</div>
          ))}
        </div>
      </div>

      <section className="lp-features">
        <div style={{fontSize:12,fontWeight:700,color:"#6366f1",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Why Sphinx?</div>
        <h2 style={{fontSize:"clamp(26px,3vw,40px)",fontWeight:900,color:"#1e293b",letterSpacing:-1,marginBottom:48}}>Everything you need to run<br/>a smarter institution</h2>
        <div className="lp-feat-grid">
          {[
            {icon:"📊",title:"Real-time Analytics",desc:"Live dashboards showing attendance, grades, and risk levels updated instantly.",color:"#6366f1"},
            {icon:"🚨",title:"AI Risk Detection",desc:"Automatically flag students showing signs of academic struggle before it's too late.",color:"#ef4444"},
            {icon:"📋",title:"Smart Reports",desc:"One-click PDF reports on any student or department. Export and share instantly.",color:"#22c55e"},
            {icon:"🔔",title:"Instant Alerts",desc:"Get notified the moment a student misses class or fails an assignment.",color:"#f59e0b"},
            {icon:"🎓",title:"Grade Tracking",desc:"Monitor GPA trends, assignment submissions, and exam results across all subjects.",color:"#06b6d4"},
            {icon:"🔒",title:"Secure & Compliant",desc:"Enterprise-grade security with role-based access for admins and doctors.",color:"#ec4899"},
          ].map((f,i)=>(
            <div key={i} className="lp-feat-card">
              <div style={{width:48,height:48,borderRadius:14,background:f.color+"12",color:f.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:16}}>{f.icon}</div>
              <h3 style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:8}}>{f.title}</h3>
              <p style={{fontSize:13,color:"#64748b",lineHeight:1.7}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-cta">
        <div className="lp-cta-in">
          <span style={{fontSize:36}}>🚀</span>
          <div style={{flex:1}}>
            <h2 style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:4}}>Ready to transform your institution?</h2>
            <p style={{fontSize:13,color:"rgba(255,255,255,.8)"}}>Join thousands of educators already using Sphinx.</p>
          </div>
          <button style={{padding:"12px 26px",borderRadius:11,border:"none",background:"#fff",color:"#6366f1",fontWeight:800,fontSize:13,cursor:"pointer",flexShrink:0}} onClick={onEnter}>Get Started Free →</button>
        </div>
      </section>

      <footer style={{maxWidth:1100,margin:"0 auto",padding:"24px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #f1f5f9"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:900,fontSize:15,color:"#1e293b",letterSpacing:2}}>
          <img src={sphinxLogo} alt="S" style={{width:28,height:28,borderRadius:"50%",objectFit:"cover"}}/>SPHINX
        </div>
        <p style={{fontSize:12,color:"#94a3b8"}}>© 2025 Sphinx University Platform · All rights reserved</p>
      </footer>
    </div>
  );
}

/* ══ DASHBOARD PAGES ══ */
function DashboardPage({ userProfile, darkMode }) {
  const [stats,setStats]=useState({total:0,highRisk:0,passRate:0,failRate:0});
  const [topRisk,setTopRisk]=useState([]);
  const [riskDist,setRiskDist]=useState({});
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      let all=[], from=0, limit=1000;
      while(true){
        const {data:chunk}=await supabase.from("predictions").select("*").range(from,from+limit-1);
        if(!chunk||chunk.length===0) break;
        all=[...all,...chunk];
        if(chunk.length<limit) break;
        from+=limit;
      }
      if(all.length>0){
        const total=all.length;
        const highRisk=all.filter(s=>s.risk_level==="Critical Risk").length;
        const passed=all.filter(s=>s.predicted_result===1).length;
        const failed=all.filter(s=>s.predicted_result===0).length;
        setStats({total,highRisk,passRate:Math.round(passed/total*100),failRate:Math.round(failed/total*100)});
        setTopRisk(all.filter(s=>s.risk_level==="Critical Risk").slice(0,5));
        setRiskDist({
          "Critical Risk": all.filter(s=>s.risk_level==="Critical Risk").length,
          "High Risk": all.filter(s=>s.risk_level==="High Risk").length,
          "Medium Risk": all.filter(s=>s.risk_level==="Medium Risk").length,
          "Low Risk": all.filter(s=>s.risk_level==="Low Risk").length,
        });
      }
      setLoading(false);
    })();
  },[]);

  if(loading) return <div className="loading">Loading...</div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const txt = darkMode?'#e2e8f0':'#1e293b';
  const sub = darkMode?'#94a3b8':'#475569';

  return (
    <div className="page-fade">
      <div className="dash-hdr">
        <div><h1 className="dash-title">{greeting}, {userProfile?.name||"Admin"} 👋</h1><p className="dash-sub">Here's what's happening with your students today.</p></div>
        <button className="btn-pri">＋ New Report</button>
      </div>
      <div className="stat-grid">
        {[
          {label:"Total Students",   val:stats.total,        trend:"from ML predictions", icon:"🎓",color:"#6366f1",bg:"#eef2ff"},
          {label:"High Risk",        val:stats.highRisk,     trend:"needs attention",     icon:"🚨",color:"#ef4444",bg:"#fef2f2"},
          {label:"Expected to Pass", val:stats.passRate+"%", trend:"ML prediction",       icon:"✅",color:"#22c55e",bg:"#f0fdf4"},
          {label:"Expected to Fail", val:stats.failRate+"%", trend:"ML prediction",       icon:"❌",color:"#f59e0b",bg:"#fffbeb"},
        ].map((c,i)=>(
          <div key={i} className="stat-card-l">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <div style={{fontSize:12,color:"#64748b",fontWeight:600,marginBottom:6}}>{c.label}</div>
                <div style={{fontSize:32,fontWeight:900,color:txt,letterSpacing:-1}}>{c.val}</div>
              </div>
              <div style={{width:42,height:42,borderRadius:12,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{c.icon}</div>
            </div>
            <div style={{fontSize:11,color:c.color,fontWeight:600}}>{c.trend}</div>
          </div>
        ))}
      </div>
      <div className="two-col">
        <div className="dash-card">
          <div style={{fontSize:14,fontWeight:800,color:txt,marginBottom:16}}>⚠️ Critical Risk Students</div>
          {topRisk.map((s,i)=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<topRisk.length-1?`1px solid ${darkMode?'#334155':'#f1f5f9'}`:"none"}}>
              <Av name={s.name||"?"} i={i} size={34}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:txt}}>{s.name}</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>{s.subject}</div>
              </div>
              <div style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:"#fef2f2",color:"#ef4444"}}>Critical Risk</div>
              <div style={{fontSize:12,fontWeight:800,color:"#ef4444"}}>{s.pass_probability}%</div>
            </div>
          ))}
          {topRisk.length===0&&<div style={{textAlign:"center",padding:20,color:"#94a3b8",fontSize:13}}>No high risk students 🎉</div>}
        </div>
        <div className="dash-card">
          <div style={{fontSize:14,fontWeight:800,color:txt,marginBottom:16}}>📊 Risk Distribution</div>
          {[["Critical Risk","#ef4444"],["High Risk","#f59e0b"],["Medium Risk","#6366f1"],["Low Risk","#22c55e"]].map(([s,c])=>{
            const count=riskDist[s]||0;
            const total=Object.values(riskDist).reduce((a,b)=>a+b,0);
            return (
              <div key={s} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:12,fontWeight:600,color:sub}}>{s}</span>
                  <span style={{fontSize:12,fontWeight:800,color:c}}>{count}</span>
                </div>
                <div style={{height:6,background:darkMode?'#334155':"#f1f5f9",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${total?(count/total)*100:0}%`,height:"100%",background:c,borderRadius:3}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function StudentsPage({ userRole, userProfile, darkMode }) {
  const [students,setStudents]=useState([]);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("All");
  const [subject,setSubject]=useState("All");
  const [subjects,setSubjects]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      let query = supabase.from("predictions").select("*");
      if(userRole==="doctor" && userProfile?.subject) query = query.eq("subject", userProfile.subject);
      else if(userRole==="assistant" && userProfile?.sections) query = query.in("section", userProfile.sections);
      else if(userRole==="advisor" && userProfile?.student_ids) query = query.in("student_id", userProfile.student_ids);
      let all=[], from=0, limit=1000;
      while(true){
        const {data:chunk}=await query.range(from,from+limit-1);
        if(!chunk||chunk.length===0) break;
        all=[...all,...chunk];
        if(chunk.length<limit) break;
        from+=limit;
      }
      setStudents(all);
      setSubjects([...new Set(all.map(s=>s.subject).filter(Boolean))]);
      setLoading(false);
    })();
  },[userRole, userProfile]);

  const visible=students.filter(s=>
    s.name?.toLowerCase().includes(search.toLowerCase())&&
    (filter==="All"||s.risk_level===filter)&&
    (subject==="All"||s.subject===subject)
  );

  const del=async(id)=>{
    await supabase.from("predictions").delete().eq("id",id);
    setStudents(prev=>prev.filter(s=>s.id!==id));
  };

  const barColor=p=>p>=80?"#22c55e":p>=60?"#f59e0b":"#ef4444";
  const riskColorF=r=>r==="Critical Risk"?"#ef4444":r==="High Risk"?"#f59e0b":r==="Medium Risk"?"#6366f1":"#22c55e";
  const riskBg=r=>r==="Critical Risk"?"#fef2f2":r==="High Risk"?"#fffbeb":r==="Medium Risk"?"#eef2ff":"#f0fdf4";

  const txt = darkMode?'#e2e8f0':'#1e293b';
  const inputBg = darkMode?'#0f172a':'#f8fafc';
  const inputBorder = darkMode?'#334155':'#e2e8f0';

  if(loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-fade">
      <div className="dash-hdr">
        <div><h1 className="dash-title">Students</h1><p className="dash-sub">Manage and monitor all enrolled students.</p></div>
      </div>
      <div className="dash-card">
        <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:inputBg,border:`1px solid ${inputBorder}`,borderRadius:10,padding:"8px 14px",flex:1,minWidth:180}}>
            <span style={{color:"#94a3b8"}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search students…" style={{border:"none",outline:"none",background:"none",fontSize:13,color:txt,width:"100%",fontFamily:"inherit"}}/>
          </div>
          <select style={{padding:"8px 12px",border:`1px solid ${inputBorder}`,borderRadius:10,fontSize:12,color:txt,background:inputBg,fontFamily:"inherit",outline:"none"}} value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="All">All Risk Levels</option>
            <option value="Critical Risk">Critical Risk</option>
            <option value="High Risk">High Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="Low Risk">Low Risk</option>
          </select>
          <select style={{padding:"8px 12px",border:`1px solid ${inputBorder}`,borderRadius:10,fontSize:12,color:txt,background:inputBg,fontFamily:"inherit",outline:"none"}} value={subject} onChange={e=>setSubject(e.target.value)}>
            <option value="All">All Subjects</option>
            {subjects.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${darkMode?'#334155':'#f1f5f9'}`}}>
              {["Student","Subject","Pass %","Fail %","Risk Level","Prediction",""].map(h=>(
                <th key={h} style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"1px",padding:"8px 12px",textAlign:"left"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((s,i)=>(
              <tr key={s.id} style={{borderBottom:`1px solid ${darkMode?'#1e293b':'#f8fafc'}`}}>
                <td style={{padding:"12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Av name={s.name||"?"} i={i} size={34}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:txt}}>{s.name}</div>
                      <div style={{fontSize:11,color:"#94a3b8"}}>ID: {s.student_id}</div>
                    </div>
                  </div>
                </td>
                <td style={{padding:"12px",fontSize:12,color:"#94a3b8"}}>{s.subject}</td>
                <td style={{padding:"12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:50,height:5,background:darkMode?'#334155':"#f1f5f9",borderRadius:3,overflow:"hidden"}}>
                      <div style={{width:`${s.pass_probability}%`,height:"100%",background:barColor(s.pass_probability),borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:barColor(s.pass_probability)}}>{s.pass_probability}%</span>
                  </div>
                </td>
                <td style={{padding:"12px",fontSize:12,fontWeight:700,color:"#ef4444"}}>{s.fail_probability}%</td>
                <td style={{padding:"12px"}}>
                  <span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,background:riskBg(s.risk_level),color:riskColorF(s.risk_level)}}>{s.risk_level}</span>
                </td>
                <td style={{padding:"12px",fontSize:12,fontWeight:700,color:s.predicted_result===1?"#22c55e":"#ef4444"}}>
                  {s.predicted_result===1?"✅ Pass":"❌ Fail"}
                </td>
                <td style={{padding:"12px"}}>
                  <button onClick={()=>del(s.id)} style={{background:"none",border:`1px solid ${inputBorder}`,color:"#94a3b8",width:28,height:28,borderRadius:7,cursor:"pointer",fontSize:12}}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {visible.length===0&&<div style={{textAlign:"center",padding:40,color:"#94a3b8",fontSize:13}}>No students found.</div>}
      </div>
    </div>
  );
}

function NotificationsPage({ darkMode }) {
  const [notifs,setNotifs]=useState([]);
  const [highRiskStudents,setHighRiskStudents]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      const {data}=await supabase.from("notifications").select("*").order("created_at",{ascending:false});
      if(data) setNotifs(data);
      const {data:riskData}=await supabase.from("predictions").select("name,subject,pass_probability,risk_level").eq("risk_level","Critical Risk").limit(50);
      if(riskData) setHighRiskStudents(riskData);
      setLoading(false);
    })();
  },[]);

  const col={danger:"#ef4444",warning:"#f59e0b",success:"#22c55e",info:"#6366f1"};
  const ic={danger:"🚨",warning:"⚠️",success:"✅",info:"ℹ️"};
  const timeAgo=d=>{
    const diff=Math.floor((Date.now()-new Date(d))/1000);
    if(diff<3600) return `${Math.floor(diff/60)}m ago`;
    if(diff<86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  const txt = darkMode?'#e2e8f0':'#1e293b';

  if(loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-fade">
      <div className="dash-hdr"><div><h1 className="dash-title">Notifications</h1><p className="dash-sub">Stay updated on student alerts.</p></div></div>

      {highRiskStudents.length>0&&(
        <div className="dash-card" style={{marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:800,color:"#ef4444",marginBottom:16}}>🚨 High Risk Alerts ({highRiskStudents.length} students)</div>
          {highRiskStudents.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderBottom:`1px solid ${darkMode?'#334155':'#f1f5f9'}`}}>
              <div style={{width:36,height:36,borderRadius:10,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🚨</div>
              <div style={{flex:1}}>
                <p style={{fontSize:13,fontWeight:700,color:txt,marginBottom:2}}>{s.name}</p>
                <p style={{fontSize:12,color:"#94a3b8"}}>{s.subject} — Pass probability: <span style={{color:"#ef4444",fontWeight:700}}>{s.pass_probability}%</span></p>
              </div>
              <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:"#fef2f2",color:"#ef4444"}}>Critical Risk</span>
            </div>
          ))}
        </div>
      )}

      <div className="dash-card">
        <div style={{fontSize:14,fontWeight:800,color:txt,marginBottom:16}}>📬 Notifications</div>
        {notifs.map(n=>(
          <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"14px 0",borderBottom:`1px solid ${darkMode?'#334155':'#f1f5f9'}`}}>
            <div style={{width:36,height:36,borderRadius:10,background:(col[n.type]||"#6366f1")+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{ic[n.type]||"ℹ️"}</div>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:700,color:txt,marginBottom:4}}>{n.title}</p>
              <p style={{fontSize:12,color:"#94a3b8"}}>{n.message}</p>
              <p style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{timeAgo(n.created_at)}</p>
            </div>
            <div style={{width:8,height:8,borderRadius:"50%",background:col[n.type]||"#6366f1",marginTop:4,flexShrink:0}}/>
          </div>
        ))}
        {notifs.length===0&&highRiskStudents.length===0&&<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>🎉 No notifications!</div>}
      </div>
    </div>
  );
}

function ReportsPage({ darkMode }) {
  const [reports,setReports]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      const {data}=await supabase.from("reports").select("*").order("created_at",{ascending:false});
      if(data) setReports(data);
      setLoading(false);
    })();
  },[]);

  const ic={attendance:"📋",risk:"⚠️",assignments:"📝",performance:"📊"};
  const col={attendance:"#6366f1",risk:"#ef4444",assignments:"#22c55e",performance:"#f59e0b"};
  const txt = darkMode?'#e2e8f0':'#1e293b';

  if(loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-fade">
      <div className="dash-hdr"><div><h1 className="dash-title">Reports</h1><p className="dash-sub">Generate and download academic reports.</p></div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16}}>
        {reports.map(r=>(
          <div key={r.id} className="dash-card" style={{cursor:"pointer"}}>
            <div style={{width:48,height:48,borderRadius:14,background:(col[r.type]||"#6366f1")+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,marginBottom:14}}>{ic[r.type]||"📊"}</div>
            <div style={{fontSize:14,fontWeight:800,color:txt,marginBottom:8}}>{r.title}</div>
            <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.6,marginBottom:16}}>{r.description}</div>
            <button style={{width:"100%",padding:"10px",border:`1px solid ${col[r.type]||"#6366f1"}30`,borderRadius:10,background:(col[r.type]||"#6366f1")+"08",color:col[r.type]||"#6366f1",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>⬇ Download PDF</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage({ darkMode }) {
  const [notifs,setNotifs]=useState({email:true,push:false,weekly:true});
  const txt = darkMode?'#e2e8f0':'#1e293b';
  const inputBg = darkMode?'#0f172a':'#f8fafc';
  const inputBorder = darkMode?'#334155':'#e2e8f0';
  return (
    <div className="page-fade">
      <div className="dash-hdr"><div><h1 className="dash-title">Settings</h1><p className="dash-sub">Manage your account and preferences.</p></div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
        {[
          {title:"👤 Account Info",fields:[["Full Name","Admin"],["Email","admin@sphinx.edu"],["Role","Administrator"]]},
          {title:"🔒 Change Password",fields:[["Current Password",""],["New Password",""],["Confirm",""]],pw:true},
        ].map((card,i)=>(
          <div key={i} className="dash-card">
            <div style={{fontSize:14,fontWeight:800,color:txt,marginBottom:16}}>{card.title}</div>
            {card.fields.map(([l,v])=>(
              <div key={l} style={{marginBottom:12}}>
                <label style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:5}}>{l}</label>
                <input type={card.pw?"password":"text"} defaultValue={v} placeholder={card.pw?"••••••••":undefined} style={{width:"100%",padding:"9px 13px",border:`1px solid ${inputBorder}`,borderRadius:9,fontSize:13,color:txt,fontFamily:"inherit",outline:"none",background:inputBg,boxSizing:"border-box"}}/>
              </div>
            ))}
            <button style={{padding:"9px 20px",borderRadius:9,border:"none",background:"#6366f1",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>Save Changes</button>
          </div>
        ))}
        <div className="dash-card">
          <div style={{fontSize:14,fontWeight:800,color:txt,marginBottom:16}}>🔔 Notifications</div>
          {[["email","Email Alerts","Get notified via email"],["push","Push Notifications","Browser alerts"],["weekly","Weekly Summary","Performance digest"]].map(([k,l,s])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${darkMode?'#334155':'#f1f5f9'}`}}>
              <div><div style={{fontSize:13,fontWeight:600,color:txt}}>{l}</div><div style={{fontSize:11,color:"#94a3b8"}}>{s}</div></div>
              <div onClick={()=>setNotifs({...notifs,[k]:!notifs[k]})} style={{width:42,height:24,borderRadius:12,background:notifs[k]?"#6366f1":"#e2e8f0",cursor:"pointer",position:"relative",transition:"background .25s"}}>
                <div style={{position:"absolute",top:3,left:notifs[k]?21:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .25s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══ AI PREDICTIONS PAGE ══ */
function PredictionsPage() {
  const [predictions,setPredictions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [subject,setSubject]=useState("All");
  const [subjects,setSubjects]=useState([]);
  const [stats,setStats]=useState({total:0,highRisk:0,safe:0,accuracy:95.21});

  useEffect(()=>{ fetchPredictions(); },[]);

  async function fetchPredictions() {
    setLoading(true);
    const {data}=await supabase.from("predictions").select("*").order("pass_probability",{ascending:true});
    if(data){
      setPredictions(data);
      const uniqueSubjects=[...new Set(data.map(d=>d.subject))];
      setSubjects(uniqueSubjects);
      const highRisk=data.filter(d=>d.risk_level==="Critical Risk").length;
      const safe=data.filter(d=>d.risk_level==="Low Risk").length;
      setStats({total:data.length,highRisk,safe,accuracy:95.21});
    }
    setLoading(false);
  }

  const filtered=predictions.filter(p=>
    p.name?.toLowerCase().includes(search.toLowerCase())&&
    (subject==="All"||p.subject===subject)
  );

  if(loading) return <div className="loading">Loading AI Predictions...</div>;

  return (
    <div className="page-fade">
      <div className="dash-hdr">
        <div><h1 className="dash-title">AI Predictions 🤖</h1><p className="dash-sub">Student performance predictions powered by Machine Learning — {stats.accuracy}% accuracy.</p></div>
      </div>
      <div className="stat-grid">
        {[
          {label:"Total Students",val:stats.total,   icon:"🎓",color:"#6366f1",bg:"#eef2ff"},
          {label:"High Risk",     val:stats.highRisk, icon:"🚨",color:"#ef4444",bg:"#fef2f2"},
          {label:"Safe Students", val:stats.safe,     icon:"✅",color:"#22c55e",bg:"#f0fdf4"},
          {label:"Model Accuracy",val:stats.accuracy+"%",icon:"🤖",color:"#f59e0b",bg:"#fffbeb"},
        ].map((c,i)=>(
          <div key={i} className="stat-card-l">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <div style={{fontSize:12,color:"#64748b",fontWeight:600,marginBottom:6}}>{c.label}</div>
                <div className="stat-val" style={{fontSize:32,fontWeight:900,letterSpacing:-1}}>{c.val}</div>
              </div>
              <div style={{width:42,height:42,borderRadius:12,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="dash-card">
        <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",flex:1,minWidth:180}}>
            <span style={{color:"#94a3b8"}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search student..." style={{border:"none",outline:"none",background:"none",fontSize:13,color:"#334155",width:"100%",fontFamily:"inherit"}}/>
          </div>
          <select style={{padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:10,fontSize:12,color:"#475569",background:"#f8fafc",fontFamily:"inherit",outline:"none"}} value={subject} onChange={e=>setSubject(e.target.value)}>
            <option value="All">All Subjects</option>
            {subjects.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #f1f5f9"}}>
              {["Student","Subject","Pass %","Fail %","Risk Level","Prediction"].map(h=>(
                <th key={h} style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"1px",padding:"8px 12px",textAlign:"left"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p,i)=>(
              <tr key={p.id} style={{borderBottom:"1px solid #f8fafc"}}>
                <td className="stat-val" style={{padding:"12px",fontSize:13,fontWeight:700}}>{p.name}</td>
                <td style={{padding:"12px",fontSize:12,color:"#94a3b8"}}>{p.subject}</td>
                <td style={{padding:"12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:60,height:5,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}>
                      <div style={{width:`${p.pass_probability}%`,height:"100%",background:"#22c55e",borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:"#22c55e"}}>{p.pass_probability}%</span>
                  </div>
                </td>
                <td style={{padding:"12px",fontSize:12,fontWeight:700,color:"#ef4444"}}>{p.fail_probability}%</td>
                <td style={{padding:"12px"}}>
                  <span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,background:riskColor(p.risk_level)+"15",color:riskColor(p.risk_level),border:`1px solid ${riskColor(p.risk_level)}30`}}>{p.risk_level}</span>
                </td>
                <td style={{padding:"12px",fontSize:12,fontWeight:700,color:p.predicted_result===1?"#22c55e":"#ef4444"}}>
                  {p.predicted_result===1?"✅ ناجح":"❌ راسب"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No predictions found.</div>}
        <div style={{fontSize:12,color:"#94a3b8",marginTop:12,textAlign:"right"}}>Showing {filtered.length} of {predictions.length} students</div>
      </div>
    </div>
  );
}

function TopBar({ page, user, userProfile, userRole, darkMode, setDarkMode, handleLogout }) {
  const [showMenu,setShowMenu]=useState(false);
  const titles = {dashboard:'Home',students:'Students',notifications:'Notifications',reports:'Reports',settings:'Settings',predictions:'AI Predictions',upload:'Upload Data'};
  const displayName = userProfile?.name||(user?.email?.split('@')[0])||'Admin';
  const initials = displayName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{display:'flex',alignItems:'center',gap:16,padding:'14px 32px',background:darkMode?'#1e293b':'#fff',borderBottom:`1px solid ${darkMode?'#334155':'#e2e8f0'}`,position:'sticky',top:0,zIndex:50}}>
      <div style={{display:'flex',alignItems:'center',gap:8,color:darkMode?'#94a3b8':'#64748b',fontSize:13,fontWeight:600}}>
        <span style={{fontSize:16}}>{navItems.find(n=>n.key===page)?.icon||'📋'}</span>
        <span>{titles[page]||'Dashboard'}</span>
      </div>
      <div style={{flex:1,display:'flex',justifyContent:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,background:darkMode?'#0f172a':'#f1f5f9',borderRadius:20,padding:'8px 18px',width:'100%',maxWidth:300}}>
          <span style={{color:'#94a3b8',fontSize:14}}>🔍</span>
          <input placeholder='Search...' style={{border:'none',outline:'none',background:'none',fontSize:13,color:darkMode?'#e2e8f0':'#334155',fontFamily:'inherit',width:'100%'}}/>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div onClick={()=>setDarkMode(!darkMode)} style={{width:36,height:36,borderRadius:10,background:darkMode?'#334155':'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:18}} title="Toggle Dark Mode">
          {darkMode?'☀️':'🌙'}
        </div>
        <div style={{position:'relative',cursor:'pointer'}}>
          <span style={{fontSize:20}}>🔔</span>
          <div style={{position:'absolute',top:-2,right:-2,width:8,height:8,borderRadius:'50%',background:'#ef4444'}}/>
        </div>
        <div style={{position:'relative'}}>
          <div onClick={()=>setShowMenu(!showMenu)} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'6px 10px',borderRadius:10,background:darkMode?'#334155':'#f8fafc',border:`1px solid ${darkMode?'#475569':'#e2e8f0'}`}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:800}}>{initials}</div>
            <span style={{fontSize:12,color:darkMode?'#e2e8f0':'#475569',fontWeight:600}}>{displayName}</span>
            <span style={{fontSize:10,color:'#94a3b8'}}>▼</span>
          </div>
          {showMenu&&(
            <div style={{position:'absolute',right:0,top:'110%',background:darkMode?'#1e293b':'#fff',border:`1px solid ${darkMode?'#334155':'#e2e8f0'}`,borderRadius:12,padding:8,minWidth:180,boxShadow:'0 8px 30px rgba(0,0,0,.12)',zIndex:100}}>
              <div style={{padding:'8px 12px',borderBottom:`1px solid ${darkMode?'#334155':'#f1f5f9'}`,marginBottom:4}}>
                <div style={{fontSize:13,fontWeight:700,color:darkMode?'#e2e8f0':'#1e293b'}}>{displayName}</div>
                <div style={{fontSize:11,color:'#94a3b8'}}>{user?.email}</div>
                <div style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'#eef2ff',color:'#6366f1',fontWeight:700,marginTop:4,display:'inline-block'}}>{userRole||'admin'}</div>
              </div>
              <button onClick={()=>{setShowMenu(false);handleLogout();}} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'none',background:'none',color:'#ef4444',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:8,textAlign:'left'}}>
                <MdLogout/> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══ MAIN APP ══ */
function App() {
  const [view,setView]=useState("landing");
  const [darkMode,setDarkMode]=useState(false);
  const [user,setUser]=useState(null);
  const [userRole,setUserRole]=useState(null);
  const [userProfile,setUserProfile]=useState(null);
  const [activePage,setActivePage]=useState("dashboard");
  const [modelData,setModelData]=useState(null);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    if(darkMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  },[darkMode]);

  useEffect(()=>{
    fetch('/model.json')
      .then(r=>r.json())
      .then(d=>setModelData(d))
      .catch(e=>console.error('model.json error:',e));
  },[]);

  const fetchRole = async (userId) => {
    const {data: profileData} = await supabase.from("profiles").select("*").eq("id", userId).single();
    if(profileData) {
      setUserRole(profileData.role);
      setUserProfile(profileData);
    } else {
      const {data: roleData} = await supabase.from("roles").select("role").eq("user_id", userId).single();
      if(roleData) setUserRole(roleData.role);
      else setUserRole("admin");
    }
  };

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user){ setUser(session.user); fetchRole(session.user.id); setView("dashboard"); }
    });
    supabase.auth.onAuthStateChange((_e,session)=>{
      if(session?.user){ setUser(session.user); fetchRole(session.user.id); setView("dashboard"); }
      else{ setUser(null); setUserRole(null); setUserProfile(null); setView("landing"); }
    });
  },[]);

  const handleLogin=async()=>{
    setLoading(true); setError("");
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){setError("Invalid email or password.");setLoading(false);}
    else setLoading(false);
  };

  const handleLogout=async()=>{
    await supabase.auth.signOut();
    setUserRole(null); setUserProfile(null); setView("landing");
  };

  const renderPage=()=>{
    switch(activePage){
      case "students":      return <StudentsPage userRole={userRole} userProfile={userProfile} darkMode={darkMode}/>;
      case "notifications": return <NotificationsPage darkMode={darkMode}/>;
      case "reports":       return <ReportsPage darkMode={darkMode}/>;
      case "settings":      return <SettingsPage darkMode={darkMode}/>;
      case "predictions":   return <PredictionsPageFull modelData={modelData} userRole={userRole} userProfile={userProfile}/>;
      case "upload":        return modelData ? <UploadData modelData={modelData}/> : <div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>⏳ Loading model...</div>;
      default:              return <DashboardPage userProfile={userProfile} darkMode={darkMode}/>;
    }
  };

  if(view==="landing") return (
    <>
      <AppStyles darkMode={false}/>
      <LandingPage onEnter={()=>setView("login")}/>
    </>
  );

  if(view==="login") return (
    <>
      <AppStyles darkMode={false}/>
      <div className="login-wrap">
        <div className="login-card">
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32}}>
            <img src={sphinxLogo} alt="S" style={{width:36,height:36,borderRadius:"50%",objectFit:"cover"}}/>
            <span style={{fontWeight:900,fontSize:18,color:"#1e293b",letterSpacing:3}}>SPHINX</span>
          </div>
          <h2 style={{fontSize:24,fontWeight:900,color:"#1e293b",margin:"0 0 6px"}}>Welcome back</h2>
          <p style={{fontSize:13,color:"#64748b",margin:"0 0 28px"}}>Sign in to access your dashboard</p>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".5px",marginBottom:6}}>Email Address</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} type="email" placeholder="admin@sphinx.edu" style={{width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:11,fontSize:13,color:"#334155",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{marginBottom:22}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".5px",marginBottom:6}}>Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} type="password" placeholder="••••••••" style={{width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:11,fontSize:13,color:"#334155",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
          {error&&<div style={{fontSize:12,color:"#ef4444",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:10}}>{error}</div>}
          <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:13,borderRadius:12,border:"none",background:"#6366f1",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(99,102,241,.3)",opacity:loading?.7:1}}>
            {loading?"Signing in…":"Sign In →"}
          </button>
          <button onClick={()=>setView("landing")} style={{width:"100%",padding:10,borderRadius:12,border:"none",background:"none",color:"#94a3b8",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>← Back to homepage</button>
          <p style={{fontSize:11,color:"#cbd5e1",textAlign:"center",marginTop:16}}>© 2025 Sphinx University · All rights reserved</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <AppStyles darkMode={darkMode}/>
      <div className="dash-shell">
        <aside className="dash-side" style={{background:darkMode?'#1e293b':'#fff',borderRight:`1px solid ${darkMode?'#334155':'#e2e8f0'}`}}>
          <div className="dash-side-logo" style={{borderBottom:`1px solid ${darkMode?'#334155':'#f1f5f9'}`}}>
            <img src={sphinxLogo} alt="S" style={{width:36,height:36,borderRadius:"50%",objectFit:"cover"}}/>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:darkMode?'#e2e8f0':'#1e293b',letterSpacing:2}}>SPHINX</div>
              <div style={{fontSize:10,color:"#94a3b8"}}>Academic Platform</div>
            </div>
          </div>
          <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:2,padding:"16px 20px 8px"}}>Main Menu</div>
          <nav style={{display:"flex",flexDirection:"column",gap:3,padding:"0 12px",flex:1}}>
            {navItems
              .filter(n => n.key!=="upload" || userRole==="doctor" || userRole==="admin" || !userRole)
              .map(n=>(
                <button key={n.key} onClick={()=>setActivePage(n.key)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",background:activePage===n.key?"#eef2ff":"none",color:activePage===n.key?"#6366f1":darkMode?"#94a3b8":"#64748b",cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"inherit",fontSize:13,fontWeight:activePage===n.key?700:600,transition:"all .18s"}}>
                  <span style={{fontSize:16}}>{n.icon}</span>{n.label}
                </button>
              ))}
          </nav>
        </aside>
        <main style={{flex:1,overflowX:"hidden",overflowY:"auto",background:darkMode?'#0f172a':'#f8fafc',display:"flex",flexDirection:"column",minWidth:0}}>
          <TopBar page={activePage} user={user} userProfile={userProfile} userRole={userRole} darkMode={darkMode} setDarkMode={setDarkMode} handleLogout={handleLogout}/>
          <div style={{padding:"28px 32px",flex:1,minWidth:0}}>{renderPage()}</div>
        </main>
      </div>
    </>
  );
}

function AppStyles({ darkMode }) {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif !important; background: ${darkMode?'#0f172a':'#f8fafc'} !important; color: ${darkMode?'#e2e8f0':'#1e293b'} !important; }
    .page-fade { animation: fadeUp .35s ease; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
    .loading { display:flex; align-items:center; justify-content:center; height:200px; font-size:14px; color:#94a3b8; }
    .dash-shell { display:flex; min-height:100vh; overflow:hidden; }
    .dash-side { width:230px; background:${darkMode?'#1e293b':'#fff'}; border-right:1px solid ${darkMode?'#334155':'#e2e8f0'}; display:flex; flex-direction:column; position:sticky; top:0; height:100vh; flex-shrink:0; overflow-y:auto; }
    .dash-side-logo { display:flex; align-items:center; gap:10px; padding:20px; border-bottom:1px solid ${darkMode?'#334155':'#f1f5f9'}; }
    .dash-hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; gap:12px; flex-wrap:wrap; }
    .dash-title { font-size:24px; font-weight:900; color:${darkMode?'#e2e8f0':'#1e293b'}; letter-spacing:-.5px; }
    .dash-sub { font-size:13px; color:#94a3b8; margin-top:4px; }
    .dash-card { background:${darkMode?'#1e293b':'#fff'}; border:1px solid ${darkMode?'#334155':'#e2e8f0'}; border-radius:14px; padding:20px; margin-bottom:16px; overflow:hidden; }
    .stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin-bottom:20px; }
    .stat-card-l { background:${darkMode?'#1e293b':'#fff'}; border:1px solid ${darkMode?'#334155':'#e2e8f0'}; border-radius:14px; padding:20px; }
    .stat-val { color:${darkMode?'#e2e8f0':'#1e293b'} !important; }
    .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    .btn-pri { padding:10px 22px; border-radius:10px; border:none; background:#6366f1; color:#fff; font-weight:700; font-size:13px; cursor:pointer; font-family:inherit; box-shadow:0 4px 14px rgba(99,102,241,.3); }
    .login-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#f8fafc,#eef2ff); }
    .login-card { background:#fff; border-radius:20px; padding:48px; width:100%; max-width:420px; box-shadow:0 20px 60px rgba(0,0,0,.08); border:1px solid #e2e8f0; }
    table { width:100%; border-collapse:collapse; }
    th, td { max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .lp { font-family:'Inter',sans-serif; background:#fafafa; min-height:100vh; }
    .lp-nav { position:sticky; top:0; z-index:100; background:rgba(250,250,250,.92); backdrop-filter:blur(12px); border-bottom:1px solid #e2e8f0; }
    .lp-nav-in { max-width:1200px; margin:0 auto; padding:0 32px; height:64px; display:flex; align-items:center; gap:24px; }
    .lp-logo { display:flex; align-items:center; gap:10px; margin-right:16px; }
    .lp-logo-img { width:36px; height:36px; border-radius:50%; object-fit:cover; }
    .lp-logo-txt { font-weight:900; font-size:18px; color:#1e293b; letter-spacing:3px; }
    .lp-links { display:flex; gap:4px; flex:1; }
    .lp-link { padding:6px 14px; border-radius:8px; font-size:13px; font-weight:600; color:#64748b; cursor:pointer; border:none; background:none; font-family:inherit; }
    .lp-ghost { padding:8px 18px; border-radius:10px; border:1px solid #e2e8f0; background:none; color:#475569; font-weight:600; font-size:13px; cursor:pointer; font-family:inherit; }
    .lp-pri { padding:10px 22px; border-radius:10px; border:none; background:#6366f1; color:#fff; font-weight:700; font-size:13px; cursor:pointer; font-family:inherit; }
    .lp-pri-lg { padding:14px 30px; border-radius:12px; border:none; background:#6366f1; color:#fff; font-weight:700; font-size:15px; cursor:pointer; font-family:inherit; box-shadow:0 4px 20px rgba(99,102,241,.35); }
    .lp-out { padding:14px 30px; border-radius:12px; border:1.5px solid #e2e8f0; background:#fff; color:#475569; font-weight:700; font-size:15px; cursor:pointer; font-family:inherit; }
    .lp-hero { max-width:1100px; margin:0 auto; padding:70px 32px 50px; text-align:center; }
    .lp-badge { display:inline-flex; align-items:center; gap:8px; padding:7px 16px; border-radius:20px; background:#eef2ff; color:#6366f1; font-size:12px; font-weight:700; margin-bottom:24px; border:1px solid #c7d2fe; }
    .lp-dot { width:7px; height:7px; border-radius:50%; background:#6366f1; animation:lpulse 2s infinite; }
    @keyframes lpulse { 0%,100%{opacity:1}50%{opacity:.4} }
    .lp-h1 { font-size:clamp(36px,5vw,58px); font-weight:900; color:#1e293b; line-height:1.1; letter-spacing:-2px; margin:0 0 20px; }
    .lp-sub { font-size:16px; color:#64748b; max-width:540px; margin:0 auto 32px; line-height:1.7; }
    .lp-preview-wrap { position:relative; max-width:640px; margin:0 auto; height:290px; }
    .lp-card { background:#fff; border-radius:14px; box-shadow:0 20px 60px rgba(0,0,0,.1); border:1px solid #e2e8f0; padding:16px; }
    .lp-card-main { position:absolute; width:340px; left:50%; transform:translateX(-50%); top:0; z-index:2; }
    .lp-logos { background:#fff; border-top:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9; padding:28px 32px; text-align:center; }
    .lp-features { max-width:1100px; margin:0 auto; padding:80px 32px; text-align:center; }
    .lp-feat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px; text-align:left; }
    .lp-feat-card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:28px; transition:all .25s; }
    .lp-feat-card:hover { border-color:#c7d2fe; transform:translateY(-4px); box-shadow:0 12px 40px rgba(99,102,241,.1); }
    .lp-cta { background:linear-gradient(135deg,#6366f1,#8b5cf6); margin:0 32px 80px; border-radius:20px; padding:40px 48px; }
    .lp-cta-in { max-width:900px; margin:0 auto; display:flex; align-items:center; gap:24px; flex-wrap:wrap; }
    @media(max-width:768px){ .lp-links{display:none} .lp-ghost{display:none} .lp-preview-wrap{display:none} .lp-cta{margin:0 16px 40px} .lp-cta-in{flex-direction:column} .two-col{grid-template-columns:1fr} }
  `}</style>;
}

export default App;


