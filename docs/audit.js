/* OKG audit. Журнал аудита в стиле Discord: читает "AdminLog", пишет события вручную. */
(function(){
"use strict";
var S={rows:[],profiles:{},filter:"",actor:"",loaded:false};
function cl(){return window.sb||null;}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
var ACT={
 "profiles.insert":"Создан профиль","profiles.update":"Изменён профиль","profiles.delete":"Удалён профиль",
 "role.changed":"Смена роли","status.changed":"Смена статуса",
 "requests.insert":"Новая заявка","requests.update":"Изменена заявка","requests.delete":"Удалена заявка",
 "materials.insert":"Добавлен материал","materials.update":"Изменён материал","materials.delete":"Удалён материал",
 "auth.login":"Вход в систему","auth.logout":"Выход из системы",
 "admin.open":"Открыта админ-панель","audit.export":"Экспорт журнала"
};
var ICON={
 "profiles.insert":"👤","profiles.update":"✏️","profiles.delete":"🗑️",
 "role.changed":"🎭","status.changed":"🔖",
 "requests.insert":"📨","requests.update":"📬","requests.delete":"📭",
 "materials.insert":"📄","materials.update":"📝","materials.delete":"🗑️",
 "auth.login":"🔓","auth.logout":"🔒","admin.open":"🛡️","audit.export":"📤"
};
var KIND={
 "profiles.insert":"join","profiles.update":"update","profiles.delete":"delete",
 "role.changed":"update","status.changed":"update",
 "requests.insert":"join","requests.update":"update","requests.delete":"delete",
 "materials.insert":"create","materials.update":"update","materials.delete":"delete",
 "auth.login":"join","auth.logout":"leave","admin.open":"update","audit.export":"update"
};
function actLabel(a){return ACT[a]||a||"—";}
function iconOf(a){return ICON[a]||"•";}
function kindOf(a){return KIND[a]||"update";}
function canSee(){
 var R=window.OKG_ROLES; if(!R)return false;
 var p=window.OKG_ADMIN&&window.OKG_ADMIN.state&&window.OKG_ADMIN.state.profile;
 if(!p)return false;
 var r=R.roleOf(p); return r==="tech"||r==="head"||r==="deputy";
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
 S.loaded=true; fillActors(); render();
}
function who(id){
 if(!id)return "Система";
 var p=S.profiles[id];
 if(!p)return id.slice(0,8)+"…";
 return p.nickname||p.email||id.slice(0,8)+"…";
}
function roleOf(id){var p=S.profiles[id];return p&&p.role?p.role:"user";}
function initials(id){
 var n=who(id);
 var parts=n.replace(/@.*/,"").split(/[\s._-]+/).filter(Boolean);
 if(parts.length>=2)return (parts[0][0]+parts[1][0]).toUpperCase();
 return n.slice(0,2).toUpperCase();
}
function fmt(ts){
 if(!ts)return "";
 var d=new Date(ts); if(isNaN(d))return ts;
 function z(n){return n<10?"0"+n:""+n;}
 return z(d.getHours())+":"+z(d.getMinutes());
}
function dayKey(ts){
 var d=new Date(ts); if(isNaN(d))return "—";
 function z(n){return n<10?"0"+n:""+n;}
 return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate());
}
function dayLabel(k){
 if(k==="—")return "Неизвестная дата";
 var now=new Date();
 function z(n){return n<10?"0"+n:""+n;}
 var today=now.getFullYear()+"-"+z(now.getMonth()+1)+"-"+z(now.getDate());
 var y=new Date(now.getTime()-86400000);
 var yest=y.getFullYear()+"-"+z(y.getMonth()+1)+"-"+z(y.getDate());
 if(k===today)return "Сегодня";
 if(k===yest)return "Вчера";
 var p=k.split("-");
 return p[2]+"."+p[1]+"."+p[0];
}
function visible(){
 var q=(S.filter||"").toLowerCase(), a=S.actor;
 return S.rows.filter(function(x){
  if(a&&x.actorId!==a)return false;
  if(!q)return true;
  return (actLabel(x.action)+" "+x.action+" "+(x.target||"")+" "+who(x.actorId)).toLowerCase().indexOf(q)>=0;
 });
}
function render(){
 var b=document.getElementById("auditList");if(!b)return;
 var rows=visible();
 var cnt=document.getElementById("auditCount");
 if(cnt)cnt.textContent=rows.length+" из "+S.rows.length;
 if(!S.rows.length){
  b.innerHTML='<div class="dc-empty"><div class="dc-empty-ico">🕓</div><div class="dc-empty-t">Записей пока нет</div><div class="dc-empty-s">События появятся, как только кто-то изменит профиль, заявку или материал.</div></div>';
  return;
 }
 if(!rows.length){
  b.innerHTML='<div class="dc-empty"><div class="dc-empty-ico">🔍</div><div class="dc-empty-t">Ничего не найдено</div><div class="dc-empty-s">Попробуйте изменить фильтр или поисковый запрос.</div></div>';
  return;
 }
 var out="", lastDay=null;
 rows.forEach(function(x){
  var k=dayKey(x.createdAt);
  if(k!==lastDay){ out+='<div class="dc-day"><span>'+esc(dayLabel(k))+'</span></div>'; lastDay=k; }
  var t=esc(x.target||"");
  if(t.length>120)t=t.slice(0,120)+"…";
  var kind=kindOf(x.action);
  out+='<div class="dc-msg dc-'+kind+'">'
    +'<div class="dc-ava dc-ava-'+esc(roleOf(x.actorId))+'">'+esc(initials(x.actorId))+'</div>'
    +'<div class="dc-body">'
      +'<div class="dc-head">'
        +'<span class="dc-name">'+esc(who(x.actorId))+'</span>'
        +'<span class="dc-badge dc-badge-'+esc(roleOf(x.actorId))+'">'+esc(roleOf(x.actorId))+'</span>'
        +'<span class="dc-time">'+esc(fmt(x.createdAt))+'</span>'
      +'</div>'
      +'<div class="dc-text"><span class="dc-ico">'+iconOf(x.action)+'</span>'+esc(actLabel(x.action))+(t?' <span class="dc-target">'+t+'</span>':'')+'</div>'
      +'<div class="dc-code">'+esc(x.action)+'</div>'
    +'</div>'
  +'</div>';
 });
 b.innerHTML=out;
}
function actors(){
 var seen={},out=[];
 S.rows.forEach(function(x){ if(x.actorId&&!seen[x.actorId]){seen[x.actorId]=1;out.push(x.actorId);} });
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
  var t=e.target; if(!t||!t.closest)return;
  var r=t.closest("[data-audit-refresh]");
  if(r){e.preventDefault();load();return;}
  var x=t.closest("[data-audit-export]");
  if(x){e.preventDefault();if(canSee())csv();}
 });
 document.addEventListener("input",function(e){
  var t=e.target; if(!t||!t.id)return;
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
