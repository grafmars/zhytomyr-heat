/* Консервативний локальний розбір. Словник можна доповнювати. */
(function(root){
const aliases={
'Фещенка-Чопівського':['фещенка[- –]чопівського'], 'Шевченка':['шевченк[ао]'], 'Гоголівська':['гоголівська'], 'Князів Острозьких':['князів\\s+острозьких'], 'Велика Бердичівська':['(?:в(?:елика)?\\.?\\s*)бердичівська'], 'Вітрука':['вітрука'], 'Польовий майдан':['(?:площа|майдан|пл\\.)\\s*польов[аий]+','польовий\\s+майдан'], 'Кибальчича':['кибальчича'], 'Покровська':['покровська'], 'Лесі Українки':['лесі\\s+українки'], 'Івана Богуна':['івана\\s+богуна'], 'Театральна':['театральна'], 'провулок Сікорського':['(?:(?:пер|пров)\\.?|провулок)\\s*сікорського','сікорського'], 'Офіцерська':['офіцерська'], 'проспект Миру':['(?:проспект|просп\\.?|пр\\.?)\\s*миру'], 'Київська':['київська'], 'Лятошинського':['лятошинського'], 'Небесної Сотні':['небесної\\s+сотні'], 'Рильського':['рильського'], 'Хлібна':['хлібна'], 'Крошенська':['крошенська'], 'Селецька':['селецька'], 'Святослава Ріхтера':['(?:святослава\\s+)?ріхтера'], 'Довженка':['довженка'], 'Чуднівська':['чуднівська'], 'Східна':['східна'], 'Перемоги':['перемоги'], 'Короленка':['короленка'], 'Велика Бердичівська':['(?:велика|в\\.?)\\s*бердичівська'], 'провулок Вацківський':['(?:(?:провулок|пров\\.?)\\s*)?вацківський'], 'Степана Бандери':['(?:степана\\s+)?бандери'], 'Михайла Грушевського':['(?:михайла\\s+)?грушевського'], 'Жуйка':['жуйка'], 'Космонавтів':['космонавтів'], 'провулок Паперовий':['(?:провулок|пров\\.?)\\s*паперовий']
};
function key(s){return s.toLowerCase().replace(/вул(?:иця)?\.?/g,'').replace(/[\s,.-]/g,'').replace(/і/g,'і');}
function number(s){return s.replace(/\s|-/g,'').toUpperCase().replace(/[ABCEHIKMOPTX]/g,c=>({A:'А',B:'В',C:'С',E:'Е',H:'Н',I:'І',K:'К',M:'М',O:'О',P:'Р',T:'Т',X:'Х'}[c]));}
function status(s,fallback){if(/(?:порив|прорив|аварі|вит[іо]к)/iu.test(s)&&!/порив\s+(?:усунуто|ліквідовано)|прорив\s+(?:усунуто|ліквідовано)/iu.test(s))return 'break';if(/нема(?:є)?\s+(?:опалення|тепла)|не\s+(?:підключ|подал)|холодн/iu.test(s))return 'off';if(/трішки|слабк|літні|ледь|34[–-]36/iu.test(s))return 'weak';if(/16\s*(?:град|°)/iu.test(s))return 'unknown';if(/(?:^|[\s,])є(?:$|[\s,.])|(?:є|з)\s+(?:тепл|опален)|підключено|подали\s+тепло|\+/iu.test(s))return 'on';return fallback;}
function parse(text,fallback='unknown',day=''){
 const items=[],unresolved=[];let cleaned=text.replace(/[\u2066-\u2069\u200e\u200f]/g,'');
 const blocks=cleaned.split(/(?=\[\s*\d{1,2}\s+[^\]]+\])/g).filter(x=>x.trim());
 for(const block of blocks){
  const stamp=block.match(/^\[([^\]]+)\]/);const time=stamp?.[1].match(/(\d{1,2}:\d{2})/);let body=stamp?block.replace(/^\[[^\]]+\]\s*[^:\n]*:\s*/,''):block;
  const matches=[];
  // Нова вулиця з явним типом (вул., пров., майдан), навіть якщо її немає у словнику.
  const generic=/(?:^|[\n;])\s*((?:вулиця|вул\.|провулок|пров\.|проспект|майдан|площа)\s+[А-ЯІЇЄҐа-яіїєґ'’ .-]+?)(?=\s*,?\s*\d)/gu;
  for(const m of body.matchAll(generic)){const street=m[1].trim();matches.push({street,start:m.index,end:m.index+m[0].length});}

  for(const [street,patterns] of Object.entries(aliases)){const re=new RegExp('(?<![а-яіїєґ])(?:'+patterns.join('|')+')','giu');for(const m of body.matchAll(re))matches.push({street,start:m.index,end:m.index+m[0].length});}
  matches.sort((a,b)=>a.start-b.start||b.end-a.end);const ms=matches.filter((m,i)=>!matches.slice(0,i).some(x=>x.start<=m.start&&x.end>m.start));
  if(!ms.length){if(body.trim())unresolved.push(body.trim());continue;}
  for(let i=0;i<ms.length;i++){
   const m=ms[i],seg=body.slice(m.end,ms[i+1]?.start??body.length);const nums=[];let rest=seg.replace(/^\s*[,№:]?\s*/,'');let consumed=0;
   while(true){const hit=rest.match(/^(\d+(?:\s*\/\s*\d+)?(?:\s*-?\s*[абвгдежзиклмнпрстуфхABCEHIKMOPTX](?![а-яіїєґa-z]))?)(?!\d)/iu);if(!hit)break;nums.push(number(hit[1]));consumed+=hit[0].length;rest=rest.slice(hit[0].length);const sep=rest.match(/^\s*(?:,|;|та\b|і\b|и\b|та(?=\s)|і(?=\s)|и(?=\s))\s*(?=\d)/iu);if(!sep)break;rest=rest.slice(sep[0].length);consumed+=sep[0].length;}
   if(!nums.length){unresolved.push(m.street+seg.trim());continue;}
   const common=!/порив|прорив|аварі/iu.test(body)&&/(?:є|з)\s+тепл|є\s+опалення/iu.test(body)?'on':fallback;
   let st=status(rest,common);const note=rest.replace(/^[\s,;.]+|[\s,;.]+$/g,'');
   for(const num of nums)items.push({address:m.street+', '+num,status:st,note,updatedAt:day&&time?day+'T'+time[1].padStart(5,'0')+':00+02:00':null,review:false});
  }
 }
 return {items,unresolved};
}
root.HeatParser={parse,key,number,status,aliases};if(typeof module!=='undefined')module.exports=root.HeatParser;
})(typeof window!=='undefined'?window:globalThis);
