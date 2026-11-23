/* base.js — 基础工具、个人资料、联系人数据、Chats 列表、Contacts 页 */
var $=function(s){return document.querySelector(s)};
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function toast(m,ms){var d=document.createElement("div");d.className="toast";d.textContent=m;document.body.appendChild(d);setTimeout(function(){d.remove()},ms||2200)}
function shrink(file,max,square,cb){
  var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){
    var c=document.createElement("canvas"),x=c.getContext("2d");
    if(square){var s=Math.min(im.width,im.height);c.width=c.height=max;x.fillStyle="#fff";x.fillRect(0,0,max,max);x.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,max,max)}
    else{var k=Math.min(1,max/Math.max(im.width,im.height));c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height)}
    cb(c.toDataURL("image/jpeg",.8));
  };im.src=r.result};r.readAsDataURL(file);
}

// ---------- User 个人资料 ----------
var P=JSON.parse(JSON.stringify(CONFIG.profile));
try{
  var raw=store("profile");
  if(raw){Object.assign(P,JSON.parse(raw))}
  else{if(store("myName"))P.name=store("myName");if(store("myHandle"))P.handle=store("myHandle");if(store("avatar"))P.avatar=store("avatar")}
}catch(e){}
function saveP(){store("profile",JSON.stringify(P))}
// 之后聊天提示词会通过这两个函数读取 User 和角色信息
window.getUserProfile=function(){return{name:P.name,real:P.real,uid:P.uid,bio:P.bio,persona:P.persona}};
window.getContacts=function(){return contacts};
var PERSON='<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
var PERSONP='<svg class="p" viewBox="0 0 24 24">'+PERSON.replace(/<svg[^>]*>|<\/svg>/g,"")+'</svg>';
function applyHeader(){
  $("#hdName").textContent=P.name;
  $("#hdAvatar").innerHTML=P.avatar?'<img src="'+P.avatar+'">':PERSON;
  var b=$("#banner");
  if(P.bg){b.style.backgroundImage='url("'+P.bg+'")';b.classList.add("img")}else{b.style.backgroundImage="";b.classList.remove("img")}
}

// ---------- 联系人数据 ----------
var contacts=[];try{contacts=JSON.parse(store("contacts")||"[]")}catch(e){}
function saveContacts(){try{localStorage.setItem("contacts",JSON.stringify(contacts));return true}catch(e){toast("存储空间不足，图片可能太大");return false}}
function cname(c){return c.real||c.user}
function idTaken(uid,exceptContact){var l=uid.toLowerCase();if(exceptContact!=="__me"&&P.uid&&P.uid.toLowerCase()===l)return true;return contacts.some(function(c){return c.id!==exceptContact&&c.uid&&c.uid.toLowerCase()===l})}
function nick(c){return c.user||c.real}
function chatsFrom(){return contacts.map(function(c){var d=new Date(c.t);return{id:c.id,name:nick(c),last:c.sig||"New friend",date:(d.getMonth()+1)+"/"+d.getDate(),avatar:c.avatar}})}

// ---------- Chats 列表 ----------
var tab="chats";
function fmtTime(t){
  var d=new Date(t),n=new Date(),day=function(x){return new Date(x.getFullYear(),x.getMonth(),x.getDate())};
  var k=Math.round((day(n)-day(d))/864e5);
  if(k<=0){var h=d.getHours(),m=d.getMinutes();return(h%12||12)+":"+(m<10?"0":"")+m+" "+(h<12?"AM":"PM")}
  if(k===1)return"Yesterday";
  if(k<7)return["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
  return(d.getMonth()+1)+"/"+d.getDate();
}
function chatsFrom(){
  var a=contacts.map(function(c){var l=(chats[c.id]||[]).slice(-1)[0];return{id:c.id,name:nick(c),last:l?l.text:(c.sig||"New friend"),t:l?l.t:c.t,date:fmtTime(l?l.t:c.t),unread:0,avatar:c.avatar}});
  var b=groups.map(function(g){var ns=g.members.map(function(m){var c=cget(m);return c?nick(c):null}).filter(Boolean);return{id:g.id,group:true,name:g.name,last:ns.join(", ")||"No members",t:g.t,date:fmtTime(g.t),unread:0,avatar:g.avatar}});
  return a.concat(b).sort(function(x,y){return y.t-x.t});
}
function renderList(){
  var q=$("#q").value.trim().toLowerCase(),el=$("#list");
  if(tab==="friends"){renderFriends(q);return}
  var rows=chatsFrom().filter(function(c){return(tab==="chats"||(tab==="groups")===!!c.group)&&(!q||c.name.toLowerCase().indexOf(q)>-1||c.last.toLowerCase().indexOf(q)>-1)});
  el.innerHTML=rows.length?rows.map(function(c){
    var right=tab!=="friends"?'<span class="d">'+c.date+'</span>':'';
    var badge=tab==="chats"&&c.unread?'<span class="bd">'+(c.unread>99?"99+":c.unread)+'</span>':'';
    return '<button class="item" data-id="'+c.id+'"'+(c.group?' data-g="1"':'')+'><div class="avatar">'+(c.avatar?'<img src="'+c.avatar+'">':(c.group?GROUPI:PERSON))+'</div>'+
      '<div class="body"><div class="row"><span class="t">'+esc(c.name)+'</span>'+right+'</div><div class="row2"><div class="p">'+esc(c.last)+'</div>'+badge+'</div></div></button>';
  }).join(""):'<div class="empty" style="margin-top:50px">'+(q?"没有找到":tab==="groups"?"还没有群聊<br>去 CONTACTS 点 New Group 创建":tab==="friends"?"还没有好友<br>去 CONTACTS 添加":"还没有聊天<br>去 CONTACTS 添加一个角色")+'</div>';
}
$("#tabs").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  tab=b.dataset.t;document.querySelectorAll("#tabs button").forEach(function(t){t.classList.toggle("on",t===b)});renderList();
};
$("#q").oninput=renderList;
$("#qBtn").onclick=function(){var b=$("#qBar");b.hidden=!b.hidden;if(!b.hidden)$("#q").focus();else{$("#q").value="";renderList()}};

// ---------- Contacts 页 ----------
function renderContacts(){
  var q=$("#cq").value.trim().toLowerCase();
  var rows=contacts.slice().sort(function(a,b){return cname(a).localeCompare(cname(b))}).filter(function(c){return !q||((c.real||"")+(c.user||"")).toLowerCase().indexOf(q)>-1});
  var gs=groups.filter(function(g){return !q||g.name.toLowerCase().indexOf(q)>-1});
  var h=rows.map(function(c){
    var sub=c.sig||(c.user?"@"+c.user.replace(/^@/,""):"");
    return '<button class="item" data-id="'+c.id+'"><div class="avatar">'+(c.avatar?'<img src="'+c.avatar+'">':PERSON)+'</div><div class="body"><div class="t">'+esc(cname(c))+'</div>'+(sub?'<div class="p">'+esc(sub)+'</div>':'')+'</div></button>';
  }).join("");
  if(gs.length)h+='<div class="sec" style="margin-top:18px"><span>Groups</span></div>'+gs.map(function(g){
    var n=g.members.filter(function(m){return cget(m)}).length;
    return '<button class="item" data-gid="'+g.id+'"><div class="avatar">'+(g.avatar?'<img src="'+g.avatar+'">':GROUPI)+'</div><div class="body"><div class="t">'+esc(g.name)+'</div><div class="p">'+n+' members</div></div></button>';
  }).join("");
  $("#cList").innerHTML=h||'<div class="empty" style="margin-top:60px">'+(q?"没有找到":"还没有联系人<br>点上面的 Add Friend 添加角色")+'</div>';
}
$("#cList").onclick=function(e){var b=e.target.closest(".item");if(!b)return;if(b.dataset.gid)openGroupForm(b.dataset.gid);else openProfile(b.dataset.id)};
$("#cq").oninput=renderContacts;
$("#cSearch").onclick=function(){var b=$("#cSearchBar");b.hidden=!b.hidden;if(!b.hidden)$("#cq").focus();else{$("#cq").value="";renderContacts()}};
$("#addBtn").onclick=function(){openForm()};

