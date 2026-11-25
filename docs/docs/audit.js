/* OKG audit. Журнал аудита: читает таблицу "AdminLog", пишет события вручную. Подключать после auth2.js и admin-roles.js */
(function(){
"use strict";
var S={rows:[],profiles:{},filter:"",actor:"",loaded:false};
function cl(){return window.sb||null;}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
var ACT={
 "profiles.insert":"Создан профиль",
 "profiles.update":"Изменён профиль",
 "profiles.delete":"Удалён профиль",
 "role.changed":"Смена роли",
 "status.changed":"Смена статуса",
 "requests.insert":"Новая заявка",
 "requests.update":"Изменена заявка",
 "requests.delete":"Удалена заявка",
 "materials.insert":"Добавлен материал",
 "materials.update":"Изменён материал",
 "materials.delete":"Удалён материал",
 "auth.login":"Вход в систему",
 "auth.logout":"Выход из системы",
 "admin.open":"Открыта админ-панель",
 "audit.export":"Экспорт журнала"
};
function actLabel(a){return ACT[a]||a||"—";}
function canSee(){
 var R=window.OKG_ROLES;
 if(!R)return false;
 var p=window.OKG_ADMIN&&window.OKG_ADMIN.state&&window.OKG_ADMIN.state.profile;
 if(!p)return false;
 var r=R.roleOf(p);
 return r==="tech"||r==="head"||r==="deputy";
}
async function log(action,target){
 var c=cl();if(!c)return;
 try{
  var u=await c.auth.getUser();
  var uid=u&&u.data&&u.data.user?u.data.user.id:null;
  if(!uid)return;
  await c.from("AdminLog").insert({id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)),actorId:uid,action:action,target:target||""});
 }catch(e){console.warn("audit:",e&&e.message);}
}
async function load(){
 var c=cl();if(!c)return;
 var r=await c.from("AdminLog").select("*").order("createdAt",{ascending:false}).limit(300);
 if(r.error){console.warn("audit load:",r.error.message);return;}
 S.rows=r.data||[];
 var ids={};S.rows.forEach(function(x){if(x.actorId)ids[x.actorId]=1;});
 var keys=Object.keys(ids);
 if(keys.length){
  var p=await c.from("profiles").select("id,email,nickname,role").in("id",keys);
  if(!p.error)(p.data||[]).forEach(function(x){S.profiles[x.id]=x;});
 }
 S.loaded=true;
 fillActors();
 render();
}
function who(id){
 if(!id)return "система";
 var p=S.profiles[id];
 if(!p)return id.slice(0,8)+"…";
 return p.nickname||p.email||id.slice(0,8)+"…";
}
function fmt(ts){
 if(!ts)return "";
 var d=new Date(ts);
 if(isNaN(d))return ts;
 function z(n){return n<10?"0"+n:""+n;}
 return z(d.getDate())+"."+z(d.getMonth()+1)+"."+d.getFullYear()+" "+z(d.getHours())+":"+z(d.getMinutes());
}
function visible(){
 var q=(S.filter||"").toLowerCase(), a=S.actor;
 return S.rows.filter(function(x){
  if(a&&x.actorId!==a)return false;
  if(!q)return true;
  return (actLabel(x.action)+" "+x.action+" "+x.target+" "+who(x.actorId)).toLowerCase().indexOf(q)>=0;
 });
}
function render(){
 var b=document.getElementById("auditList");if(!b)return;
 var rows=visible();
 var cnt=document.getElementById("auditCount");
 if(cnt)cnt.textContent=rows.length+" из "+S.rows.length;
 if(!S.rows.length){
  b.innerHTML='<div class="admin-empty">Записей пока нет. События появятся, как только кто-то изменит профиль, заявку или материал.</div>';
  return;
 }
 if(!rows.length){
  b.innerHTML='<div class="admin-empty">Ничего не найдено по фильтру.</div>';
  return;
 }
 b.innerHTML=rows.map(function(x){
  var t=esc(x.target||"");
  if(t.length>90)t=t.slice(0,90)+"…";
  return '<div class="admin-row audit-row">'+
   '<div><strong>'+esc(actLabel(x.action))+'</strong>'+
   '<div class="muted">'+esc(who(x.actorId))+(t?' · '+t:'')+'</div></div>'+
   '<div class="audit-time muted">'+esc(fmt(x.createdAt))+'</div></div>';
 }).join("");
}
function actors(){
 var seen={},out=[];
 S.rows.forEach(function(x){
  if(x.actorId&&!seen[x.actorId]){seen[x.actorId]=1;out.push(x.actorId);}
 });
 return out;
}
function fillActors(){
 var s=document.getElementById("auditActor");if(!s)return;
 var cur=s.value;
 var o='<option value="">Все администраторы</option>';
 actors().forEach(function(id){
  o+='<option value="'+esc(id)+'"'+(id===cur?' selected':'')+'>'+esc(who(id))+'</option>';
 });
 s.innerHTML=o;
}
function csv(){
 var rows=visible();
 var head="Дата;Кто;Действие;Код;Объект\n";
 var body=rows.map(function(x){
  return [fmt(x.createdAt),who(x.actorId),actLabel(x.action),x.action,x.target||""].map(function(v){
   return '"'+String(v==null?"":v).replace(/"/g,'""')+'"';
  }).join(";");
 }).join("\n");
 var blob=new Blob(["\ufeff"+head+body],{type:"text/csv;charset=utf-8"});
 var a=document.createElement("a");
 a.href=URL.createObjectURL(blob);
 a.download="okg-audit-"+new Date().toISOString().slice(0,10)+".csv";
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
 log("audit.export",rows.length+" записей");
}
function init(){
 if(window.__okgAudit)return;window.__okgAudit=1;
 document.addEventListener("click",function(e){
  var t=e.target;
  if(!t||!t.closest)return;
  var r=t.closest("[data-audit-refresh]");
  if(r){e.preventDefault();load();return;}
  var x=t.closest("[data-audit-export]");
  if(x){e.preventDefault();if(canSee())csv();}
 });
 document.addEventListener("input",function(e){
  var t=e.target;
  if(!t||!t.id)return;
  if(t.id==="auditSearch"){S.filter=t.value;render();}
 });
 document.addEventListener("change",function(e){
  var t=e.target;
  if(t&&t.id==="auditActor"){S.actor=t.value;render();}
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.OKG_AUDIT={load:load,log:log,render:render,state:S,canSee:canSee,exportCsv:csv};
})();
