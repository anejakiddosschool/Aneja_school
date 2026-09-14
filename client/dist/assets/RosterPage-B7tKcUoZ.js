import{j as e}from"./vendor-quill-Dau58qhI.js";import{r as l,R as k}from"./vendor-react-Dx2Z5YOK.js";import{r as $}from"./rosterService-Ck7twpOc.js";import{a as A,u as T,z as x}from"./index-CzH_LwuS.js";import{s as L}from"./subjectService-Bwn9F0Zg.js";import"./vendor-misc-V3MW026N.js";import"./vendor-capture-DacLzJdU.js";import"./vendor-socket-BLRFddlS.js";import"./vendor-ui-DKUHTyJs.js";const H=()=>{const[d]=l.useState(A.getCurrentUser()),m=new Date().getFullYear();Array.from({length:5},(r,t)=>`${m-t}-${m-t+1}`);const{currentSession:n,isPastSession:b}=T(),[s,g]=l.useState(null),[h,p]=l.useState(!1),[y,u]=l.useState(""),[j,v]=l.useState([]);l.useEffect(()=>{d.role==="teacher"&&d.homeroomGrade&&f()},[d]),l.useEffect(()=>{(async()=>{try{const a=(await L.getAllSubjects()).data.data||[],w=[...new Set(a.map(S=>S.gradeLevel).filter(Boolean))].sort();v(w)}catch{x.error("Failed to load grade levels.")}})()},[]);const f=async r=>{if(r&&r.preventDefault(),!gradeLevel){x.error("Please select a Class/Grade.");return}p(!0),g(null);try{const t=await $.getRoster({gradeLevel,academicYear:n});g(t.data),u(t.data.homeroomTeacherName)}catch(t){x.error(t.response?.data?.message||"Failed to generate roster data.")}finally{p(!1)}},N=()=>{const r=document.getElementById("rosterTable");if(!r)return;const t=window.open("","","height=800,width=1200");t.document.write("<html><head><title>Print Roster</title>"),t.document.write(`
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
    `),t.document.write("</head><body>"),t.document.write(`
        <h3 class="titleOfAll">Aneja Kiddos School Roster</h3>
        <div class="subTitle">Class: <b>${gradeLevel}</b> &nbsp;|&nbsp; Session: <b>${n}</b> &nbsp;|&nbsp; Homeroom Teacher: <b>${y}</b></div>
    `),t.document.write(r.outerHTML),t.document.write("</body></html>"),t.document.close(),setTimeout(()=>{t.focus(),t.print(),t.close()},1e3)},o="px-3 py-4 border-r border-violet-800 text-center align-middle font-semibold tracking-wide text-xs uppercase",c="px-3 py-2 border border-gray-200 text-center text-sm text-gray-700",i=`${c} font-bold text-left bg-gray-50 text-gray-800 uppercase text-xs tracking-wider`;return e.jsxs("div",{className:"max-w-7xl mx-auto space-y-6 animate-fade-in pb-10",children:[e.jsxs("div",{className:"bg-white p-6 rounded-xl shadow-sm border border-gray-100",children:[e.jsx("h2",{className:"text-2xl font-bold text-gray-800",children:"Yearly Mark List (Roster)"}),e.jsx("p",{className:"text-sm text-gray-500 mt-1",children:"Generate comprehensive semester-wise mark sheets and class rankings."})]}),e.jsx("div",{className:"bg-white p-6 rounded-xl shadow-sm border border-gray-100",children:e.jsxs("form",{onSubmit:f,className:"grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 items-end",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block",children:"1. Select Class"}),e.jsxs("select",{value:gradeLevel,onChange:r=>setGradeLevel(r.target.value),className:"w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 cursor-pointer transition-all",required:!0,children:[e.jsx("option",{value:"",children:"-- Choose Class --"}),j.map(r=>e.jsx("option",{value:r,children:r},r))]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block",children:["2. Academic Session",e.jsx("span",{className:"ml-2 text-[10px] font-semibold text-gray-400 normal-case",children:"(change from navbar switcher)"})]}),e.jsxs("div",{className:`w-full p-2.5 rounded-lg border text-sm font-bold ${b?"bg-amber-50 border-amber-300 text-amber-700":"bg-violet-50 border-violet-100 text-violet-700"}`,children:[n,b?" ⚠️":""]})]}),e.jsxs("div",{className:"lg:col-span-2 flex gap-3 h-[42px] mt-auto",children:[e.jsx("button",{type:"submit",disabled:h||!gradeLevel,className:"flex-1 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all",children:h?"Generating Sheet...":"Load Data"}),s&&e.jsxs("button",{type:"button",onClick:N,className:"bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-all flex items-center gap-2",children:[e.jsx("span",{children:"🖨️"})," Print Document"]})]})]})}),s&&s.roster.length>0?e.jsxs("div",{className:"bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in",children:[e.jsxs("div",{className:"bg-gray-50 p-5 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-2",children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-gray-800",children:["Performance Register: ",e.jsx("span",{className:"text-violet-600",children:gradeLevel})]}),e.jsxs("p",{className:"text-sm text-gray-600 font-medium mt-1",children:["Homeroom Teacher: ",e.jsx("span",{className:"text-gray-800 bg-white px-2 py-0.5 border rounded shadow-sm",children:y||"Not Assigned"})]})]}),e.jsxs("div",{className:"text-sm font-semibold bg-white border text-gray-700 px-4 py-1.5 rounded-full shadow-sm",children:["Total Students: ",s.roster.length]})]}),e.jsx("div",{className:"overflow-x-auto p-4",children:e.jsxs("table",{id:"rosterTable",className:"w-full border-collapse",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-violet-700 text-white header-bg",children:[e.jsx("th",{className:o,children:"ID"}),e.jsx("th",{className:o,children:"Full Name"}),e.jsx("th",{className:o,children:"Sex"}),e.jsx("th",{className:o,children:"Age"}),e.jsx("th",{className:o,children:"Term"}),s.subjects.map(r=>e.jsx("th",{className:o,children:r},`head-${r}`)),e.jsx("th",{className:`${o} bg-violet-800`,children:"Total"}),e.jsx("th",{className:`${o} bg-violet-800`,children:"Average"}),e.jsx("th",{className:`${o} bg-violet-900 border-none`,children:"Rank"})]})}),e.jsx("tbody",{className:"bg-white",children:s.roster.map((r,t)=>e.jsxs(k.Fragment,{children:[e.jsxs("tr",{className:"hover:bg-blue-50/30 transition-colors",children:[e.jsx("td",{rowSpan:"3",className:"px-3 py-2 border border-gray-200 text-center font-bold text-gray-700 bg-gray-50",children:r.studentId}),e.jsx("td",{rowSpan:"3",className:"px-3 py-2 border border-gray-200 text-left font-bold text-gray-900 student-name",children:r.fullName}),e.jsx("td",{rowSpan:"3",className:"px-3 py-2 border border-gray-200 text-center text-gray-600",children:r.gender?.charAt(0)}),e.jsx("td",{rowSpan:"3",className:"px-3 py-2 border border-gray-200 text-center text-gray-600",children:r.age}),e.jsx("td",{className:i,children:"1st Sem"}),s.subjects.map(a=>e.jsx("td",{className:c,children:r.firstSemester.scores[a]??"-"},`${r.studentId}-${a}-1`)),e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold bg-gray-100 text-gray-800",children:r.firstSemester.total.toFixed(2)}),e.jsxs("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold bg-gray-100 text-blue-700",children:[r.firstSemester.average.toFixed(2),"%"]}),e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold bg-gray-200 text-gray-900",children:r.rank1st})]}),e.jsxs("tr",{className:"hover:bg-blue-50/30 transition-colors",children:[e.jsx("td",{className:i,children:"2nd Sem"}),s.subjects.map(a=>e.jsx("td",{className:c,children:r.secondSemester.scores[a]??"-"},`${r.studentId}-${a}-2`)),e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold bg-gray-100 text-gray-800",children:r.secondSemester.total.toFixed(2)}),e.jsxs("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold bg-gray-100 text-blue-700",children:[r.secondSemester.average.toFixed(2),"%"]}),e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold bg-gray-200 text-gray-900",children:r.rank2nd})]}),e.jsxs("tr",{className:"bg-blue-50/50 border-b-2 border-b-gray-400",children:[e.jsx("td",{className:`${i} text-blue-800`,children:"Subject Avg"}),s.subjects.map(a=>e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-bold text-gray-700",children:typeof r.subjectAverages[a]=="number"?r.subjectAverages[a].toFixed(1):"-"},`${r.studentId}-${a}-avg`)),e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-extrabold bg-blue-100 text-gray-900",children:(r.overallTotal||0).toFixed(2)}),e.jsxs("td",{className:"px-3 py-2 border border-gray-200 text-center font-extrabold bg-blue-100 text-blue-800",children:[(r.overallAverage||0).toFixed(2),"%"]}),e.jsx("td",{className:"px-3 py-2 border border-gray-200 text-center font-extrabold bg-violet-100 text-violet-700 text-lg",children:r.overallRank})]})]},r.studentId))})]})})]}):s&&s.roster.length===0?e.jsxs("div",{className:"bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center",children:[e.jsx("span",{className:"text-5xl",children:"📭"}),e.jsx("p",{className:"text-xl font-bold text-gray-800 mt-4",children:"No Records Found"}),e.jsx("p",{className:"text-gray-500 mt-2",children:"No student marks have been entered for this class and academic session."})]}):null]})};export{H as default};
