/* Консервативний локальний розбір. Словник можна доповнювати. */
(function(root){
const aliases={
'Фещенка-Чопівського':['фещенка[- –]чопівського'], 'Шевченка':['шевченк[ао]'], 'Гоголівська':['гоголівська'], 'Князів Острозьких':['князів\\s+острозьких'], 'Велика Бердичівська':['(?:в(?:елика)?\\.?\\s*)бердичівська'], 'Вітрука':['вітрука'], 'Польовий майдан':['(?:площа|майдан|пл\\.)\\s*польов[аий]+','польовий\\s+майдан'], 'Кибальчича':['кибальчича'], 'Покровська':['покровська'], 'Лесі Українки':['лесі\\s+українки'], 'Івана Богуна':['івана\\s+богуна'], 'Театральна':['театральна'], 'провулок Сікорського':['(?:(?:пер|пров)\\.?|провулок)\\s*сікорського','сікорського'], 'Офіцерська':['офіцерська'], 'проспект Миру':['(?:проспект|просп\\.?|пр\\.?)\\s*миру'], 'Київська':['київська'], 'Лятошинського':['лятошинського'], 'Небесної Сотні':['небесної\\s+сотні'], 'Рильського':['рильського'], 'Хлібна':['хлібна'], 'Крошенська':['крошенська'], 'Селецька':['селецька'], 'Святослава Ріхтера':['(?:святослава\\s+)?ріхтера'], 'Довженка':['довженка'], 'Чуднівська':['чуднівська'], 'Східна':['східна'], 'Перемоги':['перемоги'], 'Короленка':['короленка'], 'Велика Бердичівська':['(?:велика|в\\.?)\\s*бердичівська'], 'провулок Вацківський':['(?:(?:провулок|пров\\.?)\\s*)?вацківський'], 'Степана Бандери':['(?:степана\\s+)?бандери'], 'Михайла Грушевського':['(?:михайла\\s+)?грушевського'], 'Жуйка':['жуйка'], 'Космонавтів':['космонавтів'], 'провулок Паперовий':['(?:провулок|пров\\.?)\\s*паперовий']
};
Object.assign(aliases,{
 'Івана Мазепи':['(?:івана\\s+)?мазепи'], 'Ціолковського':['ціолковського'],
 'Вільський Шлях':['вільський\\s+шлях'], 'Домбровського':['домбровського'],
 'Бориса Тена':['бориса\\s+тена'], 'Кондратюка':['(?:юрія\\s+)?кондратюка'],
 'Виставка':['виставка'], 'Героїв Крут':['героїв\\s+крут'],
 'Григорія Сковороди':['(?:григорія\\s+)?сковороди'],
 'провулок Лазурний':['(?:(?:провулок|пров\\.)\\s*)?лазурний'],
 'Юрія Тютюнника':['(?:(?:юрія|ю\\.)\\s*)?тютюнника'],
 'Малікова':['малікова'], 'Героїв Десантників':['героїв\\s+десантників'],
 'Тутковського':['(?:павла\\s+)?тутковського'], 'майдан Згоди':['(?:майдан|м-н|площа)\\s+згоди'],
 'проїзд Плотницького':['(?:проїзд|пр-д)\\s+плотницького'],
 'майдан Мистецькі Ворота':['(?:(?:майдан|м-н|площа)\\s+)?мистецькі\\s+ворота'],
 'провулок Березівський':['(?:(?:провулок|пров\\.)\\s*)?березівський']
});
aliases['Довженка']=['довженк[ао]'];
aliases['проспект Миру'].push('по\\.\\s*миру');
function key(s){
 s=String(s||'').normalize('NFKC').replace(/[\u200e\u200f\u2066-\u2069]/g,'').toLowerCase().trim();
 const m=s.match(/^(.*?)[\s,№]*(\d+(?:\s*\/\s*\d+)?\s*-?\s*[а-яіїєґa-z]?)\s*$/iu);
 if(m&&m[1].trim()){
  let street=m[1].replace(/^(?:м\.?\s*житомир|житомир)\s*,?\s*/u,'').replace(/^(?:вулиця|вул\.)\s*/u,'').replace(/[,\s]+$/u,'').trim();
  for(const [canonical,patterns] of Object.entries(aliases))if(patterns.some(pattern=>new RegExp('^(?:'+pattern+')$','iu').test(street))){street=canonical.toLowerCase();break;}
  return street.replace(/[\s,.–—-]/g,'').replace(/[’`ʼ]/g,"'")+'|'+number(m[2]);
 }
 return s.replace(/^(?:вулиця|вул\.)\s*/u,'').replace(/[\s,.–—-]/g,'');
}
function number(s){return s.replace(/\s|-/g,'').toUpperCase().replace(/[ABCEHIKMOPTX]/g,c=>({A:'А',B:'В',C:'С',E:'Е',H:'Н',I:'І',K:'К',M:'М',O:'О',P:'Р',T:'Т',X:'Х'}[c]));}
function status(s,fallback){
 if(/(?:порив|прорив|аварі|вит[іо]к)/iu.test(s)&&!/порив\s+(?:усунуто|ліквідовано)|прорив\s+(?:усунуто|ліквідовано)/iu.test(s))return 'break';
 if(/(?:лише|тільки)\s+(?:в\s+)?од(?:ин|ному)\s+під|трішки|слабк|літні|ледь|34[–-]36|малий\s+тиск|низький\s+тиск/iu.test(s))return 'weak';
 if(/(?:нема(?:є)?|без|ні)\s+(?:опалення|тепла)|не\s+(?:підключ|подал)|холодн|відсутн|тепла\s+не\s+бачимо|тепл[ао]\s+не\s+було/iu.test(s))return 'off';
 if(/16\s*(?:град|°)|є\s+теплоносій/iu.test(s))return 'unknown';
 if(/(?:^|[\s,])є(?:$|[\s,.])|(?:є|з)\s+(?:тепл|опален)|підключено|подали\s+тепло|запустили|включили|\+/iu.test(s))return 'on';
 return fallback;
}
function messageDate(stamp,day){
 const m=stamp?.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/u);
 const months={січня:1,января:1,лютого:2,февраля:2,березня:3,марта:3,квітня:4,апреля:4,травня:5,мая:5,червня:6,июня:6,липня:7,июля:7,серпня:8,августа:8,вересня:9,сентября:9,жовтня:10,октября:10,листопада:11,ноября:11,грудня:12,декабря:12};
 return m&&months[m[2].toLowerCase()]?`${m[3]}-${String(months[m[2].toLowerCase()]).padStart(2,'0')}-${m[1].padStart(2,'0')}`:day;
}
function timestamp(day,time){
 if(!day||!time)return null;
 const utc=new Date(day+'T12:00:00Z');const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Kyiv',hour:'2-digit',hourCycle:'h23'}).format(utc));
 return day+'T'+time.padStart(5,'0')+':00+'+String(hour-12).padStart(2,'0')+':00';
}
function parse(text,fallback='unknown',day='',contextStreet=''){
 const items=[],unresolved=[];let cleaned=text.replace(/[\u2066-\u2069\u200e\u200f]/g,'');
 const blocks=cleaned.split(/(?=\[\s*\d{1,2}\s+[^\]]+\])/g).filter(x=>x.trim());
 for(const block of blocks){
  const stamp=block.match(/^\[([^\]]+)\]/);const time=stamp?.[1].match(/(\d{1,2}:\d{2})/);let body=stamp?block.replace(/^\[[^\]]+\]\s*[^:\n]*:\s*/,''):block;
  if(/^(?:Повідомлення видалено|Сообщение удалено)/u.test(body.trim()))continue;const msgDay=messageDate(stamp?.[1],day);
  if(contextStreet&&/^\s*\d/u.test(body))body=contextStreet+' '+body;
  const matches=[];
  // Нова вулиця з явним типом (вул., пров., майдан), навіть якщо її немає у словнику.
  const generic=/(?:^|[\n;])\s*((?:вулиця|вул\.|провулок|пров\.|проспект|майдан|площа)\s+[А-ЯІЇЄҐа-яіїєґ'’ .-]+?)(?=\s*,?\s*\d)/gu;
  for(const m of body.matchAll(generic)){const street=m[1].trim();matches.push({street,start:m.index,end:m.index+m[0].length});}

  for(const [street,patterns] of Object.entries(aliases)){const re=new RegExp('(?<![а-яіїєґ])(?:'+patterns.join('|')+')','giu');for(const m of body.matchAll(re))matches.push({street,start:m.index,end:m.index+m[0].length});}
  matches.sort((a,b)=>a.start-b.start||b.end-a.end);const ms=matches.filter((m,i)=>!matches.slice(0,i).some(x=>x.start<=m.start&&x.end>m.start));
  if(!ms.length){if(body.trim())unresolved.push(body.trim());continue;}
  for(let i=0;i<ms.length;i++){
   const m=ms[i],seg=body.slice(m.end,ms[i+1]?.start??body.length);const nums=[];let rest=seg.replace(/^\s*[,№:\-]?\s*/,'');let consumed=0;
   while(true){const hit=rest.match(/^(\d+(?:\s*\/\s*\d+)?(?:\s*-?\s*[абвгдежзиклмнпрстуфхABCEHIKMOPTX](?![а-яіїєґa-z]))?)(?!\d)/iu);if(!hit)break;nums.push(number(hit[1]));consumed+=hit[0].length;rest=rest.slice(hit[0].length);const sep=rest.match(/^\s*(?:,|;|та\b|і\b|и\b|та(?=\s*\d)|і(?=\s*\d)|и(?=\s*\d))\s*(?=\d)/iu);if(!sep)break;rest=rest.slice(sep[0].length);consumed+=sep[0].length;}
   if(!nums.length){unresolved.push(m.street+seg.trim());continue;}
   const common=!/порив|прорив|аварі/iu.test(body)&&/(?:є|з)\s+тепл|є\s+опалення/iu.test(body)?'on':fallback;
   let st=status(rest,common);const note=rest.replace(/^[\s,;.]+|[\s,;.]+$/g,'');
   for(const num of nums)items.push({address:m.street+', '+num,status:st,note,updatedAt:timestamp(msgDay,time?.[1]),review:false});
  }
 }
 return {items,unresolved};
}
root.HeatParser={parse,key,number,status,aliases};if(typeof module!=='undefined')module.exports=root.HeatParser;
})(typeof window!=='undefined'?window:globalThis);

