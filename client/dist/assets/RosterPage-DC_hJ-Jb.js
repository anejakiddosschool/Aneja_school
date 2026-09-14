import{j as e}from"./vendor-quill-Dau58qhI.js";import{r as l,R as T}from"./vendor-react-Dx2Z5YOK.js";import{r as R}from"./rosterService-BHLgJkl7.js";import{a as F,z as m}from"./index-ezyXcw5P.js";import{s as G}from"./subjectService-DjVeN5IZ.js";import"./vendor-misc-V3MW026N.js";import"./vendor-capture-DacLzJdU.js";import"./vendor-socket-BLRFddlS.js";import"./vendor-ui-DKUHTyJs.js";const H=()=>{const[n]=l.useState(F.getCurrentUser()),b=new Date().getFullYear(),g=Array.from({length:5},(t,r)=>`${b-r}-${b-r+1}`),[d,j]=l.useState(n.homeroomGrade||""),[c,v]=l.useState(g[0]),[s,h]=l.useState(null),[p,y]=l.useState(!1),[u,N]=l.useState(""),[w,S]=l.useState([]);l.useEffect(()=>{n.role==="teacher"&&n.homeroomGrade&&f()},[n]),l.useEffect(()=>{(async()=>{try{const a=(await G.getAllSubjects()).data.data||[],A=[...new Set(a.map($=>$.gradeLevel).filter(Boolean))].sort();S(A)}catch{m.error("Failed to load grade levels.")}})()},[]);const f=async t=>{if(t&&t.preventDefault(),!d){m.error("Please select a Class/Grade.");return}y(!0),h(null);try{const r=await R.getRoster({gradeLevel:d,academicYear:c});h(r.data),N(r.data.homeroomTeacherName)}catch(r){m.error(r.response?.data?.message||"Failed to generate roster data.")}finally{y(!1)}},k=()=>{const t=document.getElementById("rosterTable");if(!t)return;const r=window.open("","","height=800,width=1200");r.document.write("<html><head><title>Print Roster</title>"),r.document.write(`
        <style>
            @page { 
                size: A4 landscape; 
                margin: 1cm; 
            }
            body { 
                padding: 10px;
                font-family: Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            table { 
                margin-top: 15px;
                width: 100%; 
                border-collapse: collapse; 
                font-size: 8pt; 
            }
            th, td { 
                border: 1px solid #000; 
                padding: 6px; 
                text-align: center; 
            }
            th { 
                background-color: #f3f4f6 !important;
                vertical-align: middle; 
                font-weight: bold;
            }
            .student-name { 
                text-align: left; 
                font-weight: bold;
            }
            .header-bg {
               background-color: #e11d48 !important; 
               color: white !important;
            }
            .titleOfAll {
                text-align: center;
                font-size: 16pt;
                margin-bottom: 5px;
            }
            .subTitle {
                text-align: center;
                font-size: 12pt;
                color: #555;
            }
            .bg-gray-100 { background-color: #f3f4f6 !important; }
            .bg-gray-200 { background-color: #e5e7eb !important; }
            .bg-gray-300 { background-color: #d1d5db !important; }
        </style>
    `),r.document.write("</head><body>"),r.document.write(`
        <h3 class="titleOfAll">Aneja Kiddos School Roster</h3>
        <div class="subTitle">Class: <b>${d}</b> &nbsp;|&nbsp; Session: <b>${c}</b> &nbsp;|&nbsp; Homeroom Teacher: <b>${u}</b></div>
    `),r.document.write(t.outerHTML),r.document.write("</body></html>"),r.document.close(),setTimeout(()=>{r.focus(),r.print(),r.close()},1e3)},o="px-3 py-4 border-r border-violet-800 text-center align-middle font-semibold tracking-wide text-xs uppercase",i="px-3 py-2 border border-gray-200 text-center text-sm text-gray-700",x=`${i} font-bold text-left bg-gray-50 text-gray-800 uppercase text-xs tracking-wider`;return e.jsxs("div",{className:"max-w-7xl mx-auto space-y-6 animate-fade-in pb-10",children:[e.jsxs("div",{className:"bg-white p-6 rounded-xl shadow-sm border border-gray-100",children:[e.jsx("h2",{className:"text-2xl font-bold text-gray-800",children:"Yearly Mark List (Roster)"}),e.jsx("p",{className:"text-sm text-gray-500 mt-1",children:"Generate comprehensive semester-wise mark sheets and class rankings."})]}),e.jsx("div",{className:"bg-white p-6 rounded-xl shadow-sm border border-gray-100",children:e.jsxs("form",{onSubmit:f,className:"grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 items-end",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block",children:"1. Select Class"}),e.jsxs("select",{value:d,onChange:t=>j(t.target.value),className:"w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 cursor-pointer transition-all",required:!0,children:[e.jsx("option",{value:"",children:"-- Choose Class --"}),w.map(t=>e.jsx("option",{value:t,children:t},t))]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block",children:"2. Academic Session"}),e.jsx("select",{value:c,onChange:t=>v(t.target.value),className:"w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 cursor-pointer transition-all",children:g.map(t=>e.jsx("option",{value:t,children:t},t))})]}),e.jsxs("div",{className:"lg:col-span-2 flex gap-3 h-[42px] mt-auto",children:[e.jsx("button",{type:"submit",disabled:p||!d,className:"flex-1 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all",children:p?"Generating Sheet...":"Load Data"}),s&&e.jsxs("button",{type:"button",onClick:k,className:"bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-all flex items-center gap-2",children:[e.jsx("span",{children:"🖨️"})," Print Document"]})]})]})}),s&&s.roster.length>0?e.jsxs("div",{className:"bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in",children:[e.jsxs("div",{className:"bg-gray-50 p-5 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-2",children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-gray-800",children:["Performance Register: ",e.jsx("span",{className:"text-violet-600",children:d})]}),e.jsxs("p",{className:"text-sm text-gray-600 font-medium mt-1",children:["Homeroom Teacher: ",e.jsx("span",{className:"text-gray-800 bg-white px-2 py-0.5 border rounded shadow-sm",children:u||"Not Assigned"})]})]}),e.jsxs("div",{className:"text-sm font-semibold bg-white border text-gray-700 px-4 py-1.5 rounded-full shadow-sm",children:["Total Students: ",s.roster.length]})]}),e.jsx("div",{className:"overflow-x-auto p-4",children:e.jsxs("table",{id:"rosterTable",className:"w-full border-collapse",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-violet-700 text-white header-bg",children:[e.jsx("th",{className:o,children:"ID"}),e.jsx("th",{className:o,children:"Full Name"}),e.jsx("th",{className:o,children:"Sex"}),e.jsx("th",{className:o,children:"Age"}),e.jsx("th",{className:o,children:"Term"}),s.subjects.map(t=>e.jsx("th",{className:o,children:t},`head-${t}`)),e.jsx("th",{className:`${o} bg-violet-800`,children:"Total"}),e.jsx("th",{className:`${o} bg-violet-800`,children:"Average"}),e.jsx("th",{className:`${o} bg-violet-900 border-none`,children:"Rank"})]})}),e.jsx("tbody",{className:"bg-white",children:s.roster.map((t,r)=>e.jsxs(T.Fragment,{children:[e.jsxs("tr",{className:"hover:bg-blue-50/30 transition-colors",children:[e.jsx("td",{rowSpan:"3",className:"px-3 py-2 border border-gray-200 text-center font-bold text-gray-700 bg-gray-50",children:t.studentId}),e.jsx("td",{rowSpan:"3",className:"px-3 py-2 border border-gray-200 text-left font-bold text-gray-900 student-name",children:t.fullName}),e.jsx("td",{rowSpan:"3",className:"px-3 py-2 border border-gray-200 text-center text-gray-600",children:t.gender?.charAt(0)}),e.jsx("td",{rowSpan:"3",className:"px-3 py-2 border border-gray-200 text-center text-gray-600",children:t.age}),e.jsx("td",{className:x,children:"1st Sem"}),s.subjects.map(a=>e.jsx("td",{className:i,children:t.firstSemester.scores[a]??"-"},`${t.studentId}-${a}-1`)),e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold bg-gray-100 text-gray-800",children:t.firstSemester.total.toFixed(2)}),e.jsxs("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold bg-gray-100 text-blue-700",children:[t.firstSemester.average.toFixed(2),"%"]}),e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold bg-gray-200 text-gray-900",children:t.rank1st})]}),e.jsxs("tr",{className:"hover:bg-blue-50/30 transition-colors",children:[e.jsx("td",{className:x,children:"2nd Sem"}),s.subjects.map(a=>e.jsx("td",{className:i,children:t.secondSemester.scores[a]??"-"},`${t.studentId}-${a}-2`)),e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold bg-gray-100 text-gray-800",children:t.secondSemester.total.toFixed(2)}),e.jsxs("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold bg-gray-100 text-blue-700",children:[t.secondSemester.average.toFixed(2),"%"]}),e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold bg-gray-200 text-gray-900",children:t.rank2nd})]}),e.jsxs("tr",{className:"bg-blue-50/50 border-b-2 border-b-gray-400",children:[e.jsx("td",{className:`${x} text-blue-800`,children:"Subject Avg"}),s.subjects.map(a=>e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold text-gray-700",children:typeof t.subjectAverages[a]=="number"?t.subjectAverages[a].toFixed(1):"-"},`${t.studentId}-${a}-avg`)),e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-extrabold bg-blue-100 text-gray-900",children:(t.overallTotal||0).toFixed(2)}),e.jsxs("td",{className:"px-3 py-2 border border-gray-200 text-center font-extrabold bg-blue-100 text-blue-800",children:[(t.overallAverage||0).toFixed(2),"%"]}),e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-extrabold bg-violet-100 text-violet-700 text-lg",children:t.overallRank})]})]},t.studentId))})]})})]}):s&&s.roster.length===0?e.jsxs("div",{className:"bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center",children:[e.jsx("span",{className:"text-5xl",children:"📭"}),e.jsx("p",{className:"text-xl font-bold text-gray-800 mt-4",children:"No Records Found"}),e.jsx("p",{className:"text-gray-500 mt-2",children:"No student marks have been entered for this class and academic session."})]}):null]})};export{H as default};
