const $=id=>document.getElementById(id);
const K='jc_lottery_records_v3';
const MK='jc_lottery_modes_v3';
const jars=window.JC_LOTTERY_JARS;
const order=window.JC_LOTTERY_ORDER;
const topLines=['阿迟今天也替小猫摸一张小纸条。','先别急着努力，先看看今天抽到什么。','把选择交给签筒，把小猫交给阿迟。','今天也可以只收下一点点温柔。','抽到喜欢的就收下，不喜欢就再摸一张。'];
let active='status';
let pending=null;
let modes=load(MK,{private:false,song:'全部'});
let records=load(K,[]);

function load(k,d){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d}}
function save(){localStorage.setItem(K,JSON.stringify(records));localStorage.setItem(MK,JSON.stringify(modes))}
function date(){let d=new Date;return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`}
function time(){let d=new Date;return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function say(x){let t=$('toast');t.textContent=x;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1600)}

function pool(k){
  let j=jars[k];
  if(j.special==='diy')return $('customText').value.split(/\n|,|，|;|；/).map(x=>x.trim()).filter(Boolean).map(x=>({title:x,note:'这是阿映自己放进签筒的内容，阿迟只负责认真抽到它。'}));
  if(j.special==='song')return j.items.filter(x=>modes.song==='全部'||x[1]===modes.song).map(x=>({title:x[0],type:x[1],note:x[2]}));
  if(j.special==='intimacy'){
    let ls=j.locations.filter(x=>modes.private||!x[1]);
    let as=j.actions.filter(x=>modes.private||!x[1]);
    let a=[];
    ls.forEach(l=>as.forEach(s=>a.push({title:`地点：${l[0]}\n行为：${s[0]}`,note:s[2]})));
    return a;
  }
  return (j.items||[]).map(x=>({title:x[0],note:x[1]}));
}
function modeLabel(k){return k==='song'?modes.song:k==='intimacy'?(modes.private?'私密模式':'日常模式'):''}
function render(){nav();modesUI();main();todayList()}
function nav(){let n=$('nav');n.innerHTML='';order.forEach(k=>{let j=jars[k],b=document.createElement('button');b.className='tab'+(k===active?' on':'');b.innerHTML=`<span>${j.icon}</span>${j.nav}`;b.onclick=()=>{active=k;pending=null;render()};n.appendChild(b)})}
function modesUI(){
  let r=$('modes');r.innerHTML='';
  $('custom').classList.toggle('show',active==='diy');
  if(active==='intimacy')[['日常模式',false],['私密模式',true]].forEach(x=>{let b=document.createElement('button');b.className='mode '+(x[1]?'private ':'')+(modes.private===x[1]?'on':'');b.textContent=x[0];b.onclick=()=>{modes.private=x[1];pending=null;save();render()};r.appendChild(b)});
  if(active==='song')['全部','SLMV歌单','阿迟写的歌'].forEach(x=>{let b=document.createElement('button');b.className='mode '+(modes.song===x?'on':'');b.textContent=x;b.onclick=()=>{modes.song=x;pending=null;save();render()};r.appendChild(b)})
}
function main(){
  let j=jars[active],p=pool(active);
  $('jarState').textContent=j.name;$('poolCount').textContent=p.length;$('todayCount').textContent=records.filter(r=>r.date===date()).length;
  $('jarTitle').textContent=`${j.icon} ${j.name}`;$('jarDesc').textContent=j.desc;
  $('accept').disabled=!pending;
  $('accept').style.opacity=pending?'1':'.55';
  if(!pending){$('label').textContent='待收下的小签';$('resTitle').textContent=active==='diy'?'先在下面写入你的自定义签，再抽。':'把手伸进签筒里，阿迟替你摸一张。';$('resNote').textContent='抽到后可以收下；想换一张，直接再点「抽一签」。'}
  else{$('label').textContent='待收下的小签';$('resTitle').textContent=pending.title;$('resNote').textContent=pending.note||''}
}
function recNode(r){
  let d=document.createElement('div');d.className='rec';
  d.innerHTML=`<div class="rt"><span>${r.time}｜${r.jarName}</span><span>${r.mode||''}</span></div><div class="rtitle"></div><div class="rnote"></div>`;
  d.querySelector('.rtitle').textContent=r.title;d.querySelector('.rnote').textContent=r.note||'';
  let b=document.createElement('button');b.className='btn small soft';b.textContent='删除这条';b.onclick=()=>{records=records.filter(x=>x.id!==r.id);save();render();hist();say('已删除')};d.appendChild(b);return d
}
function todayList(){let box=$('todayList'),arr=records.filter(r=>r.date===date()).sort((a,b)=>b.ts-a.ts);box.innerHTML='';if(!arr.length){box.innerHTML='<div class="empty">今天还没有收下任何签。抽到喜欢的那张，就点「收下这签」。</div>';return}arr.forEach(r=>box.appendChild(recNode(r)))}
function drawOne(){let p=pool(active);if(!p.length){say(active==='diy'?'先写入 DIY 选项再抽':'这个签池还没有内容');return}pending=p[Math.floor(Math.random()*p.length)];main()}
function acceptOne(){if(!pending){say('先抽一签，再收下它');return}let j=jars[active];records.push({id:uid(),ts:Date.now(),date:date(),time:time(),key:active,jarName:j.name,title:pending.title,note:pending.note||'',mode:modeLabel(active)});pending=null;save();render();say('已收下这签')}
function clearJarToday(){if(!confirm(`清空今天「${jars[active].name}」的记录？清空后不会留在历史里。`))return;records=records.filter(r=>!(r.date===date()&&r.key===active));save();render();say('已清空当前签筒记录')}
function clearTodayAll(){if(!confirm('清空今天全部记录？清空后不会留在历史里。'))return;records=records.filter(r=>r.date!==date());save();render();say('已清空今日记录')}
function hist(){let box=$('historyContent');box.innerHTML='';if(!records.length){box.innerHTML='<div class="empty">还没有任何历史记录。</div>';return}let g={};[...records].sort((a,b)=>b.ts-a.ts).forEach(r=>(g[r.date]??=[]).push(r));Object.keys(g).sort((a,b)=>new Date(b)-new Date(a)).forEach(dt=>{let s=document.createElement('section');s.className='date';s.innerHTML=`<div class="dt">${dt}</div>`;let l=document.createElement('div');l.className='list';g[dt].sort((a,b)=>b.ts-a.ts).forEach(r=>l.appendChild(recNode(r)));s.appendChild(l);box.appendChild(s)})}
function download(content,name,type){let blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
function exportMd(){if(!records.length){say('还没有可导出的记录');return}let g={},out='\ufeff# J&C 抽签记录\n\n';[...records].sort((a,b)=>b.ts-a.ts).forEach(r=>(g[r.date]??=[]).push(r));Object.keys(g).sort((a,b)=>new Date(b)-new Date(a)).forEach(dt=>{out+=`## ${dt}\n\n`;g[dt].sort((a,b)=>b.ts-a.ts).forEach(r=>{out+=`### ${r.time}｜${r.jarName}${r.mode?'｜'+r.mode:''}\n${r.title}\n\n`;if(r.note)out+=`阿迟补充：${r.note}\n\n`})});download(out,`J&C抽签记录-${date().replaceAll('/','-')}.md`,'text/markdown;charset=utf-8');say('已导出 Markdown')}
function backupPayload(){return JSON.stringify({version:1,records,modes},null,2)}
async function copyBackup(){let text=backupPayload();try{await navigator.clipboard.writeText(text);say('备份已复制到剪贴板')}catch(e){prompt('复制下面的备份内容：',text)}}
function backupData(){download(backupPayload(),`J&C抽签备份-${date().replaceAll('/','-')}.json`,'application/json;charset=utf-8');say('已下载备份文件')}
function applyBackupText(text){try{let data=JSON.parse(text);if(!Array.isArray(data.records))throw new Error();records=data.records;modes=data.modes||modes;save();render();hist();say('已导入备份')}catch(e){say('导入失败，内容不是正确的备份 JSON')}}
function pasteImport(){let text=prompt('把备份 JSON 内容粘贴到这里：');if(text&&text.trim())applyBackupText(text.trim())}
function bind(){
  $('draw').onclick=drawOne;$('accept').onclick=acceptOne;$('clearJar').onclick=clearJarToday;$('clearToday').onclick=clearTodayAll;
  $('historyBtn').onclick=()=>{$('todayView').classList.add('hidden');$('historyView').classList.remove('hidden');hist();scrollTo({top:0,behavior:'smooth'})};
  $('back').onclick=()=>{$('historyView').classList.add('hidden');$('todayView').classList.remove('hidden');render()};
  $('exportMd').onclick=exportMd;$('backup').onclick=backupData;$('copyBackup').onclick=copyBackup;$('pasteImportBtn').onclick=pasteImport;
  $('clearAll').onclick=()=>{if(confirm('确定清空全部历史记录吗？')){records=[];save();render();hist();say('已清空全部历史')}};
  $('customText').addEventListener('input',()=>{pending=null;main()});
  if($('topLine'))$('topLine').textContent=topLines[Math.floor(Math.random()*topLines.length)];
}
bind();render();