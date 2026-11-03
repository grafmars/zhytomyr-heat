// Actual frontend handlers → Worker → SQLite → second viewer (DOM stub, no map tiles).
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import worker from './backend/worker.mjs';
const require=createRequire(import.meta.url), parser=require('./parser.js');
const seed=JSON.parse(readFileSync(new URL('./data.json',import.meta.url)));
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('./backend/schema.sql',import.meta.url),'utf8'));
const env={EDITOR_CODE:'test-private-code',ALLOWED_ORIGIN:'https://grafmars.github.io',DB:{prepare(q){let args=[];return{bind(...v){args=v;return this;},async first(){return sql.prepare(q).get(...args);},async run(){return{meta:{changes:sql.prepare(q).run(...args).changes}};}}}}};
function page(){
 const elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,style:{},classList:{toggle(){}},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;},focus(){},insertAdjacentHTML(){},append(){}});return elements.get(id);};
 const doc={getElementById:element,querySelectorAll:()=>[],addEventListener(){},hidden:false};
 const context=vm.createContext({window:{HEAT_CONFIG:{API_URL:'https://heat.example',REFRESH_MS:5000},addEventListener(){}},document:doc,location:{pathname:'/zhytomyr-heat/'},HeatParser:parser,localStorage:{getItem(){return null;},setItem(){},removeItem(){}},fetch:async(url,options={})=>url==='./data.json'?new Response(JSON.stringify(seed)):worker.fetch(new Request(url,{...options,headers:{...options.headers,Origin:env.ALLOWED_ORIGIN}}),env),AbortSignal,Intl,Date,Map,Set,JSON,Number,String,Array,Object,Promise,Error,RegExp,crypto:globalThis.crypto,setTimeout,clearTimeout,setInterval(){},confirm:()=>true,console,Blob,URL});
 vm.runInContext(readFileSync(new URL('./app.js',import.meta.url),'utf8'),context);
 return{context,element,run:s=>vm.runInContext(s,context)};
}
const settle=()=>new Promise(r=>setTimeout(r,30));
const editor=page();await settle();editor.element('editorCode').value='wrong';await editor.element('codeForm').onsubmit({preventDefault(){}});assert.equal(editor.run('editing'),false);
editor.element('editorCode').value=env.EDITOR_CODE;await editor.element('codeForm').onsubmit({preventDefault(){}});await editor.run('publishChanges()');assert.match(editor.element('syncStatus').textContent,/Збережено для всіх/);
const viewer=page();await settle();assert.equal(viewer.run('data.buildings.length'),106);
editor.run("data.buildings[0].status='off'; data.buildings[0].note='integration check'; save()");await editor.run('publishChanges()');await viewer.run('refreshShared()');assert.equal(viewer.run('data.buildings[0].note'),'integration check');assert.equal(viewer.run('data.buildings[0].status'),'off');
// Conflicting update must retain editor draft and leave shared state untouched.
editor.run('serverRevision=0; data.buildings[0].note="conflicting edit"; save()');await editor.run('publishChanges()');assert.equal(editor.run('dirty'),true);assert.equal(editor.run('syncBlocked'),true);await viewer.run('refreshShared()');assert.equal(viewer.run('data.buildings[0].note'),'integration check');
console.log('Passed: wrong code, server login, initial publish, save confirmation, second viewer auto refresh, conflicting draft preserved.');
