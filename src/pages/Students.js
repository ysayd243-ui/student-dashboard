import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const riskColor = r => r==="High Risk"?"#ef4444":r==="Medium Risk"?"#f59e0b":r==="Low Risk"?"#6366f1":"#22c55e";
const riskBg    = r => r==="High Risk"?"#fef2f2":r==="Medium Risk"?"#fffbeb":r==="Low Risk"?"#eef2ff":"#f0fdf4";
const barColor  = p => p>=80?"#22c55e":p>=60?"#f59e0b":"#ef4444";

const GRADIENTS=[["#eef2ff","#6366f1"],["#f0fdf4","#22c55e"],["#fff7ed","#f97316"],["#fdf2f8","#ec4899"],["#eff6ff","#3b82f6"],["#fefce8","#eab308"]];
function Av({name,i=0}){
  const [bg,fg]=GRADIENTS[i%GRADIENTS.length];
  const ini=(name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return <div style={{width:36,height:36,borderRadius:"50%",background:bg,color:fg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0}}>{ini}</div>;
}

function Students() {
  const [students,setStudents]=useState([]);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("All");
  const [subject,setSubject]=useState("All");
  const [subjects,setSubjects]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{ fetchStudents(); },[]);

  async function fetchStudents() {
    setLoading(true);
    let all=[], from=0, limit=1000;
    while(true){
      const {data:chunk}=await supabase.from("predictions").select("*").range(from,from+limit-1);
      if(!chunk||chunk.length===0) break;
      all=[...all,...chunk];
      if(chunk.length<limit) break;
      from+=limit;
    }
    setStudents(all);
    const uniqueSubjects=[...new Set(all.map(s=>s.subject).filter(Boolean))];
    setSubjects(uniqueSubjects);
    setLoading(false);
  }

  const del = async (id) => {
    await supabase.from("predictions").delete().eq("id",id);
    setStudents(students.filter(s=>s.id!==id));
  };

  const visible=students.filter(s=>
    (s.name||"").toLowerCase().includes(search.toLowerCase())&&
    (filter==="All"||s.risk_level===filter)&&
    (subject==="All"||s.subject===subject)
  );

  const S={
    page:{padding:"28px 32px",background:"#f8fafc",minHeight:"100vh",fontFamily:"'Inter',sans-serif"},
    hdr:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24},
    title:{fontSize:24,fontWeight:900,color:"#1e293b"},
    sub:{fontSize:13,color:"#94a3b8",marginTop:4},
    box:{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:20},
    toolbar:{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"},
    searchWrap:{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",flex:1,minWidth:180},
    searchInp:{border:"none",outline:"none",background:"none",fontSize:13,color:"#334155",width:"100%",fontFamily:"inherit"},
    sel:{padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:10,fontSize:12,color:"#475569",background:"#f8fafc",fontFamily:"inherit",cursor:"pointer"},
  };

  if(loading) return <div style={{...S.page,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:14,color:"#94a3b8"}}>Loading...</div></div>;

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <div>
          <h1 style={S.title}>Students</h1>
          <p style={S.sub}>{students.length} students from ML predictions.</p>
        </div>
      </div>
      <div style={S.box}>
        <div style={S.toolbar}>
          <div style={S.searchWrap}>
            <span style={{color:"#94a3b8"}}>🔍</span>
            <input style={S.searchInp} placeholder="Search students…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select style={S.sel} value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="All">All Risk Levels</option>
            <option value="High Risk">High Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="Low Risk">Low Risk</option>
            <option value="Critical Risk">Critical Risk</option>
          </select>
          <select style={S.sel} value={subject} onChange={e=>setSubject(e.target.value)}>
            <option value="All">All Subjects</option>
            {subjects.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:12}}>{visible.length} of {students.length} students</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #f1f5f9"}}>
                {["Student","ID","Subject","Pass %","Risk Level","Prediction",""].map(h=>(
                  <th key={h} style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1,padding:"8px 12px",textAlign:"left"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((s,i)=>(
                <tr key={s.id} style={{borderBottom:"1px solid #f8fafc"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Av name={s.name} i={i}/>
                      <div style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{s.name}</div>
                    </div>
                  </td>
                  <td style={{padding:"12px",fontSize:12,color:"#94a3b8",fontFamily:"monospace"}}>{s.student_id}</td>
                  <td style={{padding:"12px",fontSize:12,color:"#64748b"}}>{s.subject}</td>
                  <td style={{padding:"12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:50,height:5,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}>
                        <div style={{width:`${s.pass_probability}%`,height:"100%",background:barColor(s.pass_probability),borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:700,color:barColor(s.pass_probability)}}>{s.pass_probability}%</span>
                    </div>
                  </td>
                  <td style={{padding:"12px"}}>
                    <span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,background:riskBg(s.risk_level),color:riskColor(s.risk_level)}}>{s.risk_level}</span>
                  </td>
                  <td style={{padding:"12px",fontSize:12,fontWeight:700,color:s.predicted_result===1?"#22c55e":"#ef4444"}}>
                    {s.predicted_result===1?"✅ Pass":"❌ Fail"}
                  </td>
                  <td style={{padding:"12px"}}>
                    <button onClick={()=>del(s.id)} style={{background:"none",border:"1px solid #e2e8f0",color:"#94a3b8",width:28,height:28,borderRadius:7,cursor:"pointer",fontSize:12}}
                      onMouseEnter={e=>{e.target.style.background="#fef2f2";e.target.style.color="#ef4444"}}
                      onMouseLeave={e=>{e.target.style.background="none";e.target.style.color="#94a3b8"}}>✕</button>
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

export default Students;