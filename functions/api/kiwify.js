const ON=['order_approved','subscription_renewed'],OFF=['subscription_canceled','subscription_late','order_refunded','chargeback']
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')
export async function onRequestPost({request,env}){
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
