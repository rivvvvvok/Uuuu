/* char.js — 生活轨迹、Char 的手机页、Chat Settings、头像色环 */// ---------- Char life trail (Chats > Friends) ----------
var TR={};try{TR=JSON.parse(store("trails")||"{}")}catch(e){}
var TCUR=null,TED=null;
function saveTR(){try{localStorage.setItem("trails",JSON.stringify(TR));return true}catch(e){toast("存储空间不足");return false}}
function pad2(n){return ("0"+n).slice(-2)}
function hm2min(t){var a=String(t).split(":");return (parseInt(a[0],10)||0)*60+(parseInt(a[1],10)||0)}
function normHM(t){var a=String(t).split(":");return pad2(Math.min(23,parseInt(a[0],10)||0))+":"+pad2(Math.min(59,parseInt(a[1],10)||0))}
function zoneNow(tz){
  var d=new Date(),p;
  var o={year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false};
  try{p=new Intl.DateTimeFormat("en-GB",Object.assign({timeZone:tz||undefined},o)).formatToParts(d)}catch(e){p=new Intl.DateTimeFormat("en-GB",o).formatToParts(d)}
  var g={};p.forEach(function(x){g[x.type]=x.value});
  var hh=g.hour==="24"?"00":g.hour;
  return{date:g.year+"-"+g.month+"-"+g.day,min:(+hh)*60+(+g.minute),hm:hh+":"+g.minute};
}
function curSlot(items,min){
  for(var i=0;i<items.length;i++){
    var f=hm2min(items[i].from),t=hm2min(items[i].to);if(t<=f)t+=1440;
    if((min>=f&&min<t)||(min+1440>=f&&min+1440<t))return items[i];
  }
  return null;
}
function getTrail(id){
  var z=zoneNow(chsGet(id).charTz),t=TR[id];
  if(!t||t.date!==z.date||!t.items)return{items:[],now:null,time:z.hm,date:z.date};
  var items=t.items.slice().sort(function(a,b){return hm2min(a.from)-hm2min(b.from)});
  return{items:items,now:curSlot(items,z.min),time:z.hm,date:z.date};
}
window.getTrail=getTrail;
// Friends：保留 Char 列表（第二行显示 Char 的 ID），点进去是两个正方形大卡片：生活轨迹 / 手机
var PHONEI='<svg viewBox="0 0 24 24"><rect x="7" y="2.500" width="10" height="19" rx="2.500"/><path d="M11 18.500h2"/></svg>';
var TRAILI='<svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="2.200"/><circle cx="18" cy="6" r="2.200"/><path d="M8.200 18H14a3 3 0 000-6h-4a3 3 0 010-6h5.800"/></svg>';
function charId(c){return c.uid?"@"+c.uid.replace(/^@/,""):(c.user&&c.real?"@"+c.user.replace(/^@/,""):"")}
function renderFriends(q){
  var el=$("#list"),rows=contacts.filter(function(c){return !q||((c.real||"")+(c.user||"")).toLowerCase().indexOf(q)>-1});
  if(!rows.length){el.innerHTML='<div class="empty" style="margin-top:50px">还没有联系人<br>先去 CONTACTS 添加一位 Char</div>';return}
  el.innerHTML=rows.map(function(c){
    var t=getTrail(c.id);
    return '<button class="item fcard" data-tid="'+c.id+'"><div class="avatar">'+(c.avatar?'<img src="'+c.avatar+'">':PERSON)+'</div><div class="body"><div class="row"><span class="t">'+esc(nick(c))+'</span><span class="d">'+t.time+'</span></div><div class="row2"><div class="p">'+esc(charId(c)||"No ID yet")+'</div></div></div></button>';
  }).join("");
}
function renderFc(){
  var c=cget(TCUR);if(!c){go("chats");return}
  $("#pgFc").innerHTML='<div class="ctop"><button class="circle" id="fcBack" aria-label="返回">'+BACK+'</button></div>'+
    '<div class="banner'+(c.bg?' img':'')+'" style="margin-top:16px'+(c.bg?';background-image:url('+c.bg+')':'')+'"><div class="bnTop"><div class="bnMe"><div class="bnAv"><div class="avatar">'+(c.avatar?'<img src="'+c.avatar+'">':PERSON)+'</div><i class="dot"></i></div><div class="meinfo"><div class="name">'+esc(nick(c))+'</div><div class="status">'+esc(charId(c)||"No ID yet")+'</div></div></div></div></div>'+
    '<div class="fsq"><button data-fs="phone"><span class="fci">'+PHONEI+'</span><b>Phone</b><small>看看 Char 的手机</small></button>'+
    '<button data-fs="trail"><span class="fci">'+TRAILI+'</span><b>Life Trail</b><small>Char 的生活轨迹</small></button></div>';
}
$("#pgFc").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="fcBack")return go("chats");
  if(b.dataset.fs==="trail")return go("trail");
  if(b.dataset.fs==="phone")return go("ph");
};
$("#list").addEventListener("click",function(e){
  var b=e.target.closest(".fcard");if(!b)return;
  e.stopPropagation();TCUR=b.dataset.tid;go("fc");
},true);
var LOCK='<svg class="tlk" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
var SPARK='<svg viewBox="0 0 24 24"><path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM18.500 16l.8 2.200 2.200.8-2.200.8-.8 2.200-.8-2.200-2.200-.8 2.200-.8z"/></svg>';
function renderTrail(){
  var c=cget(TCUR);if(!c){go("chats");return}
  var t=getTrail(TCUR),o=chsGet(TCUR),hasLk=false;
  var list=t.items.map(function(x){
    var now=t.now&&t.now.id===x.id,lk=!x.man;if(lk)hasLk=true;
    var inner='<i></i><div class="tlc"><div class="tlt"><span>'+x.from+' – '+x.to+(x.place?' · '+esc(x.place):'')+'</span><span class="tr2">'+(now?'<em>Now</em>':'')+'</span></div><div class="tlx">'+esc(x.text)+'</div>'+(x.detail?'<div class="tld">'+esc(x.detail)+'</div>':'')+'</div>';
    return lk?'<div class="tl lk'+(now?' now':'')+'">'+inner+'</div>':'<button class="tl'+(now?' now':'')+'" data-ti="'+x.id+'">'+inner+'</button>';
  }).join("");
  $("#pgTrail").innerHTML='<div class="ctop"><button class="circle" id="trBack" aria-label="返回">'+BACK+'</button><button class="circle" id="trGen" aria-label="生成今天的轨迹">'+SPARK+'</button></div>'+
    '<div class="svhead"><div class="svtx"><h1>Today\'s<br>Trail</h1><p>'+esc(nick(c))+' · '+t.date+' · 当地 '+t.time+(o.charTz?'':'（未设置时区，用本机时间）')+'</p></div></div>'+
    (o.life?'':'<div class="hint" style="margin:14px 4px 0">Chat Settings 里的 Life trail status 还没开，Char 聊天时不会参考这份轨迹</div>')+
    
    (t.items.length?'<div class="tlw">'+list+'</div>':'<div class="empty" style="margin-top:46px">还没有今天的轨迹<br>点右上角的闪光键让 AI 生成</div>')+
    '<button class="addpill" id="trAdd" style="margin:14px 0 4px"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Add a slot</span></button>';
}
function openTrailSheet(id){
  var t=TR[TCUR],x=null;if(id&&t)t.items.forEach(function(i){if(i.id===id)x=i});
  if(x&&!x.man){toast("AI 生成的内容不能修改");return}
  TED=x?x.id:null;
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="shCancel">Cancel</button><span class="ttl">'+(x?"Edit slot":"New slot")+'</span><button class="go" id="trSave">Save</button></div>'+
    '<div class="card" style="margin-top:16px"><div class="fl"><label>From</label><input type="time" id="trFrom" value="'+(x?x.from:"09:00")+'"></div><div class="fl"><label>To</label><input type="time" id="trTo" value="'+(x?x.to:"10:00")+'"></div><div class="fl"><label>Doing</label><input id="trText" maxlength="60" placeholder="例如 在咖啡馆看书" value="'+esc(x?x.text:"")+'"></div></div>'+
    (x?'<button class="pillbtn" id="trDel" style="margin-top:12px">Delete</button>':'');
  $("#sheetWrap").hidden=false;
}
$("#sheet").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="trSave"){
    var f=$("#trFrom").value,to=$("#trTo").value,tx=$("#trText").value.trim();
    if(!f||!to){toast("请选择时间");return}
    if(!tx){toast("写一下在做什么");$("#trText").focus();return}
    var z=zoneNow(chsGet(TCUR).charTz),t=TR[TCUR];
    if(!t||t.date!==z.date)t=TR[TCUR]={date:z.date,items:[]};
    if(TED){t.items.forEach(function(i){if(i.id===TED){i.from=normHM(f);i.to=normHM(to);i.text=tx}})}
    else t.items.push({id:Date.now().toString(36),from:normHM(f),to:normHM(to),text:tx,man:true});
    saveTR();closeSheet();renderTrail();
  }else if(b.id==="trDel"){
    var t2=TR[TCUR];if(t2){t2.items=t2.items.filter(function(i){return i.id!==TED});saveTR()}
    closeSheet();renderTrail();
  }
});
function genTrail(cid){
  var c=cget(cid),a=S.api,o=chsGet(cid),z=zoneNow(o.charTz);
  var demo=(a.base||"").trim().toLowerCase()==="demo";
  if(!demo&&(!a.base||!a.key||!a.model)){toast("请先在 Settings 填写 Chat API");return Promise.resolve(false)}
  function done(items){
    items=items.filter(function(x){return x&&/^\d{1,2}:\d{2}$/.test(String(x.from))&&/^\d{1,2}:\d{2}$/.test(String(x.to))&&x.text}).map(function(x,i){
      return{id:Date.now().toString(36)+i,from:normHM(x.from),to:normHM(x.to),text:String(x.text).slice(0,60),place:x.place?String(x.place).slice(0,30):"",detail:x.detail?String(x.detail).slice(0,100):""};
    });
    if(!items.length)throw new Error("没有生成出有效的安排");
    // AI 生成的内容整体替换；用户手动添加的（man）保留
    var keep=(TR[cid]&&TR[cid].date===z.date)?TR[cid].items.filter(function(i){return i.man}):[];
    TR[cid]={date:z.date,items:items.concat(keep)};saveTR();return true;
  }
  if(demo)return Promise.resolve(done([
    {from:"08:00",to:"09:00",text:"（演示）起床吃早饭",place:"家",detail:"闹钟响了三次才爬起来，煮了点麦片，边吃边刷手机上的天气预报。"},
    {from:"09:00",to:"12:00",text:"（演示）工作",place:"工作间",detail:"上午一直在处理积压的活，中途接了个电话，聊了十分钟，有点烦躁但还是忍住了。"},
    {from:"12:00",to:"13:00",text:"（演示）午饭",place:"路边小店",detail:"随便买了个三明治，坐在车里吃，听了会儿广播。"},
    {from:"13:00",to:"18:00",text:"（演示）继续忙",place:"外面",detail:"下午跑了两个地方，天气很热，回程路上买了瓶冰水一口气喝完。"},
    {from:"22:30",to:"07:30",text:"（演示）睡觉",place:"家",detail:"洗完澡倒头就睡，手机放在床头，没有再看。"}
  ]));
  var sys="";try{sys=buildSystem(c,[])}catch(e){}
  var lang=o.charLang||"the language this character normally uses";
  var ask=PROMPTS.trailAsk(nick(c),z.date,o.charRegion,o.charTz,lang);
  return fetch(apiUrl(a,"/chat/completions"),{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+a.key},body:JSON.stringify({model:a.model,temperature:0.8,max_tokens:2000,messages:[{role:"system",content:sys},{role:"user",content:ask}]})})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j.error&&j.error.message)||("HTTP "+r.status));return j})})
    .then(function(j){
      var t=j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;if(!t)throw new Error("空回复");
      t=String(t).replace(/<think>[\s\S]*?(<\/think>|$)/gi,"");
      var i=t.indexOf("["),k=t.lastIndexOf("]");if(i<0||k<i)throw new Error("格式不对");
      return done(JSON.parse(t.slice(i,k+1)));
    });
}
$("#pgTrail").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="trBack"){go("fc");return}
  if(b.id==="trAdd"){openTrailSheet(null);return}
  if(b.dataset.ti){openTrailSheet(b.dataset.ti);return}
  if(b.id==="trGen"){
    if(b.disabled)return;
    if(TR[TCUR]&&getTrail(TCUR).items.length&&!confirm("重新生成会换掉今天 AI 生成的轨迹（你手动添加的会保留），继续吗？"))return;
    b.disabled=true;b.style.opacity=".5";toast("正在生成今天的轨迹…");
    genTrail(TCUR).then(function(ok){if(ok){toast("已生成");renderTrail()}}).catch(function(err){toast("生成失败："+String(err.message||err).slice(0,60))}).then(function(){b.disabled=false;b.style.opacity=""});
  }
};

// ---------- Char 的手机页 ----------
var PH={};try{PH=JSON.parse(store("phones")||"{}")}catch(e){}
function savePH(){try{localStorage.setItem("phones",JSON.stringify(PH));return true}catch(e){toast("存储空间不足");return false}}
function phGet(id){var o=PH[id]||(PH[id]={});if(!o.img)o.img={};return o}
function pi(d){return '<svg viewBox="0 0 24 24">'+d+'</svg>'}
var PHA={
  notes:["Notes",pi('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 10h8M8 14h5"/>')],
  unicos:["Unicos",pi('<path d="M7 5v8a5 5 0 0010 0V5"/>')],
  phone:["Phone",pi('<path d="M6 4h3l1.5 4-2 1.5a10 10 0 005 5l1.500-2 4 1.500v3a2 2 0 01-2 2A13 13 0 014 6a2 2 0 012-2z"/>')],
  x:["X",pi('<path d="M5 5l14 14M19 5L5 19"/>')],
  health:["Health",pi('<path d="M12 20s-7-4.500-7-10a4 4 0 017-2.500A4 4 0 0119 10c0 5.500-7 10-7 10z"/>')],
  shop:["Shop",pi('<path d="M6 8h12l1 12H5z"/><path d="M9 8a3 3 0 016 0"/>')],
  photos:["Photos",pi('<rect x="4" y="5" width="16" height="14" rx="3"/><circle cx="9" cy="10" r="1.500"/><path d="M5 17l5-4 4 3 2-2 3 3"/>')],
  safari:["Safari",pi('<circle cx="12" cy="12" r="8"/><path d="M15 9l-2 4-4 2 2-4z"/>')],
  msg:["",pi('<path d="M5 6h14a1 1 0 011 1v8a1 1 0 01-1 1h-7l-4 3v-3H5a1 1 0 01-1-1V7a1 1 0 011-1z"/>')],
  cam:["",pi('<path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.500"/>')],
  gear:["",pi('<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100"/>')],
  music:["",pi('<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>')]
};
function phApp(k,o,lab){
  var im=o.img[k];
  return '<div class="pa" data-pk="'+k+'"><div class="ai"'+(im?' style="background-image:url('+im+')"':'')+'>'+(im?'':PHA[k][1])+'</div>'+(lab?'<span>'+PHA[k][0]+'</span>':'')+'</div>';
}
function phWg(k,o,inner){
  var im=o.img[k];
  return '<div class="wimg" data-pk="'+k+'"'+(im?' style="background-image:url('+im+')"':'')+'>'+(inner||'')+'</div>';
}
function phTime(){
  var z=zoneNow(chsGet(TCUR).charTz),d=new Date(z.date+"T00:00:00Z");
  var t=$("#phT");if(t)t.textContent=z.hm;
  var w=$("#phD");if(w)w.innerHTML=d.toLocaleDateString("en-US",{weekday:"short",timeZone:"UTC"})+'.<br>'+d.toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});
}
function renderPh(){
  var c=cget(TCUR);if(!c){go("chats");return}
  var o=phGet(TCUR),h=0;for(var q=0;q<TCUR.length;q++)h=(h*31+TCUR.charCodeAt(q))%1000;
  var lv=40+h%56,bw=Math.max(2,Math.round(lv/100*19)),
  st='<span><svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.500" width="3" height="6.500" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>'+
  '<svg viewBox="0 0 17 12" style="fill:currentColor;stroke:none"><path d="M8.500 2.500c2.300 0 4.400.9 6 2.400l1.200-1.300A10.800 10.800 0 008.500.7 10.800 10.800 0 001.300 3.600l1.200 1.300a8.900 8.900 0 016-2.400z"/><path d="M8.500 6.200c1.300 0 2.500.5 3.400 1.300l1.200-1.300A7 7 0 008.500 4.400a7 7 0 00-4.600 1.800l1.200 1.300a5.100 5.100 0 013.400-1.300z"/><path d="M8.500 9.800L10.700 8a3.400 3.400 0 00-4.400 0z"/></svg>'+
  '<svg class="bt" viewBox="0 0 27 13" style="fill:currentColor;stroke:none"><rect x=".5" y=".5" width="22" height="12" rx="3.800" style="fill:none;stroke:currentColor;stroke-width:1;opacity:.4"/><rect x="2" y="2" width="'+bw+'" height="9" rx="2.500"/><path d="M24.200 4.500v4c.8-.3 1.500-1.200 1.500-2s-.7-1.700-1.500-2z" style="opacity:.45"/></svg></span>';
  $("#pgPh").innerHTML='<div class="phfr"><div class="phs"'+(o.wp?' style="--pw:url('+o.wp+')"':'')+'>'+
    
    '<div class="phw">'+phWg("w1",o,'<div class="wd" id="phD"></div>')+
      '<div class="wgm"><b id="phT"></b><small>Have a nice day.</small><button data-wpb="1" aria-label="更换壁纸">'+pi('<path d="M5 12h14M13 6l6 6-6 6"/>')+'</button></div></div>'+
    '<div class="phbar"><div class="pag">'+["notes","unicos","phone","x"].map(function(k){return phApp(k,o,1)}).join("")+'</div></div>'+
    '<div class="phm">'+phWg("w2",o)+'<div class="pag">'+["health","shop","photos","safari"].map(function(k){return phApp(k,o,1)}).join("")+'</div></div>'+
    '<button class="phdots" id="phHome" aria-label="返回"><i class="on"></i><i></i></button>'+
    '<div class="phdock"><div class="pag">'+["msg","cam","gear","music"].map(function(k){return phApp(k,o,0)}).join("")+'</div></div>'+
    '</div></div>';
  phTime();
}
setInterval(function(){if(!$("#pgPh").hidden)phTime()},20000);
function phSheet(k){
  var sh=document.createElement("div");
  sh.innerHTML='<div class="phbk"></div><div class="phsh"><button data-s="pick">'+(k==="wp"?"更换壁纸":"更换图片")+'</button><button data-s="reset">恢复默认</button><button data-s="x" style="color:var(--sub)">取消</button></div>';
  document.body.appendChild(sh);
  sh.onclick=function(e){
    var b=e.target.closest("button"),id=TCUR;
    if(!b&&!e.target.classList.contains("phbk"))return;
    var a=b?b.dataset.s:"x",o=phGet(id);
    if(a==="pick"){
      var bi=document.createElement("input");bi.type="file";bi.accept="image/*";
      bi.onchange=function(){if(!bi.files[0])return;
        shrink(bi.files[0],k==="wp"?1200:(k[0]==="w"?700:256),k!=="wp"&&k[0]!=="w",function(d){
          var old=k==="wp"?o.wp:o.img[k];
          if(k==="wp")o.wp=d;else o.img[k]=d;
          if(!savePH()){if(k==="wp")o.wp=old;else o.img[k]=old;return}
          toast("已更换");if(TCUR===id&&!$("#pgPh").hidden)renderPh();
        })};
      bi.click();
    }else if(a==="reset"){
      if(k==="wp")delete o.wp;else delete o.img[k];
      savePH();renderPh();
    }
    sh.remove();
  };
}
(function(){
  var tm=null,sx=0,sy=0,el=$("#pgPh");
  function clr(){clearTimeout(tm);tm=null}
  el.addEventListener("pointerdown",function(e){
    var t=e.target.closest("[data-pk]");if(!t)return;
    sx=e.clientX;sy=e.clientY;var k=t.dataset.pk;
    clr();tm=setTimeout(function(){tm=null;if(navigator.vibrate)try{navigator.vibrate(10)}catch(x){}phSheet(k)},520);
  });
  el.addEventListener("pointermove",function(e){if(tm&&Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy)>8)clr()});
  ["pointerup","pointercancel","pointerleave"].forEach(function(n){el.addEventListener(n,clr)});
  el.addEventListener("contextmenu",function(e){e.preventDefault()});
  el.addEventListener("click",function(e){
    var b=e.target.closest("button");if(!b)return;
    if(b.id==="phHome")go("fc");
    else if(b.dataset.wpb)phSheet("wp");
  });
})();

// ---------- Chat Settings (per Char) ----------
// getChatSettings(id): 供内置功能读取这位 Char 的聊天设置
var CHS={};try{CHS=JSON.parse(store("chatset")||"{}")}catch(e){}
var CHD={mem:150,bg:false,bgMin:30,apOn:false,apMin:180,apAt:0,apImg:0,asOn:false,asMin:60,asAt:0,life:false,charTz:"",userTz:"",charRegion:"",userRegion:"",voice:false,voiceId:"",charLang:"",trLang:"",trOpen:false,aware:false,outMin:1,outMax:5,thoughts:false,wbOff:[],blocked:false,reactOn:true,vtMe:true,vtChar:true,chBg:"",cot:false,busyOn:false,arMode:"busy",ar:{busy:["","",""],focus:["","",""],sleep:["","",""]},emoFreq:"mid",voiceFreq:"low",imgOn:true,ltm:false,ltmEvery:90,ltmCap:500,ltmAt:0};
function chsGet(id){var o=CHS[id]||(CHS[id]={});for(var k in CHD)if(o[k]===undefined)o[k]=(typeof CHD[k]==="object")?JSON.parse(JSON.stringify(CHD[k])):CHD[k];return o}
function saveCHS(){try{localStorage.setItem("chatset",JSON.stringify(CHS));return true}catch(e){toast("存储空间不足");return false}}
window.getChatSettings=function(id){return JSON.parse(JSON.stringify(chsGet(id)))};
function chsPrompt(id){
  var o=chsGet(id),r=[];
  function tn(tz){try{return new Date().toLocaleString("en-US",{timeZone:tz||undefined,dateStyle:"medium",timeStyle:"short"})}catch(e){return ""}}
  var tzs=PROMPTS.timeZones(tn(o.charTz),o.charTz,tn(o.userTz),o.userTz);if(tzs)r.push(tzs);
  var pls=PROMPTS.places(o.charRegion,o.userRegion);if(pls)r.push(pls);
  var px=msgs(id).filter(function(m){return m.by==="me"&&m.type==="transfer"&&!m.st});
  if(px.length)r.push(PROMPTS.transfer(px.map(function(m){return money(m.amount)+(m.note?" ("+m.note+")":"")}).join(" and ")));
  if(o.blocked)r.push(PROMPTS.blocked());
  if(o.thoughts)r.push(PROMPTS.innerVoice());
  if(o.charLang){r.push(PROMPTS.language(o.charLang));r.push(PROMPTS.translation(o.trLang))}
  var cm=cotMode(o);if(cm!=="off")r.push(PROMPTS.reasoning(cm));
  r.push(PROMPTS.quoting());
  r.push(PROMPTS.moments(feedFor(id),statusFor(id)));
  if(o.emoFreq!=="off"&&SD.stickers.length){
    r.push(PROMPTS.stickers(SD.stickers.slice(0,PROMPTS.limits.stickerNames).map(function(x,ix){return stName(x,ix)}),o.emoFreq));
  }
  if(o.imgOn!==false&&imgOk())r.push(PROMPTS.sendImage());
  if(o.life){
    var trl=getTrail(id);
    if(trl.items.length)r.push(PROMPTS.lifeTrail(trl));
  }
  var a=Math.min(o.outMin,o.outMax),b=Math.max(o.outMin,o.outMax);
  r.push(PROMPTS.outputRhythm(a,b,PROMPTS.pickCount(a,b)));
  return r;
}
var sumBusy={};
function summarize(cid,manual){
  var o=chsGet(cid),c=cget(cid),list=msgs(cid),a=S.api;
  var s0=Math.min(o.ltmAt||0,list.length),e0=list.length,seg=list.slice(s0);
  if(!c||seg.length<2){if(manual)toast("还没有新的聊天可以总结");return Promise.resolve(false)}
  if(sumBusy[cid])return Promise.resolve(false);
  var cap=Math.max(1,parseInt(o.ltmCap)||500),demo=(a.base||"").trim().toLowerCase()==="demo";
  if(!demo&&(!a.base||!a.key||!a.model)){if(manual)toast("请先在 Settings 填写 Chat API");return Promise.resolve(false)}
  sumBusy[cid]=1;
  // 聊天记录不再每行带时间：只在「新的一段」开头标一次（隔得久或跨天算新的一段）
  var tz=memTz(cid),gap=(PROMPTS.limits.summaryGapMin||60)*60000,prev=0,lines=[];
  seg.forEach(function(m){
    if(m.by==="sys")return;
    if(m.t&&(!prev||m.t-prev>gap||memDay(m.t,tz)!==memDay(prev,tz)))lines.push("=== "+memDay(m.t,tz)+" "+memTm(m.t,tz)+" ===");
    if(m.t)prev=m.t;
    lines.push((m.by==="me"?P.name:nick(c))+": "+m.text);
  });
  var convo=lines.join("\n"),tok=Math.min(16000,cap*3),lang=PROMPTS.limits.summaryLang;
  function ask(sys,user){
    return fetch(apiUrl(a,"/chat/completions"),{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+a.key},body:JSON.stringify({model:a.model,temperature:0.3,max_tokens:tok,messages:[{role:"system",content:sys},{role:"user",content:user}]})})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j.error&&j.error.message)||("HTTP "+r.status));return j})})
    .then(function(j){var t=j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;if(!t)throw new Error("空回复");return String(t).replace(/<think>[\s\S]*?(<\/think>|$)/gi,"").trim()});
  }
  // 超出字数上限：让 AI 压缩（最多两次），实在不行才在句子结尾处截断，不会断在半句话中间
  function fit(t,n){
    if(t.length<=cap||n>=2)return Promise.resolve(t);
    return ask(PROMPTS.condense(cap,lang),t).then(function(t2){return fit(t2||t,n+1)});
  }
  function cutFit(t){
    if(t.length<=cap)return t;
    var s=t.slice(0,cap),k=Math.max(s.lastIndexOf("。"),s.lastIndexOf("！"),s.lastIndexOf("？"),s.lastIndexOf("；"),s.lastIndexOf("\n"),s.lastIndexOf("."));
    return(k>cap*0.5?s.slice(0,k+1):s).trim();
  }
  var job=demo?new Promise(function(r){setTimeout(function(){r("（演示）这里会是 "+seg.length+" 条聊天的核心记忆总结。")},800)}):
    ask(PROMPTS.summary(nick(c),P.name,cap,lang),convo).then(function(t){return fit(t,0)});
  return job.then(function(t){
    t=cutFit(t);
    if(!t)throw new Error("空回复");
    var lt=(seg[seg.length-1]||{}).t||Date.now();
    if(MT.indexOf("Summary")<0)MT.push("Summary");
    (MEM[cid]||(MEM[cid]=[])).unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),type:"Summary",text:t,t:Date.now(),date:memDay(lt,tz),time:memTm(lt,tz),sf:s0,st:e0});
    saveMem();o.ltmAt=e0;saveCHS();
    if(manual)toast("已生成并存入 Memory");
    return true;
  }).catch(function(e){if(manual)toast("总结失败："+String(e.message||e).slice(0,60));return false})
  .then(function(ok){delete sumBusy[cid];return ok});
}
function ltmCheck(id){var o=chsGet(id);if(o.ltm&&msgs(id).length-(o.ltmAt||0)>=(parseInt(o.ltmEvery)||90))summarize(id,false)}
function estTok(t){t=String(t||"");var cj=(t.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g)||[]).length;return Math.round(cj*1.1+(t.length-cj)/4)}
function estRound(c){
  var list=msgs(c.id),n=Math.max(2,parseInt(chsGet(c.id).mem)||150),t=0;
  try{t+=estTok(buildSystem(c,list))}catch(e){}
  list.slice(-n).forEach(function(m){t+=estTok(m.text)+4});
  return t;
}
function tzNow(tz){try{return "Now there: "+new Date().toLocaleTimeString("en-US",{timeZone:tz||undefined,hour:"numeric",minute:"2-digit"})}catch(e){return ""}}
function tzOk(tz){try{new Intl.DateTimeFormat("en",{timeZone:tz});return true}catch(e){return false}}
function chT(key,label,sub){var o=chsGet(CUR);return '<div class="fl"><button class="srow" data-ct="'+key+'"><b>'+label+'</b><i class="sw'+(o[key]?' on':'')+'"></i></button>'+(sub?'<div class="hint">'+sub+'</div>':'')+'</div>'}
function chI(key,label,ph,opt){opt=opt||{};var o=chsGet(CUR);return '<div class="fl"><label>'+label+'</label><input data-cf="'+key+'" '+(opt.num?'type="number" inputmode="numeric" ':'autocapitalize="off" autocorrect="off" spellcheck="false" ')+(opt.list?'list="'+opt.list+'" ':'')+'placeholder="'+ph+'" value="'+esc(o[key])+'">'+(opt.tz?'<div class="hint" id="tzn_'+key+'">'+tzNow(o[key])+'</div>':'')+(opt.sub?'<div class="hint">'+opt.sub+'</div>':'')+'</div>'}
// 思维链档位：off / short / long（旧版本是开关，开着的算 short）
function cotMode(o){return o.cot===true?"short":(o.cot==="short"||o.cot==="long"?o.cot:"off")}
function chSeg(key,label,sub,optsIn,cur){
  var o=chsGet(CUR),opts=optsIn||[["off","Never"],["low","Rarely"],["mid","Sometimes"],["high","Often"]];if(cur==null)cur=o[key];
  return '<div class="fl"><label>'+label+'</label><div class="seg" data-sgk="'+key+'" style="margin-top:8px">'+opts.map(function(x){return '<button data-sg="'+x[0]+'" class="'+(cur===x[0]?'on':'')+'">'+x[1]+'</button>'}).join("")+'</div>'+(sub?'<div class="hint">'+sub+'</div>':'')+'</div>';
}
function arHTML(){
  var o=chsGet(CUR),m=o.arMode,ls=o.ar[m]||["","",""];
  var ph={busy:"例如 我正在忙，晚点回你",focus:"例如 专注中，稍后回复你",sleep:"例如 睡着啦，明天再聊"}[m];
  return '<div class="fl"><label>Mode</label><div class="seg" style="margin-top:8px">'+[["busy","Busy"],["focus","Focus"],["sleep","Sleep"]].map(function(x){return '<button data-bm="'+x[0]+'" class="'+(m===x[0]?'on':'')+'">'+x[1]+'</button>'}).join("")+'</div><div class="hint">当前模式下的三条自动回复，会随机选一条发出</div></div>'+
    [0,1,2].map(function(i){return '<div class="fl"><label>Reply '+(i+1)+'</label><input data-ar="'+i+'" maxlength="80" placeholder="'+esc(ph)+'" value="'+esc(ls[i])+'"></div>'}).join("");
}
function renderChSet(){
  var c=cget(CUR);if(!c){go("chats");return}
  var o=chsGet(CUR),total=msgs(CUR).filter(function(m){return m.by!=="sys"}).length,tzs;
  try{tzs=Intl.supportedValuesOf("timeZone")}catch(e){tzs=["UTC","Asia/Shanghai","Asia/Tokyo","Asia/Seoul","Asia/Singapore","Europe/London","Europe/Paris","America/New_York","America/Chicago","America/Los_Angeles","Australia/Sydney"]}
  var wb=WB.items.map(function(x){
    var on=x.scope==="global"?o.wbOff.indexOf(x.id)<0:(x.chars||[]).indexOf(CUR)>-1;
    return '<div class="fl"><button class="srow" data-wb="'+x.id+'"><b>'+esc(x.title||"Untitled")+'</b><i class="sw'+(on?' on':'')+'"></i></button><div class="hint">'+(x.scope==="global"?"Global":"Local")+(x.on===false?" · 条目本身已关闭":"")+'</div></div>';
  }).join("");
  $("#pgChset").innerHTML='<div class="chs"><div class="sTitle"><button class="circle" id="chsBack" aria-label="返回">'+BACK+'</button><h1>Chat Settings</h1></div>'+
    '<div class="hint" style="margin:12px 4px 0">'+esc(nick(c))+' 的聊天设置，只对这位 Char 生效</div>'+
    '<div class="sgrp">Overview</div><div class="card"><div class="fl"><div class="srow"><b>Total messages</b><span class="v">'+total+'</span></div></div><div class="fl"><div class="srow"><b>Estimated tokens (this round)</b><span class="v">≈ '+estRound(c)+'</span></div><div class="hint">按当前设定的记忆深度估算：系统提示词 + 最近聊天记录，只含输入部分</div></div></div>'+
    '<div class="sgrp">Background Chat</div><div class="card">'+chT("bg","Message you on their own","开启后，Char 会在后台主动私发消息")+chI("bgMin","Interval (minutes)","30",{num:1})+'</div>'+
    '<div class="sgrp">Moments Interaction</div><div class="card">'+chT("reactOn","Like & comment on my moments","开启后，Char 会随机、不定时地给你的动态点赞、评论，也会回复你的评论。不是每条都会，也不会立刻，就像真人刷到了才互动")+'</div>'+
    '<div class="sgrp">Auto Post</div><div class="card">'+chT("apOn","Post moments on their own","开启后，Char 隔一段时间会根据当前状态自己发一条动态：一两句话，像真人随手发的")+chI("apMin","Interval (minutes)","180",{num:1,sub:"计时按真实时间算：中途关掉 App 也不会重置，下次打开发现到点了就补发一条。App 关着的时候发不出来，想让它在后台也发，可以到 Settings 里打开 Keep Alive"})+chI("apImg","Image chance (%)","0",{num:1,sub:"发动态时附带一张生成图片的概率。0 = 从不；100 = 每条都配图。需要先在 Settings 里接好 Image Generation；生图失败时就只发文字"})+'</div>'+
    '<div class="sgrp">Auto Status</div><div class="card">'+chT("asOn","Set status on their own","开启后，Char 隔一段时间会自己更新一条限时状态：几个字，24 小时后消失")+chI("asMin","Interval (minutes)","60",{num:1,sub:"计时按真实时间算：中途关掉 App 也不会重置，下次打开发现到点了就补发一条。App 关着的时候发不出来，想让它在后台也发，可以到 Settings 里打开 Keep Alive"})+'</div>'+
    '<div class="sgrp">Life Trail</div><div class="card">'+chT("life","Life trail status","让 Char 拥有自己的生活轨迹和当前状态")+'</div>'+
    '<div class="sgrp">Time & Place</div><datalist id="tzList">'+tzs.map(function(z){return '<option value="'+z+'">'}).join("")+'</datalist><div class="card">'+
      chI("charTz","Char time zone","例如 Asia/Tokyo",{list:"tzList",tz:1})+chI("userTz","Your time zone","例如 America/New_York",{list:"tzList",tz:1})+
      chI("charRegion","Char region","例如 Kyoto, Japan")+chI("userRegion","Your region","例如 Seattle, USA")+'</div>'+
    '<div class="sgrp">Voice</div><div class="card">'+chT("voice","Voice generation","开启后 Char 的消息可以生成语音")+chI("voiceId","Voice ID (optional)","留空则使用 Settings 里的声音")+chT("vtMe","Show text on my voice messages","开启后，你发的语音下面会展开识别出的文字")+chT("vtChar","Show text on Char's voice messages","开启后，Char 发的语音下面会展开文字")+'</div>'+
    '<div class="sgrp">Language & Translation</div><div class="card">'+chI("charLang","Char language","例如 English, 日本語")+chI("trLang","Translate into","例如 中文")+chT("trOpen","Auto-expand translation","开启后，翻译气泡默认直接展开，不用再点一下")+'</div>'+
    '<div class="sgrp">Awareness</div><div class="card">'+chT("aware","Moment awareness","让 Char 感知并主动提及近期的网络动态")+'</div>'+
    '<div class="sgrp">Reasoning</div><div class="card">'+chSeg("cot","Chain of thought","回复前先想一遍：对方的情绪、我此刻的感受、避免重复、不出戏、不像AI。Short 约 200 字，Long 约 600 字且检查更细；越长越慢、越费 tokens",[["off","Off"],["short","Short"],["long","Long"]],cotMode(chsGet(CUR)))+'</div>'+
    '<div class="sgrp">Auto Reply</div><div class="card">'+chT("busyOn","Auto-reply when busy","开启后，Char 会直接用下面的自定义回复应答，不再调用 AI")+'<div id="arBox">'+arHTML()+'</div></div>'+
    '<div class="sgrp">Output</div><div class="card"><div class="fl"><label>Messages per round</label><div class="rng"><input data-cf="outMin" type="number" inputmode="numeric" placeholder="min" value="'+o.outMin+'"><span>to</span><input data-cf="outMax" type="number" inputmode="numeric" placeholder="max" value="'+o.outMax+'"></div></div>'+
      chSeg("emoFreq","Sticker frequency","只控制表情标签，不限制普通消息里的 emoji")+chSeg("voiceFreq","Voice frequency","需要先开启上面的 Voice generation")+chT("imgOn","Send photos","开启后，你让 Char 发照片（比如“发张你现在的照片”），它会用 Image Generation 生成一张发给你。需要先在 Settings 里接好生图 API；每张图会多花一次生图请求")+chI("mem","Short-term memory (messages)","150",{num:1,sub:"Char 每次回复时能读到的最近聊天条数，默认 150"})+chT("thoughts","Inner thoughts each round","开启后，Char 每轮回复都会带一条心声，点聊天栏里的爱心查看。一轮刷一轮，想留下就收藏")+'</div>'+
    '<div class="sgrp">World Book</div><div class="card">'+(wb||'<div class="empty" style="margin:6px 0">还没有世界书条目</div>')+'</div><div class="hint">开关表示这条设定是否挂载给这位 Char。Local 条目会加入或移出它的角色列表</div>'+
    '<div class="sgrp">Long-term Memory</div><div class="card">'+chT("ltm","Long-term memory","开启后，聊天累计到设定条数会自动总结成核心记忆，存进 Memory 页")+chI("ltmEvery","Trigger every (messages)","90",{num:1,sub:"每累计这么多条新消息，就总结一次，默认 90"})+chI("ltmCap","Core memory limit (characters)","500",{num:1,sub:"每次总结的字数上限，默认 500"})+'<div class="fl"><div class="srow"><b>Not summarized yet</b><span class="v">'+Math.max(0,total-Math.min(o.ltmAt||0,total))+' messages</span></div><button class="pillbtn" data-ca="sumnow" style="margin-top:12px">Summarize now</button><button class="pillbtn" data-ca="sumredo" style="margin-top:8px">Re-summarize last '+(Math.max(1,parseInt(o.ltmEvery)||90))+' messages</button><div class="hint">手动总结自上次总结以来的新聊天。删掉最新一条总结时进度会自动回退；也可以点第二个按钮，把最近这么多条重新标成未总结，再点 Summarize now</div></div></div>'+
    '<div class="sgrp">Chat Background</div><div class="card"><div class="fl"><button class="tile wide" data-ca="bgpick" style="width:100%">'+I.photo+'<span class="tx"><b>Choose image</b><small>'+(o.chBg?"已设置":"未设置，使用默认背景")+'</small></span></button>'+(o.chBg?'<button class="pillbtn" data-ca="bgrm" style="margin-top:10px">Remove background</button>':'')+'</div></div>'+
    '<div class="sgrp">Manage</div><button class="pillbtn" data-ca="edit">Edit Contact</button><button class="pillbtn" data-ca="clear">Clear Chat</button><div class="card" style="margin-top:12px">'+chT("blocked","Block","拉黑后你无法给 Char 发消息；Char 仍能给你发消息，但每条旁边会带一个黑色感叹号")+'</div></div>';
}
$("#pgChset").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  var o=chsGet(CUR);
  if(b.id==="chsBack"){go("chat");applyChatBg();renderChat(true);updateSend();return}
  if(b.dataset.sg){var pk=b.parentNode.dataset.sgk;o[pk]=b.dataset.sg;[].forEach.call(b.parentNode.children,function(x){x.classList.toggle("on",x===b)});saveCHS();return}
  if(b.dataset.bm){o.arMode=b.dataset.bm;saveCHS();$("#arBox").innerHTML=arHTML();return}
  if(b.dataset.ct){var k=b.dataset.ct;o[k]=!o[k];if((k==="apOn"||k==="asOn")&&o[k])o[k==="apOn"?"apAt":"asAt"]=Date.now();b.querySelector(".sw").classList.toggle("on",o[k]);saveCHS();if(k==="blocked"){var bc=cget(CUR),bn=bc?nick(bc):"Char";sysNote(CUR,o[k]?"You blocked "+bn:"You unblocked "+bn);toast(o[k]?"Blocked":"Unblocked")}return}
  if(b.dataset.wb){
    var id=b.dataset.wb,x=null;WB.items.forEach(function(i){if(i.id===id)x=i});if(!x)return;
    var on;
    if(x.scope==="global"){var ix=o.wbOff.indexOf(id);if(ix>-1)o.wbOff.splice(ix,1);else o.wbOff.push(id);on=o.wbOff.indexOf(id)<0;saveCHS()}
    else{x.chars=x.chars||[];var jx=x.chars.indexOf(CUR);if(jx>-1)x.chars.splice(jx,1);else x.chars.push(CUR);on=x.chars.indexOf(CUR)>-1;saveWB()}
    b.querySelector(".sw").classList.toggle("on",on);return;
  }
  if(b.dataset.ca==="sumredo"){var oo=chsGet(CUR),nn=Math.max(1,parseInt(oo.ltmEvery)||90);oo.ltmAt=Math.max(0,msgs(CUR).length-nn);saveCHS();toast("已回退，可以重新总结");renderChSet();return}
  if(b.dataset.ca==="sumnow"){b.disabled=true;b.textContent="Summarizing…";summarize(CUR,true).then(function(){if(!$("#pgChset").hidden)renderChSet()});return}
  if(b.dataset.ca==="bgpick"){
    var bi=document.createElement("input");bi.type="file";bi.accept="image/*";
    bi.onchange=function(){if(bi.files[0])shrink(bi.files[0],1000,false,function(d){var old=o.chBg;o.chBg=d;if(!saveCHS()){o.chBg=old;return}toast("已更换聊天背景");renderChSet()})};
    bi.click();return;
  }
  if(b.dataset.ca==="bgrm"){o.chBg="";saveCHS();toast("已恢复默认背景");renderChSet();return}
  if(b.dataset.ca==="edit"){openForm(CUR);return}
  if(b.dataset.ca==="clear"){
    if(!b.dataset.arm){b.dataset.arm="1";b.textContent="Tap again to clear";b.style.color="#e5484d";return}
    chats[CUR]=[];chsGet(CUR).ltmAt=0;saveCHS();saveChats();toast("已清空聊天");renderChSet();
  }
};
$("#pgChset").oninput=function(e){
  if(e.target.dataset.ar!==undefined){var oo=chsGet(CUR);oo.ar[oo.arMode][+e.target.dataset.ar]=e.target.value.trim();saveCHS();return}
  var f=e.target.dataset.cf;if(!f)return;
  var o=chsGet(CUR),v=e.target.value;
  if(f==="charTz"||f==="userTz"){o[f]=v.trim();var n=$("#tzn_"+f);if(n)n.textContent=tzOk(o[f]||undefined)?tzNow(o[f]):"";saveCHS();return}
  if(e.target.type==="number"){var n2=parseInt(v,10);if(isNaN(n2))return;
    var lim={ltmEvery:[10,1000],ltmCap:[50,3000],mem:[2,1000],bgMin:[1,1440],apMin:[1,10080],apImg:[0,100],asMin:[1,10080],outMin:[1,20],outMax:[1,20]}[f]||[1,9999];
    o[f]=Math.max(lim[0],Math.min(lim[1],n2));saveCHS();return}
  o[f]=v.trim();saveCHS();
};
$("#pgChset").onchange=function(e){
  var f=e.target.dataset.cf;if(!f)return;
  var o=chsGet(CUR);
  if((f==="charTz"||f==="userTz")&&o[f]&&!tzOk(o[f])){toast("时区格式不对，例如 Asia/Tokyo");o[f]="";e.target.value="";var n=$("#tzn_"+f);if(n)n.textContent=tzNow("");saveCHS();return}
  if(e.target.type==="number"){e.target.value=o[f]}
  if(f==="outMin"&&o.outMin>o.outMax){o.outMax=o.outMin;saveCHS();renderChSet()}
  if(f==="outMax"&&o.outMax<o.outMin){o.outMin=o.outMax;saveCHS();renderChSet()}
};

// ---------- avatar ring tint ----------
(function(){
  var cache={};
  function sample(src,cb){
    if(cache[src]){cb(cache[src]);return}
    var im=new Image();
    im.onload=function(){
      try{
        var c=document.createElement("canvas");c.width=c.height=8;var x=c.getContext("2d");
        x.drawImage(im,0,0,8,8);var d=x.getImageData(0,0,8,8).data,a=[0,0,0,0],b=[0,0,0,0];
        for(var i=0;i<64;i++){var px=i%8,py=(i/8)|0,t=(px+py<8)?a:b;t[0]+=d[i*4];t[1]+=d[i*4+1];t[2]+=d[i*4+2];t[3]++}
        function f(t){return "rgb("+Math.round(t[0]/t[3])+","+Math.round(t[1]/t[3])+","+Math.round(t[2]/t[3])+")"}
        cache[src]=[f(a),f(b)];cb(cache[src]);
      }catch(e){}
    };
    im.src=src;
  }
  function apply(){
    document.querySelectorAll(".bnAv .avatar,.cvIn .avatar,.cpav .avatar,.pfav").forEach(function(el){
      var im=el.querySelector("img");
      if(!im){if(el.dataset.tint){el.dataset.tint="";el.style.removeProperty("--r1");el.style.removeProperty("--r2")}return}
      var src=im.getAttribute("src");if(!src||el.dataset.tint===src)return;
      el.dataset.tint=src;
      sample(src,function(c){el.style.setProperty("--r1",c[0]);el.style.setProperty("--r2",c[1])});
    });
  }
  var app=document.querySelector(".app");
  if(app)new MutationObserver(function(){requestAnimationFrame(apply)}).observe(app,{childList:true,subtree:true});
  apply();
})();


// ---------- Char 自己发动态 / 状态 ----------
// 每位 Char 在 Chat Settings 里分别开关、分别设间隔（分钟）。计时按真实时间算（记在每位 Char 的设置里，关掉 App 不会重置）；App 开着、或者开了 Keep Alive 时才会真正发出，到点没发的，下次打开补发一条。
var AUTO={busy:false};
function autoApiOk(){var a=S.api;return (a.base||"").trim().toLowerCase()==="demo"||!!(a.base&&a.key&&a.model)}
function autoClean(t,cut){
  t=String(t||"").replace(/<think>[\s\S]*?(<\/think>|$)/gi,"").replace(/\[thought:[\s\S]*?\]/ig,"");
  t=t.split(/\n+/).map(function(x){return x.trim()}).filter(Boolean)[0]||"";
  t=t.split(/\s*(?:\|\|\||｜｜｜)\s*/)[0].trim().replace(/^["“「『]+|["”」』]+$/g,"").trim();
  return t.slice(0,cut);
}
// 调一次聊天模型，拿一段文字
function autoLLM(sys,ask,demoText){
  var a=S.api;
  if((a.base||"").trim().toLowerCase()==="demo")return new Promise(function(r){setTimeout(function(){r(demoText)},600)});
  return fetch(apiUrl(a,"/chat/completions"),{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+a.key},body:JSON.stringify({model:a.model,temperature:0.9,max_tokens:600,messages:[{role:"system",content:sys},{role:"user",content:ask}]})})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j.error&&j.error.message)||("HTTP "+r.status));return j})})
    .then(function(j){var t=j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;if(!t)throw new Error("空回复");return String(t)});
}
// 给动态配图：先让聊天模型根据动态文字写一句生图描述，再去生图
function autoImage(c,sys,text){
  return autoLLM(sys,PROMPTS.autoPostImage(nick(c),text),"a cozy desk with a cup of coffee, soft morning light").then(function(p){
    p=autoClean(p,400);if(!p)throw new Error("空描述");
    return genImage(p);
  });
}
function autoRun(c,kind){
  var o=chsGet(c.id),L=PROMPTS.limits;
  var lang=o.charLang||"the language this character normally uses",sys="",ask,cut;
  try{sys=buildSystem(c,msgs(c.id).slice(-8))}catch(e){}
  if(kind==="post"){
    var rec=posts.filter(function(p){return p.by===c.id&&p.text}).slice(0,3).map(function(p){return p.text});
    ask=PROMPTS.autoPost(nick(c),lang,rec);cut=L.autoPostCut;
  }else{
    var cur=getStatus(c.id);ask=PROMPTS.autoStatus(nick(c),lang,cur&&cur.text);cut=L.autoStatusCut;
  }
  return autoLLM(sys,ask,kind==="post"?"（演示）今天也要加油":"（演示）发呆中").then(function(t){
    t=autoClean(t,cut);if(!t)throw new Error("空回复");
    if(kind!=="post"){setStatus(c.id,t);return true}
    var pct=Math.max(0,Math.min(100,parseFloat(o.apImg)||0));
    var want=pct>0&&imgOk()&&Math.random()*100<pct;
    return (want?autoImage(c,sys,t).catch(function(){return null}):Promise.resolve(null)).then(function(img){
      posts.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,4),by:c.id,text:t,imgs:img?[img]:[],loc:"",mention:[],hide:[],vis:"Friends",t:Date.now(),likes:[],cmts:[]});
      if(!savePosts()){posts.shift();throw new Error("存储空间不足")}
      var pg=$("#pgProfile");if(pg&&!pg.hidden&&typeof PVid!=="undefined"&&PVid===c.id)renderProfile();
      return true;
    });
  });
}
function autoTick(){
  if(AUTO.busy||!autoApiOk())return;
  var now=Date.now(),job=null;
  contacts.some(function(c){
    var o=chsGet(c.id);
    if(o.apOn&&!o.apAt){o.apAt=now;saveCHS()} // 刚开启：从现在开始计时
    if(o.asOn&&!o.asAt){o.asAt=now;saveCHS()}
    if(o.apOn&&now-(o.apAt||0)>=Math.max(1,parseInt(o.apMin)||180)*60000){job={c:c,k:"post"};return true}
    if(o.asOn&&now-(o.asAt||0)>=Math.max(1,parseInt(o.asMin)||60)*60000){job={c:c,k:"status"};return true}
    return false;
  });
  if(!job)return;
  AUTO.busy=true;
  var o=chsGet(job.c.id),key=job.k==="post"?"apAt":"asAt",gap=Math.max(1,parseInt(job.k==="post"?o.apMin:o.asMin)||60)*60000;
  autoRun(job.c,job.k).then(function(){o[key]=Date.now()})
    .catch(function(){o[key]=Date.now()-Math.max(0,gap-5*60000)}) // 失败了就 5 分钟后再试
    .then(function(){AUTO.busy=false;saveCHS()});
}
setInterval(autoTick,20000);
document.addEventListener("visibilitychange",function(){if(!document.hidden)setTimeout(autoTick,1500)});
setTimeout(autoTick,5000);


// ---------- Char 互动：点赞 / 评论 / 回复评论，以及动态流上下文 ----------
// 你发动态后、或评论/回复了 Char 之后，把「Char 之后可能会来互动」排进队列（存本地，关掉 App 不丢）。
// 到点 + App 开着时，才让 AI 决定点不点赞、评不评论；没刷到的、AI 觉得没兴趣的，就什么都不做。
function agoEn(t){var m=Math.max(0,Math.round((Date.now()-t)/60000));if(m<2)return "just now";if(m<60)return m+"m ago";var h=Math.round(m/60);if(h<48)return h+"h ago";return Math.round(h/24)+"d ago"}
function cutText(s,n){return String(s||"").replace(/\s+/g," ").trim().slice(0,n)}
function visibleTo(p,cid){if(p.vis==="Only me")return false;if(p.hide&&p.hide.indexOf(cid)>-1)return false;return true}
function feedFor(cid){
  var L=PROMPTS.limits,out=[],n=0;
  for(var i=0;i<posts.length&&n<L.feedPosts;i++){
    var p=posts[i];if(!visibleTo(p,cid))continue;n++;
    var line="#"+p.id+" "+who(p.by).name+(p.by==="me"?" (user)":p.by===cid?" (you)":"")+", "+agoEn(p.t)+": "+(cutText(p.text,L.feedCut)||"(no text)");
    if(p.rp)line+=" [reposted "+who(p.rp.by).name+": "+cutText(p.rp.text,40)+"]";
    if(p.imgs&&p.imgs.length)line+=" [+"+p.imgs.length+" photo(s) you can't see]";
    if(p.mention&&p.mention.length)line+=" [mentions "+p.mention.map(function(x){return who(x).name}).join(", ")+"]";
    if(p.likes&&p.likes.length)line+=" | liked by "+p.likes.map(function(x){return who(x).name}).join(", ");
    if(p.cmts&&p.cmts.length)line+=" | comments: "+p.cmts.slice(-L.feedCmts).map(function(c){return who(c.by).name+(c.re?" replied to "+who(c.re.by).name:"")+": "+cutText(c.text,40)}).join(" ; ");
    out.push(line);
  }
  return out;
}
function statusFor(cid){
  var r=[],su=getStatus("me"),sc=getStatus(cid);
  if(su&&su.text)r.push("User's status: "+su.text);
  if(sc&&sc.text)r.push("Your own status: "+sc.text);
  return r;
}
var INTQ=[];try{INTQ=JSON.parse(store("intq")||"[]")||[]}catch(e){}
var INT={busy:false};
function saveINTQ(){try{localStorage.setItem("intq",JSON.stringify(INTQ.slice(-60)))}catch(e){}}
function rnd(a,b){return a+Math.random()*(b-a)}
function qid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5)}
window.intOnMyPost=function(p){
  var L=PROMPTS.limits;
  contacts.forEach(function(c){
    var o=chsGet(c.id);
    if(!o.reactOn||o.blocked||!visibleTo(p,c.id))return;
    if(Math.random()>L.reactSeeChance)return; // 这位 Char 根本没刷到
    INTQ.push({id:qid(),k:"post",cid:c.id,pid:p.id,due:Date.now()+rnd(L.reactDelayMin,L.reactDelayMax)*60000});
  });
  saveINTQ();
};
window.intOnMyComment=function(p,cm){
  var L=PROMPTS.limits,tid=cm.re?cm.re.by:p.by;
  if(!tid||tid==="me"||!cget(tid))return;
  var o=chsGet(tid);if(!o.reactOn||o.blocked)return;
  if(Math.random()>L.replyChance)return;
  INTQ.push({id:qid(),k:"reply",cid:tid,pid:p.id,cmt:cm.t,due:Date.now()+rnd(L.replyDelayMin,L.replyDelayMax)*60000});
  saveINTQ();
};
function aiText(sys,ask,demoText,maxTok){
  var a=S.api;
  if((a.base||"").trim().toLowerCase()==="demo")return new Promise(function(r){setTimeout(function(){r(demoText)},500)});
  return fetch(apiUrl(a,"/chat/completions"),{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+a.key},body:JSON.stringify({model:a.model,temperature:0.9,max_tokens:maxTok||300,messages:[{role:"system",content:sys},{role:"user",content:ask}]})})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j.error&&j.error.message)||("HTTP "+r.status));return j})})
    .then(function(j){var t=j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;if(!t)throw new Error("空回复");return String(t)});
}
function intJSON(t){t=String(t||"").replace(/<think>[\s\S]*?(<\/think>|$)/gi,"");var i=t.indexOf("{"),j=t.lastIndexOf("}");if(i<0||j<i)return null;try{return JSON.parse(t.slice(i,j+1))}catch(e){return null}}
function postBlock(p){var s=cutText(p.text,200)||"(no text)";if(p.rp)s+=" [reposted "+who(p.rp.by).name+": "+cutText(p.rp.text,80)+"]";if(p.imgs&&p.imgs.length)s+=" [+"+p.imgs.length+" photo(s) you can't see]";return s}
function threadOf(p){return p.cmts.slice(-6).map(function(c){return who(c.by).name+(c.re?" replied to "+who(c.re.by).name:"")+": "+cutText(c.text,60)}).join("\n")}
function intRun(it){
  var c=cget(it.cid),p=null;posts.forEach(function(x){if(x.id===it.pid)p=x});
  if(!c||!p)return Promise.resolve(false);
  var o=chsGet(c.id);if(!o.reactOn||o.blocked)return Promise.resolve(false);
  var L=PROMPTS.limits,lang=o.charLang||"the language this character normally uses",sys="";
  try{sys=buildSystem(c,msgs(c.id).slice(-8))}catch(e){}
  if(it.k==="post"){
    if(!visibleTo(p,c.id))return Promise.resolve(false);
    return aiText(sys,PROMPTS.reactPost(nick(c),lang,who(p.by).name,postBlock(p),threadOf(p),L.reactCut),'{"like":true,"comment":"（演示）好看"}',200).then(function(t){
      var j=intJSON(t);if(!j)return false;
      var did=false;
      if(j.like&&p.likes.indexOf(c.id)<0)did=window.charLike(c.id,p.id)||did;
      var cm=autoClean(j.comment,L.reactCut);
      if(cm&&!p.cmts.some(function(x){return x.by===c.id&&!x.re}))did=window.charComment(c.id,p.id,cm)||did;
      return did;
    });
  }
  var mine=null;p.cmts.forEach(function(x){if(x.by==="me"&&x.t===it.cmt)mine=x});
  if(!mine)return Promise.resolve(false);
  return aiText(sys,PROMPTS.replyComment(nick(c),lang,postBlock(p),threadOf(p),cutText(mine.text,120),L.replyCut),"（演示）哈哈",200).then(function(t){
    if(/\[skip\]/i.test(t))return false;
    var rp=autoClean(t,L.replyCut);if(!rp)return false;
    return window.charComment(c.id,p.id,rp,"me");
  });
}
function refreshMoments(){
  if(typeof cmtId!=="undefined"&&cmtId)return; // 你正在写评论时不刷新，免得输入被清掉
  var m=$("#pgMoments");if(m&&!m.hidden)renderMoments();
  var pf=$("#pgProfile");if(pf&&!pf.hidden)renderProfile();
}
function intTick(){
  if(INT.busy||AUTO.busy||!autoApiOk())return;
  var now=Date.now(),it=null,dirty=false;
  INTQ=INTQ.filter(function(x){if(now-x.due>864e5){dirty=true;return false}return true}); // 过期一天以上的直接丢掉
  for(var i=0;i<INTQ.length;i++){if(INTQ[i].due<=now){it=INTQ[i];break}}
  if(dirty)saveINTQ();
  if(!it)return;
  INT.busy=true;
  INTQ=INTQ.filter(function(x){return x!==it});saveINTQ(); // 先出队：失败了也不重试，真人也会漏看
  intRun(it).then(function(ok){if(ok)refreshMoments()}).catch(function(){}).then(function(){INT.busy=false});
}
setInterval(intTick,15000);
document.addEventListener("visibilitychange",function(){if(!document.hidden)setTimeout(intTick,2000)});
setTimeout(intTick,7000);
