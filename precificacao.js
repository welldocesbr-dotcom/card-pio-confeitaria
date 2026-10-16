;(function(){const st=document.createElement('style');st.textContent='.g2{display:grid;grid-template-columns:1fr 96px;gap:8px}.g3{display:grid;grid-template-columns:1fr 92px 1fr;gap:8px;align-items:end}.g22{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ln2{display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--line)}.ln2 .qi{width:78px;margin:0;padding:8px 10px}.ln2 .x{flex:none;border:0;background:#f4e9e6;border-radius:50%;width:30px;height:30px;font-size:18px;cursor:pointer;color:var(--mut)}.sum{position:sticky;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:4;display:grid;grid-template-columns:1fr 1.2fr 1.2fr;gap:8px;background:var(--ink);color:#fff;border-radius:20px;padding:12px 16px;margin-top:14px;box-shadow:0 10px 30px #0004}.sum span{display:block;font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.05em}.sum b{font-size:15px}.sum .big{font:700 21px var(--display)}.dl{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px dashed var(--line)}.kind{font-size:11px;font-weight:700;background:var(--calda);color:var(--brand);border-radius:99px;padding:2px 9px;margin-left:6px}.warn{color:#b3261e;font-weight:700}.ok{color:#2e7d32;font-weight:700}details.card summary{font-weight:700;cursor:pointer}';document.head.appendChild(st)})()
const UN={g:['m',1],kg:['m',1000],ml:['v',1],l:['v',1000],un:['u',1]}
const GRP={m:['g','kg'],v:['ml','l'],u:['un']},BASE={m:'g',v:'ml',u:'un'}
const KINDS=['Ingrediente','Embalagem','Outro']
const num=v=>Number(String(v??'').replace(',','.'))||0
const newRec=()=>({name:'',yield:10,ln:[],mo:'',out:'',taxa:'',margem:50,preco:''})
let R=newRec(),RECS=[],RID=null,pm='',SUP=[],SF=null,SUB='rec',AD={s:'',q:'',u:''},sm='',SERR=false
const sup=id=>SUP.find(x=>x.id==id)
const opts=s=>Object.keys(UN).map(u=>`<option ${u==s?'selected':''}>${u}</option>`).join('')
const pct=v=>v.toFixed(1).replace('.',',')+'%'
const $p=id=>document.getElementById(id)
function lineCost(l){const s=sup(l.s);if(!s)return null;const a=UN[l.u],b=UN[s.pu],pq=num(s.pq)*b[1];return pq?num(l.q)*a[1]/pq*num(s.pp):0}
function calc(r){let bad=0,ing=0;(r.ln||[]).forEach(l=>{const c=lineCost(l);if(c===null)bad++;else ing+=c})
 const extra=num(r.mo)+num(r.out),total=ing+extra,y=Math.max(num(r.yield),1),cu=total/y
 const m=num(r.margem),t=num(r.taxa),den=1-(m+t)/100,sug=den>0?cu/den:0,preco=num(r.preco)||sug,lu=preco*(1-t/100)-cu
 return{bad,ing,extra,total,y,cu,sug,preco,lu,lt:lu*y,mr:preco?lu/preco*100:0,invalid:den<=0}}
function precDraw(){const el=$p('prec');if(!el)return
 el.innerHTML=`<div class="tabs"><button class="${SUB=='rec'?'on':''}" onclick="SUB='rec';precDraw()">Receita</button><button class="${SUB=='ins'?'on':''}" onclick="SUB='ins';SF=null;precDraw()">Insumos (${SUP.length})</button></div>${SERR?'<p class="msg warn">Para cadastrar insumos, rode o arquivo insumos.sql no Supabase.</p>':''}<div id="pb"></div>`
 SUB=='rec'?recView():insView()}
const fl=(l,k,ph)=>`<label>${l}<input inputmode="decimal" value="${esc(R[k])}" ${ph?`placeholder="${ph}"`:''} oninput="setR('${k}',this.value)"></label>`
function recView(){const s=sup(AD.s),us=s?GRP[UN[s.pu][0]]:[]
 const sel=SUP.length?`<select onchange="adSel(this.value)"><option value="">Escolha um insumo…</option>${KINDS.map(k=>{const l=SUP.filter(x=>x.kind==k);return l.length?`<optgroup label="${k}">${l.map(x=>`<option value="${x.id}" ${AD.s==x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</optgroup>`:''}).join('')}</select>
 <div class="g2" style="margin-top:8px"><input inputmode="decimal" placeholder="Quantidade" value="${esc(AD.q)}" oninput="AD.q=this.value"><select onchange="AD.u=this.value" ${s?'':'disabled'}>${us.map(u=>`<option ${AD.u==u?'selected':''}>${u}</option>`).join('')||'<option>un</option>'}</select></div>
 <button class="btn sm" style="margin-top:10px;width:100%" onclick="adAdd()">+ Adicionar à receita</button>`:'<p class="mut">Cadastre seus insumos primeiro.</p><button class="btn sm" style="margin-top:8px" onclick="SUB=\'ins\';precDraw()">Cadastrar insumos</button>'
 $p('pb').innerHTML=`<div class="pcols"><div class="pmain"><div class="card"><div class="g2" style="grid-template-columns:1fr 96px"><label style="margin:0">Receita<input value="${esc(R.name)}" placeholder="Ex.: Bolo de cenoura" oninput="setR('name',this.value)"></label><label style="margin:0">Rende<input inputmode="decimal" value="${esc(R.yield)}" oninput="setR('yield',this.value)"></label></div></div>
 <div class="card"><h3 style="font-size:19px;margin-bottom:10px">Ingredientes e embalagens</h3>${sel}<div id="lines"></div></div>
 <div class="card"><div class="g22">${fl('Mão de obra (R$)','mo')}${fl('Gás, luz e outros (R$)','out')}${fl('Lucro desejado (%)','margem')}${fl('Taxas e perdas (%)','taxa')}</div>${fl('Preço que quer cobrar por unidade (R$). Vazio = usar o sugerido','preco')}</div>
 </div><div class="pside"><div class="sum" id="sum"></div><details class="card" id="det"></details><div id="rl"></div></div></div>`
 drawLines();precRes();precList()}
function adSel(v){AD.s=v;AD.u=v?sup(v).pu:'';recView()}
function adAdd(){if(!AD.s||!num(AD.q))return;R.ln.push({s:AD.s,q:AD.q,u:AD.u});AD={s:'',q:'',u:''};recView()}
function rmL(k){R.ln.splice(k,1);drawLines();precRes()}
function setL(k,v){R.ln[k].q=v;precRes()}
const setR=(k,v)=>{R[k]=v;precRes()}
function drawLines(){const e=$p('lines');if(!e)return
 e.innerHTML=R.ln.length?R.ln.map((l,k)=>{const s=sup(l.s);return `<div class="ln2"><b style="flex:1;min-width:0">${s?esc(s.name):'Insumo removido'}</b><input class="qi" inputmode="decimal" value="${esc(l.q)}" oninput="setL(${k},this.value)"><span class="mut">${l.u}</span><b id="lc${k}" style="min-width:62px;text-align:right"></b><button class="x" aria-label="Remover" onclick="rmL(${k})">×</button></div>`}).join(''):'<p class="mut" style="margin-top:12px">Nenhum item ainda. Escolha um insumo acima.</p>'}
function precRes(){const c=calc(R)
 R.ln.forEach((l,k)=>{const e=$p('lc'+k),v=lineCost(l);if(e)e.textContent=v===null?'—':brl(v)})
 const su=$p('sum');if(!su)return
 su.innerHTML=c.invalid?'<b style="grid-column:1/-1">Lucro mais taxas passam de 100%</b>':`<div><span>Custo/un</span><b>${brl(c.cu)}</b></div><div><span>Preço sugerido</span><b class="big">${brl(c.sug)}</b></div><div><span>Lucro/un</span><b>${brl(c.lu)} · ${pct(c.mr)}</b></div>`
 const L=(a,b)=>`<div class="dl"><span>${a}</span>${b}</div>`
 $p('det').innerHTML=`<summary>Ver detalhes do cálculo</summary>${L('Ingredientes e embalagens',`<b>${brl(c.ing)}</b>`)}${L('Outros custos',`<b>${brl(c.extra)}</b>`)}${L('Custo total da receita',`<b>${brl(c.total)}</b>`)}${L('Custo por unidade (rende '+c.y+')',`<b>${brl(c.cu)}</b>`)}${L('Preço considerado',`<b>${brl(c.preco)}</b>`)}${L('Lucro por unidade',`<b class="${c.lu>=0?'ok':'warn'}">${brl(c.lu)}</b>`)}${L('Margem de lucro real',`<b class="${c.mr>=0?'ok':'warn'}">${pct(c.mr)}</b>`)}${L('Lucro da receita inteira',`<b>${brl(c.lt)}</b>`)}${c.bad?'<p class="warn">Há itens com insumo removido.</p>':''}`}
function precList(){const el=$p('rl');if(!el)return
 el.innerHTML=`<div class="card"><div class="row"><button class="btn sm" onclick="saveRec()">${RID?'Atualizar receita':'Salvar receita'}</button><button class="btn ghost sm" onclick="usePrice()">Usar preço em um produto</button><button class="btn ghost sm" onclick="R=newRec();RID=null;pm='';recView()">Nova</button></div><p class="msg">${esc(pm)}</p></div>`+
 (RECS===null?'<p class="msg warn">Para salvar receitas, rode o arquivo receitas.sql no Supabase.</p>':RECS.length?'<h3 style="font-size:19px;margin:22px 0 0">Receitas salvas</h3>'+RECS.map(x=>`<div class="card row sp" style="flex-wrap:nowrap"><b>${esc(x.name)}</b><span class="row" style="flex-wrap:nowrap"><button class="btn ghost sm" onclick="openRec('${x.id}')">Abrir</button><button class="btn ghost sm" onclick="delRec('${x.id}')">×</button></span></div>`).join(''):'')}
const usePrice=()=>PREC.use(R.name||'Novo produto',calc(R).preco)
async function precInit(){R=newRec();RID=null;pm='';sm='';SUB='rec';AD={s:'',q:'',u:''};SF=null;SERR=false
 try{SUP=await PREC.listSup()}catch(e){SUP=[];SERR=true}
 try{RECS=await PREC.list()}catch(e){RECS=null}
 precDraw()}
async function saveRec(){if(!R.name.trim()){pm='Dê um nome à receita.';return precList()}
 try{await PREC.save(R.name,JSON.parse(JSON.stringify(R)),RID);RECS=await PREC.list();if(!RID)RID=(RECS.find(x=>x.name==R.name)||{}).id;pm='Receita salva!'}catch(e){pm='Não foi possível salvar.'}precList()}
function openRec(id){R=JSON.parse(JSON.stringify(RECS.find(x=>x.id==id).data));R.ln=R.ln||[];RID=id;pm='';SUB='rec';precDraw()}
async function delRec(id){if(!confirm('Excluir esta receita?'))return;try{await PREC.del(id);RECS=await PREC.list();if(RID==id)RID=null}catch(e){}precList()}
function insView(){const f=SF
 const form=f?`<div class="card"><h3 style="font-size:20px">${f.id?'Editar insumo':'Novo insumo'}</h3>
 <label>Nome<input value="${esc(f.name)}" placeholder="Ex.: Açúcar refinado" oninput="SF.name=this.value"></label>
 <label>Tipo</label><div class="seg" style="grid-template-columns:repeat(3,1fr)">${KINDS.map(k=>`<button class="${f.kind==k?'on':''}" onclick="SF.kind='${k}';insView()">${k}</button>`).join('')}</div>
 <label>Quanto comprou e quanto pagou</label><div class="g3"><input inputmode="decimal" placeholder="Qtde" value="${esc(f.pq)}" oninput="SF.pq=this.value;insHint()"><select onchange="SF.pu=this.value;insHint()">${opts(f.pu)}</select><input inputmode="decimal" placeholder="R$" value="${esc(f.pp)}" oninput="SF.pp=this.value;insHint()"></div>
 <p class="mut" id="ih" style="margin-top:8px"></p>
 <div class="row" style="margin-top:14px"><button class="btn sm" onclick="saveSup()">Salvar insumo</button><button class="btn ghost sm" onclick="SF=null;insView()">Cancelar</button></div><p class="msg warn">${esc(sm)}</p></div>`
 :`<button class="btn" onclick="SF={name:'',kind:'Ingrediente',pq:'',pu:'kg',pp:''};sm='';insView()">+ Novo insumo</button>`
 const list=SUP.length?SUP.slice().sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name)).map(x=>`<div class="card row sp" style="flex-wrap:nowrap"><div style="min-width:0"><b>${esc(x.name)}</b><span class="kind">${esc(x.kind)}</span><br><span class="mut">${brl(x.pp)} por ${esc(x.pq)} ${x.pu}</span></div><span class="row" style="flex-wrap:nowrap"><button class="btn ghost sm" onclick="editSup('${x.id}')">Editar</button><button class="btn ghost sm" onclick="delSup('${x.id}')">×</button></span></div>`).join(''):'<p class="mut" style="margin-top:14px">Nenhum insumo cadastrado ainda.</p>'
 $p('pb').innerHTML=form+'<div class="pgrid">'+list+'</div>';insHint()}
function insHint(){const e=$p('ih');if(!e||!SF)return;const b=UN[SF.pu],pq=num(SF.pq)*b[1];e.textContent=pq?'Custo por '+BASE[b[0]]+': R$ '+(num(SF.pp)/pq).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4}):''}
const editSup=id=>{SF={...sup(id)};sm='';insView()}
async function saveSup(){const f=SF,pq=num(f.pq);if(!f.name.trim()||!pq){sm='Informe o nome e a quantidade comprada.';return insView()}
 try{await PREC.saveSup({name:f.name.trim(),kind:f.kind,pq,pu:f.pu,pp:num(f.pp)},f.id);SUP=await PREC.listSup();SF=null;sm=''}catch(e){sm='Não foi possível salvar.'}precDraw()}
async function delSup(id){if(!confirm('Excluir este insumo? Receitas que o usam vão mostrar "insumo removido".'))return;try{await PREC.delSup(id);SUP=await PREC.listSup()}catch(e){}precDraw()}
