import {I192,I512} from './icones.js'
const bin=b=>Uint8Array.from(atob(b),c=>c.charCodeAt(0))
const PNG={'/icon-192.png':bin(I192),'/icon-512.png':bin(I512)}
const ON=['order_approved','subscription_renewed'],OFF=['subscription_canceled','subscription_late','order_refunded','chargeback']
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')
async function kiwify(request,env){
 const b=await request.json().catch(()=>({}))
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.KIWIFY_TOKEN),{name:'HMAC',hash:'SHA-1'},false,['sign'])
 const calc=hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(JSON.stringify(b))))
 if(new URL(request.url).searchParams.get('signature')!==calc)return new Response('forbidden',{status:403})
 const ev=b.webhook_event_type,email=((b.Customer||{}).email||'').toLowerCase()
 if(!email||(!ON.includes(ev)&&!OFF.includes(ev)))return Response.json({ignored:true})
 const U=env.SUPABASE_URL,K=env.SUPABASE_SERVICE_ROLE_KEY,active=ON.includes(ev)
 const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'}
 await fetch(U+'/rest/v1/licenses?on_conflict=email',{method:'POST',headers:{...H,Prefer:'resolution=merge-duplicates'},body:JSON.stringify({email,active,updated_at:new Date().toISOString()})})
 if(active)await fetch(U+'/auth/v1/invite?redirect_to='+encodeURIComponent(env.SITE_URL+'/painel'),{method:'POST',headers:H,body:JSON.stringify({email})})
 return Response.json({ok:true})
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
