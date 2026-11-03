// Cloudflare Worker. Код редактора задається у Settings → Variables and Secrets → EDITOR_CODE.

const validCoord = x => x.lat === null && x.lng === null ||
  Number.isFinite(x.lat) && Number.isFinite(x.lng) && x.lat >= 50.15 && x.lat <= 50.4 && x.lng >= 28.45 && x.lng <= 28.9;
export function validateData(d) {
  if (!d || d.schemaVersion !== 1 || !Array.isArray(d.buildings) || !Array.isArray(d.boilers) || !Array.isArray(d.unresolved)) return false;
  if (d.buildings.length > 10000 || d.boilers.length > 500 || d.unresolved.length > 2000) return false;
  const ids = new Set(), names = new Set(), bids = new Set();
  const str = (s, n) => typeof s === 'string' && s.length <= n;
  for (const b of d.boilers) {
    if (!str(b.id,100) || !b.id || bids.has(b.id) || !str(b.name,300) || !str(b.address,300) || !str(b.note ?? '',10000) || !str(b.source ?? '',2000) || !/^#[0-9a-f]{6}$/i.test(b.color) || !Array.isArray(b.order) || !validCoord(b)) return false;
    bids.add(b.id);
  }
  for (const h of d.buildings) {
    if (!str(h.id,100) || !h.id || ids.has(h.id) || !str(h.address,300) || !h.address.trim() || !['on','off','weak','break','unknown'].includes(h.status) || !str(h.note ?? '',10000) || !str(h.source ?? '',2000) || !Number.isFinite(Date.parse(h.updatedAt)) || !validCoord(h) || h.boilerId && !bids.has(h.boilerId)) return false;
    const key=h.address.toLowerCase().replace(/[\s,.-]/g,'');
    if(names.has(key))return false;names.add(key);ids.add(h.id);
  }
  for(const b of d.boilers)if(b.order.some(id=>!ids.has(id)))return false;
  return d.unresolved.every(x=>x && str(x.text,10000) && str(x.note ?? '',10000));
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').replace(/\/$/,'');
    const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
    if (origin && origin === allowed) {
      headers['Access-Control-Allow-Origin']=origin;
      headers['Access-Control-Allow-Headers']='Content-Type, X-Edit-Code';
      headers['Access-Control-Allow-Methods']='GET, POST, PUT, OPTIONS';
    }
    const reply=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers});
    if(origin && origin!==allowed)return reply({error:'Цей сайт не підключений до сервера.'},403);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    const path=new URL(request.url).pathname.replace(/\/$/,'');
    const write=request.method==='PUT'||path==='/auth';
    if(write && !env.EDITOR_CODE)return reply({error:'Задайте секрет EDITOR_CODE у налаштуваннях Worker.'},503);
    if(write && request.headers.get('X-Edit-Code')!==env.EDITOR_CODE)return reply({error:'Неправильний код.'},401);
    if(path==='/auth' && request.method==='POST')return reply({ok:true});
    if(path!=='/map')return reply({error:'Not found'},404);
    if(!env.DB)return reply({error:'Базу D1 не підключено.'},503);
    try{
      if(request.method==='GET'){
        const row=await env.DB.prepare('SELECT revision, body FROM heat_state WHERE id=1').first();
        if(!row)return reply({error:'Карту ще не опубліковано.',revision:0},404);
        return reply({revision:row.revision,data:JSON.parse(row.body)});
      }
      if(request.method!=='PUT')return reply({error:'Method not allowed'},405);
      if(Number(request.headers.get('Content-Length')||0)>2000000)return reply({error:'Завеликий файл.'},413);
      const body=await request.text();if(body.length>2000000)return reply({error:'Завеликий файл.'},413);
      let input;try{input=JSON.parse(body);}catch{return reply({error:'Некоректний JSON.'},400);}
      if(!Number.isInteger(input.revision)||input.revision<0||!validateData(input.data))return reply({error:'Некоректні дані.'},400);
      const next=input.revision+1;input.data.revision=String(next);
      const json=JSON.stringify(input.data);
      const result=input.revision===0
        ? await env.DB.prepare('INSERT OR IGNORE INTO heat_state(id,revision,body) VALUES(1,?,?)').bind(next,json).run()
        : await env.DB.prepare('UPDATE heat_state SET revision=?,body=? WHERE id=1 AND revision=?').bind(next,json,input.revision).run();
      if(result.meta.changes!==1)return reply({error:'Інший редактор уже змінив карту. Збережіть резервну копію та завантажте актуальні дані.'},409);
      return reply({ok:true,revision:next});
    }catch{return reply({error:'Помилка бази даних. Зміни не підтверджено.'},503);}
  }
};
