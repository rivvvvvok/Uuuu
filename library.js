/* library.js — 世界书、相册、关系网、记忆库、匿名箱 */// ---------- World Book 世界书（全局 / 局部） ----------
// 对外接口：getWorldBook(角色id) 取该角色适用的全部已开启条目（全局 + 绑定了该角色的局部）
//          matchWorldBook(角色id, 文本) 只取“始终生效”或“关键词出现在文本里”的条目（写内置词时用这个）
var WB={items:[]};
try{var rwb=store("worldbook");if(rwb){var w1=JSON.parse(rwb);if(w1&&w1.items)WB.items=w1.items}}catch(e){}
function saveWB(){try{localStorage.setItem("worldbook",JSON.stringify(WB));return true}catch(e){toast("存储空间不足");return false}}
window.getWorldBook=function(charId){
  return WB.items.filter(function(x){return x.on!==false&&!(x.scope==="global"&&charId&&chsGet(charId).wbOff.indexOf(x.id)>-1)&&(x.scope==="global"||(charId&&(x.chars||[]).indexOf(charId)>-1))}).map(function(x){return{title:x.title,keys:x.keys||[],content:x.content,scope:x.scope,always:!(x.keys&&x.keys.length),depth:x.depth||"medium"}});
};
window.matchWorldBook=function(charId,text){
  var t=String(text||"").toLowerCase();
  return getWorldBook(charId).filter(function(x){return x.always||x.keys.some(function(k){return k&&t.indexOf(k.toLowerCase())>-1})});
};
function wbSetHTML(){return '<div class="sgrp">World Book</div><div class="card"><button class="srow" id="wbBtn"><b>World Book</b><span class="v">'+WB.items.length+' entries ›</span></button></div>'}
var WT="global",WE={};
function wbRow(x){
  var sub=(x.keys&&x.keys.length?x.keys.join(", "):"Always on")+" · "+({light:"轻度",deep:"深度"}[x.depth]||"中度");
  if(x.scope==="local"){var ns=(x.chars||[]).map(function(i){var c=cget(i);return c?nick(c):null}).filter(Boolean);sub+=" · "+(ns.join(", ")||"No char")}
  return '<div class="item wbrow" data-wid="'+x.id+'"><div class="body"><div class="t">'+esc(x.title||"Untitled")+'</div><div class="p">'+esc(sub)+'</div></div><button class="wtg" data-wtog="'+x.id+'" aria-label="开关"><i class="sw'+(x.on!==false?' on':'')+'"></i></button></div>';
}
function renderWorld(){
  var list=WB.items.filter(function(x){return x.scope===WT});
  $("#pgWorld").innerHTML='<div class="sTitle"><button class="circle" id="wbBack" aria-label="返回">'+BACK+'</button><h1>World Book</h1></div>'+
    '<div class="seg"><button data-wtab="global" class="'+(WT==="global"?"on":"")+'">Global</button><button data-wtab="local" class="'+(WT==="local"?"on":"")+'">Local</button></div>'+
    '<div class="hint" style="word-break:normal">'+(WT==="global"?"全局：对所有角色都生效。":"局部：只对你选定的角色生效。")+'关键词留空 = 始终生效；填了关键词 = 聊天里出现这些词时才触发。</div>'+
    '<button class="addpill" id="wbAdd"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Add Entry</span></button>'+
    (list.length?'<div>'+list.map(wbRow).join("")+'</div>':'<div class="empty" style="margin-top:40px">'+(WT==="global"?"还没有全局条目":"还没有局部条目")+'</div>');
}
function openWbEdit(id){
  var x=null;WB.items.forEach(function(i){if(i.id===id)x=i});
  var scope=x?x.scope:WT;
  if(!x&&scope==="local"&&!contacts.length){toast("还没有联系人，先去 CONTACTS 添加");return}
  WE={id:x?x.id:null,scope:scope,chars:x?(x.chars||[]).filter(cget):[],on:x?x.on!==false:true,depth:(x&&x.depth)||"medium"};
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="wbCancel">Cancel</button><span class="ttl">'+(scope==="global"?"Global Entry":"Local Entry")+'</span><button class="go" id="wbSave">Save</button></div>'+
    '<div class="card" style="margin-top:16px"><div class="fl"><label>Title</label><input id="wbT" maxlength="40" placeholder="条目名称" value="'+esc(x&&x.title)+'"></div><div class="fl"><label>Keywords</label><input id="wbK" maxlength="120" placeholder="用逗号分隔，留空 = 始终生效" value="'+esc(x&&x.keys&&x.keys.join(", "))+'"></div></div>'+
    (scope==="local"?'<div class="card"><label>Characters</label><div class="fchips" id="wbChars" style="flex-wrap:wrap;margin-top:6px">'+contacts.map(function(c){return '<button class="fchip'+(WE.chars.indexOf(c.id)>-1?' on':'')+'" data-wbc="'+c.id+'">'+esc(nick(c))+'</button>'}).join("")+'</div></div>':'')+
    '<div class="card"><label>Depth</label><div class="fchips" style="margin-top:6px">'+[["light","轻度"],["medium","中度"],["deep","深度"]].map(function(d){return '<button class="fchip'+(WE.depth===d[0]?' on':'')+'" data-wbd="'+d[0]+'">'+d[1]+'</button>'}).join("")+'</div><div class="hint" style="word-break:normal">轻度：只在相关时当作背景参考。中度：自然融入对话。深度：作为核心设定，始终影响角色的言行。</div></div>'+
    '<div class="card"><label>Content</label><textarea class="tall" id="wbC" maxlength="3000" placeholder="写下设定内容…（AI 会读取）">'+esc(x&&x.content)+'</textarea></div>'+
    (x?'<button class="ghost" id="wbDel">Delete Entry</button>':'');
  $("#sheetWrap").hidden=false;
}
$("#pgWorld").onclick=function(e){
  var b=e.target.closest("button");
  if(b){
    if(b.id==="wbBack"){go("set");return}
    if(b.dataset.wtab){WT=b.dataset.wtab;renderWorld();return}
    if(b.id==="wbAdd"){openWbEdit();return}
    if(b.dataset.wtog){WB.items.forEach(function(x){if(x.id===b.dataset.wtog)x.on=x.on===false}) ;saveWB();renderWorld();return}
  }
  var r=e.target.closest("[data-wid]");if(r)openWbEdit(r.dataset.wid);
};
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.dataset.wbd){WE.depth=t.dataset.wbd;t.parentNode.querySelectorAll(".fchip").forEach(function(c){c.classList.toggle("on",c===t)})}
  else if(t.dataset.wbc){var i=WE.chars.indexOf(t.dataset.wbc);if(i>-1)WE.chars.splice(i,1);else WE.chars.push(t.dataset.wbc);t.classList.toggle("on")}
  else if(t.id==="wbCancel")closeSheet();
  else if(t.id==="wbDel"){
    if(!t.dataset.arm){t.dataset.arm="1";t.textContent="再点一次确认删除";t.style.color="#e5484d";return}
    WB.items=WB.items.filter(function(x){return x.id!==WE.id});saveWB();closeSheet();renderWorld();toast("已删除");
  }
  else if(t.id==="wbSave"){
    var ti=$("#wbT").value.trim(),co=$("#wbC").value.trim(),ks=$("#wbK").value.split(/[,，、\n]/).map(function(k){return k.trim()}).filter(Boolean);
    if(!ti&&!co){toast("先写点内容吧");return}
    if(WE.scope==="local"&&!WE.chars.length){toast("至少选一个角色");return}
    if(!ti)ti=ks[0]||co.slice(0,12);
    var o={id:WE.id||Date.now().toString(36),title:ti,keys:ks,content:co,scope:WE.scope,chars:WE.scope==="local"?WE.chars.slice():[],on:WE.on,depth:WE.depth||"medium",t:Date.now()},hit=false;
    WB.items=WB.items.map(function(x){if(x.id===o.id){hit=true;return o}return x});
    if(!hit)WB.items.unshift(o);
    saveWB();closeSheet();renderWorld();toast("已保存");
  }
});

// ---------- Album 相册 ----------
// 对外接口：getAlbum(角色id) 取该角色相册 [{id,desc,t}]
//          setAvatarFromAlbum(角色id,照片id,回调) 把相册里的某张图设为该角色头像（以后想让 AI 按描述挑图，就用这两个）
// 图片存在 IndexedDB（不占 localStorage 的空间），文字描述和设置存在 localStorage 的 albums
var ALB={};try{ALB=JSON.parse(store("albums")||"{}")||{}}catch(e){}
function saveAlb(){try{localStorage.setItem("albums",JSON.stringify(ALB));return true}catch(e){toast("存储空间不足");return false}}
function alb(cid){if(!ALB[cid])ALB[cid]={auto:true,chance:20,last:"",cur:"",items:[]};return ALB[cid]}
window.getAlbum=function(cid){return(ALB[cid]&&ALB[cid].items||[]).map(function(x){return{id:x.id,desc:x.desc,t:x.t}})};
var AV={view:"home",cid:""},AP=[],AO="",THUMB={};
function squareFrom(url,cb){var im=new Image();im.onload=function(){var s=Math.min(im.width,im.height),c=document.createElement("canvas");c.width=c.height=400;var x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,400,400);x.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,400,400);cb(c.toDataURL("image/jpeg",.85))};im.src=url}
window.setAvatarFromAlbum=function(cid,pid,cb){
  var c=cget(cid);if(!c){cb&&cb(false);return}
  idbGet("alb:"+pid,function(e,url){
    if(e||!url){cb&&cb(false);return}
    squareFrom(url,function(av){var old=c.avatar;c.avatar=av;if(!saveContacts()){c.avatar=old;cb&&cb(false);return}alb(cid).cur=pid;saveAlb();cb&&cb(true)});
  });
};
// 每天最多检查一次：按每个角色设置的几率，从相册里随机挑一张换头像
function albumTick(){
  var d=new Date(),today=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
  contacts.forEach(function(c){
    var a=ALB[c.id];if(!a||a.auto===false||!a.items.length||a.last===today)return;
    a.last=today;saveAlb();
    if(Math.random()*100>=(+a.chance||0))return;
    var pool=a.items.filter(function(x){return x.id!==a.cur});if(!pool.length)return;
    var p=pool[Math.floor(Math.random()*pool.length)];
    window.setAvatarFromAlbum(c.id,p.id,function(ok){if(ok){toast(nick(c)+" 换了新头像");renderList();var pg=$("#pgContacts");if(pg&&!pg.hidden)renderContacts()}});
  });
}
function loadThumbs(root){
  root.querySelectorAll("img[data-tid]").forEach(function(im){
    var id=im.dataset.tid;if(THUMB[id]){im.src=THUMB[id];return}
    idbGet("albt:"+id,function(e,u){if(u){THUMB[id]=u;im.src=u}});
  });
}
function renderAlbum(){
  var el=$("#pgAlbum"),h;
  if(AV.view==="home"){
    h='<div class="sTitle"><button class="circle" id="alBack" aria-label="返回">'+BACK+'</button><h1>Albums</h1></div>';
    var cs=contacts.slice().sort(function(a,b){return cname(a).localeCompare(cname(b))});
    h+=cs.length?'<div class="alg" style="margin-top:18px">'+cs.map(function(c){
      var it=(ALB[c.id]&&ALB[c.id].items)||[],cv=it.length?'<img data-tid="'+it[0].id+'">':(c.avatar?'<img src="'+c.avatar+'">':PERSON);
      return '<button class="alc" data-acid="'+c.id+'"><div class="cv">'+cv+'</div><b>'+esc(nick(c))+'</b><small>'+it.length+' photos</small></button>';
    }).join("")+'</div>':'<div class="empty">还没有联系人<br>先去 CONTACTS 添加角色</div>';
  }else{
    var c=cget(AV.cid);if(!c){AV.view="home";return renderAlbum()}
    var a=alb(AV.cid);
    h='<div class="sTitle"><button class="circle" id="alBack" aria-label="返回">'+BACK+'</button><h1>'+esc(nick(c))+'</h1></div>'+
      '<button class="addpill" id="alAdd"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Add Photos</span></button>'+
      '<div class="card"><div class="fl"><button class="srow" id="alAuto"><b>Auto change avatar</b><i class="sw'+(a.auto!==false?' on':'')+'"></i></button></div>'+
      '<div class="fl"><label>Chance per day (%)</label><input id="alChance" type="number" inputmode="numeric" min="0" max="100" value="'+(+a.chance||0)+'"></div></div>'+
      '<div class="hint">开启后，每天有一定几率从这个相册里随机挑一张，换成 TA 的头像。</div>'+
      (a.items.length?'<div class="pgrid">'+a.items.map(function(x){return '<button data-aid="'+x.id+'"><img data-tid="'+x.id+'"></button>'}).join("")+'</div>':'<div class="empty" style="margin-top:40px">还没有照片</div>');
  }
  el.innerHTML=h;loadThumbs(el);
}
function pickPhotos(){
  var inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.multiple=true;
  inp.onchange=function(){
    var fs=Array.prototype.slice.call(inp.files).slice(0,12);if(!fs.length)return;
    toast("处理图片中…");AP=[];
    (function next(i){
      if(i>=fs.length){openAddSheet();return}
      shrink(fs[i],1280,false,function(full){shrink(fs[i],360,true,function(th){
        AP.push({id:Date.now().toString(36)+i+Math.random().toString(36).slice(2,5),full:full,thumb:th,desc:""});next(i+1);
      })});
    })(0);
  };
  inp.click();
}
function openAddSheet(){
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="alCancel">Cancel</button><span class="ttl">Add Photos</span><button class="go" id="alSave">Save</button></div>'+
    '<div style="max-height:56vh;overflow-y:auto;margin-top:12px">'+AP.map(function(p,i){return '<div class="card aprow"><img src="'+p.thumb+'"><input data-ai="'+i+'" maxlength="200" placeholder="写一句图片描述…"></div>'}).join("")+'</div>';
  $("#sheetWrap").hidden=false;
}
function openPhoto(id){
  var a=alb(AV.cid),x=null;a.items.forEach(function(i){if(i.id===id)x=i});if(!x)return;AO=id;
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="apClose">Close</button><span class="ttl">Photo</span><button class="go" id="apSave">Save</button></div>'+
    '<img class="vimg" id="apImg" style="margin-top:14px" src="'+(THUMB[id]||"")+'">'+
    '<div class="card"><label>Description</label><textarea id="apDesc" maxlength="200" placeholder="写一句图片描述…">'+esc(x.desc)+'</textarea></div>'+
    '<button class="pillbtn" id="apAv">Set as avatar</button><button class="ghost" id="apDel">Delete Photo</button>';
  $("#sheetWrap").hidden=false;
  idbGet("alb:"+id,function(e,u){var im=$("#apImg");if(u&&im&&AO===id)im.src=u});
}
$("#pgAlbum").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="alBack"){if(AV.view==="detail"){AV.view="home";renderAlbum();$("#pgAlbum").scrollTop=0}else go("me");return}
  if(b.dataset.acid){AV={view:"detail",cid:b.dataset.acid};renderAlbum();$("#pgAlbum").scrollTop=0;return}
  if(b.id==="alAuto"){var a=alb(AV.cid);a.auto=a.auto===false;saveAlb();renderAlbum();return}
  if(b.id==="alAdd")return pickPhotos();
  if(b.dataset.aid)return openPhoto(b.dataset.aid);
};
$("#pgAlbum").oninput=function(e){if(e.target.id==="alChance"){alb(AV.cid).chance=Math.max(0,Math.min(100,parseInt(e.target.value,10)||0));saveAlb()}};
$("#sheet").addEventListener("input",function(e){var i=e.target.dataset.ai;if(i!=null&&AP[+i])AP[+i].desc=e.target.value});
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  var a=(/^(al|ap)/.test(t.id)&&AV.cid)?alb(AV.cid):null;
  if(t.id==="alCancel"){AP=[];closeSheet()}
  else if(t.id==="alSave"){
    var list=AP.slice();t.disabled=true;
    (function put(i){
      if(i>=list.length){saveAlb();AP=[];closeSheet();renderAlbum();toast("已添加 "+list.length+" 张");return}
      var p=list[i];
      idbPut("alb:"+p.id,p.full,function(e1){idbPut("albt:"+p.id,p.thumb,function(e2){
        if(e1||e2){toast("保存失败，存储空间可能不足");saveAlb();closeSheet();renderAlbum();return}
        THUMB[p.id]=p.thumb;a.items.unshift({id:p.id,desc:p.desc.trim(),t:Date.now()});put(i+1);
      })});
    })(0);
  }
  else if(t.id==="apClose")closeSheet();
  else if(t.id==="apSave"){a.items.forEach(function(x){if(x.id===AO)x.desc=$("#apDesc").value.trim()});saveAlb();closeSheet();toast("已保存")}
  else if(t.id==="apAv")window.setAvatarFromAlbum(AV.cid,AO,function(ok){toast(ok?"已设为头像":"设置失败");if(ok)renderList()});
  else if(t.id==="apDel"){
    if(!t.dataset.arm){t.dataset.arm="1";t.textContent="再点一次确认删除";t.style.color="#e5484d";return}
    a.items=a.items.filter(function(x){return x.id!==AO});if(a.cur===AO)a.cur="";
    idbDel("alb:"+AO);idbDel("albt:"+AO);delete THUMB[AO];saveAlb();closeSheet();renderAlbum();toast("已删除");
  }
});
// 备份：把相册图片一起打包 / 导入时写回
function albumPack(cb){
  var ids=[];Object.keys(ALB).forEach(function(c){ALB[c].items.forEach(function(x){ids.push(x.id)})});
  var out={};(function nx(i){
    if(i>=ids.length)return cb(out);
    idbGet("alb:"+ids[i],function(e,f){idbGet("albt:"+ids[i],function(e2,t){if(f)out[ids[i]]={f:f,t:t||""};nx(i+1)})});
  })(0);
}
function albumRestore(m,cb){
  var ks=Object.keys(m||{});(function nx(i){
    if(i>=ks.length)return cb();
    idbPut("alb:"+ks[i],m[ks[i]].f,function(){idbPut("albt:"+ks[i],m[ks[i]].t,function(){nx(i+1)})});
  })(0);
}
function doExport(){albumPack(doExport0)}
document.addEventListener("visibilitychange",function(){if(!document.hidden)albumTick()});

// ---------- Relationships 关系网 ----------
// 数据：REL=[{id,a,b,label,back,note}]，a / b 是角色 id，"me" 代表你自己
// label = A 是 B 的什么；back = B 是 A 的什么（留空表示双方一样）
// 对外接口：getRelations(id) 取某人（"me" 或角色id）的所有关系，之后写聊天提示词时用
var REL=[];try{REL=JSON.parse(store("relations")||"[]")||[]}catch(e){}
function saveRel(){try{localStorage.setItem("relations",JSON.stringify(REL));return true}catch(e){toast("存储空间不足");return false}}
function relName(id){if(id==="me")return P.name||"Me";var c=cget(id);return c?nick(c):""}
function relOk(id){return id==="me"||!!cget(id)}
window.getRelations=function(id){
  return REL.filter(function(r){return r.a===id||r.b===id}).map(function(r){
    var self=r.a===id,o=self?r.b:r.a;
    return{with:o,withName:relName(o),selfRole:self?r.label:(r.back||r.label),otherRole:self?(r.back||r.label):r.label,note:r.note||""};
  });
};
function relLabel(r){return(r.label||"…")+(r.back&&r.back!==r.label?" / "+r.back:"")}
function relGraph(){
  var ids=contacts.map(function(c){return c.id}),cx=180,cy=190,R=125,pos={me:{x:cx,y:cy}},g="",t="",n="",i=0;
  ids.forEach(function(id,k){var a=-Math.PI/2+2*Math.PI*k/ids.length;pos[id]={x:cx+R*Math.cos(a),y:cy+R*Math.sin(a)}});
  REL.forEach(function(r){
    var p=pos[r.a],q=pos[r.b];if(!p||!q)return;
    g+='<line x1="'+p.x+'" y1="'+p.y+'" x2="'+q.x+'" y2="'+q.y+'" style="stroke:var(--sub);stroke-width:1.4;opacity:.55"/>';
    t+='<text x="'+(p.x+q.x)/2+'" y="'+((p.y+q.y)/2+3)+'" text-anchor="middle" style="fill:var(--sub);font-size:10px;font-weight:700;stroke:var(--bg);stroke-width:4px;paint-order:stroke">'+esc(relLabel(r).slice(0,12))+'</text>';
  });
  ["me"].concat(ids).forEach(function(id){
    var p=pos[id],nm=relName(id),c=id==="me"?null:cget(id),av=id==="me"?P.avatar:(c&&c.avatar);i++;
    n+=(id==="me"?'<circle cx="'+p.x+'" cy="'+p.y+'" r="31" style="fill:none;stroke:var(--text);stroke-width:1.5"/>':'')+
      '<circle cx="'+p.x+'" cy="'+p.y+'" r="27" style="fill:var(--av)"/>'+
      (av?'<clipPath id="rcp'+i+'"><circle cx="'+p.x+'" cy="'+p.y+'" r="26"/></clipPath><image href="'+av+'" x="'+(p.x-26)+'" y="'+(p.y-26)+'" width="52" height="52" preserveAspectRatio="xMidYMid slice" clip-path="url(#rcp'+i+')"/>'
        :'<text x="'+p.x+'" y="'+(p.y+6)+'" text-anchor="middle" style="fill:#fff;font-size:17px;font-weight:800">'+esc((nm||"?").slice(0,1).toUpperCase())+'</text>')+
      '<text x="'+p.x+'" y="'+(p.y+46)+'" text-anchor="middle" style="fill:var(--text);font-size:11px;font-weight:700">'+esc(nm.slice(0,8))+'</text>';
  });
  return '<svg class="rgraph" viewBox="0 0 360 385">'+g+t+n+'</svg>';
}
function renderRel(){
  REL=REL.filter(function(r){return relOk(r.a)&&relOk(r.b)});
  var h='<div class="sTitle"><button class="circle" id="rlBack" aria-label="返回">'+BACK+'</button><h1>Relationships</h1></div>'+relGraph()+
    '<button class="addpill" id="rlAdd"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Add Relationship</span></button>';
  h+=REL.length?REL.map(function(r){
    return '<button class="item" data-rid="'+r.id+'" style="margin-top:8px"><div class="body"><div class="t">'+esc(relName(r.a))+' · '+esc(relName(r.b))+'</div><div class="p">'+esc(relLabel(r)+(r.note?" — "+r.note:""))+'</div></div></button>';
  }).join(""):'<div class="empty" style="margin-top:30px">还没有关系<br>点上面添加，比如你和某个角色，或者角色之间</div>';
  $("#pgRel").innerHTML=h;
}
var RE={};
function relChips(row,sel){
  return ["me"].concat(contacts.map(function(c){return c.id})).map(function(id){
    return '<button class="fchip'+(id===sel?' on':'')+'" data-'+row+'="'+id+'">'+esc(relName(id))+'</button>';
  }).join("");
}
function openRelEdit(id){
  var x=null;REL.forEach(function(r){if(r.id===id)x=r});
  if(!x&&!contacts.length){toast("还没有联系人，先去 CONTACTS 添加");return}
  RE={id:x?x.id:null,a:x?x.a:"me",b:x?x.b:""};
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="rlCancel">Cancel</button><span class="ttl">Relationship</span><button class="go" id="rlSave">Save</button></div>'+
    '<div style="max-height:62vh;overflow-y:auto">'+
    '<div class="card" style="margin-top:16px"><label>Person A</label><div class="fchips" id="rlA" style="flex-wrap:wrap;margin-top:6px">'+relChips("ra",RE.a)+'</div></div>'+
    '<div class="card"><label>Person B</label><div class="fchips" id="rlB" style="flex-wrap:wrap;margin-top:6px">'+relChips("rb",RE.b)+'</div></div>'+
    '<div class="card"><div class="fl"><label>A 是 B 的…</label><input id="rlLab" maxlength="30" placeholder="例如：哥哥、同桌、暗恋对象" value="'+esc(x&&x.label)+'"></div>'+
    '<div class="fl"><label>B 是 A 的…（留空 = 和上面一样）</label><input id="rlBk" maxlength="30" placeholder="例如：弟弟" value="'+esc(x&&x.back)+'"></div></div>'+
    '<div class="card"><label>Note</label><textarea id="rlNote" maxlength="300" placeholder="补充说明，比如相识经过、现在的关系状态…（AI 会读取）">'+esc(x&&x.note)+'</textarea></div>'+
    (x?'<button class="ghost" id="rlDel">Delete Relationship</button>':'')+'</div>';
  $("#sheetWrap").hidden=false;
}
$("#pgRel").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="rlBack")return go("me");
  if(b.id==="rlAdd")return openRelEdit();
  if(b.dataset.rid)return openRelEdit(b.dataset.rid);
};
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.dataset.ra||t.dataset.rb){
    var k=t.dataset.ra?"a":"b";RE[k]=t.dataset.ra||t.dataset.rb;
    t.parentNode.querySelectorAll(".fchip").forEach(function(c){c.classList.toggle("on",c===t)});return;
  }
  if(t.id==="rlCancel")closeSheet();
  else if(t.id==="rlDel"){
    if(!t.dataset.arm){t.dataset.arm="1";t.textContent="再点一次确认删除";t.style.color="#e5484d";return}
    REL=REL.filter(function(r){return r.id!==RE.id});saveRel();closeSheet();renderRel();toast("已删除");
  }
  else if(t.id==="rlSave"){
    var lab=$("#rlLab").value.trim(),bk=$("#rlBk").value.trim(),note=$("#rlNote").value.trim();
    if(!RE.b||RE.a===RE.b){toast("请选两个不同的人");return}
    if(!lab&&!note){toast("写一下他们是什么关系");return}
    if(REL.some(function(r){return r.id!==RE.id&&((r.a===RE.a&&r.b===RE.b)||(r.a===RE.b&&r.b===RE.a))})){toast("这两个人已经有关系了，点开它来修改");return}
    var o={id:RE.id||Date.now().toString(36),a:RE.a,b:RE.b,label:lab,back:bk,note:note},hit=false;
    REL=REL.map(function(r){if(r.id===o.id){hit=true;return o}return r});
    if(!hit)REL.unshift(o);
    saveRel();closeSheet();renderRel();toast("已保存");
  }
});

// ---------- Memory 记忆库 ----------
// 数据：MEM={角色id:[{id,type,text,t}]}；MT=类型列表（默认来自 CONFIG.memoryTypes，可新建）
// 对外接口：getMemories(角色id, 类型可选) 取某个角色的记忆，之后写聊天提示词时用
var MEM={};try{MEM=JSON.parse(store("memories")||"{}")||{}}catch(e){}
var MT=null;try{MT=JSON.parse(store("memtypes")||"null")}catch(e){}
if(!Array.isArray(MT)||!MT.length)MT=CONFIG.memoryTypes.slice();
function saveMem(){try{localStorage.setItem("memories",JSON.stringify(MEM));localStorage.setItem("memtypes",JSON.stringify(MT));return true}catch(e){toast("存储空间不足");return false}}
function memDay(t){var d=new Date(t||Date.now()),p=function(n){return(n<10?"0":"")+n};return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())}
function memSort(list){return list.slice().sort(function(a,b){var ka=a.date||memDay(a.t),kb=b.date||memDay(b.t);return ka<kb?1:ka>kb?-1:(b.t||0)-(a.t||0)})}
window.getMemories=function(cid,type){return(MEM[cid]||[]).filter(function(m){return!type||m.type===type}).map(function(m){return{type:m.type,text:m.text,t:m.t,date:m.date||memDay(m.t)}})};
var MV={view:"home",cid:"",type:"All"},ME={};
function renderMem(){
  var el=$("#pgMem"),h;
  if(MV.view==="home"){
    h='<div class="sTitle"><button class="circle" id="mmBack" aria-label="返回">'+BACK+'</button><h1>Memory</h1></div>';
    var cs=contacts.slice().sort(function(a,b){return cname(a).localeCompare(cname(b))});
    h+=cs.length?'<div style="margin-top:18px">'+cs.map(function(c){
      var n=(MEM[c.id]||[]).length;
      return '<button class="item" data-mcid="'+c.id+'" style="margin-top:8px"><div class="avatar">'+(c.avatar?'<img src="'+c.avatar+'">':PERSON)+'</div><div class="body"><div class="t">'+esc(nick(c))+'</div><div class="p">'+n+' memories</div></div></button>';
    }).join("")+'</div>':'<div class="empty">还没有联系人<br>先去 CONTACTS 添加角色</div>';
  }else{
    var c=cget(MV.cid);if(!c){MV.view="home";return renderMem()}
    var all=MEM[MV.cid]||[],list=memSort(all.filter(function(m){return MV.type==="All"||m.type===MV.type}));
    h='<div class="sTitle"><button class="circle" id="mmBack" aria-label="返回">'+BACK+'</button><h1>'+esc(nick(c))+'</h1></div>'+
      '<div class="fchips" style="flex-wrap:wrap;margin-top:16px">'+["All"].concat(MT).map(function(t){return '<button class="fchip'+(t===MV.type?' on':'')+'" data-mtype="'+esc(t)+'">'+esc(t)+'</button>'}).join("")+'</div>'+
      '<button class="addpill" id="mmAdd"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Add Memory</span></button>'+
      (list.length?list.map(function(m){
        return '<button class="item" data-mid="'+m.id+'" style="margin-top:8px;align-items:flex-start;padding:12px 14px"><div class="body"><div class="row"><span class="mtag">'+esc(m.type)+'</span><span class="d">'+esc(m.date||memDay(m.t))+'</span></div><div class="mmt">'+esc(m.text)+'</div></div></button>';
      }).join(""):'<div class="empty" style="margin-top:40px">'+(all.length?"这个类型下还没有记忆":"还没有记忆")+'</div>');
  }
  el.innerHTML=h;
}
function openMemEdit(id){
  var x=null;(MEM[MV.cid]||[]).forEach(function(m){if(m.id===id)x=m});
  ME={id:x?x.id:null,type:x?x.type:(MV.type!=="All"?MV.type:MT[0])};
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="mmCancel">Cancel</button><span class="ttl">Memory</span><button class="go" id="mmSave">Save</button></div>'+
    '<div style="max-height:62vh;overflow-y:auto">'+
    '<div class="card" style="margin-top:16px"><label>Type</label><div class="fchips" id="mmTypes" style="flex-wrap:wrap;margin-top:6px">'+MT.map(function(t){return '<button class="fchip'+(t===ME.type?' on':'')+'" data-metype="'+esc(t)+'">'+esc(t)+'</button>'}).join("")+'</div>'+
    '<div class="fl" style="margin-top:12px"><input id="mmNew" maxlength="8" placeholder="或者新建一个类型（最多 8 个字）"></div></div>'+
    '<div class="card"><label>Date</label><input type="date" id="mmDate" value="'+(x?(x.date||memDay(x.t)):memDay(Date.now()))+'"></div>'+
    '<div class="card"><label>Content</label><textarea class="tall" id="mmText" maxlength="1000" placeholder="写下这条记忆…（AI 会读取）">'+esc(x&&x.text)+'</textarea></div>'+
    (x?'<button class="ghost" id="mmDel">Delete Memory</button>':'')+'</div>';
  $("#sheetWrap").hidden=false;
}
$("#pgMem").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="mmBack"){if(MV.view==="detail"){MV.view="home";renderMem();$("#pgMem").scrollTop=0}else go("me");return}
  if(b.dataset.mcid){MV={view:"detail",cid:b.dataset.mcid,type:"All"};renderMem();$("#pgMem").scrollTop=0;return}
  if(b.dataset.mtype){MV.type=b.dataset.mtype;renderMem();return}
  if(b.id==="mmAdd")return openMemEdit();
  if(b.dataset.mid)return openMemEdit(b.dataset.mid);
};
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.dataset.metype){ME.type=t.dataset.metype;var nw=$("#mmNew");if(nw)nw.value="";t.parentNode.querySelectorAll(".fchip").forEach(function(c){c.classList.toggle("on",c===t)});return}
  if(t.id==="mmCancel")closeSheet();
  else if(t.id==="mmDel"){
    if(!t.dataset.arm){t.dataset.arm="1";t.textContent="再点一次确认删除";t.style.color="#e5484d";return}
    MEM[MV.cid]=(MEM[MV.cid]||[]).filter(function(m){return m.id!==ME.id});saveMem();closeSheet();renderMem();toast("已删除");
  }
  else if(t.id==="mmSave"){
    var tx=$("#mmText").value.trim(),nt=$("#mmNew").value.trim(),ty=ME.type,dv=$("#mmDate").value||memDay(Date.now());
    if(!tx){toast("先写点内容吧");return}
    if(nt){if(MT.indexOf(nt)<0)MT.push(nt);ty=nt}
    var list=MEM[MV.cid]||(MEM[MV.cid]=[]);
    if(ME.id){list.forEach(function(m){if(m.id===ME.id){m.type=ty;m.text=tx;m.date=dv}})}
    else list.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),type:ty,text:tx,t:Date.now(),date:dv});
    saveMem();closeSheet();renderMem();toast("已保存");
  }
});

// ---------- Anonymous Box 匿名箱 ----------
// 数据：QBOX=[{id,to,from,anon,q,a,t,at}]  to=被提问的角色id；from="me" 或角色id；anon=是否匿名；a=回答
// 对外接口：getQuestions(角色id) 取某角色收到的问题；answerQuestion(问题id, 文字) 写入回答（以后接上 AI 就用这个自动回答）
var QBOX=[];try{QBOX=JSON.parse(store("box")||"[]")||[]}catch(e){}
function saveBox(){try{localStorage.setItem("box",JSON.stringify(QBOX));return true}catch(e){toast("存储空间不足");return false}}
window.getQuestions=function(cid){return QBOX.filter(function(q){return q.to===cid&&q.from==="me"}).map(function(q){return{id:q.id,asker:q.anon?"Anonymous":relName(q.from),anonymous:!!q.anon,question:q.q,answer:q.a||"",t:q.t}})};
window.answerQuestion=function(id,text){var ok=false;QBOX.forEach(function(q){if(q.id===id){q.a=String(text||"").trim();q.at=q.a?Date.now():0;ok=true}});if(ok)saveBox();return ok};
var QBV={to:"All"},QBE={},QOPEN="",QDR="",QAN=true;
function boxChips(attr,ids,sel){return ids.map(function(o){return '<button class="fchip'+(o.id===sel?' on':'')+'" data-'+attr+'="'+o.id+'">'+esc(o.n)+'</button>'}).join("")}
function bxAv(){var c=QBV.to!=="All"?cget(QBV.to):null;return avh(c&&c.avatar)}
function bxTitle(){var c=QBV.to!=="All"?cget(QBV.to):null;return c?"Ask "+nick(c)+" anything":"Ask me anything"}
var BXSEND='<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',BXX='<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
function renderBox(){
  QBOX=QBOX.filter(function(q){return cget(q.to)&&q.from==="me"});
  if(QBV.to!=="All"&&!cget(QBV.to))QBV.to="All";
  var list=QBOX.filter(function(q){return QBV.to==="All"||q.to===QBV.to});
  var chips=boxChips("bf",[{id:"All",n:"All"}].concat(contacts.map(function(c){return{id:c.id,n:nick(c)}})),QBV.to);
  $("#pgBox").innerHTML=
    '<div class="bxs"><div class="bxs-top"><div class="bxs-who"><div class="avatar">'+avh(P.avatar)+'</div><b>Anonymous</b><span>now</span></div><button class="circle" id="bxBack" aria-label="Close">'+BXX+'</button></div>'+
    '<div class="fchips bxs-chips">'+chips+'</div>'+
    '<div class="bxs-mid"><div class="bxs-card"><div class="bxs-av">'+bxAv()+'</div><div class="bxs-t">'+esc(bxTitle())+'</div><textarea id="bxQ" maxlength="300" placeholder="Type something…"></textarea></div></div>'+
    '<div class="bxs-bot"><button class="fchip'+(QAN?' on':'')+'" id="bxAnonT">Anonymous</button><button class="sendBtn" id="bxSend" aria-label="Send">'+BXSEND+'</button></div></div>'+
    '<div class="sgrp" style="margin-top:22px">Questions</div>'+
    (list.length?list.map(function(q){
      return '<button class="item" data-qid="'+q.id+'" style="margin-top:8px;align-items:flex-start;padding:12px 14px"><div class="body"><div class="row"><span class="mtag">'+esc(q.anon?"Anonymous":relName("me"))+' → '+esc(relName(q.to))+'</span><span class="d">'+fmtTime(q.t)+'</span></div>'+
        '<div class="mmt" style="font-weight:700">'+esc(q.q)+'</div>'+
        (q.a?'<div class="mmt" style="color:var(--sub);margin-top:6px">'+esc(relName(q.to))+'：'+esc(q.a)+'</div>':'<div class="p" style="margin-top:6px">Waiting for reply…</div>')+'</div></button>';
    }).join(""):'<div class="empty" style="margin-top:30px">No questions yet<br>Pick a Char above and ask something</div>');
  $("#bxQ").value=QDR;
}
function bxSendQ(){
  var tx=$("#bxQ").value.trim();
  if(QBV.to==="All"){toast("Pick a Char first");return}
  if(!tx){toast("Type something first");return}
  QBOX.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),to:QBV.to,from:"me",anon:QAN,q:tx,a:"",t:Date.now(),at:0});
  saveBox();QDR="";renderBox();toast("Sent");
}
function openQ(id){
  var q=null;QBOX.forEach(function(x){if(x.id===id)q=x});if(!q)return;QOPEN=id;
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="bxClose">Close</button><span class="ttl">Question</span><button class="go" id="bxSaveA">Save</button></div>'+
    '<div class="card" style="margin-top:16px"><span class="mtag">'+esc(q.anon?"Anonymous":relName(q.from))+' → '+esc(relName(q.to))+'</span><div class="mmt" style="font-weight:700;display:block;-webkit-line-clamp:unset">'+esc(q.q)+'</div></div>'+
    '<div class="card"><label>Answer as '+esc(relName(q.to))+'</label><textarea class="tall" id="bxA" maxlength="600" placeholder="以 TA 的口吻写回答…（接上 AI 后可以自动回答）">'+esc(q.a)+'</textarea></div>'+
    '<button class="ghost" id="bxDel">Delete Question</button>';
  $("#sheetWrap").hidden=false;
}
$("#boxBtn").onclick=function(){QBV.to="All";go("box")};
$("#pgBox").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="bxBack")return go("contacts");
  if(b.dataset.bf){QDR=$("#bxQ").value;QBV.to=b.dataset.bf;renderBox();return}
  if(b.id==="bxAnonT"){QAN=!QAN;b.classList.toggle("on",QAN);return}
  if(b.id==="bxSend")return bxSendQ();
  if(b.dataset.qid)return openQ(b.dataset.qid);
};
$("#pgBox").addEventListener("input",function(e){if(e.target.id==="bxQ")QDR=e.target.value});
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.id==="bxClose")closeSheet();
  else if(t.id==="bxSaveA"){window.answerQuestion(QOPEN,$("#bxA").value);closeSheet();renderBox();toast("已保存")}
  else if(t.id==="bxDel"){
    if(!t.dataset.arm){t.dataset.arm="1";t.textContent="再点一次确认删除";t.style.color="#e5484d";return}
    QBOX=QBOX.filter(function(q){return q.id!==QOPEN});saveBox();closeSheet();renderBox();toast("已删除");
  }
});


// ---------- Contacts 页的相册小组件：三张图，长按任意一张更换 ----------
var STRIP=[];try{STRIP=JSON.parse(store("strip")||"[]")||[]}catch(e){}
var STRIPI='<svg viewBox="0 0 24 24"><rect x="3.500" y="5" width="17" height="14" rx="3"/><circle cx="9" cy="10.500" r="1.500"/><path d="M4.500 17l4.500-4 3.500 3 3-2.500 4 3.500"/></svg>';
function renderStrip(){
  var el=$("#cStrip");if(!el)return;
  var any=STRIP.some(function(x){return !!x});
  el.innerHTML='<div class="csr">'+[0,1,2].map(function(i){return '<div class="cs'+(STRIP[i]?'':' ph')+'" data-si="'+i+'">'+(STRIP[i]?'<img src="'+STRIP[i]+'">':STRIPI)+'</div>'}).join("")+'</div>'+(any?'':'<div class="csh">长按图片可以更换</div>');
}
function pickStrip(i){
  var inp=document.createElement("input");inp.type="file";inp.accept="image/*";
  inp.onchange=function(){var f=inp.files[0];if(!f)return;
    shrink(f,520,false,function(url){
      var old=STRIP[i];STRIP[i]=url;
      try{localStorage.setItem("strip",JSON.stringify(STRIP))}catch(e){STRIP[i]=old;toast("存储空间不足");return}
      renderStrip();
    });
  };
  inp.click();
}
(function(){
  var tm=null,sx=0,sy=0,box=$("#cStrip");if(!box)return;
  function slot(e){return e.target.closest&&e.target.closest(".cs")}
  box.addEventListener("touchstart",function(e){var d=slot(e);if(!d)return;var t=e.touches[0];sx=t.clientX;sy=t.clientY;clearTimeout(tm);tm=setTimeout(function(){pickStrip(+d.dataset.si)},500)},{passive:true});
  box.addEventListener("touchmove",function(e){var t=e.touches[0];if(Math.abs(t.clientX-sx)>8||Math.abs(t.clientY-sy)>8)clearTimeout(tm)},{passive:true});
  box.addEventListener("touchend",function(){clearTimeout(tm)});
  box.addEventListener("touchcancel",function(){clearTimeout(tm)});
  box.addEventListener("contextmenu",function(e){var d=slot(e);if(d){e.preventDefault();pickStrip(+d.dataset.si)}});
})();
