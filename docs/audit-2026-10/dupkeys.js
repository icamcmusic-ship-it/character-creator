// Lists duplicate keys in object literals in js/engine.js and which nested links the later key drops. Needs espree (ships with eslint): npm i --no-save espree, or point the require at an existing copy.
const espree=require('espree');
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../../js/engine.js','utf8');
const ast=espree.parse(src,{ecmaVersion:2022,loc:true,range:true,sourceType:'script'});
function walk(n,f){ if(!n||typeof n!=='object')return; if(Array.isArray(n)){n.forEach(x=>walk(x,f));return;} if(n.type)f(n); for(const k in n){ if(k==='loc'||k==='range')continue; walk(n[k],f);} }
const subs=(p)=>{ // returns {section:[cats]}
  const o={}; if(p.value.type!=='ObjectExpression')return o;
  p.value.properties.forEach(q=>{const sec=q.key.name||q.key.value; o[sec]=(q.value.properties||[]).map(r=>r.key.name||r.key.value);}); return o; };
walk(ast,n=>{
  if(n.type==='ObjectExpression'){
    const seen={};
    n.properties.forEach(p=>{ if(p.type!=='Property')return; const k=p.key.name||p.key.value; (seen[k]=seen[k]||[]).push(p); });
    const d=Object.entries(seen).filter(([k,v])=>v.length>1);
    if(d.length){
      console.log('Object at line',n.loc.start.line,'dupes',d.length);
      d.forEach(([k,v])=>{
        const last=subs(v[v.length-1]); const lost=[];
        v.slice(0,-1).forEach(p=>{const s=subs(p); for(const sec in s) s[sec].forEach(c=>{ if(!(last[sec]&&last[sec].includes(c))) lost.push(sec+'>'+c);});});
        console.log('  ',k,'lines',v.map(p=>p.loc.start.line).join(','),'LOST:',lost.join(' | ')||'(nothing)');
      });
    }
  }
});
