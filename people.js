/* people.js — 添加/编辑角色、ME 页、Moments、发布动态面板 */// ---------- 添加 / 编辑角色 ----------
var F={};
var CAM='<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.500"/></svg>';
var CHEV='<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>';
function showAv(){$("#avc").innerHTML=(F.avatar?'<img src="'+F.avatar+'">':PERSONP)+'<span class="cam2">'+CAM+'</span>'}
function showBg(){$("#bgth").innerHTML=F.bg?'<img src="'+F.bg+'">':''}
function openForm(id){
  var c=null;if(id)contacts.forEach(function(x){if(x.id===id)c=x});
  F={id:c?c.id:null,t:c?c.t:Date.now(),avatar:c?c.avatar:"",bg:c?c.bg:""};
  $("#pgAdd").innerHTML=
    '<button class="cancel" id="fCancel">Cancel</button>'+
    '<div class="card lrow" id="avRow"><div class="avc" id="avc"></div><div class="tx"><b>Avatar</b><small>上传或选择头像</small></div>'+CHEV+'</div>'+
    '<div class="card lrow" id="bgRow"><div class="tx"><b>Background</b><small>设置聊天背景图片</small></div><div class="bgth" id="bgth"></div>'+CHEV+'</div>'+
    '<div class="card"><div class="fl"><label>Username</label><input id="cUser" maxlength="30" placeholder="输入用户名" value="'+esc(c&&c.user)+'"></div>'+
    '<div class="fl"><label>Real Name</label><input id="cReal" maxlength="30" placeholder="输入真名" value="'+esc(c&&c.real)+'"></div><div class="fl"><label>ID</label><input id="cUid" maxlength="30" placeholder="唯一 ID，例如 moon.river_27" value="'+esc(c&&c.uid)+'"></div></div>'+
    '<div class="card"><label>Signature</label><textarea id="cSig" maxlength="80" placeholder="写一句简短的签名…">'+esc(c&&c.sig)+'</textarea></div>'+
    '<div class="card"><label>Character Description</label><textarea class="tall" id="cDesc" maxlength="4000" placeholder="写下这个角色的性格、背景、说话方式…（AI 会读取）">'+esc(c&&c.desc)+'</textarea></div>'+
    '<input type="file" accept="image/*" hidden id="fAv"><input type="file" accept="image/*" hidden id="fBg">'+
    '<button class="bigbtn" id="cSave">'+(c?"Save":"Add Contact")+'</button>'+(c?'<button class="ghost" id="cDel">Delete Contact</button>':'');
  showAv();showBg();
  $("#fCancel").onclick=function(){if(F.id)openProfile(F.id);else go("contacts")};
  $("#avRow").onclick=function(){$("#fAv").click()};
  $("#bgRow").onclick=function(){$("#fBg").click()};
  $("#fAv").onchange=function(){if(this.files[0])shrink(this.files[0],400,true,function(d){F.avatar=d;showAv()})};
  $("#fBg").onchange=function(){if(this.files[0])shrink(this.files[0],900,false,function(d){F.bg=d;showBg()})};
  $("#cSave").onclick=function(){
    var u=$("#cUser").value.trim(),r=$("#cReal").value.trim();
    if(!u&&!r){$("#cUser").focus();toast("请至少填写 Username 或 Real Name");return}
    var uid=$("#cUid").value.trim();
    if(uid&&idTaken(uid,F.id||"")){toast("这个 ID 已经被用了");return}
    var o={id:F.id||Date.now().toString(36),user:u,real:r,uid:uid,sig:$("#cSig").value.trim(),desc:$("#cDesc").value.trim(),avatar:F.avatar,bg:F.bg,t:F.t};
    var old=contacts.slice(),isNew=!F.id,hit=false;
    contacts=contacts.map(function(x){if(x.id===o.id){hit=true;return o}return x});
    if(!hit)contacts.push(o);
    if(!saveContacts()){contacts=old;return}
    toast(isNew?"已添加":"已保存");openProfile(o.id);
  };
  var dl=$("#cDel");
  if(dl)dl.onclick=function(){
    if(!dl.dataset.arm){dl.dataset.arm="1";dl.textContent="再点一次确认删除";dl.style.color="#e5484d";return}
    contacts=contacts.filter(function(x){return x.id!==F.id});saveContacts();toast("已删除");go("contacts");
  };
  go("add");
}

// ---------- ME 页 ----------
var editing=false,draftAvatar="",draftBg="",draft={};
var BADGE='<svg class="badge" viewBox="0 0 24 24"><path d="M22.45 12.00 L22.39 12.41 L22.22 12.80 L21.95 13.18 L21.60 13.52 L21.22 13.83 L20.82 14.12 L20.45 14.38 L20.13 14.64 L19.88 14.91 L19.71 15.20 L19.63 15.52 L19.62 15.88 L19.66 16.29 L19.74 16.74 L19.82 17.22 L19.87 17.72 L19.87 18.20 L19.79 18.66 L19.64 19.06 L19.39 19.39 L19.06 19.64 L18.66 19.79 L18.20 19.87 L17.72 19.87 L17.22 19.82 L16.74 19.74 L16.29 19.66 L15.88 19.62 L15.52 19.63 L15.20 19.71 L14.91 19.88 L14.64 20.13 L14.38 20.45 L14.12 20.82 L13.83 21.22 L13.52 21.60 L13.18 21.95 L12.80 22.22 L12.41 22.39 L12.00 22.45 L11.59 22.39 L11.20 22.22 L10.82 21.95 L10.48 21.60 L10.17 21.22 L9.88 20.82 L9.62 20.45 L9.36 20.13 L9.09 19.88 L8.80 19.71 L8.48 19.63 L8.12 19.62 L7.71 19.66 L7.26 19.74 L6.78 19.82 L6.28 19.87 L5.80 19.87 L5.34 19.79 L4.94 19.64 L4.61 19.39 L4.36 19.06 L4.21 18.66 L4.13 18.20 L4.13 17.72 L4.18 17.22 L4.26 16.74 L4.34 16.29 L4.38 15.88 L4.37 15.52 L4.29 15.20 L4.12 14.91 L3.87 14.64 L3.55 14.38 L3.18 14.12 L2.78 13.83 L2.40 13.52 L2.05 13.18 L1.78 12.80 L1.61 12.41 L1.55 12.00 L1.61 11.59 L1.78 11.20 L2.05 10.82 L2.40 10.48 L2.78 10.17 L3.18 9.88 L3.55 9.62 L3.87 9.36 L4.12 9.09 L4.29 8.80 L4.37 8.48 L4.38 8.12 L4.34 7.71 L4.26 7.26 L4.18 6.78 L4.13 6.28 L4.13 5.80 L4.21 5.34 L4.36 4.94 L4.61 4.61 L4.94 4.36 L5.34 4.21 L5.80 4.13 L6.28 4.13 L6.78 4.18 L7.26 4.26 L7.71 4.34 L8.12 4.38 L8.48 4.37 L8.80 4.29 L9.09 4.12 L9.36 3.87 L9.62 3.55 L9.88 3.18 L10.17 2.78 L10.48 2.40 L10.82 2.05 L11.20 1.78 L11.59 1.61 L12.00 1.55 L12.41 1.61 L12.80 1.78 L13.18 2.05 L13.52 2.40 L13.83 2.78 L14.12 3.18 L14.38 3.55 L14.64 3.87 L14.91 4.12 L15.20 4.29 L15.52 4.37 L15.88 4.38 L16.29 4.34 L16.74 4.26 L17.22 4.18 L17.72 4.13 L18.20 4.13 L18.66 4.21 L19.06 4.36 L19.39 4.61 L19.64 4.94 L19.79 5.34 L19.87 5.80 L19.87 6.28 L19.82 6.78 L19.74 7.26 L19.66 7.71 L19.62 8.12 L19.63 8.48 L19.71 8.80 L19.88 9.09 L20.13 9.36 L20.45 9.62 L20.82 9.88 L21.22 10.17 L21.60 10.48 L21.95 10.82 L22.22 11.20 L22.39 11.59Z"/><path class="ck" d="M7.900 11.900l2.800 2.800 5.400-5.400"/></svg>';
function meTile(k,svg,t,w){return '<button class="tile'+(w?' wide':'')+'" data-me="'+k+'">'+svg+'<span class="tx"><b>'+t+'</b></span></button>'}
function renderMe(){
  var el=$("#pgMe"),av=editing?draftAvatar:P.avatar,h="";
  var img=av?'<img src="'+av+'">':PERSONP;
  if(!editing){
    h='<div class="bigav">'+img+'</div>'+
      '<div class="mname"><span>'+esc(P.name)+'</span>'+BADGE+'</div>'+
      (P.real?'<div class="mhandle">'+esc(P.real)+'</div>':'')+
      (P.uid?'<div class="mhandle">ID: '+esc(P.uid)+'</div>':'')+
      (P.bio?'<div class="mbio">'+esc(P.bio)+'</div>':'')+
      (P.fans?'<div class="mfans">'+esc(P.fans)+'粉丝</div>':'')+
      '<button class="bigbtn" id="editBtn">Edit Profile</button>'+
      '<div class="tiles" id="meTiles" style="margin-top:28px">'+
      meTile("texts",'<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 01-11.600 7.100L4 20l1.100-4.500A8 8 0 1121 12z"/><path d="M12 8.500l1 2 2.200.3-1.600 1.500.4 2.200-2-1.100-2 1.100.4-2.200-1.600-1.500 2.200-.3z"/></svg>',"Saved Texts")+
      meTile("thoughts",'<svg viewBox="0 0 24 24"><path d="M12 20.500C6 16.500 3.500 13 3.500 9.500A4.500 4.500 0 0112 7.200 4.500 4.500 0 0120.500 9.500C20.500 13 18 16.500 12 20.500z"/></svg>',"Saved Thoughts")+
      meTile("stickers",'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.500 14.500a4.500 4.500 0 007 0"/><circle cx="9" cy="10" r=".6"/><circle cx="15" cy="10" r=".6"/></svg>',"Stickers")+
      meTile("wallet",'<svg viewBox="0 0 24 24"><path d="M4 7.500A2.500 2.500 0 016.500 5H18a1 1 0 011 1v2"/><rect x="3" y="8" width="18" height="12" rx="3"/><circle cx="16.500" cy="14" r="1.200"/></svg>',"Wallet")+
      meTile("rel",'<svg viewBox="0 0 24 24"><circle cx="12" cy="5.5" r="2.5"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/><path d="M11 8l-4 7.500M13 8l4 7.500M8 18h8"/></svg>',"Relationships")+
      meTile("mem",'<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h11M9 8h6"/></svg>',"Memory")+
      meTile("couple",'<svg viewBox="0 0 24 24"><path d="M12 20C6.500 16.200 4 13 4 9.800A4 4 0 0112 8a4 4 0 018 1.800C20 13 17.500 16.200 12 20z"/><path d="M9.500 11.500h5"/></svg>',"Couple Space",true)+
      meTile("album",'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4 4 3 3-2 4 3"/></svg>',"Photo Album",true)+'</div>';
  }else{
    h='<label class="bigav">'+img+'<span class="cam">'+CAM+'</span><input type="file" accept="image/*" hidden id="file"></label>'+
      '<div class="card lrow" id="pbgRow" style="margin-top:14px"><div class="tx"><b>Background</b><small>设置首页顶部背景图</small></div><div class="bgth" id="pbgth">'+(draftBg?'<img src="'+draftBg+'">':'')+'</div>'+CHEV+'</div><input type="file" accept="image/*" hidden id="fPbg">'+
      '<div class="field efirst"><label>名字</label><input id="fName" value="'+esc(P.name)+'" maxlength="30"></div>'+
      '<div class="field"><label>真实姓名</label><input id="fReal" value="'+esc(P.real)+'" maxlength="30"></div>'+
      '<div class="field"><label>ID</label><input id="fUid" value="'+esc(P.uid)+'" maxlength="30" placeholder="唯一 ID，例如 moon.river_27"></div>'+
      '<div class="field"><label>个性签名</label><textarea id="fBio" maxlength="120">'+esc(P.bio)+'</textarea></div>'+
      '<div class="field"><label>人设描述（AI 会读取）</label><textarea class="tall" id="fPersona" maxlength="2000" placeholder="写下你在故事里是谁：年龄、性格、职业、背景、外貌、说话习惯…">'+esc(P.persona)+'</textarea></div>'+
      '<div class="field"><label>粉丝数（显示用，可留空）</label><input id="fFans" value="'+esc(P.fans)+'" maxlength="12"></div>'+
      '<button class="bigbtn" id="saveBtn">保存</button><button class="ghost" id="cancelBtn">取消</button>';
  }
  el.innerHTML=h;
  if(!editing){$("#editBtn").onclick=function(){editing=true;draftAvatar=P.avatar;draftBg=P.bg;renderMe()};
    $("#meTiles").onclick=function(e){var b=e.target.closest("[data-me]");if(b){var mk=b.dataset.me;if(mk==="couple"){CPV="pick";cpArm=null;go("couple")}else if(mk==="texts"||mk==="thoughts"||mk==="stickers"){SV={kind:mk,cat:"All"};SArm=null;go("saved")}else if(mk==="wallet")go("wallet");else if(mk==="album"){AV={view:"home",cid:""};go("album")}else if(mk==="rel")go("rel");else if(mk==="mem"){MV={view:"home",cid:"",type:"All"};go("mem")}else toast("Coming soon")}}}
  else{
    $("#file").onchange=function(){
      if(!this.files[0])return;
      draft={u:$("#fUid").value,n:$("#fName").value,h:$("#fReal").value,b:$("#fBio").value,f:$("#fFans").value,p:$("#fPersona").value};
      shrink(this.files[0],400,true,function(d){draftAvatar=d;renderMe();
        $("#fName").value=draft.n;$("#fReal").value=draft.h;$("#fUid").value=draft.u;$("#fBio").value=draft.b;$("#fFans").value=draft.f;$("#fPersona").value=draft.p});
    };
    $("#saveBtn").onclick=function(){
      P.name=$("#fName").value.trim()||"Nana";P.real=$("#fReal").value.trim();
      var nu=$("#fUid").value.trim();if(nu&&idTaken(nu,"__me")){toast("这个 ID 已经被用了");return}P.uid=nu;
      P.bio=$("#fBio").value.trim();P.persona=$("#fPersona").value.trim();P.fans=$("#fFans").value.trim();P.avatar=draftAvatar;P.bg=draftBg;
      saveP();applyHeader();editing=false;renderMe();
    };
    $("#cancelBtn").onclick=function(){editing=false;renderMe()};
    $("#pbgRow").onclick=function(){$("#fPbg").click()};
    $("#fPbg").onchange=function(){if(this.files[0])shrink(this.files[0],900,false,function(d){draftBg=d;$("#pbgth").innerHTML='<img src="'+d+'">'})};
  }
}

// ---------- Moments ----------
var posts=[];try{posts=JSON.parse(store("posts")||"[]")}catch(e){}
function savePosts(){try{localStorage.setItem("posts",JSON.stringify(posts));return true}catch(e){toast("存储空间不足，图片可能太大");return false}}
window.getPosts=function(){return posts};
var momTab="posts",armId=null,cmtId=null,D={};
var I={
 heart:'<svg viewBox="0 0 24 24"><path d="M12 20.500C6 16.500 3.500 13 3.500 9.500A4.500 4.500 0 0112 7.200 4.500 4.500 0 0120.500 9.500C20.500 13 18 16.500 12 20.500z"/></svg>',
 cmt:'<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 01-11.600 7.100L4 20l1.100-4.500A8 8 0 1121 12z"/></svg>',
 dots:'<svg viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><circle cx="5" cy="12" r="1.700"/><circle cx="12" cy="12" r="1.700"/><circle cx="19" cy="12" r="1.700"/></svg>',
 edit:'<svg viewBox="0 0 24 24"><path d="M12 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-6"/><path d="M18.500 3.500a2.100 2.100 0 013 3L12 16l-4 1 1-4z"/></svg>',
 photo:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.800"/><path d="M4 18l5-4.500 4 3.500 3-2.500 4 3.500"/></svg>',
 loc:'<svg viewBox="0 0 24 24"><path d="M12 21s-6.500-5.600-6.500-11a6.500 6.500 0 0113 0c0 5.400-6.500 11-6.500 11z"/><circle cx="12" cy="10" r="2.300"/></svg>',
 at:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-4 8"/></svg>',
 eye:'<svg viewBox="0 0 24 24"><path d="M2 12s3.800-6.500 10-6.500S22 12 22 12s-3.800 6.500-10 6.500S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 hide:'<svg viewBox="0 0 24 24"><circle cx="10" cy="8" r="4"/><path d="M2.500 20c0-4 3.500-6 7.500-6M16 15l5 5M21 15l-5 5"/></svg>',
 fwd:'<svg viewBox="0 0 24 24"><path d="M17 3l4 4-4 4"/><path d="M3 11V9a2 2 0 012-2h16"/><path d="M7 21l-4-4 4-4"/><path d="M21 13v2a2 2 0 01-2 2H3"/></svg>'
};
function ago(t){var s=(Date.now()-t)/1000;if(s<60)return"now";if(s<3600)return Math.floor(s/60)+"m ago";if(s<86400)return Math.floor(s/3600)+"h ago";if(s<604800)return Math.floor(s/86400)+"d ago";var d=new Date(t);return(d.getMonth()+1)+"/"+d.getDate()}
function who(id){if(id==="me")return{name:P.name,avatar:P.avatar};var r={name:"Unknown",avatar:""};contacts.forEach(function(c){if(c.id===id)r={name:nick(c),avatar:c.avatar}});return r}
function avh(a){return a?'<img src="'+a+'">':PERSON}
function names(ids){return ids.map(function(i){return who(i).name}).join(", ")}

function postHTML(p){
  var a=who(p.by),liked=p.likes.indexOf("me")>-1,meta=[];
  if(p.loc)meta.push(esc(p.loc));
  if(p.mention&&p.mention.length)meta.push("@"+esc(names(p.mention).replace(/, /g," @")));
  if(p.vis==="Only me")meta.push("Only me");
  var n=p.imgs?p.imgs.length:0;
  return '<div class="post"><div class="ph"><div class="avatar">'+avh(a.avatar)+'</div><div><div class="pn">'+esc(a.name)+'</div><div class="pt">'+ago(p.t)+'</div></div>'+
    (p.by==="me"?'<button class="pmore'+(armId===p.id?' arm':'')+'" data-act="del" data-id="'+p.id+'">'+(armId===p.id?'Delete':I.dots)+'</button>':'')+'</div>'+
    (p.text?'<div class="ptx">'+esc(p.text)+'</div>':'')+
    (p.rp?'<div class="rpq"><div class="rph"><div class="avatar">'+avh(who(p.rp.by).avatar)+'</div><b>'+esc(who(p.rp.by).name)+'</b></div>'+(p.rp.text?'<div class="rpt">'+esc(p.rp.text)+'</div>':'')+(p.rp.img?'<img class="rpi" src="'+p.rp.img+'">':'')+'</div>':'')+
    (n?'<div class="pimgs n'+Math.min(n,3)+(n===4?' q':'')+'">'+p.imgs.map(function(s){return '<img src="'+s+'">'}).join("")+'</div>':'')+
    (meta.length?'<div class="pmeta">'+meta.join(" · ")+'</div>':'')+
    '<div class="pact"><button class="'+(liked?'liked':'')+'" data-act="like" data-id="'+p.id+'">'+I.heart+(p.likes.length||"")+'</button>'+
    '<button data-act="cmt" data-id="'+p.id+'">'+I.cmt+(p.cmts.length||"")+'</button>'+
    '<button data-act="fwd" data-id="'+p.id+'">'+I.fwd+(p.rps||"")+'</button></div>'+
    (p.cmts.length?'<div class="cmts">'+p.cmts.map(function(c,i){return '<div data-pid="'+p.id+'" data-ci="'+i+'"><b>'+esc(who(c.by).name)+'</b> '+esc(c.text)+'</div>'}).join("")+'</div>':'')+
    (cmtId===p.id?'<div class="cin"><input id="cIn" placeholder="写评论…" maxlength="200"><button data-act="send" data-id="'+p.id+'">Send</button></div>':'')+
    '</div>';
}
function renderMoments(){
  var list=posts.filter(function(p){return momTab==="posts"||p.likes.indexOf("me")>-1});
  var handle=P.uid?"@"+P.uid.replace(/^@/,""):"";
  $("#pgMoments").innerHTML=
    heroCard({bg:P.bg,av:avh(P.avatar),st:stHTML("me",true),name:esc(P.name),handle:handle,sig:P.bio,btn:'data-act="new"',label:"Post"})+
    '<div class="seg" style="margin-top:22px"><button data-act="tab" data-v="posts" class="'+(momTab==="posts"?"on":"")+'">Posts</button><button data-act="tab" data-v="likes" class="'+(momTab==="likes"?"on":"")+'">Likes</button></div>'+
    '<div style="margin-top:6px">'+(list.length?list.map(postHTML).join(""):'<div class="empty" style="margin-top:40px">'+(momTab==="posts"?"还没有动态<br>点 Post 发第一条":"还没有点赞")+'</div>')+'</div>';
  var ci=$("#pgMoments #cIn");if(ci)ci.focus();
}
$("#pgMoments").onclick=function(e){
  var b=e.target.closest("[data-act]");if(!b)return;
  var act=b.dataset.act,id=b.dataset.id,p=null;posts.forEach(function(x){if(x.id===id)p=x});
  if(act!=="del")armId=null;
  if(act==="new"){openCompose();return}
  if(act==="stedit"){openStatus(false);return}
  if(act==="tab")momTab=b.dataset.v;
  else if(act==="like"&&p){var i=p.likes.indexOf("me");if(i>-1)p.likes.splice(i,1);else p.likes.push("me");savePosts()}
  else if(act==="cmt")cmtId=cmtId===id?null:id;
  else if(act==="fwd"){if(p)openFwd(p);return}
  else if(act==="send"&&p){var v=$("#cIn").value.trim();if(!v)return;p.cmts.push({by:"me",text:v,t:Date.now()});savePosts();cmtId=null}
  else if(act==="del"){if(armId===id){posts=posts.filter(function(x){return x.id!==id});savePosts();armId=null}else armId=id}
  renderMoments();
};
$("#pgMoments").onkeydown=function(e){if(e.key==="Enter"&&e.target.id==="cIn"){var b=$("#pgMoments [data-act=send]");if(b)b.click()}};

// ---- 发布动态面板 ----
function tile(id,ico,name,sub,cnt,wide){return '<button class="tile'+(wide?' wide':'')+'" data-tl="'+id+'">'+ico+'<span class="tx"><b>'+name+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</span>'+(cnt?'<span class="cnt">'+cnt+'</span>':'')+'</button>'}
function openCompose(){D={text:"",imgs:[],loc:"",locOpen:false,mention:[],hide:[],vis:"Friends"};composeView();$("#sheetWrap").hidden=false;setTimeout(function(){var t=$("#pText");if(t)t.focus()},60)}
function closeSheet(){$("#sheetWrap").hidden=true;$("#sheet").innerHTML=""}
function canPost(){return !!(D.text.trim()||D.imgs.length)}
function composeView(){
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="shCancel">Cancel</button><span class="ttl">New Post</span><button class="go" id="shPost"'+(canPost()?'':' disabled')+'>Post</button></div>'+
   '<textarea id="pText" placeholder="Share something…">'+esc(D.text)+'</textarea>'+
   (D.imgs.length?'<div class="thumbs">'+D.imgs.map(function(s,i){return '<div class="th"><img src="'+s+'"><button class="x" data-rm="'+i+'">✕</button></div>'}).join("")+'</div>':'')+
   (D.locOpen?'<div class="card" style="margin:0 0 8px"><input id="pLoc" placeholder="输入地点" maxlength="40" value="'+esc(D.loc)+'"></div>':'')+
   '<div class="tiles">'+tile("photos",I.photo,"Photos","",D.imgs.length+"/9")+tile("loc",I.loc,"Location",D.loc)+
   tile("mention",I.at,"Mention",names(D.mention))+tile("vis",I.eye,"Visibility",D.vis)+tile("hide",I.hide,"Hide From",names(D.hide),"",true)+'</div>'+stCapHTML();
  $("#pText").oninput=function(){D.text=this.value;$("#shPost").disabled=!canPost()};
  var pl=$("#pLoc");if(pl){pl.oninput=function(){D.loc=this.value};if(!D.loc)pl.focus()}
}
function pickerView(kind){
  D.pk=kind;
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><span style="min-width:56px"></span><span class="ttl">'+(kind==="mention"?"Mention":"Hide From")+'</span><button class="go" id="pkDone">Done</button></div><div style="margin-top:12px">'+
   contacts.map(function(c){return '<button class="prow" data-pk="'+c.id+'"><div class="avatar">'+avh(c.avatar)+'</div><span class="pn">'+esc(nick(c))+'</span><i class="chk'+(D[kind].indexOf(c.id)>-1?' on':'')+'"></i></button>'}).join("")+'</div>';
}
$("#scrim").onclick=closeSheet;
$("#sheet").onclick=function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.id==="shCancel")return closeSheet();
  if(t.id==="pkDone")return composeView();
  if(t.dataset.pk){var arr=D[D.pk],i=arr.indexOf(t.dataset.pk);if(i>-1)arr.splice(i,1);else arr.push(t.dataset.pk);t.querySelector(".chk").classList.toggle("on");return}
  if(t.dataset.rm){D.imgs.splice(+t.dataset.rm,1);return composeView()}
  if(t.id==="shPost"){
    if(!canPost())return;
    var o={id:Date.now().toString(36),by:"me",text:D.text.trim(),imgs:D.imgs,loc:D.loc.trim(),mention:D.mention,hide:D.hide,vis:D.vis,t:Date.now(),likes:[],cmts:[]};
    posts.unshift(o);if(!savePosts()){posts.shift();return}
    closeSheet();momTab="posts";renderMoments();toast("已发布");return;
  }
  var tl=t.dataset.tl;if(!tl)return;
  if(tl==="photos"){
    if(D.imgs.length>=9){toast("最多 9 张");return}
    var inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.multiple=true;
    inp.onchange=function(){
      var fs=[].slice.call(inp.files).slice(0,9-D.imgs.length),left=fs.length;if(!left)return;
      fs.forEach(function(f){shrink(f,800,false,function(d){D.imgs.push(d);if(--left===0)composeView()})});
    };inp.click();
  }
  else if(tl==="loc"){D.locOpen=!D.locOpen;composeView()}
  else if(tl==="vis"){D.vis=D.vis==="Friends"?"Only me":"Friends";composeView()}
  else if(tl==="mention"||tl==="hide"){if(!contacts.length){toast("还没有联系人");return}pickerView(tl)}
};


// ---- 转发 ----
var FW=null;
function openFwd(p){
  FW=p;var src=p.rp||{by:p.by,text:p.text,img:(p.imgs&&p.imgs[0])||""};
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="rpCancel">Cancel</button><span class="ttl">Repost</span><button class="go" id="rpPost">Repost</button></div>'+
    '<textarea id="rpText" placeholder="说点什么…（可以留空）" maxlength="300"></textarea>'+
    '<div class="rpq" style="margin-top:10px"><div class="rph"><div class="avatar">'+avh(who(src.by).avatar)+'</div><b>'+esc(who(src.by).name)+'</b></div>'+(src.text?'<div class="rpt">'+esc(src.text)+'</div>':'')+(src.img?'<img class="rpi" src="'+src.img+'">':'')+'</div>';
  $("#sheetWrap").hidden=false;
}
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.id==="rpCancel"){FW=null;closeSheet();return}
  if(t.id==="rpPost"&&FW){
    var p=FW,src=p.rp||{by:p.by,text:p.text,img:(p.imgs&&p.imgs[0])||""};
    var o={id:Date.now().toString(36),by:"me",text:($("#rpText").value||"").trim(),imgs:[],loc:"",mention:[],hide:[],vis:"Friends",t:Date.now(),likes:[],cmts:[],rp:{by:src.by,text:src.text||"",img:src.img||""}};
    p.rps=(p.rps||0)+1;posts.unshift(o);
    if(!savePosts()){posts.shift();p.rps--;return}
    FW=null;closeSheet();momTab="posts";renderMoments();var pf=$("#pgProfile");if(pf&&!pf.hidden)renderProfile();toast("已转发");
  }
});

// ---- 长按评论：删除 ----
var CMT=null;
function openCmtMenu(pid,ci){
  var p=null;posts.forEach(function(x){if(x.id===pid)p=x});if(!p||!p.cmts[ci])return;
  try{getSelection().removeAllRanges()}catch(e){}
  CMT={pid:pid,ci:ci};var c=p.cmts[ci];
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="cmCancel">Cancel</button><span class="ttl">Comment</span><button class="go" id="cmDel">Delete</button></div>'+
    '<div class="card" style="margin-top:16px"><div class="cmq"><b>'+esc(who(c.by).name)+'</b> '+esc(c.text)+'</div></div>';
  $("#sheetWrap").hidden=false;
}
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.id==="cmCancel"){CMT=null;closeSheet();return}
  if(t.id==="cmDel"&&CMT){
    var p=null;posts.forEach(function(x){if(x.id===CMT.pid)p=x});
    if(p){p.cmts.splice(CMT.ci,1);savePosts()}
    CMT=null;closeSheet();renderMoments();var pf=$("#pgProfile");if(pf&&!pf.hidden)renderProfile();toast("已删除评论");
  }
});
(function(){
  var tm=null,sx=0,sy=0;
  function sel(e){return e.target.closest&&e.target.closest(".cmts>div[data-ci]")}
  document.addEventListener("touchstart",function(e){var d=sel(e);if(!d)return;var t=e.touches[0];sx=t.clientX;sy=t.clientY;clearTimeout(tm);tm=setTimeout(function(){openCmtMenu(d.dataset.pid,+d.dataset.ci)},480)},{passive:true});
  document.addEventListener("touchmove",function(e){var t=e.touches[0];if(Math.abs(t.clientX-sx)>8||Math.abs(t.clientY-sy)>8)clearTimeout(tm)},{passive:true});
  document.addEventListener("touchend",function(){clearTimeout(tm)});
  document.addEventListener("touchcancel",function(){clearTimeout(tm)});
  document.addEventListener("contextmenu",function(e){var d=sel(e);if(d){e.preventDefault();openCmtMenu(d.dataset.pid,+d.dataset.ci)}});
})();
