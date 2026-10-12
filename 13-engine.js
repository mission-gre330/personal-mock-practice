(function(root){
let sections=[],mockId="mock01";
function setMock(mock){mockId=mock.id;sections=mock.sections.map(s=>({...s,count:s.questions.length}));api.sections=sections;}
function create(now=Date.now()){return {version:2,id:mockId+'-'+now,mockId,startedAt:now,section:0,index:0,deadline:now+sections[0].minutes*60000,answers:{},marks:{},completed:false};}
function remaining(s,now=Date.now()){return Math.max(0,Math.ceil((s.deadline-now)/1000));}
function advance(s,now=Date.now()){const n=structuredClone(s);if(n.section===sections.length-1){n.completed=true;n.finishedAt=now;}else{n.section++;n.index=0;n.deadline=now+sections[n.section].minutes*60000;}return n;}
function reconcile(s,now=Date.now()){let n=structuredClone(s);while(!n.completed&&now>=n.deadline)n=advance(n,n.deadline);return n;}
function key(s){return `${s.section+1}-${s.index+1}`;}
function numeric(s){const v=String(s).trim();if(!/^[-+]?\d*(?:\.\d+)?(?:\/[-+]?\d+(?:\.\d+)?)?$/.test(v)||!v)return NaN;const a=v.split('/').map(Number);return a.length===2?a[0]/a[1]:a[0];}
function grade(q,a=[]){if(q.type==='essay')return null;if(q.type==='numeric')return Math.abs(numeric(a[0])-numeric(q.correct))<1e-8;if(q.type==='blanks')return JSON.stringify(a)===JSON.stringify(q.correct);return JSON.stringify([...a].sort())===JSON.stringify([...q.correct].sort());}
function gridScore(mock,answers,kind,grid){const ss=mock.sections.map((s,i)=>({...s,index:i})).filter(s=>s.kind===kind);if(ss.length!==2||ss[0].questions.length!==12||ss[1].questions.length!==15||!grid)return null;const counts=ss.map(s=>s.questions.filter((q,i)=>grade(q,answers[`${s.index+1}-${i+1}`])===true).length);return {first:counts[0],second:counts[1],scaled:grid.rows[counts[0]][counts[1]]};}
const api={gridScore,sections,setMock,create,remaining,advance,reconcile,key,grade};if(typeof module!=='undefined')module.exports=api;else root.MockEngine=api;
})(typeof window!=='undefined'?window:globalThis);
