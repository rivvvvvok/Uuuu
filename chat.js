/* chat.js — 群聊、对话、调用 AI、消息操作、页面切换（核心） */// ---------- 群聊 ----------
var groups=[];try{groups=JSON.parse(store("groups")||"[]")}catch(e){}
function saveGroups(){try{localStorage.setItem("groups",JSON.stringify(groups));return true}catch(e){toast("存储空间不足，图片可能太大");return false}}
window.getGroups=function(){return groups};
function cget(id){var r=null;contacts.forEach(function(c){if(c.id===id)r=c});return r}
var GP='<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 3-5.5 6.5-5.5s6.500 1.900 6.500 5.500"/><circle cx="17" cy="9" r="2.8"/><path d="M17 14.500c2.700 0 4.500 1.500 4.500 4.500"/>';
var GROUPI='<svg viewBox="0 0 24 24">'+GP+'</svg>',GROUPP='<svg class="p" viewBox="0 0 24 24">'+GP+'</svg>';
var G={};
function openGroupForm(id){
  var g=null;groups.forEach(function(x){if(x.id===id)g=x});
  G={id:g?g.id:null,t:g?g.t:Date.now(),avatar:g?g.avatar:"",members:g?g.members.filter(function(m){return cget(m)}):[]};
  $("#pgGrp").innerHTML=
   '<button class="cancel" id="gCancel">Cancel</button>'+
   '<div class="card lrow" id="gAvRow"><div class="avc" id="gavc"></div><div class="tx"><b>Group Avatar</b><small>上传群头像</small></div>'+CHEV+'</div>'+
   '<div class="card"><label>Group Name</label><input id="gName" maxlength="30" placeholder="给群聊起个名字" value="'+esc(g&&g.name)+'"></div>'+
   '<div class="card"><label>Members<span id="gCount" style="float:right;color:var(--sub);font-size:12px;font-weight:700"></span></label>'+
   (contacts.length?contacts.map(function(c){return '<button class="prow" data-m="'+c.id+'"><div class="avatar">'+avh(c.avatar)+'</div><span class="pn">'+esc(cname(c))+'</span><i class="chk'+(G.members.indexOf(c.id)>-1?' on':'')+'"></i></button>'}).join(""):'<div class="hint" style="margin:4px 0">还没有联系人，请先到 Add Friend 添加角色。</div>')+'</div>'+
   '<button class="bigbtn" id="gSave">'+(g?"Save":"Create Group")+'</button>'+(g?'<button class="ghost" id="gDel">Delete Group</button>':'');
  function av(){$("#gavc").innerHTML=(G.avatar?'<img src="'+G.avatar+'">':GROUPP)+'<span class="cam2">'+CAM+'</span>'}
  function cnt(){$("#gCount").textContent=G.members.length+" selected"}
  av();cnt();
  $("#gCancel").onclick=function(){go("contacts")};
  $("#gAvRow").onclick=function(){
    var inp=document.createElement("input");inp.type="file";inp.accept="image/*";
    inp.onchange=function(){if(inp.files[0])shrink(inp.files[0],400,true,function(d){G.avatar=d;av()})};inp.click();
  };
  $("#pgGrp").onclick=function(e){
    var b=e.target.closest("[data-m]");if(!b)return;
    var i=G.members.indexOf(b.dataset.m);if(i>-1)G.members.splice(i,1);else G.members.push(b.dataset.m);
    b.querySelector(".chk").classList.toggle("on");cnt();
  };
  $("#gSave").onclick=function(){
    var name=$("#gName").value.trim();
    if(!name){$("#gName").focus();toast("请填写群名");return}
    if(G.members.length<2){toast("至少选择 2 个角色");return}
    var o={id:G.id||("g"+Date.now().toString(36)),name:name,avatar:G.avatar,members:G.members,t:G.t};
    var old=groups.slice(),isNew=!G.id,hit=false;
    groups=groups.map(function(x){if(x.id===o.id){hit=true;return o}return x});
    if(!hit)groups.push(o);
    if(!saveGroups()){groups=old;return}
    toast(isNew?"群聊已创建":"已保存");go("contacts");
  };
  var dl=$("#gDel");
  if(dl)dl.onclick=function(){
    if(!dl.dataset.arm){dl.dataset.arm="1";dl.textContent="再点一次确认删除";dl.style.color="#e5484d";return}
    groups=groups.filter(function(x){return x.id!==G.id});saveGroups();toast("已删除");go("contacts");
  };
  go("grp");
}
$("#grpBtn").onclick=function(){openGroupForm()};

// ---------- 对话 ----------
var chats={};try{chats=JSON.parse(store("chats")||"{}")}catch(e){}
function saveChats(){try{localStorage.setItem("chats",JSON.stringify(chats));return true}catch(e){toast("存储空间不足");return false}}
window.getChats=function(){return chats};
function msgs(id){return chats[id]||(chats[id]=[])}
var CUR=null,busy=false,act={i:-1};
function pad2(n){return n<10?"0"+n:""+n}
function sameDay(a,b){return new Date(a).toDateString()===new Date(b).toDateString()}
function hm(t){var d=new Date(t),h=d.getHours();return(h%12||12)+":"+pad2(d.getMinutes())+" "+(h<12?"AM":"PM")}
function stamp(t){var d=new Date(t);return sameDay(t,Date.now())?hm(t):(d.getMonth()+1)+"/"+d.getDate()+" "+pad2(d.getHours())+":"+pad2(d.getMinutes())}
function mtime(t){var d=new Date(t);return sameDay(t,Date.now())?hm(t):(d.getMonth()+1)+"/"+d.getDate()+" "+hm(t)}

function chatHeader(c){
  var hd=$("#chHead");
  hd.className="banner chHead"+(c.bg?" img":"");hd.style.backgroundImage=c.bg?'url("'+c.bg+'")':"";
  hd.innerHTML='<div class="bnTop"><div class="chL"><button class="circle" id="chBack" aria-label="返回">'+BACK+'</button><div class="bnAv"><div class="avatar">'+avh(c.avatar)+'</div><i class="dot"></i></div>'+
    '<div class="meinfo"><div class="name">'+esc(nick(c))+'</div><div class="status">'+esc((getStatus(c.id)&&getStatus(c.id).text)||c.sig||"online")+'</div></div></div>'+
    '<button class="circle" id="chMenu" aria-label="更多">'+I.dots+'</button></div>';
}
function renderChat(keep){
  var c=cget(CUR),list=msgs(CUR),h="",prev=null,sc=$("#chScroll"),top=sc.scrollTop;
  list.forEach(function(m,i){
    var pill=!prev||m.t-prev.t>15*60000,me=m.by==="me";
    if(pill)h+='<div class="tpill">'+stamp(m.t)+'</div>';
    if(pill||prev.by!==m.by)h+='<div class="mh'+(me?' me':'')+'"><div class="avatar">'+avh(me?P.avatar:c.avatar)+'</div><div class="mt"><b>'+esc(me?P.name:nick(c))+'</b><span>'+mtime(m.t)+'</span></div></div>';
    h+='<div class="b '+(me?'m':'o')+bubbleCls(m)+(m.tb&&!me?' tb':'')+(m.blk&&!me?' blk':'')+(SEL.ids[m.id]?' sel':'')+'" data-i="'+i+'">'+qHTML(m)+bubbleHTML(m)+(m.tb&&!me?tbBadge(m):'')+(m.blk&&!me?BLKX:'')+'</div>'+(!me&&!m.type?trBlock(m):'');
    prev=m;
  });
  if(busy)h+='<div class="b o typing" style="margin-top:'+(prev&&prev.by==="ai"?4:12)+'px"><i></i><i></i><i></i></div>';
  if(!list.length&&!busy)h='<div class="empty" style="margin-top:60px">和 '+esc(nick(c))+' 说点什么吧</div>';
  sc.innerHTML=h;sc.scrollTop=keep?top:sc.scrollHeight;
}
function updateSend(){
  var l=msgs(CUR),last=l[l.length-1];
  $("#chSend").disabled=busy||!($("#chIn").value.trim()||(last&&last.by==="me"));
}
function openChat(id){
  var c=cget(id);if(!c)return;
  CUR=id;chatHeader(c);applyChatBg();$("#chIn").value="";$("#chIn").style.height="36px";
  go("chat");renderChat();updateSend();
}

// ---- 调用 AI ----
function buildSystem(c,list){
  var s=window.buildSystemPrompt(c.id),ex=[];
  try{var mm=getMemories(c.id);if(mm.length)ex.push("[Memories]\n"+mm.slice(-60).map(function(m){return"- ["+m.type+"] "+String(m.text).slice(0,300)}).join("\n"))}catch(e){}
  try{var tail=list.slice(-6).map(function(m){return m.text}).join("\n"),wb=matchWorldBook(c.id,tail);if(wb.length)ex.push("[World Book]\nDepth guide: light = background hint, mention only if it fits naturally; medium = stay consistent with it when relevant; deep = core canon that always shapes how you think, speak and act, even when not mentioned.\n"+wb.map(function(x){var d=x.depth||"medium";return"- ("+d+") "+x.title+": "+String(x.content).slice(0,d==="deep"?1500:d==="light"?300:600)}).join("\n"))}catch(e){}
  try{var rl=getRelations(c.id);if(rl.length)ex.push("[Relationships]\n"+rl.map(function(r){return"- "+r.withName+": "+r.selfRole+(r.otherRole&&r.otherRole!==r.selfRole?" / "+r.otherRole:"")+(r.note?" ("+r.note+")":"")}).join("\n"))}catch(e){}
  try{var st=getStatus(c.id),us=getStatus("me"),l=[];if(st)l.push("Your current status: "+st.text);if(us)l.push("The user's current status: "+us.text);if(l.length)ex.push("[Status]\n"+l.join("\n"))}catch(e){}
  try{var cp=getCouple(c.id);if(cp&&cp.days!=null)ex.push("[Relationship days]\nDays counted with the user: "+cp.days)}catch(e){}
  try{chsPrompt(c.id).forEach(function(x){ex.push(x)})}catch(e){}
  ex.push("[Now]\n"+new Date().toLocaleString());
  ex.push((window.CONFIG&&CONFIG.prompts&&CONFIG.prompts.style)||"[Style]\n- You are texting. Write short, natural messages the way a real person texts.\n- Put each separate message on its own line, without numbering. Usually 1 to 5 messages per reply, more only if the user asks.\n- Do not narrate actions in asterisks unless the character would. Never mention being an AI or a language model.\n- Reply in the language the user is writing in, unless the character description says otherwise.");
  return s+"\n\n"+ex.join("\n\n");
}
function callAI(c,list){
  var a=S.api;
  if((a.base||"").trim().toLowerCase()==="demo")return new Promise(function(r){setTimeout(function(){r("好呀\n这是演示模式的回复\n到 Settings 里填真实的 API，就能和我正式聊天了")},1200)});
  if(!a.base||!a.key||!a.model)return Promise.reject(new Error("请先在 Settings 里填写 Chat API"));
  var n=Math.max(2,parseInt(chsGet(c.id).mem)||parseInt(a.ctx)||30),hist=[],tp=parseFloat(a.temp);if(isNaN(tp))tp=0.8;
  list.slice(-n).forEach(function(m){var role=m.by==="me"?"user":"assistant",l=hist[hist.length-1];if(l&&l.role===role)l.content+="\n"+qtx(m);else hist.push({role:role,content:qtx(m)})});
  var body={model:a.model,messages:[{role:"system",content:buildSystem(c,list)}].concat(hist),temperature:tp,max_tokens:parseInt(a.max)||1024};
  return fetch(apiUrl(a,"/chat/completions"),{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+a.key},body:JSON.stringify(body)})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j.error&&j.error.message)||("HTTP "+r.status));return j})})
    .then(function(j){var t=j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;if(!t)throw new Error("接口没有返回内容");return String(t)})
    .catch(function(e){if(e instanceof TypeError)throw new Error("请求失败：网址不对，或接口不允许网页直接调用");throw e});
}
// 转账：Char 回复时决定收款（[accept]）还是退回（[return]）；没写标记就默认收款
function applyXfer(id,dec,rb){
  msgs(id).forEach(function(m){
    if(m.by==="me"&&m.type==="transfer"&&!m.st){
      if(dec==="return"){if(!walletAdd("gift_in",id,m.amount,"Returned: "+(m.note||"Transfer")))return;m.st="returned"}
      else m.st="received";
      m.stRb=rb;
      msgs(id).push({id:Date.now().toString(36)+"x"+Math.random().toString(36).slice(2,4),by:"ai",type:"xack",ok:m.st==="received",amount:m.amount,note:m.note||"",text:"[Transfer "+(m.st==="received"?"accepted":"returned")+"] "+money(m.amount),rb:rb,t:Date.now()});
    }
  });
  saveChats();
}
// 重新生成回复时，把那一轮回复造成的收款/退回状态还原
function resetXfers(id,removed){
  var rbs={};removed.forEach(function(x){if(x.rb)rbs[x.rb]=1});
  msgs(id).forEach(function(m){
    if(m.type==="transfer"&&m.st&&m.stRb&&rbs[m.stRb]){
      if(m.st==="returned"&&!walletAdd("gift_out",id,m.amount,"Transfer again"))return;
      delete m.st;delete m.stRb;
    }
  });
}
function getReply(){
  var id=CUR,c=cget(id),co=chsGet(id);
  if(co.busyOn){
    var ls=(co.ar[co.arMode]||[]).filter(function(x){return x&&x.trim()});
    if(ls.length){busy=true;renderChat();updateSend();setTimeout(function(){reveal(id,[ls[Math.floor(Math.random()*ls.length)].trim()],0)},900);return}
  }
  busy=true;renderChat();updateSend();
  callAI(c,msgs(id)).then(function(text){
    text=text.replace(/<think>[\s\S]*?(<\/think>|$)/gi,"");
    var parts=text.split(/\n+/).map(function(x){return x.trim()}).filter(Boolean);
    var hasX=msgs(id).some(function(m){return m.by==="me"&&m.type==="transfer"&&!m.st}),dec=null,rb="b"+Date.now().toString(36);
    if(hasX)parts=parts.map(function(x){var mm=x.match(/\[(accept|return)\]/i);if(mm){dec=mm[1].toLowerCase();x=x.replace(/\s*\[(accept|return)\]\s*/ig," ").trim()}return x}).filter(Boolean);
    parts=parts.length?parts:["…"];var trs=[];
    parts=parts.map(function(x,i){var k=x.split(/\s*(?:\|\|\||｜｜｜)\s*/);if(k.length>1){trs[i]=k.slice(1).join(" ").trim();return k[0].trim()||"…"}return x});
    PTR[id]=trs;RB[id]=rb;if(hasX)applyXfer(id,dec||"accept",rb);reveal(id,parts,0);
  }).catch(function(e){busy=false;if(CUR===id){renderChat(true);updateSend()}toast(String(e.message||e).slice(0,90),4500)});
}
function reveal(id,parts,i){
  var last=i===parts.length-1;if(last){busy=false;setTimeout(function(){ltmCheck(id)},300)}
  var nm=aiMsg(id,parts[i],i);if(PTR[id]&&PTR[id][i])nm.tr=PTR[id][i];if(last)PTR[id]=null;if(RB[id])nm.rb=RB[id];if(last)RB[id]=null;msgs(id).push(nm);saveChats();if(chsGet(id).trOpen){if(nm.tr)nm.trShow=true;else if(!nm.type)autoTr(id,nm)}
  try{if(!(CUR===id&&!$("#pgChat").hidden))window.notifyMsg(id,nm.text)}catch(e){}
  if(CUR===id){renderChat();updateSend()}
  if(!last)setTimeout(function(){reveal(id,parts,i+1)},Math.min(1400,350+parts[i+1].length*30));
}
function sendMsg(reply){
  if(busy)return;
  if(chsGet(CUR).blocked){toast("已拉黑，取消拉黑后才能发送");return}
  var inp=$("#chIn"),v=inp.value.trim(),l=msgs(CUR);
  if(v){
    var nm0={id:Date.now().toString(36),by:"me",text:v,t:Date.now()};if(PQ){nm0.q=PQ;clearQuote()}l.push(nm0);
    if(!saveChats()){l.pop();return}
    inp.value="";inp.style.height="36px";inp.focus();
  }else if(!(l.length&&l[l.length-1].by==="me"))return;
  if(reply===false){renderChat();updateSend();return}
  getReply();
}
$("#chIn").oninput=function(){this.style.height="36px";this.style.height=Math.min(120,this.scrollHeight)+"px";updateSend()};
$("#chIn").onkeydown=function(e){if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){e.preventDefault();sendMsg(false)}};
$("#chSend").onclick=function(){sendMsg(true)};
$("#chIn").setAttribute("enterkeyhint","send");
(function(){var sh=false;
  $("#chIn").addEventListener("keydown",function(e){sh=e.shiftKey});
  // 手机键盘（尤其是中文输入法）的回车可能不触发 keydown，用 beforeinput 兜底：回车 = 只发送，不让 Char 回复
  $("#chIn").addEventListener("beforeinput",function(e){if((e.inputType==="insertLineBreak"||e.inputType==="insertParagraph")&&!sh){e.preventDefault();sendMsg(false)}});
})();
$("#chHeart").onclick=function(){toast("心声功能之后再做")};
$("#list").onclick=function(e){var b=e.target.closest(".item");if(!b)return;if(b.dataset.g){toast("群聊对话之后再做");return}openChat(b.dataset.id)};

// ---- 消息操作 ----
function openAct(html){$("#actSheet").innerHTML='<div class="grab"></div>'+html;$("#actWrap").hidden=false}
function closeAct(){$("#actWrap").hidden=true;$("#actSheet").innerHTML=""}
$("#actScrim").onclick=closeAct;
$("#chHead").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="chBack"){go("chats");return}
  if(b.id==="chMenu"){go("chset");return}
};
$("#chScroll").onclick=function(e){
  if(!SEL.on)return;
  var b=e.target.closest(".b");if(!b||b.classList.contains("typing"))return;
  var m=msgs(CUR)[+b.dataset.i];if(!m)return;
  if(SEL.ids[m.id])delete SEL.ids[m.id];else SEL.ids[m.id]=1;
  selUI();renderChat(true);
};
$("#actSheet").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  var a=b.dataset.a,l=msgs(CUR),m=l[act.i];
  if(a==="cancel")return closeAct();
  if(a==="editc"){closeAct();return openForm(CUR)}
  if(a==="clear"){
    if(!b.dataset.arm){b.dataset.arm="1";b.textContent="再点一次确认清空";b.style.color="#e5484d";return}
    chats[CUR]=[];saveChats();closeAct();renderChat();updateSend();return;
  }
  if(!m)return;
  if(a==="copy"){try{navigator.clipboard.writeText(m.text);toast("已复制")}catch(x){toast("复制失败")}closeAct()}
  else if(a==="edit"){$("#actSheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" data-a="cancel">Cancel</button><span class="ttl">Edit</span><button class="go" data-a="saveedit">Save</button></div><div class="card" style="margin-top:14px"><label>'+(m.by==="ai"?"Original":"Message")+'</label><textarea class="tall" id="eTx">'+esc(m.text)+'</textarea></div>'+(m.by==="ai"?'<div class="card"><label>Translation (optional)</label><textarea class="tall" id="eTr" placeholder="译文，可以留空">'+esc(m.tr||"")+'</textarea></div>':'')}
  else if(a==="saveedit"){var v=$("#eTx").value.trim();if(v)m.text=v;var te=$("#eTr");if(te&&m.by==="ai"){var tv=te.value.trim();if(tv)m.tr=tv;else delete m.tr}saveChats();closeAct();renderChat(true)}
  else if(a==="savetext"){if(getSaved("texts",CUR).some(function(x){return x.text===String(m.text).trim()})){toast("已经收藏过了");closeAct();return}toast(addSaved("texts",CUR,m.text)?"已收藏，可以在 Me → Saved Texts 里看到":"收藏失败");closeAct()}
  else if(a==="del"){l.splice(act.i,1);saveChats();closeAct();renderChat(true);updateSend()}
  else if(a==="regen"){if(chsGet(CUR).blocked){closeAct();toast("已拉黑，取消拉黑后才能使用");return}var j=act.i;while(j>0&&l[j-1].by==="ai")j--;resetXfers(CUR,l.slice(j));l.splice(j);saveChats();closeAct();getReply()}
};

// ---------- 页面切换 ----------
function go(p){
  document.documentElement.classList.toggle("inchat",p==="chat");
  document.querySelectorAll("#nav button").forEach(function(x){x.classList.toggle("on",x.dataset.p===(p==="add"||p==="grp"||p==="profile"||p==="box"?"contacts":p==="set"||p==="world"||p==="chat"||p==="chset"||p==="trail"||p==="fc"||p==="ph"?"chats":p==="couple"||p==="saved"||p==="wallet"||p==="album"||p==="rel"||p==="mem"?"me":p))});
  ["chats","me","contacts","moments","add","set","grp","couple","saved","wallet","profile","world","album","rel","mem","box","fc","ph","chat","chset","trail"].forEach(function(k){$("#pg"+k[0].toUpperCase()+k.slice(1)).hidden=k!==p});
  $("#nav").hidden=p==="add"||p==="set"||p==="grp"||p==="couple"||p==="saved"||p==="wallet"||p==="profile"||p==="world"||p==="album"||p==="rel"||p==="mem"||p==="box"||p==="chat"||p==="chset"||p==="trail"||p==="fc"||p==="ph";$("#cnav").hidden=p!=="couple";
  if(p==="set")renderSettings();
  if(p==="chset")renderChSet();
  if(p==="trail")renderTrail();
  if(p==="fc")renderFc();
  if(p==="ph")renderPh();
  if(p==="world")renderWorld();
  if(p==="album")renderAlbum();
  if(p==="rel")renderRel();
  if(p==="mem")renderMem();
  if(p==="box")renderBox();
  if(p==="me"){editing=false;renderMe()}
  if(p==="contacts")renderContacts();
  if(p==="chats")renderList();
  if(p==="moments")renderMoments();
  if(p==="couple")renderCouple();
  if(p==="saved")renderSaved();
  if(p==="wallet")renderWallet();
  if(p==="profile")renderProfile();
  var m=$(".main:not([hidden])");if(m)m.scrollTop=0;
}
$("#nav").onclick=function(e){var b=e.target.closest("button");if(b)go(b.dataset.p)};
$("#meRow").onclick=function(){go("me")};
$("#setBtn").onclick=function(){go("set")};

