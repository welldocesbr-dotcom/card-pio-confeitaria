import {I192,I512} from './icones.js'
const bin=b=>Uint8Array.from(atob(b),c=>c.charCodeAt(0))
const PNG={'/icon-192.png':bin(I192),'/icon-512.png':bin(I512)}
const ON=['order_approved','subscription_renewed'],OFF=['subscription_canceled','subscription_late','order_refunded','chargeback']
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'Content-Type':'application/json'}})
async function hmac(key,data){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-1'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(data)))}
async function kiwify(request,env){
 try{
  if(!env.KIWIFY_TOKEN){console.log('FALTA KIWIFY_TOKEN');return J({erro:'KIWIFY_TOKEN não cadastrado na Cloudflare'},500)}
  if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY){console.log('FALTA SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY');return J({erro:'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não cadastrados na Cloudflare'},500)}
  const raw=await request.text();let b;try{b=JSON.parse(raw)}catch(e){console.log('corpo inválido');return J({erro:'corpo inválido'},400)}
  const sig=new URL(request.url).searchParams.get('signature')||''
  if(sig!==await hmac(env.KIWIFY_TOKEN,raw)&&sig!==await hmac(env.KIWIFY_TOKEN,JSON.stringify(b))){console.log('ASSINATURA INVÁLIDA: o token da Kiwify é diferente do KIWIFY_TOKEN da Cloudflare');return J({erro:'assinatura inválida'},403)}
  const ev=b.webhook_event_type,email=((b.Customer||{}).email||'').toLowerCase()
  if(!email||(!ON.includes(ev)&&!OFF.includes(ev))){console.log('evento ignorado',ev);return J({ignorado:ev||'sem evento'})}
  const active=ON.includes(ev),H={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'}
  const r=await fetch(env.SUPABASE_URL+'/rest/v1/licenses?on_conflict=email',{method:'POST',headers:{...H,Prefer:'resolution=merge-duplicates'},body:JSON.stringify({email,active,updated_at:new Date().toISOString()})})
  if(!r.ok){console.log('ERRO SUPABASE',r.status,await r.text());return J({erro:'falha ao gravar a licença no Supabase',status:r.status},502)}
  console.log('LICENÇA',active?'liberada':'bloqueada',email,'evento',ev)
  return J({ok:true,evento:ev,ativa:active})
 }catch(e){console.log('ERRO',String(e));return J({erro:String(e)},500)}
}
const SW=`self.addEventListener('install',()=>self.skipWaiting())
self.addEventListener('activate',e=>e.waitUntil(clients.claim()))
self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(fetch(e.request).catch(()=>new Response('Sem conexão. Tente novamente quando estiver online.',{headers:{'Content-Type':'text/plain;charset=utf-8'}})))})`
function manifest(u){const p=u.searchParams,s=(p.get('s')||'').replace(/[^a-z0-9-]/g,''),n=(p.get('n')||'').slice(0,40);let i=p.get('i')||'',ic=[{src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]
 try{const h=new URL(i);if(s&&h.protocol==='https:'&&h.hostname.endsWith('.supabase.co'))ic=[{src:i,sizes:'192x192',type:'image/png'},{src:i,sizes:'512x512',type:'image/png'}]}catch(e){}
 return{id:s?'/'+s:'/painel',name:s?(n||'Cardápio'):'Descomplica.AI',short_name:s?(n||'Cardápio').slice(0,12):'Descomplica',start_url:s?'/'+s:'/painel',scope:'/',display:'standalone',orientation:'portrait',background_color:'#fbf7f4',theme_color:'#a5603f',lang:'pt-BR',icons:ic}}
export default{
 async fetch(request,env){
  const u=new URL(request.url),p=u.pathname
  if(p==='/api/kiwify'&&request.method==='POST')return kiwify(request,env)
  if(p.startsWith('/api/'))return new Response('not found',{status:404})
  if(p==='/manifest.webmanifest')return new Response(JSON.stringify(manifest(u)),{headers:{'Content-Type':'application/manifest+json','Cache-Control':'no-cache'}})
  if(p==='/sw.js')return new Response(SW,{headers:{'Content-Type':'application/javascript','Cache-Control':'no-cache'}})
  if(PNG[p])return new Response(PNG[p],{headers:{'Content-Type':'image/png','Cache-Control':'public,max-age=86400'}})
  return env.ASSETS.fetch(request)
 }
}
