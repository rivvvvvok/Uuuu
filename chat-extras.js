/* chat-extras.js — 加号面板、位置/转账卡片、语音消息、长按菜单、翻译、引用、表情包、表情包导入 */// ---------- Chat "+" sheet ----------
function sendMedia(m){
  if(busy)return;
  if(chsGet(CUR).blocked){toast("已拉黑，取消拉黑后才能发送");return}
  var l=msgs(CUR);
  l.push(Object.assign({id:Date.now().toString(36),by:"me",t:Date.now()},m,PQ?{q:PQ}:{}));if(PQ)clearQuote();
  if(!saveChats()){l.pop();return}
  renderChat();updateSend();
}
var PLUS_ITEMS=[
  ["img","Image",I.photo],
  ["transfer","Transfer",'<svg viewBox="0 0 24 24"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg>'],
  ["loc","Location",'<svg viewBox="0 0 24 24"><path d="M12 21s-6.500-5.700-6.500-11a6.500 6.500 0 0113 0c0 5.300-6.500 11-6.500 11z"/><circle cx="12" cy="10" r="2.200"/></svg>'],
  ["stk","Stickers",SMILE],
  ["mem","Memory",BUBH],
  ["voice","Voice",'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.500 11a6.500 6.500 0 0013 0M12 17.500V21"/></svg>']
];
$("#chPlus").onclick=function(){
  openAct('<div class="plt">Send</div><div class="tiles" style="margin-top:14px">'+PLUS_ITEMS.map(function(x){return '<button class="tile" data-pl="'+x[0]+'">'+x[2]+'<span class="tx"><b>'+x[1]+'</b></span></button>'}).join("")+'</div>');
};
$("#actSheet").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  var k=b.dataset.pl;
  if(k==="img"){
    closeAct();
    var inp=document.createElement("input");inp.type="file";inp.accept="image/*";
    inp.onchange=function(){if(inp.files[0])shrink(inp.files[0],900,false,function(d){sendMedia({type:"img",img:d,text:"[Image]"})})};
    inp.click();
  }
  else if(k==="stk"){
    if(!SD.stickers.length){toast("还没有表情包，先去 Me 页的 Stickers 添加");return}
    openAct('<div class="plt">Stickers</div><div class="sgrid" style="max-height:48vh;overflow-y:auto">'+SD.stickers.map(function(x){return '<button class="stk" data-pst="'+x.id+'"><img src="'+x.img+'"><span class="stn">'+esc(stName(x))+'</span></button>'}).join("")+'</div>');
  }
  else if(b.dataset.pst){
    var st=null;SD.stickers.forEach(function(x){if(x.id===b.dataset.pst)st=x});
    closeAct();if(st)sendMedia({type:"stk",sid:st.id,name:stName(st),text:"[Sticker: "+stName(st)+"]"});
  }
  else if(k==="mem"){closeAct();MV={view:"char",cid:CUR,type:"All"};go("mem")}
  else if(k==="loc"){closeAct();openLocSheet()}
  else if(k==="transfer"){closeAct();openXferSheet()}
  else if(k==="voice")vcView("idle");
});


// ---------- Chat cards: location / transfer ----------
function bubbleCls(m){return m.type==="img"?" img":m.type==="stk"?" stk":m.type==="loc"?" loc":(m.type==="transfer"||m.type==="xack")?" xfer":m.type==="voice"?" voice":""}
function bubbleHTML(m){
  if(m.type==="img"&&m.img)return '<img src="'+m.img+'">';
  if(m.type==="stk"){var ssrc=stSrc(m);if(ssrc)return '<img src="'+ssrc+'">'}
  if(m.type==="voice")return voiceBubble(m);
  if(m.type==="loc")return '<div class="locc">'+mapSVG(m.addr||m.place)+'<div class="loci"><b>'+esc(m.place||m.addr)+'</b>'+(m.place&&m.addr?'<small>'+esc(m.addr)+'</small>':'')+'</div></div>';
  if(false)return '<div class="lr"><svg viewBox="0 0 24 24"><path d="M12 21s-6.500-5.700-6.500-11a6.500 6.500 0 0113 0c0 5.300-6.500 11-6.500 11z"/><circle cx="12" cy="10" r="2.200"/></svg><div><b>'+esc(m.place||m.addr)+'</b>'+(m.place&&m.addr?'<small>'+esc(m.addr)+'</small>':'')+'</div></div>';
  if(m.type==="xack"){
    var okI='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.500l2.700 2.700L16 9.500"/></svg>',bkI='<svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/></svg>';
    return '<div class="tfc ack'+(m.ok?'':' rt')+'"><div class="tfh">'+(m.ok?okI:bkI)+'<span>'+(m.ok?"Transfer received":"Transfer returned")+'</span></div><div class="tfa">'+money(m.amount)+'</div>'+(m.note?'<div class="tfn">'+esc(m.note)+'</div>':'')+'</div>';
  }
  if(m.type==="transfer"){
    var cc=cget(CUR),xn=cc?nick(cc):"Char",xs=m.st==="received"?"✓ Received by "+xn:m.st==="returned"?"Returned · refunded to your wallet":"Waiting for "+xn+" to accept";
    return '<div class="tfc'+(m.st==="returned"?' rt':'')+'"><div class="tfh">'+WALI+'<span>Transfer</span></div><div class="tfa">'+money(m.amount)+'</div>'+(m.note?'<div class="tfn">'+esc(m.note)+'</div>':'')+'<div class="tfs">'+esc(xs)+'</div></div>';
  }
  return esc(m.text);
}
function openLocSheet(){
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="shCancel">Cancel</button><span class="ttl">Location</span><button class="go" id="lcSend">Send</button></div>'+
    '<div class="card" style="margin-top:16px"><div class="fl"><label>Place name (optional)</label><input id="lcPlace" maxlength="40" placeholder="例如 家、咖啡店"></div><div class="fl"><label>Region / address</label><input id="lcAddr" maxlength="80" placeholder="例如 京都市左京区"></div></div>';
  $("#sheetWrap").hidden=false;
  setTimeout(function(){var i=$("#lcAddr");if(i)i.focus()},60);
}
function openXferSheet(){
  var c=cget(CUR);
  $("#sheet").innerHTML='<div class="grab"></div><div class="plt">Transfer to '+esc(nick(c))+'</div><div class="amt"><span>£</span><input id="xfAmt" inputmode="decimal" placeholder="0" autocomplete="off"></div><div class="amtb">Balance '+money(W.bal)+'</div>'+
    '<div class="card"><div class="fl"><label>Note</label><input id="xfNote" maxlength="40" placeholder="Add a note"></div></div><button class="pillbtn" id="xfSend" style="margin-top:14px">Send</button>';
  $("#sheetWrap").hidden=false;
  setTimeout(function(){var i=$("#xfAmt");if(i)i.focus()},80);
}
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.id==="lcSend"){
    var pl=$("#lcPlace").value.trim(),ad=$("#lcAddr").value.trim();
    if(!ad&&!pl){toast("先填写地区或地址");return}
    closeSheet();sendMedia({type:"loc",place:pl,addr:ad,text:"[Location] "+(pl?pl+(ad?", ":""):"")+ad});
  }
  else if(t.id==="xfSend"){
    var amt=Math.round(parseFloat($("#xfAmt").value)*100)/100,note=$("#xfNote").value.trim();
    if(!(amt>0)){toast("请输入有效金额");return}
    if(amt>W.bal){toast("余额不足");return}
    if(busy||chsGet(CUR).blocked){toast(busy?"Char 正在回复，稍等一下":"已拉黑，取消拉黑后才能发送");return}
    if(!walletAdd("gift_out",CUR,amt,note||"Transfer")){toast("转账失败，请检查金额");return}
    closeSheet();sendMedia({type:"transfer",amount:amt,note:note,text:"[Transfer] "+money(amt)+(note?" - "+note:"")});
  }
});

function mapSVG(seed){
  var h=0,t=String(seed||"");for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;h=Math.abs(h);
  var a=20+h%50,b=120+(h>>3)%60,c=22+(h>>5)%40,d=58+(h>>7)%26;
  return '<svg viewBox="0 0 220 110" preserveAspectRatio="xMidYMid slice" style="display:block;width:100%;height:110px;background:var(--fill)"><path d="M0 '+(82-h%12)+' Q60 '+(58+h%20)+' 120 84 T220 70" fill="none" stroke="var(--av)" stroke-width="10" opacity=".55"/><rect x="'+(a+34)+'" y="'+(c+14)+'" width="40" height="22" rx="7" fill="var(--av)" opacity=".4"/><g fill="none" stroke="var(--bg)" stroke-linecap="round"><path d="M-10 '+c+' L230 '+(c+22)+'" stroke-width="7"/><path d="M-10 '+(d+30)+' L230 '+(d+10)+'" stroke-width="5"/><path d="M'+a+' -10 L'+(a+18)+' 120" stroke-width="7"/><path d="M'+b+' -10 L'+(b-20)+' 120" stroke-width="5"/></g><g transform="translate(110 42)"><path d="M0 24C-10 12-14 6-14-1a14 14 0 0128 0c0 7-4 13-14 25z" fill="var(--text)"/><circle cx="0" cy="-1" r="5" fill="var(--bg)"/></g></svg>';
}
function applyChatBg(){
  var pg=$("#pgChat"),o=chsGet(CUR);
  pg.style.backgroundImage=o.chBg?'url("'+o.chBg+'")':"";
  pg.style.backgroundSize="cover";pg.style.backgroundPosition="center";
}

function fitChatTop(){var h=$("#chHead"),sc=$("#chScroll");if(h&&sc&&h.offsetHeight)sc.style.paddingTop=(h.offsetHeight+14)+"px"}
(function(){var _rc=renderChat;renderChat=function(k){var r=_rc(k);fitChatTop();return r}})();
window.addEventListener("resize",fitChatTop);

function heroCard(o){
  return '<div class="banner'+(o.bg?' img onimg':'')+'" style="margin-top:6px'+(o.bg?';background-image:url('+o.bg+')':'')+'"><div class="hero" style="padding-top:'+(o.st?'92px':'30px')+'">'+
    (o.back?'<button class="circle heroBack" id="pfBack" aria-label="返回">'+BACK+'</button>':'')+
    '<div class="pfwrap hv">'+o.st+'<div class="pfav hv">'+o.av+'</div></div>'+
    '<div class="hname"><span>'+o.name+'</span>'+BADGE+'</div>'+
    (o.handle?'<div class="hid">'+esc(o.handle)+'</div>':'')+
    (o.sig?'<div class="hsig">'+esc(o.sig)+'</div>':'')+
    (o.btn?'<button class="heroBtn" '+o.btn+'>'+I.edit+'<span>'+o.label+'</span></button>':'')+'</div></div>';
}

$("#pgProfile").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b||b.id!=="pfMore")return;
  openAct('<div class="plt">Options</div><button class="pillbtn" data-pf="edit" style="margin-top:14px">Edit Info</button>');
});
$("#actSheet").addEventListener("click",function(e){
  var b=e.target.closest("button");if(b&&b.dataset.pf==="edit"){closeAct();openForm(PVid)}
});

// ---------- Voice message ----------
var VC={rec:null,tm:null,t0:0,url:"",dur:0,tok:0},VA=null,VAbtn=null;
var MICSVG='<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.500 11a6.500 6.500 0 0013 0M12 17.500V21"/></svg>';
var PLAYSVG='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',PAUSESVG='<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
function fmtDur(n){n=Math.max(0,Math.round(n||0));return Math.floor(n/60)+":"+("0"+(n%60)).slice(-2)}
function barsHTML(seed){
  var h=0,t=String(seed||"x");for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;h=Math.abs(h);
  var o="";for(var k=0;k<14;k++){o+='<i style="height:'+(6+((h>>((k*2)%24))&15)*1.1)+'px"></i>'}
  return o;
}
function vtShow(m){var o=chsGet(CUR);return m.vt!==undefined?!!m.vt:(m.by==="me"?!!o.vtMe:!!o.vtChar)}
function voiceBubble(m){
  var tx=String(m.text||"").replace(/^\[Voice( message)?\]\s*/,""),show=vtShow(m);
  return '<div class="vrow"><button class="vbtn" data-vp="'+m.id+'" aria-label="播放">'+PLAYSVG+'</button><span class="vbars">'+barsHTML(m.id)+'</span><span class="vdur">'+fmtDur(m.dur)+'</span>'+(tx?'<button class="vtg'+(show?' on':'')+'" data-vt="'+m.id+'" aria-label="显示或隐藏文字">Aa</button>':'')+'</div>'+(tx&&show?'<div class="vtx">'+esc(tx)+'</div>':'');
}
function playVoice(src,btn){
  if(VA&&VAbtn===btn){VA.pause();VA=null;btn.innerHTML=PLAYSVG;VAbtn=null;return}
  if(VA){VA.pause();if(VAbtn)VAbtn.innerHTML=PLAYSVG}
  VA=new Audio(src);VAbtn=btn;btn.innerHTML=PAUSESVG;
  var a=VA;a.onended=function(){if(VA===a){btn.innerHTML=PLAYSVG;VA=null;VAbtn=null}};
  a.play().catch(function(){toast("无法播放这段语音");btn.innerHTML=PLAYSVG;VA=null;VAbtn=null});
}
// 点聊天里的播放键：先拦下来，不触发气泡菜单
$("#chScroll").addEventListener("click",function(e){
  var tg=e.target.closest("[data-vt]");
  if(tg){
    e.stopPropagation();
    var tm=null;msgs(CUR).forEach(function(x){if(x.id===tg.dataset.vt)tm=x});
    if(tm){tm.vopen=!tm.vopen;saveChats();renderChat(true)}
    return;
  }
  var t=e.target.closest("[data-vt]");
  if(t){
    e.stopPropagation();
    var vm=null;msgs(CUR).forEach(function(x){if(x.id===t.dataset.vt)vm=x});
    if(vm){vm.vt=!vtShow(vm);saveChats();renderChat(true)}
    return;
  }
  var b=e.target.closest("[data-vp]");if(!b)return;
  e.stopPropagation();
  var id=b.dataset.vp,m=null;msgs(CUR).forEach(function(x){if(x.id===id)m=x});
  if(m&&m.audio)playVoice(m.audio,b);
},true);
function vcAbort(){
  VC.tok++;
  if(VC.tm){clearInterval(VC.tm);VC.tm=null}
  if(VC.rec){var r=VC.rec;VC.rec=null;r.stop().catch(function(){})}
  if(VA){VA.pause();VA=null;VAbtn=null}
}
new MutationObserver(function(){if($("#actWrap").hidden)vcAbort()}).observe($("#actWrap"),{attributes:true,attributeFilter:["hidden"]});
function vcView(st,info){
  var h;
  if(st==="idle")h='<div class="plt">Voice message</div><button class="vcBig" id="vcRec" aria-label="开始录音">'+MICSVG+'</button><div class="vcHint">点一下开始录音，最长 60 秒。录完会自动转成文字，你发出后也可以点开重听</div>';
  else if(st==="rec")h='<div class="plt">Recording…</div><button class="vcBig rec" id="vcStop" aria-label="停止录音">'+MICSVG+'</button><div class="vcTime" id="vcTime">0:00</div><div class="vcHint">再点一下结束</div>';
  else if(st==="proc")h='<div class="plt">Transcribing…</div><div class="vcBig" style="opacity:.5">'+MICSVG+'</div><div class="vcHint">正在把语音转成文字</div>';
  else h='<div class="plt">Voice message</div><div class="vcPrev"><button class="vbtn" id="vcPrev" aria-label="试听">'+PLAYSVG+'</button><span class="vbars">'+barsHTML(VC.dur+"p")+'</span><span class="vdur">'+fmtDur(VC.dur)+'</span></div>'+
    '<div class="card" style="margin-top:12px"><label>Transcript</label><textarea class="tall" id="vcText" maxlength="500" placeholder="没有识别到文字，可以手动填写，也可以留空直接发送">'+esc(info.text)+'</textarea></div>'+
    (info.err?'<div class="vcHint" style="text-align:left;margin:8px 4px 0">语音识别失败：'+esc(info.err)+'</div>':'')+
    '<button class="pillbtn" id="vcSend" style="margin-top:14px">Send</button><button class="pillbtn" id="vcRetake" style="margin-top:8px">Record again</button>';
  openAct(h);
}
function vcStart(){
  window.startRecording().then(function(r){
    VC.rec=r;VC.t0=Date.now();vcView("rec");
    VC.tm=setInterval(function(){
      var sec=(Date.now()-VC.t0)/1000,el=$("#vcTime");if(el)el.textContent=fmtDur(sec);
      if(sec>=60)vcStop();
    },250);
  }).catch(function(e){toast("无法使用麦克风："+String(e.message||e).slice(0,50))});
}
function vcStop(){
  if(!VC.rec)return;
  var r=VC.rec;VC.rec=null;clearInterval(VC.tm);VC.tm=null;
  VC.dur=Math.max(1,Math.round((Date.now()-VC.t0)/1000));
  var my=++VC.tok;vcView("proc");
  r.stop().then(function(blob){
    if(my!==VC.tok)return;
    if(Date.now()-VC.t0<900||!blob.size){toast("说话时间太短");vcView("idle");return}
    var rd=new Promise(function(res,rej){var f=new FileReader();f.onload=function(){res(f.result)};f.onerror=function(){rej(new Error("读取录音失败"))};f.readAsDataURL(blob)});
    var tr=window.transcribeAudio(blob).then(function(t){return{text:String(t||"").trim()}}).catch(function(e){return{text:"",err:String(e.message||e).slice(0,100)}});
    return Promise.all([rd,tr]).then(function(a){
      if(my!==VC.tok)return;
      VC.url=a[0];vcView("review",a[1]);
    });
  }).catch(function(e){if(my===VC.tok){toast("录音失败："+String(e.message||e).slice(0,50));vcView("idle")}});
}
$("#actSheet").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="vcRec")vcStart();
  else if(b.id==="vcStop")vcStop();
  else if(b.id==="vcRetake"){if(VA){VA.pause();VA=null;VAbtn=null}vcView("idle")}
  else if(b.id==="vcPrev"){playVoice(VC.url,b)}
  else if(b.id==="vcSend"){
    var tx=($("#vcText").value||"").trim(),url=VC.url,dur=VC.dur;
    if(VA){VA.pause();VA=null;VAbtn=null}
    closeAct();
    sendMedia({type:"voice",audio:url,dur:dur,text:tx?"[Voice] "+tx:"[Voice message]"});
  }
});


// ---------- Long-press menu, reactions, multi-select ----------
var SEL={on:false,ids:{}};
var HEARTPATH='M12 20.500C6 16.500 3.500 13 3.500 9.500A4.500 4.500 0 0112 7.200 4.500 4.500 0 0120.500 9.500C20.500 13 18 16.500 12 20.500z';
var TB=[
  ["heart",'<svg viewBox="0 0 24 24" style="fill:#8e8e93;stroke:none"><path d="'+HEARTPATH+'"/></svg>'],
  ["broken",'<svg viewBox="0 0 24 24" style="fill:var(--text);stroke:none"><path d="'+HEARTPATH+'"/><path d="M12.600 7.400l-2.300 3.600 2.800 1.900-2.600 4.100" style="fill:none;stroke:var(--fill);stroke-width:1.700;stroke-linecap:round;stroke-linejoin:round"/></svg>'],
  ["angry",'<svg viewBox="0 0 24 24" style="fill:none;stroke:#e5484d;stroke-width:2.200;stroke-linecap:round"><path d="M5 9.500C8 9.500 9.500 8 9.500 5M19 9.500C16 9.500 14.500 8 14.500 5M5 14.500C8 14.500 9.500 16 9.500 19M19 14.500C16 14.500 14.500 16 14.500 19"/></svg>'],
  ["drop",'<svg viewBox="0 0 24 24" style="stroke:none"><path d="M12 3.200C12 3.200 5.500 10 5.500 14.500a6.500 6.500 0 0013 0C18.500 10 12 3.200 12 3.200z" style="fill:#8fa8c4"/><path d="M9 14.800a3.200 3.200 0 002.600 3.100" style="fill:none;stroke:#fff;stroke-opacity:.75;stroke-width:1.600;stroke-linecap:round"/></svg>']
];
function tbBadge(m){var x=null;TB.forEach(function(t){if(t[0]===(m.tb==="dots"?"drop":m.tb))x=t});return x?'<span class="tbb">'+x[1]+'</span>':''}
function openMsgMenu(i){
  var l=msgs(CUR),m=l[i];if(!m)return;act.i=i;
  var ai=m.by==="ai",plain=!m.type,tail=true;
  for(var k=i;k<l.length;k++)if(l[k].by!=="ai")tail=false;
  var tbs=ai?'<div class="tbs">'+TB.map(function(x){return '<button data-tb="'+x[0]+'" class="'+(m.tb===x[0]?'on':'')+'" aria-label="贴纸">'+x[1]+'</button>'}).join("")+'</div>':'';
  openAct(tbs+
    (ai&&plain?'<button class="pillbtn" data-a="savetext">Favorite</button>':'')+
    (plain?'<button class="pillbtn" data-a="edit">Edit</button><button class="pillbtn" data-a="copy">Copy</button>':'')+
    (ai&&tail&&!busy?'<button class="pillbtn" data-a="regen">Reroll</button>':'')+
    '<button class="pillbtn" data-a="del">Delete</button><button class="pillbtn" data-sel="1">Select</button>');
}
(function(){
  var sc=$("#chScroll"),timer=null,sx=0,sy=0,fired=false;
  function cancel(){if(timer){clearTimeout(timer);timer=null}}
  sc.addEventListener("pointerdown",function(e){
    var b=e.target.closest(".b");if(!b||b.classList.contains("typing")||SEL.on)return;
    fired=false;sx=e.clientX;sy=e.clientY;
    timer=setTimeout(function(){timer=null;fired=true;try{if(navigator.vibrate)navigator.vibrate(12)}catch(x){}openMsgMenu(+b.dataset.i)},450);
  });
  sc.addEventListener("pointermove",function(e){if(timer&&(Math.abs(e.clientX-sx)>10||Math.abs(e.clientY-sy)>10))cancel()});
  ["pointerup","pointercancel","pointerleave"].forEach(function(ev){sc.addEventListener(ev,cancel)});
  sc.addEventListener("contextmenu",function(e){if(e.target.closest(".b"))e.preventDefault()});
  sc.addEventListener("click",function(e){if(fired){fired=false;e.stopPropagation();e.preventDefault()}},true);
})();
(function(){
  var cs=document.createElement("div");cs.id="chSel";cs.className="chSel";cs.hidden=true;
  cs.innerHTML='<button id="selCancel">Cancel</button><span id="selN">0 selected</span><button id="selDel">Delete</button>';
  $("#pgChat").appendChild(cs);
})();
function selUI(){
  var n=Object.keys(SEL.ids).length,bar=document.querySelector("#pgChat .chBar");
  $("#chSel").hidden=!SEL.on;if(bar)bar.hidden=SEL.on;
  $("#selN").textContent=n+" selected";$("#selDel").disabled=!n;
  var d=$("#selDel");d.textContent="Delete";delete d.dataset.arm;
}
function exitSel(){SEL.on=false;SEL.ids={};selUI();renderChat(true)}
$("#chSel").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="selCancel")exitSel();
  else if(b.id==="selDel"){
    if(!b.dataset.arm){b.dataset.arm="1";b.textContent="Tap again to delete";return}
    chats[CUR]=msgs(CUR).filter(function(m){return !SEL.ids[m.id]});
    saveChats();SEL.on=false;SEL.ids={};selUI();renderChat(true);updateSend();toast("已删除");
  }
});
$("#actSheet").addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  var m=msgs(CUR)[act.i];
  if(b.dataset.tb&&m){m.tb=(m.tb===b.dataset.tb)?undefined:b.dataset.tb;if(!m.tb)delete m.tb;saveChats();closeAct();renderChat(true)}
  else if(b.dataset.sel&&m){closeAct();SEL.on=true;SEL.ids={};SEL.ids[m.id]=1;selUI();renderChat(true)}
});
(function(){var _oc=openChat;openChat=function(id){SEL.on=false;SEL.ids={};_oc(id);selUI()}})();

// ---------- 翻译：点一下 Char 的气泡，在下面弹出翻译 ----------
var PTR={},RB={};
function trVisible(m){var o=chsGet(CUR);return m.trShow!==undefined?m.trShow:(!!o.trOpen&&!!m.tr)}
function trBlock(m){if(!trVisible(m))return"";return'<div class="trb">'+(m.tr?esc(m.tr):(m.trErr?"翻译失败，点气泡重试":"翻译中…"))+'</div>'}
function callTranslate(text,lang){
  var a=S.api;
  if((a.base||"").trim().toLowerCase()==="demo")return new Promise(function(r){setTimeout(function(){r("（演示翻译）"+text)},500)});
  if(!a.base||!a.key||!a.model)return Promise.reject(new Error("请先在 Settings 里填写 Chat API"));
  var body={model:a.model,messages:[{role:"system",content:"Translate the user's message into "+lang+". Output only the translation, with no explanations or quotation marks."},{role:"user",content:text}],temperature:0.2,max_tokens:600};
  return fetch(apiUrl(a,"/chat/completions"),{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+a.key},body:JSON.stringify(body)})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j.error&&j.error.message)||("HTTP "+r.status));return j})})
    .then(function(j){var t=j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;if(!t)throw new Error("接口没有返回内容");return String(t).replace(/<think>[\s\S]*?(<\/think>|$)/gi,"").trim()});
}
function doTr(id,m){
  if(m.tr||m.trBusy)return;
  m.trBusy=true;delete m.trErr;
  callTranslate(m.text,chsGet(id).trLang||"中文").then(function(t){m.tr=t}).catch(function(e){m.trErr=1;toast(String(e.message||e).slice(0,80),3500)})
    .then(function(){delete m.trBusy;saveChats();if(CUR===id&&!$("#pgChat").hidden)renderChat(true)});
}
function autoTr(id,m){m.trShow=true;doTr(id,m)}
$("#chScroll").addEventListener("click",function(e){
  if(SEL.on||e.target.closest("[data-vt]"))return;
  var b=e.target.closest(".b.o");if(!b||b.classList.contains("typing"))return;
  var m=msgs(CUR)[+b.dataset.i];if(!m||m.type)return;
  var show=!trVisible(m);m.trShow=show;saveChats();
  if(show&&!m.tr){m.trErr&&delete m.trErr;renderChat(true);doTr(CUR,m)}else renderChat(true);
});


// ---------- v3: quote / reply, sticker sending, sticker import ----------
var PQ=null;
(function(){
  var q=document.createElement("div");q.id="chQ";q.className="chQ";q.hidden=true;
  q.innerHTML='<div class="qb"><b id="chQn"></b><span id="chQt"></span></div><button id="chQx" aria-label="取消引用">×</button>';
  $("#pgChat").appendChild(q);
  q.addEventListener("click",function(e){if(e.target.closest("#chQx"))clearQuote()});
})();
function stName(x,i){if(x.name)return x.name;var k=(i!==undefined)?i:SD.stickers.indexOf(x);return "sticker "+(k+1)}
function stSrc(m){if(m.sid){var r="";SD.stickers.forEach(function(x){if(x.id===m.sid)r=x.img});if(r)return r}return m.img||""}
function qWho(q){if(q.by==="me")return P.name;var c=cget(CUR);return c?nick(c):"Char"}
function qpack(m){return{id:m.id,by:m.by,text:String(m.text||"").replace(/\s+/g," ").trim().slice(0,80)}}
function qtx(m){return(m.q&&m.by==="me"?'[Replying to '+qWho(m.q)+': "'+m.q.text+'"] ':'')+m.text}
function qHTML(m){
  if(!m.q||(m.type&&m.type!=="voice"))return '';
  return '<div class="qt" data-qid="'+m.q.id+'"><b>'+esc(qWho(m.q))+'</b><span>'+esc(m.q.text)+'</span></div>';
}
function startQuote(i){
  var m=msgs(CUR)[i];if(!m||SEL.on)return;
  PQ=qpack(m);
  var Q=$("#chQ"),bar=document.querySelector("#pgChat .chBar");
  $("#chQn").textContent="Replying to "+qWho(PQ);$("#chQt").textContent=PQ.text;
  Q.style.bottom=(bar?bar.offsetHeight:60)+"px";Q.hidden=false;
  try{if(navigator.vibrate)navigator.vibrate(10)}catch(e){}
  $("#chIn").focus();
}
function clearQuote(){PQ=null;var Q=$("#chQ");if(Q)Q.hidden=true}
(function(){var _oc=openChat;openChat=function(id){clearQuote();_oc(id)}})();
function aiMsg(id,raw,i){
  var nm={id:Date.now().toString(36)+i,by:"ai",text:raw,t:Date.now()};
  if(chsGet(id).blocked)nm.blk=true;
  var qm=raw.match(/^\[quote:\s*([^\]]{1,60})\]\s*/i);
  if(qm){
    var key=qm[1].trim().toLowerCase(),l=msgs(id),rest=raw.slice(qm[0].length).trim();
    for(var k=l.length-1;k>=0;k--){var x=l[k];if(x.by==="me"&&!x.type&&x.text&&x.text.toLowerCase().indexOf(key)>-1){nm.q=qpack(x);break}}
    if(rest){raw=rest;nm.text=rest}
  }
  var sm=raw.match(/^\[sticker:\s*([^\]]{1,40})\]$/i);
  if(sm){
    var nk=sm[1].trim().toLowerCase(),f=null;
    SD.stickers.forEach(function(x,ix){if(!f&&stName(x,ix).toLowerCase()===nk)f=x});
    if(!f)SD.stickers.forEach(function(x,ix){if(!f&&stName(x,ix).toLowerCase().indexOf(nk)>-1)f=x});
    if(f){nm.type="stk";nm.sid=f.id;nm.name=stName(f);nm.text="[Sticker: "+nm.name+"]"}
  }
  return nm;
}
// swipe left on a bubble to quote it
(function(){
  var sc=$("#chScroll"),el=null,sx=0,sy=0,dx=0,on=false;
  function release(){
    if(!el)return;
    var go=on&&dx<=-56,i=+el.dataset.i;
    el.style.transition="transform .2s";el.style.transform="";
    var e2=el;setTimeout(function(){e2.style.transition=""},220);
    el=null;on=false;dx=0;
    if(go)startQuote(i);
  }
  sc.addEventListener("pointerdown",function(e){
    if(SEL.on)return;
    var b=e.target.closest(".b");if(!b||b.classList.contains("typing"))return;
    el=b;sx=e.clientX;sy=e.clientY;dx=0;on=true;
  });
  sc.addEventListener("pointermove",function(e){
    if(!on||!el)return;
    var mx=e.clientX-sx,my=e.clientY-sy;
    if(dx===0&&Math.abs(my)>Math.abs(mx)+6){on=false;return}
    if(mx<0){dx=Math.max(mx,-80);el.style.transition="none";el.style.transform="translateX("+dx+"px)"}
  });
  ["pointerup","pointercancel"].forEach(function(ev){sc.addEventListener(ev,release)});
})();
// tap a quote to jump to the original message
$("#chScroll").addEventListener("click",function(e){
  var q=e.target.closest(".qt");if(!q)return;
  e.stopPropagation();
  var l=msgs(CUR),ix=-1;l.forEach(function(x,k){if(x.id===q.dataset.qid)ix=k});
  var el=ix>-1?$('#chScroll .b[data-i="'+ix+'"]'):null;
  if(el){el.scrollIntoView({block:"center",behavior:"smooth"});el.classList.add("flash");setTimeout(function(){el.classList.remove("flash")},1000)}
  else toast("原消息已被删除");
},true);
// sticker import (jpg / png / gif keeps animation)
function readSticker(f,cb){
  var nm=(f.name||"sticker").replace(/\.[^.]+$/,"").slice(0,20)||"sticker";
  if(f.type==="image/gif"){
    if(f.size>1024*1024){toast("这张 GIF 超过 1MB，太大了："+nm);cb(null);return}
    var rd=new FileReader();rd.onload=function(){cb({img:rd.result,name:nm})};rd.onerror=function(){cb(null)};rd.readAsDataURL(f);return;
  }
  shrink(f,320,false,function(d){cb(d?{img:d,name:nm}:null)});
}
function stRows(){
  var arr=SC.imgs,show=arr.length>80?arr.slice(0,12):arr;
  return show.map(function(x,i){return '<div class="strow"><img src="'+x.img+'" loading="lazy"><input data-sn="'+i+'" maxlength="20" value="'+esc(x.name)+'" placeholder="名称"></div>'}).join("")+(arr.length>80?'<div class="vcHint" style="margin:10px 0 0">共 '+arr.length+' 张，只预览前 12 张，导入时会全部加入</div>':'')
}
$("#sheet").addEventListener("input",function(e){
  var n=e.target.dataset.sn;if(n===undefined)return;
  if(SC.imgs&&SC.imgs[+n])SC.imgs[+n].name=e.target.value.trim()||"sticker";
});


// ---------- Sticker pack import ----------
function unzipEntry(buf,wanted){
  var dv=new DataView(buf),u8=new Uint8Array(buf),n=u8.length,eocd=-1;
  for(var i=n-22;i>=Math.max(0,n-65557);i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break}}
  if(eocd<0)return Promise.reject(new Error("不是有效的 docx 文件"));
  var cnt=dv.getUint16(eocd+10,true),off=dv.getUint32(eocd+16,true);
  for(var k=0;k<cnt;k++){
    if(dv.getUint32(off,true)!==0x02014b50)break;
    var method=dv.getUint16(off+10,true),csz=dv.getUint32(off+20,true),nl=dv.getUint16(off+28,true),el=dv.getUint16(off+30,true),cl=dv.getUint16(off+32,true),lho=dv.getUint32(off+42,true);
    var name=new TextDecoder().decode(u8.subarray(off+46,off+46+nl));
    if(name===wanted){
      var lnl=dv.getUint16(lho+26,true),lel=dv.getUint16(lho+28,true),ds=lho+30+lnl+lel,data=u8.subarray(ds,ds+csz);
      if(method===0)return Promise.resolve(data);
      if(method===8){
        if(typeof DecompressionStream==="undefined")return Promise.reject(new Error("这个浏览器不支持解压，请先把文档里的文字另存成 txt 再导入"));
        var st=new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        return new Response(st).arrayBuffer().then(function(b){return new Uint8Array(b)});
      }
      return Promise.reject(new Error("不支持的压缩方式"));
    }
    off+=46+nl+el+cl;
  }
  return Promise.reject(new Error("文件里没找到正文"));
}
function docxText(f){
  return f.arrayBuffer().then(function(buf){return unzipEntry(buf,"word/document.xml")}).then(function(u8){
    var x=new TextDecoder().decode(u8);
    return x.replace(/<\/w:p>/g,"\n").replace(/<w:br[^>]*\/>/g,"\n").replace(/<[^>]+>/g,"")
      .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&");
  });
}
function parsePack(text){
  var out=[],used={};
  SD.stickers.forEach(function(x,i){used[stName(x,i).toLowerCase()]=1});
  text.split(/\r?\n/).forEach(function(line){
    line=line.trim();if(!line)return;
    var m=line.match(/^(.+?)\s*[:：]\s*(https?:\/\/\S+)$/)||line.match(/^(.+?)\s+(https?:\/\/\S+)$/),name,url;
    if(m){name=m[1].trim();url=m[2]}
    else if(/^https?:\/\/\S+$/.test(line)){url=line;name="sticker"}
    else return;
    name=(name||"sticker").slice(0,20);
    var base=name,n=2;while(used[name.toLowerCase()]){name=base.slice(0,17)+" "+n;n++}
    used[name.toLowerCase()]=1;
    out.push({img:url,name:name});
  });
  return out;
}
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t||!t.dataset.simp)return;
  var inp=document.createElement("input");inp.type="file";inp.accept=".docx,.txt,.md,.csv,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  inp.onchange=function(){
    var f=inp.files[0];if(!f)return;
    var job=/\.docx$/i.test(f.name)?docxText(f):f.text();
    job.then(function(txt){
      var items=parsePack(txt);
      if(!items.length){toast("没有找到「名称:图片链接」这样的行");return}
      var seen={};SC.imgs.forEach(function(x){seen[x.name.toLowerCase()]=1});
      items.forEach(function(x){var b=x.name,n=2;while(seen[x.name.toLowerCase()]){x.name=b.slice(0,17)+" "+n;n++}seen[x.name.toLowerCase()]=1});
      SC.imgs=SC.imgs.concat(items);
      var th=$("#svThumbs");if(th)th.innerHTML=stRows();
      var nt=$("#svNote");if(nt)nt.textContent="已选择 "+SC.imgs.length+" 张";
      toast("读取到 "+items.length+" 张，点 Add 导入");
    }).catch(function(err){toast("读取失败："+String(err.message||err).slice(0,60))});
  };
  inp.click();
});



// 拉黑期间收到的消息：点黑色感叹号看说明
var BLKX='<i class="blkx"><svg viewBox="0 0 24 24"><path d="M12 6v8"/><path d="M12 18.500v.1"/></svg></i>';
$("#chScroll").addEventListener("click",function(e){
  if(e.target.closest(".blkx")){e.stopPropagation();toast("你已拉黑对方，这条消息是在拉黑期间收到的",3200)}
},true);
