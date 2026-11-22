/* system.js — 通知、后台音频保活 */// ---------- 通知 ----------
// 对外接口：notifyMsg(角色id, 文字) —— 以后 Char 发来消息时调用：
//   页面在前台 → 顶部横幅；页面在后台 → 系统通知（需要已授权）
var NOTIF={banner:true};
try{var rn=store("notif");if(rn)Object.assign(NOTIF,JSON.parse(rn))}catch(e){}
function saveNotif(){store("notif",JSON.stringify(NOTIF))}
if("serviceWorker" in navigator){try{navigator.serviceWorker.register("sw.js").catch(function(){})}catch(e){}}
function ntPerm(){if(!("Notification" in window))return"Unsupported";return Notification.permission==="granted"?"Allowed":Notification.permission==="denied"?"Blocked":"Not asked"}
function ntSetHTML(){
  return '<div class="sgrp">Notifications</div><div class="card">'+
    '<div class="fl"><div class="srow" style="cursor:default"><b>System permission</b><span class="v">'+ntPerm()+'</span></div></div>'+
    '<div class="fl"><button class="srow" id="ntBanner"><b>In-app banner</b><i class="sw'+(NOTIF.banner?' on':'')+'"></i></button></div></div>'+
    '<button class="pillbtn" id="ntAsk">Allow Notifications</button>'+
    '<button class="pillbtn" id="ntTest">Send test</button>'+
    '<button class="pillbtn" id="ntTest5">Test in 5 seconds</button>'+
    '<div class="hint" style="word-break:normal">点 Allow 会弹出系统授权窗口。想测试后台通知：点“Test in 5 seconds”，然后立刻切到桌面或别的 App。iPhone 需要先把网页添加到主屏幕再打开才支持系统通知；显示 Unsupported 说明当前打开方式不支持。</div>';
}
function ntAsk(){
  if(!("Notification" in window)){toast("当前打开方式不支持系统通知");return}
  if(Notification.permission==="denied"){toast("已被拒绝，请去系统设置里打开通知权限");return}
  var fin=false,done=function(){if(fin)return;fin=true;renderSettings();toast(ntPerm()==="Allowed"?"已允许通知":"没有允许通知")};
  try{var r=Notification.requestPermission(done);if(r&&r.then)r.then(done)}catch(e){toast("请求失败")}
}
function sysNotify(title,body,tag){
  if(!("Notification" in window)||Notification.permission!=="granted")return false;
  var opt={body:body,tag:tag||"chat"};
  var fb=function(){try{new Notification(title,opt)}catch(e){}};
  if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration){
    navigator.serviceWorker.getRegistration().then(function(reg){if(reg&&reg.showNotification)reg.showNotification(title,opt);else fb()}).catch(fb);
  }else fb();
  return true;
}
var nbT=null;
function showBanner(title,body,avatar){
  var el=$("#nbanner");
  if(!el){el=document.createElement("div");el.id="nbanner";el.className="nbanner";document.body.appendChild(el);el.onclick=function(){el.classList.remove("show")}}
  el.innerHTML='<div class="avatar">'+avh(avatar)+'</div><div class="body"><div class="t">'+esc(title)+'</div><div class="p">'+esc(body)+'</div></div>';
  void el.offsetWidth;el.classList.add("show");clearTimeout(nbT);nbT=setTimeout(function(){el.classList.remove("show")},4200);
}
window.notifyMsg=function(charId,text){
  var c=charId&&charId!=="me"?cget(charId):null,title=c?cname(c):"New message";
  if(document.visibilityState==="visible"){if(NOTIF.banner)showBanner(title,text,c&&c.avatar)}
  else sysNotify(title,text,"msg-"+(charId||""));
  return true;
};
function testNotify(){
  var vis=document.visibilityState==="visible",sys=sysNotify("Test notification","这是一条测试通知","test");
  if(vis&&NOTIF.banner)showBanner("Test notification","这是一条测试通知");
  if(!(vis&&NOTIF.banner)&&!sys)toast("没有可用的通知方式：请先授权，或打开 In-app banner");
}
$("#pgSet").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="wbBtn"){go("world");return}
  if(b.id==="ntBanner"){NOTIF.banner=!NOTIF.banner;saveNotif();renderSettings();return}
  if(b.id==="ntAsk"){ntAsk();return}
  if(b.id==="ntTest"){testNotify();return}
  if(b.id==="ntTest5"){toast("5 秒后发送，现在可以切到别的页面");setTimeout(testNotify,5000);return}
});

// ---------- Keep Alive 后台音频保活 ----------
// Silent：循环播放几乎无声的音频；Audible：循环播放你自己选的音频文件（存在浏览器里），开启后优先于 Silent
var KA={silent:false,audible:false,vol:50,file:""};
try{var rka=store("keepalive");if(rka)Object.assign(KA,JSON.parse(rka))}catch(e){}
function saveKA(){store("keepalive",JSON.stringify(KA))}
function idbOpen(cb){try{var r=indexedDB.open("chatpwa",1);r.onupgradeneeded=function(){r.result.createObjectStore("files")};r.onsuccess=function(){cb(null,r.result)};r.onerror=function(){cb(r.error||1)}}catch(e){cb(e)}}
function idbPut(k,v,done){idbOpen(function(e,db){if(e)return done(e);var tx=db.transaction("files","readwrite");tx.objectStore("files").put(v,k);tx.oncomplete=function(){done(null)};tx.onerror=function(){done(tx.error||1)}})}
function idbGet(k,done){idbOpen(function(e,db){if(e)return done(e);var rq=db.transaction("files").objectStore("files").get(k);rq.onsuccess=function(){done(null,rq.result)};rq.onerror=function(){done(rq.error||1)}})}
function idbDel(k,done){idbOpen(function(e,db){if(e)return done&&done(e);var tx=db.transaction("files","readwrite");tx.objectStore("files").delete(k);tx.oncomplete=function(){done&&done(null)}})}
var kaEl=null,kaMode="",kaUrl={silent:"",file:""};
idbGet("keepalive-file",function(e,blob){
  if(!e&&blob){kaUrl.file=URL.createObjectURL(blob)}
  else if(KA.file){KA.file="";KA.audible=false;saveKA()}
});
function makeSilentWav(){
  var rate=8000,n=rate*2,buf=new ArrayBuffer(44+n*2),v=new DataView(buf);
  function ws(o,t){for(var i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))}
  ws(0,"RIFF");v.setUint32(4,36+n*2,true);ws(8,"WAVE");ws(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);ws(36,"data");v.setUint32(40,n*2,true);
  for(var i=0;i<n;i++)v.setInt16(44+i*2,i%2?1:-1,true);
  return URL.createObjectURL(new Blob([buf],{type:"audio/wav"}));
}
function kaWant(){return KA.audible&&kaUrl.file?"file":KA.silent?"silent":""}
function kaStatus(){var w=kaWant();return !w?"Off":(kaEl&&!kaEl.paused?"Running · "+(w==="file"?"audible":"silent"):"Tap to start")}
function kaApply(){
  var want=kaWant();
  if(!want){if(kaEl)kaEl.pause();kaMode="";try{if("mediaSession" in navigator)navigator.mediaSession.playbackState="none"}catch(e){}return Promise.resolve()}
  if(!kaEl){kaEl=document.createElement("audio");kaEl.loop=true;kaEl.preload="auto";kaEl.setAttribute("playsinline","");kaEl.style.display="none";document.body.appendChild(kaEl)}
  if(kaMode!==want){kaEl.src=want==="silent"?(kaUrl.silent||(kaUrl.silent=makeSilentWav())):kaUrl.file;kaMode=want}
  kaEl.volume=want==="file"?KA.vol/100:1;
  try{if("mediaSession" in navigator&&window.MediaMetadata){navigator.mediaSession.metadata=new MediaMetadata({title:"Chats",artist:"Keep alive"});navigator.mediaSession.playbackState="playing"}}catch(e){}
  var pr=kaEl.play();
  return pr&&pr.then?pr.then(function(){},function(){}):Promise.resolve();
}
function kaSetHTML(){
  return '<div class="sgrp">Keep Alive</div><div class="card">'+
    '<div class="fl"><div class="srow" style="cursor:default"><b>Status</b><span class="v">'+kaStatus()+'</span></div></div>'+
    '<div class="fl"><button class="srow" id="kaSilent"><b>Silent audio</b><i class="sw'+(KA.silent?' on':'')+'"></i></button></div>'+
    '<div class="fl"><button class="srow" id="kaAud"><b>Audible audio</b><i class="sw'+(KA.audible?' on':'')+'"></i></button></div>'+
    '<div class="fl"><button class="srow" id="kaFile"><b>Audio file</b><span class="v">'+esc(KA.file||"Choose…")+'</span></button></div>'+
    '<div class="fl"><label style="font-size:13px;color:var(--sub);margin-bottom:8px">Volume · '+KA.vol+'%</label><input type="range" id="kaVol" min="0" max="100" value="'+KA.vol+'" style="width:100%"></div></div>'+
    (KA.file?'<button class="ghost" id="kaRm">Remove file</button>':'')+
    '<div class="hint" style="word-break:normal">在后台循环播放音频，让页面尽量不被系统冻结。Silent 播放几乎听不见的循环音；Audible 播放你选的音频文件，开启后优先于 Silent。需要先点一下开关才能开始播放；更耗电，锁屏界面可能出现播放控件。效果因系统而异，不保证一直有效。</div>';
}
$("#pgSet").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  var re=function(){renderSettings()};
  if(b.id==="kaSilent"){KA.silent=!KA.silent;saveKA();kaApply().then(re);return}
  if(b.id==="kaAud"){
    if(!KA.audible&&!kaUrl.file){toast("先选择一个音频文件");return}
    KA.audible=!KA.audible;saveKA();kaApply().then(re);return;
  }
  if(b.id==="kaFile"){
    var inp=document.createElement("input");inp.type="file";inp.accept="audio/*";
    inp.onchange=function(){
      var f=inp.files[0];if(!f)return;
      if(f.size>20*1048576){toast("文件太大，请选 20MB 以内");return}
      idbPut("keepalive-file",f,function(err){
        if(err){toast("保存失败，这个浏览器可能不支持");return}
        if(kaUrl.file)URL.revokeObjectURL(kaUrl.file);
        kaUrl.file=URL.createObjectURL(f);KA.file=f.name;saveKA();
        if(kaMode==="file"){kaMode=""}
        toast("已选择："+f.name);renderSettings();
      });
    };inp.click();return;
  }
  if(b.id==="kaRm"){
    idbDel("keepalive-file");if(kaUrl.file)URL.revokeObjectURL(kaUrl.file);kaUrl.file="";KA.file="";KA.audible=false;saveKA();
    kaMode="";kaApply().then(re);toast("已移除");return;
  }
});
$("#pgSet").addEventListener("input",function(e){
  if(e.target.id!=="kaVol")return;
  KA.vol=+e.target.value;saveKA();if(kaEl&&kaMode==="file")kaEl.volume=KA.vol/100;
  var lb=e.target.previousElementSibling;if(lb)lb.textContent="Volume · "+KA.vol+"%";
});
document.addEventListener("pointerdown",function(){if(kaWant()&&(!kaEl||kaEl.paused))kaApply()},{passive:true});
document.addEventListener("visibilitychange",function(){if(kaWant()&&kaEl&&kaEl.paused){var pr=kaEl.play();if(pr&&pr.catch)pr.catch(function(){})}});

applyHeader();renderList();albumTick();


