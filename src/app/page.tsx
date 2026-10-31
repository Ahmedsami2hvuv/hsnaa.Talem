"use client";
import { useEffect, useState } from "react";

type Lesson={id:number;title:string;content:string;subject:string;created_at?:string};
export default function Home(){
  const [role,setRole]=useState<"parent"|"student">("parent");
  const [subject,setSubject]=useState("الرياضيات");
  const [message,setMessage]=useState("");
  const [lessons,setLessons]=useState<Lesson[]>([]);
  const [selected,setSelected]=useState<number|null>(null);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  async function loadLessons(){
    try{const r=await fetch("/api/lessons");const d=await r.json();if(r.ok&&d.ok){setLessons(d.lessons);if(d.lessons.length&&!selected)setSelected(d.lessons[0].id);}}
    catch{setNotice("تعذر تحميل الدروس حالياً.");}
  }
  useEffect(()=>{loadLessons();},[]);
  async function send(){
    if(!message.trim()||busy)return;
    setBusy(true);setNotice("المعلم يجهّز درس حسناء...");
    try{
      const r=await fetch("/api/teacher",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject,message:message.trim()})});
      const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||"تعذر تجهيز الدرس");
      setLessons(old=>[d.lesson,...old]);setSelected(d.lesson.id);setMessage("");setNotice("وصل الدرس إلى دفتر حسناء بنجاح.");
    }catch(e){setNotice(e instanceof Error?e.message:"حدث خطأ.");}
    finally{setBusy(false);}
  }
  const active=lessons.find(l=>l.id===selected)||lessons[0];
  return <main className="app">
    <header className="topbar"><div className="brand"><div className="logo">م</div><div><strong>معلم حسناء</strong><small>مدرسك الذكي خطوة بخطوة</small></div></div>
      <div className="switcher"><button className={role==="parent"?"active":""} onClick={()=>setRole("parent")}>ولي الأمر</button><button className={role==="student"?"active":""} onClick={()=>setRole("student")}>دفتر حسناء</button></div>
    </header>
    <div className="workspace">
      {role==="parent"?<section className="parent-view">
        <div className="intro"><span>مساحة ولي الأمر</span><h1>احچي ويا معلم حسناء</h1><p>گله شنو درستوا اليوم، وهو يرتب الدرس والشرح والتمارين حتى توصل مباشرة لدفتر حسناء.</p></div>
        <div className="chat-card">
          <label>المادة الدراسية</label><select value={subject} onChange={e=>setSubject(e.target.value)}><option>الرياضيات</option><option>اللغة العربية</option><option>العلوم</option><option>التربية الإسلامية</option><option>الاجتماعيات</option><option>اللغة الإنكليزية</option></select>
          <label>رسالتك للمعلم</label><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="مثلاً: اليوم درسنا الكسور الاعتيادية، اشرح لحسناء توحيد المقامات بالتدريج، واعطها أمثلة وتمارين تناسب السادس الابتدائي..." rows={7}/>
          <button className="send" disabled={busy||!message.trim()} onClick={send}>{busy?"جاري إعداد الدرس...":"إرسال للمعلم وتجهيز درس حسناء"}</button>
          {notice&&<p className="notice">{notice}</p>}
        </div>
        <div className="recent"><h2>الدروس التي أرسلتها لحسناء</h2>{lessons.length?lessons.slice(0,5).map(l=><button key={l.id} onClick={()=>{setSelected(l.id);setRole("student");}}><span>{l.subject}</span><strong>{l.title}</strong></button>):<p>بعد ماكو دروس. أول ما ترسل درس، راح يظهر هنا.</p>}</div>
      </section>:<section className="student-view">
        <div className="notebook-head"><span>دفتر حسناء</span><h1>أهلاً حسناء 🌷</h1><p>هنا توصلك الدروس من المعلم. اقرئي بهدوء وحاولي تحلين التمارين بنفسچ.</p></div>
        <div className="notebook-layout"><nav className="lesson-list"><h2>دروسي</h2>{lessons.map(l=><button className={active?.id===l.id?"chosen":""} key={l.id} onClick={()=>setSelected(l.id)}><small>{l.subject}</small><strong>{l.title}</strong></button>)}{!lessons.length&&<p>دروسچ الجديدة راح تظهر هنا.</p>}</nav>
          <article className="lesson-paper">{active?<><div className="paper-meta">{active.subject} · درس من المعلم</div><h2>{active.title}</h2><div className="lesson-content">{active.content}</div></>:<div className="empty-paper"><h2>دفترچ جاهز ✨</h2><p>من يرسل ولي الأمر درساً، راح يوصلك هنا الشرح والأمثلة والتمارين.</p></div>}</article>
        </div>
      </section>}
    </div>
    <footer className="footer">معلم حسناء · تعلم بالفهم والممارسة</footer>
  </main>;
}
