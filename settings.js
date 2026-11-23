/* settings.js — Settings、语音识别/视频识别、检查更新 */// ---------- Settings ----------
var S=JSON.parse(JSON.stringify(CONFIG.settings));
try{var rs=store("settings");if(rs){var so=JSON.parse(rs);["api","voice","img","vision","stt"].forEach(function(k){Object.assign(S[k],so[k]||{})});if(so.theme)S.theme=so.theme;if(so.lastBackup)S.lastBackup=so.lastBackup}}catch(e){}
function saveS(){store("settings",JSON.stringify(S))}
window.getSettings=function(){return S};
function applyTheme(){var r=document.documentElement;if(S.theme==="system")r.removeAttribute("data-theme");else r.setAttribute("data-theme",S.theme)}
var BACK='<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>';
function fld(path,label,ph,opt){
  opt=opt||{};var p=path.split("."),v=S[p[0]][p[1]]||"",id="f_"+p[0]+"_"+p[1];
  var lab='<label>'+label+(opt.secret?'<button class="show" data-show="'+id+'">Show</button>':'')+'</label>';
  if(opt.area)return '<div class="fl">'+lab+'<textarea class="ta" data-k="'+path+'" id="'+id+'" placeholder="'+ph+'">'+esc(v)+'</textarea></div>';
  return '<div class="fl">'+lab+'<input data-k="'+path+'" id="'+id+'" '+
    (opt.secret?'type="password" autocomplete="off" ':opt.num?'type="number" step="'+opt.num+'" inputmode="decimal" ':'autocapitalize="off" autocorrect="off" spellcheck="false" ')+
    'placeholder="'+ph+'" value="'+esc(v)+'"></div>';
}
var PULLED={};
function pullsHTML(g){
  var cur=g==="voice"?S.voice.voice:S[g].model;
  return (PULLED[g]||[]).map(function(x){return '<button class="fchip'+(x.v===cur?' on':'')+'" data-pg="'+g+'" data-pv="'+esc(x.v)+'">'+esc(x.l)+'</button>'}).join("");
}
function pullBlock(g,label){return '<button class="pillbtn" data-pull="'+g+'">'+label+'</button><div class="pulls" id="pl_'+g+'">'+pullsHTML(g)+'</div>'}
function pullList(g,btn){
  var old=btn.textContent,req;
  if(g==="voice"){
    if(!S.voice.key){toast("请先填写 API Key");return}
    req=fetch("https://api.elevenlabs.io/v1/voices",{headers:{"xi-api-key":S.voice.key}});
  }else{
    var a=S[g];if(!a.base||!a.key){toast("请先填写 Base URL 和 API Key");return}
    req=fetch(a.base.replace(/\/+$/,"")+"/models",{headers:{"Authorization":"Bearer "+a.key}});
  }
  btn.disabled=true;btn.textContent="拉取中…";
  req.then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
  .then(function(x){
    var list=g==="voice"?x.j.voices:x.j.data;
    if(!x.ok||!Array.isArray(list))throw new Error(JSON.stringify(x.j).slice(0,120));
    PULLED[g]=g==="voice"?list.map(function(v){return{v:v.voice_id,l:v.name||v.voice_id}}):list.map(function(m){return{v:m.id,l:m.id}}).sort(function(a,b){return a.l.localeCompare(b.l)});
    var c=$("#pl_"+g);if(c)c.innerHTML=pullsHTML(g);
    toast("已拉取 "+PULLED[g].length+" 个，点一下即可选用");
  })
  .catch(function(e){toast("拉取失败："+e.message.slice(0,60))})
  .then(function(){btn.disabled=false;btn.textContent=old});
}
function pickPulled(b){
  var g=b.dataset.pg,v=b.dataset.pv;
  if(g==="voice"){S.voice.voice=v;var i1=$("#f_voice_voice");if(i1)i1.value=v}
  else{S[g].model=v;var i2=$("#f_"+g+"_model");if(i2)i2.value=v}
  saveS();var c=$("#pl_"+g);if(c)c.innerHTML=pullsHTML(g);
}
function testVision(){
  var a=S.vision,out=$("#visOut"),btn=$("#visTestBtn");
  if(!a.base||!a.key||!a.model){out.textContent="请先填写 Base URL、API Key 和 Model。";return}
  var cv=document.createElement("canvas");cv.width=cv.height=64;var cx=cv.getContext("2d");
  cx.fillStyle="#fff";cx.fillRect(0,0,64,64);cx.fillStyle="#e53935";cx.beginPath();cx.arc(32,32,20,0,7);cx.fill();
  btn.disabled=true;out.textContent="请求中…";
  fetch(a.base.replace(/\/+$/,"")+"/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+a.key},body:JSON.stringify({model:a.model,messages:[{role:"user",content:[{type:"text",text:"What shape and color is in this image? Answer in a few words."},{type:"image_url",image_url:{url:cv.toDataURL("image/png")}}]}],max_tokens:40})})
  .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
  .then(function(x){out.textContent=(x.ok&&x.j.choices)?"连接成功，它看到的是："+String(x.j.choices[0].message.content||"").slice(0,80):"失败："+JSON.stringify(x.j).slice(0,200)})
  .catch(function(e){out.textContent="网络错误："+e.message+"（可能是地址不对，或服务不允许浏览器直接访问）"})
  .then(function(){btn.disabled=false});
}
// ---------- 语音识别 / 视频识别 ----------
// 对外接口：startRecording() -> Promise<{stop():Promise<Blob>}>   开始录音，stop() 返回录音文件
//          transcribeAudio(blob) -> Promise<文字>                 语音转文字（用 Speech Recognition 设置）
//          describeVideo(file, 提问) -> Promise<文字>              视频截帧后交给 Image Recognition 设置识别
function apiUrl(a,p){return a.base.replace(/\/+$/,"")+p}
window.transcribeAudio=function(blob){
  var a=S.stt;
  if(!a.base||!a.key||!a.model)return Promise.reject(new Error("请先在 Settings 填写语音识别的 Base URL、API Key 和 Model"));
  var ext=/mp4|m4a|aac/.test(blob.type)?"m4a":/ogg/.test(blob.type)?"ogg":/wav/.test(blob.type)?"wav":"webm";
  var fd=new FormData();fd.append("file",blob,"voice."+ext);fd.append("model",a.model);if(a.lang)fd.append("language",a.lang);
  return fetch(apiUrl(a,"/audio/transcriptions"),{method:"POST",headers:{"Authorization":"Bearer "+a.key},body:fd})
  .then(function(r){return r.json().then(function(j){if(!r.ok||typeof j.text!=="string")throw new Error(JSON.stringify(j).slice(0,160));return j.text})});
};
window.startRecording=function(){
  if(!navigator.mediaDevices||!window.MediaRecorder)return Promise.reject(new Error("当前浏览器不支持录音"));
  return navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
    var mt=["audio/webm;codecs=opus","audio/webm","audio/mp4"].filter(function(t){return MediaRecorder.isTypeSupported(t)})[0];
    var rec=mt?new MediaRecorder(stream,{mimeType:mt}):new MediaRecorder(stream),chunks=[];
    rec.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
    rec.start();
    return{stop:function(){return new Promise(function(res){
      rec.onstop=function(){stream.getTracks().forEach(function(t){t.stop()});res(new Blob(chunks,{type:rec.mimeType||mt||"audio/webm"}))};
      rec.stop();
    })}};
  });
};
function videoFrames(file,n,maxSide){
  return new Promise(function(res,rej){
    var url=URL.createObjectURL(file),v=document.createElement("video"),out=[];
    var fail=function(m){URL.revokeObjectURL(url);rej(new Error(m))};
    v.muted=true;v.playsInline=true;v.preload="auto";v.src=url;
    v.onerror=function(){fail("这个视频格式浏览器读不了")};
    v.onloadedmetadata=function(){
      var d=v.duration;if(!isFinite(d)||d<=0)return fail("读不到视频时长");
      var k=Math.max(1,Math.min(12,n)),i=0,c=document.createElement("canvas"),x=c.getContext("2d");
      var sc=Math.min(1,maxSide/Math.max(v.videoWidth,v.videoHeight));
      c.width=Math.round(v.videoWidth*sc)||1;c.height=Math.round(v.videoHeight*sc)||1;
      v.onseeked=function(){
        x.drawImage(v,0,0,c.width,c.height);out.push(c.toDataURL("image/jpeg",.7));i++;
        if(i>=k){URL.revokeObjectURL(url);res({frames:out,duration:d})}else v.currentTime=Math.min(d-.05,d*(i+.5)/k);
      };
      v.currentTime=Math.min(d-.05,d*.5/k);
    };
  });
}
window.describeVideo=function(file,prompt){
  var a=S.vision;
  if(!a.base||!a.key||!a.model)return Promise.reject(new Error("请先填写 Image Recognition 的 Base URL、API Key 和 Model"));
  return videoFrames(file,parseInt(a.frames,10)||6,640).then(function(r){
    var parts=[{type:"text",text:(prompt||"请描述这段视频里发生了什么。")+"\n（以下 "+r.frames.length+" 张图是从时长约 "+Math.round(r.duration)+" 秒的视频里按时间顺序均匀截取的画面）"}];
    r.frames.forEach(function(u){parts.push({type:"image_url",image_url:{url:u}})});
    return fetch(apiUrl(a,"/chat/completions"),{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+a.key},body:JSON.stringify({model:a.model,messages:[{role:"user",content:parts}],max_tokens:600})})
    .then(function(q){return q.json().then(function(j){if(!q.ok||!j.choices)throw new Error(JSON.stringify(j).slice(0,160));return String(j.choices[0].message.content||"")})});
  });
};
var sttRec=null;
function testStt(){
  var btn=$("#sttTestBtn"),out=$("#sttOut");
  if(sttRec){
    var r=sttRec;sttRec=null;btn.disabled=true;btn.textContent="识别中…";
    r.stop().then(window.transcribeAudio).then(function(t){out.textContent=t?"识别结果："+t:"没有识别到内容"})
    .catch(function(e){out.textContent="失败："+e.message.slice(0,200)})
    .then(function(){btn.disabled=false;btn.textContent="Test: record and transcribe"});
    return;
  }
  window.startRecording().then(function(r){sttRec=r;btn.textContent="Stop and transcribe";out.textContent="录音中，说几句话，再点一次停止。"})
  .catch(function(e){out.textContent="无法录音："+e.message});
}
function testVideo(){
  var out=$("#visOut"),inp=document.createElement("input");inp.type="file";inp.accept="video/*";
  inp.onchange=function(){var f=inp.files[0];if(!f)return;out.textContent="抽帧并识别中…";
    window.describeVideo(f,"用一两句话描述这段视频。").then(function(t){out.textContent="识别结果："+t.slice(0,200)})
    .catch(function(e){out.textContent="失败："+e.message.slice(0,200)})};
  inp.click();
}
// ---------- 检查更新 ----------
// 原理：绕过缓存去读线上最新的 index.html，对比里面的 APP_VERSION；不一样就清掉缓存并重新载入。
// 聊天数据、设置存在浏览器本地存储里，更新不会动它们。
var UPD=null;
function checkUpdate(){
  var btn=$("#updBtn"),tx=$("#verTxt");
  if(UPD){
    btn.disabled=true;btn.textContent="更新中…";
    var p=[];
    if(window.caches&&caches.keys)p.push(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k)}))}));
    if(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations)p.push(navigator.serviceWorker.getRegistrations().then(function(rs){return Promise.all(rs.map(function(r){return r.unregister()}))}));
    Promise.all(p).catch(function(){}).then(function(){location.replace(location.pathname+"?v="+encodeURIComponent(UPD)+"&t="+Date.now())});
    return;
  }
  btn.disabled=true;btn.textContent="检查中…";
  var found=false;
  fetch(location.pathname+"?_="+Date.now(),{cache:"no-store"})
    .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.text()})
    .then(function(t){
      var m=t.match(/APP_VERSION\s*=\s*"([^"]+)"/);
      if(!m){tx.textContent="无法读取线上版本号";toast("检查失败：线上文件里找不到版本号");return}
      if(m[1]===APP_VERSION){tx.textContent="Version "+APP_VERSION+" · 已是最新";toast("已是最新版本")}
      else{UPD=m[1];found=true;tx.textContent="发现新版本 "+m[1]+"（当前 "+APP_VERSION+"）";toast("发现新版本 "+m[1])}
    })
    .catch(function(e){toast("检查失败："+String(e.message||e).slice(0,60)+"（可能没网或还在发布中）",3500)})
    .then(function(){btn.disabled=false;btn.textContent=found?"Update now":"Check for updates"});
}

// ---------- 已用空间 ----------
function mb(n){return(n/1048576).toFixed(n<10485760?2:1)+" MB"}
function fillUsage(){
  if(!window.IMG||!$("#usLs"))return;
  var u=IMG.usage(),pct=Math.min(100,Math.round(u.ls/5242880*100));
  $("#usLs").textContent=mb(u.ls)+" / 约 5 MB";$("#usBar").style.width=pct+"%";
  $("#usImg").textContent=IMG.isOk()?mb(u.img)+"（单独存放）":"没能单独存放";
  $("#usHint").textContent=pct>=80?"文字数据快满了：新内容可能存不进去，请先导出备份，再清理不需要的聊天记录。":(IMG.isOk()?"图片会自动存到单独的存储区，不占上面的文字空间。":"这台设备的浏览器不允许单独存图片，图片仍然占用上面的文字空间。");
  if(navigator.storage&&navigator.storage.estimate)navigator.storage.estimate().then(function(e){var el=$("#usAll");if(el)el.textContent=mb(e.usage||0)+(e.quota?" / "+mb(e.quota):"")}).catch(function(){});
}
function renderSettings(){
  var th=S.theme==="system"?"System":S.theme==="light"?"Light":"Dark";
  $("#pgSet").innerHTML=
   '<div class="sTitle"><button class="circle" id="sBack" aria-label="返回">'+BACK+'</button><h1>Settings</h1></div>'+
   '<div class="sgrp">Appearance</div><div class="card"><button class="srow" id="themeBtn"><b>Theme</b><span class="v">'+th+'</span></button></div>'+
   wbSetHTML()+ntSetHTML()+kaSetHTML()+'<div class="sgrp">Chat API</div><div class="card">'+fld("api.base","Base URL","https://api.openai.com/v1")+fld("api.key","API Key","sk-…",{secret:1})+fld("api.model","Model","模型名，例如 gpt-4o")+fld("api.temp","Temperature","0.8",{num:"0.1"})+fld("api.max","Max Tokens","1024",{num:"1"})+fld("api.ctx","Recent Messages","发送给 AI 的最近消息条数，默认 30",{num:"1"})+'</div>'+pullBlock("api","Fetch models")+
   '<button class="pillbtn" id="testBtn">Test connection</button><div class="hint" id="testOut">兼容 OpenAI 格式的接口都可以填，Base URL 一般以 /v1 结尾。<br>只想先看效果的话，Base URL 填 demo，聊天里会返回演示回复。</div>'+
   '<div class="sgrp">Voice · ElevenLabs</div><div class="card">'+fld("voice.key","API Key","xi-…",{secret:1})+fld("voice.voice","Voice ID","音色 ID")+fld("voice.model","Model ID","eleven_multilingual_v2")+'</div>'+pullBlock("voice","Fetch voices")+
   '<div class="sgrp">Image Generation</div><div class="card">'+fld("img.base","Base URL","https://api.openai.com/v1")+fld("img.key","API Key","sk-…",{secret:1})+fld("img.model","Model","模型名")+fld("img.size","Size","1024x1024")+fld("img.pos","Positive Prompt","正向提示词，会附加在每次生图描述的前面",{area:1})+fld("img.neg","Negative Prompt","反向提示词，描述不想出现的内容",{area:1})+'</div>'+pullBlock("img","Fetch models")+'<div class="hint">不是所有生图接口都支持反向提示词，不支持时填了可能不生效。</div>'+
   '<div class="sgrp">Image Recognition</div><div class="card">'+fld("vision.base","Base URL","https://api.openai.com/v1")+fld("vision.key","API Key","sk-…",{secret:1})+fld("vision.model","Model","支持识图的模型，例如 gpt-4o")+fld("vision.frames","Video Frames","视频截取几张画面（1-12，默认 6）",{num:"1"})+'</div>'+pullBlock("vision","Fetch models")+'<button class="pillbtn" id="visTestBtn">Test connection</button><button class="pillbtn" id="vidTestBtn">Test with a video</button><div class="hint" id="visOut">识图专用，和上面的 Chat API 是分开的两组。测试会发送一张小图片，请选用支持识图的模型。<br>视频识别不需要单独的接口：会在手机上把视频均匀截成几张画面，交给这组识图接口一起看（听不到视频里的声音）。</div>'+
   '<div class="sgrp">Speech Recognition</div><div class="card">'+fld("stt.base","Base URL","https://api.openai.com/v1")+fld("stt.key","API Key","sk-…",{secret:1})+fld("stt.model","Model","whisper-1")+fld("stt.lang","Language","可选，例如 zh、en，留空自动判断")+'</div>'+pullBlock("stt","Fetch models")+'<button class="pillbtn" id="sttTestBtn">Test: record and transcribe</button><div class="hint" id="sttOut">用来识别你说的话。走标准的 /audio/transcriptions 接口（OpenAI Whisper 格式），请选用支持语音转文字的模型；如果你的中转站不支持，测试会提示失败。</div>'+
   '<div class="sgrp">Data</div><div class="card"><button class="srow" id="keysBtn"><b>Include API keys in backup</b><i class="sw" id="swKeys"></i></button></div>'+
   '<button class="pillbtn" id="expBtn">Export backup</button><button class="pillbtn" id="impBtn">Import backup</button>'+
   '<div class="hint">上次备份：'+(S.lastBackup?new Date(S.lastBackup).toLocaleString():"还没有备份过")+'<br>聊天数据只存在这台手机的浏览器里，请定期导出备份。导入会覆盖现有的角色、动态和个人资料。</div>'+
    '<div class="sgrp">Storage</div><div class="card"><div class="fl"><div class="usr"><b>Text &amp; settings</b><span id="usLs">…</span></div><div class="ubar"><i id="usBar"></i></div></div><div class="fl"><div class="usr"><b>Images</b><span id="usImg">…</span></div></div><div class="fl"><div class="usr"><b>Total on this device</b><span id="usAll">—</span></div></div></div>'+
    '<button class="pillbtn" id="gcBtn">Clean unused images</button><div class="hint" id="usHint"></div>'+
    '<div class="sgrp">About</div><button class="pillbtn" id="updBtn">Check for updates</button>'+
    '<div class="hint" id="verTxt" style="text-align:center">Version '+APP_VERSION+'</div>';
  fillUsage();
}
function doExport0(albumImgs){
  var inc=$("#swKeys").classList.contains("on"),s2=JSON.parse(JSON.stringify(S));
  if(!inc){s2.api.key="";s2.voice.key="";s2.img.key="";s2.vision.key="";s2.stt.key=""}
  S.lastBackup=Date.now();s2.lastBackup=S.lastBackup;saveS();
  var blob=new Blob([JSON.stringify({app:"chat-pwa",version:1,exported:Date.now(),data:{profile:P,contacts:contacts,groups:groups,posts:posts,couple:CP,saved:SD,settings:s2,wallet:W,status:ST,worldbook:WB,notif:NOTIF,keepalive:KA,album:ALB,relations:REL,memories:MEM,memtypes:MT,box:QBOX,strip:STRIP,chats:chats,chatset:CHS,trails:TR,albumImgs:albumImgs||{}}})],{type:"application/json"});
  var a=document.createElement("a"),d=new Date();
  a.href=URL.createObjectURL(blob);a.download="chat-backup-"+d.getFullYear()+("0"+(d.getMonth()+1)).slice(-2)+("0"+d.getDate()).slice(-2)+".json";
  document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},2000);
  toast("已导出");renderSettings();
}
function doImport(){
  var inp=document.createElement("input");inp.type="file";inp.accept=".json,application/json";
  inp.onchange=function(){
    var f=inp.files[0];if(!f)return;var r=new FileReader();
    r.onload=function(){try{
      var d=JSON.parse(r.result).data;if(!d)throw 0;
      if(d.settings){["api","voice","img","vision","stt"].forEach(function(k){if(d.settings[k]&&!d.settings[k].key)d.settings[k].key=S[k].key})}
      if(d.profile)localStorage.setItem("profile",JSON.stringify(d.profile));
      if(d.contacts)localStorage.setItem("contacts",JSON.stringify(d.contacts));
      if(d.posts)localStorage.setItem("posts",JSON.stringify(d.posts));
      if(d.groups)localStorage.setItem("groups",JSON.stringify(d.groups));
      if(d.couple)localStorage.setItem("couple",JSON.stringify(d.couple));
      if(d.saved)localStorage.setItem("saved",JSON.stringify(d.saved));
      if(d.wallet)localStorage.setItem("wallet",JSON.stringify(d.wallet));
      if(d.status)localStorage.setItem("status",JSON.stringify(d.status));
      if(d.worldbook)localStorage.setItem("worldbook",JSON.stringify(d.worldbook));
      if(d.notif)localStorage.setItem("notif",JSON.stringify(d.notif));
      if(d.keepalive)localStorage.setItem("keepalive",JSON.stringify(d.keepalive));
      if(d.album)localStorage.setItem("albums",JSON.stringify(d.album));
      if(d.strip)localStorage.setItem("strip",JSON.stringify(d.strip));
      if(d.relations)localStorage.setItem("relations",JSON.stringify(d.relations));
      if(d.chats)localStorage.setItem("chats",JSON.stringify(d.chats));
      if(d.chatset)localStorage.setItem("chatset",JSON.stringify(d.chatset));
      if(d.trails)localStorage.setItem("trails",JSON.stringify(d.trails));
      if(d.memories)localStorage.setItem("memories",JSON.stringify(d.memories));
      if(d.memtypes)localStorage.setItem("memtypes",JSON.stringify(d.memtypes));
      if(d.box)localStorage.setItem("box",JSON.stringify(d.box));
      if(d.settings)localStorage.setItem("settings",JSON.stringify(d.settings));
      toast("正在导入…");albumRestore(d.albumImgs,function(){toast("已导入，正在重新加载");setTimeout(function(){location.reload()},700)});
    }catch(e){toast("这不是有效的备份文件")}};
    r.readAsText(f);
  };inp.click();
}
function testApi(){
  var a=S.api,out=$("#testOut"),btn=$("#testBtn");
  if(!a.base||!a.key||!a.model){out.textContent="请先填写 Base URL、API Key 和 Model。";return}
  btn.disabled=true;out.textContent="请求中…";
  fetch(a.base.replace(/\/+$/,"")+"/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+a.key},body:JSON.stringify({model:a.model,messages:[{role:"user",content:"Say hi in three words."}],max_tokens:20})})
   .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
   .then(function(x){out.textContent=(x.ok&&x.j.choices)?"连接成功："+String(x.j.choices[0].message.content||"").slice(0,60):"失败："+JSON.stringify(x.j).slice(0,200)})
   .catch(function(e){out.textContent="请求失败："+e.message+"（可能是网址不对，或接口不允许网页直接调用）"})
   .then(function(){btn.disabled=false});
}
$("#pgSet").oninput=function(e){var k=e.target.dataset.k;if(!k)return;var p=k.split(".");S[p[0]][p[1]]=e.target.value.trim();saveS()};
$("#pgSet").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="sBack")return go("chats");
  if(b.dataset.show){var i=$("#"+b.dataset.show),h=i.type==="password";i.type=h?"text":"password";b.textContent=h?"Hide":"Show";return}
  if(b.id==="themeBtn"){S.theme=S.theme==="system"?"light":S.theme==="light"?"dark":"system";saveS();applyTheme();return renderSettings()}
  if(b.id==="keysBtn")return $("#swKeys").classList.toggle("on");
  if(b.id==="testBtn")return testApi();
  if(b.id==="visTestBtn")return testVision();
  if(b.id==="vidTestBtn")return testVideo();
  if(b.id==="sttTestBtn")return testStt();
  if(b.dataset.pull)return pullList(b.dataset.pull,b);
  if(b.dataset.pg)return pickPulled(b);
  if(b.id==="gcBtn"){IMG.gc().then(function(r){toast(r.n?"已清理 "+r.n+" 张，释放 "+mb(r.bytes):"没有可以清理的图片");fillUsage()});return}
  if(b.id==="updBtn")return checkUpdate();
  if(b.id==="expBtn")return doExport();
  if(b.id==="impBtn")return doImport();
};
applyTheme();
