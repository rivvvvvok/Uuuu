/* spaces.js — 情侣空间、收藏页、钱包、角色主页、限时状态 */// ---------- Couple Space ----------
var CP={days:903,setAt:"",pname:"Ta",pav:"",partner:"",dates:[],cdates:{},cdays:{},dm:0,cbg:{},diary:[],cdiary:{}};
try{var rcp=store("couple");if(rcp)Object.assign(CP,JSON.parse(rcp))}catch(e){}
function ymd(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
if(!CP.setAt){CP.setAt=ymd(new Date());try{localStorage.setItem("couple",JSON.stringify(CP))}catch(e){}}
function saveCP(){try{localStorage.setItem("couple",JSON.stringify(CP));return true}catch(e){toast("存储空间不足，图片可能太大");return false}}
function today0(){var n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())}
function dstart(x){var a=x.split("-");return new Date(+a[0],+a[1]-1,+a[2])}
// 在一起的天数：每位 Char 各一份 CP.cdays[角色id]，该 Char 也能读到（旧版全局天数会迁移给第一次选的 Char）
function pdays(){
  if(!CP.cdays)CP.cdays={};var k=CP.partner||"_";
  if(!CP.dm&&CP.partner){CP.dm=1;if(!CP.cdays[k])CP.cdays[k]={days:CP.days,setAt:CP.setAt}}
  if(!CP.cdays[k])CP.cdays[k]={days:903,setAt:ymd(new Date())};
  return CP.cdays[k];
}
function togetherDays(){var e=pdays();return Math.max(0,e.days+Math.round((today0()-dstart(e.setAt))/864e5))}
window.getCouple=function(charId){var k=charId||"_",c=CP.cdays&&CP.cdays[k],n=c?Math.max(0,c.days+Math.round((today0()-dstart(c.setAt))/864e5)):null;return{days:n,dates:(CP.cdates&&CP.cdates[k])||[],diaries:window.getDiaries(charId)}};
function untilNext(x){var a=x.split("-"),t=today0(),n=new Date(t.getFullYear(),+a[1]-1,+a[2]);if(n<t)n=new Date(t.getFullYear()+1,+a[1]-1,+a[2]);return Math.round((n-t)/864e5)}
var MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var MONF=["January","February","March","April","May","June","July","August","September","October","November","December"];
function mdLabel(x){var a=x.split("-");return MON[+a[1]-1]+" "+(+a[2])}
var CAKE='<svg viewBox="0 0 24 24"><path d="M4 20h16M5 20v-6a2 2 0 012-2h10a2 2 0 012 2v6M8 12V9.500M12 12V8.500M16 12V9.500"/><path d="M8 6.500v.01M12 5.500v.01M16 6.500v.01"/></svg>';
var CAL='<svg viewBox="0 0 24 24"><rect x="3.500" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.500 10h17"/></svg>';
var SMILE='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.500 14.500a4.500 4.500 0 007 0"/><path d="M9 10v.01M15 10v.01"/></svg>';
var HEARTF='<svg viewBox="0 0 24 24"><path d="M12 20.500C6 16.500 3.500 13 3.500 9.500A4.500 4.500 0 0112 7.200 4.500 4.500 0 0120.500 9.500C20.500 13 18 16.500 12 20.500z"/></svg>';
var CPV="pick",cpArm=null,CM=null,CS={};
// 日记数据：CP.diary = 我的日记（只有一份，所有 Char 都能读到）；CP.cdiary[角色id] = 该 Char 自己的日记（只有我和该 Char 可见）
function charDiary(id){if(!CP.cdiary)CP.cdiary={};if(!CP.cdiary[id])CP.cdiary[id]=[];return CP.cdiary[id]}
window.getDiaries=function(charId){return{mine:CP.diary,char:charId?charDiary(charId):[]}};
// 生日/纪念日：每位 Char 各存一份 CP.cdates[角色id]（旧版全局 CP.dates 会在选人时迁移给当时选的 Char）
function pdates(){if(!CP.cdates)CP.cdates={};var k=CP.partner||"_";if(!CP.cdates[k])CP.cdates[k]=[];return CP.cdates[k]}
function migrateDates(){if(CP.dates&&CP.dates.length&&CP.partner){var a=pdates();CP.dates.forEach(function(d){a.push(d)});CP.dates=[];saveCP()}}
function cpBg(){return (CP.cbg&&CP.cbg[CP.partner||"_"])||P.bg||""}
function partnerC(){var r=null;contacts.forEach(function(c){if(c.id===CP.partner)r=c});return r}
function partnerName(){var c=partnerC();return c?cname(c):"Ta"}
function defTitle(t){return t==="mine"?"My Birthday":t==="partner"?partnerName()+"'s Birthday":"Anniversary"}
function sortedDates(list){return list.slice().sort(function(a,b){return untilNext(a.date)-untilNext(b.date)})}
function dateRow(d){
  var n=untilNext(d.date),lab=n===0?"Today":n===1?"In 1 day":"In "+n+" days",armed=cpArm===d.id;
  return '<button class="drow" data-did="'+d.id+'"><span class="cic">'+(d.type==="anniv"?HEARTF:CAKE)+'</span><span class="tx"><b>'+esc(d.title)+'</b><small>'+mdLabel(d.date)+'</small></span><span class="in'+(armed?' arm':'')+'">'+(armed?"Delete":lab)+'</span></button>';
}
function moodAll(){
  var a=(CP.diary||[]).map(function(x){return Object.assign({who:"me"},x)});
  var b=(CP.partner?charDiary(CP.partner):[]).map(function(x){return Object.assign({who:"char"},x)});
  return a.concat(b).sort(function(p,q){return(q.date>p.date?1:q.date<p.date?-1:0)||((q.t||0)-(p.t||0))});
}
function moodPreview(){var a=moodAll()[0];if(!a)return"";return'<div class="dyp">'+esc(mdLabel(a.date))+" · "+esc(String(a.text).replace(/\s+/g," ").slice(0,40))+'</div>'}
function renderCouple(){
  var el=$("#pgCouple"),h="";
  document.querySelectorAll("#cnav button").forEach(function(x){x.classList.toggle("on",x.dataset.c===CPV)});
  var dots='<svg viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>';
  $("#cnav").hidden=CPV==="pick";
  var top='<div class="ctop"><div class="cpl"><button class="circle" id="cpBack" aria-label="返回">'+BACK+'</button><h1>Couple Space</h1></div>'+(CPV==="home"?'<button class="circle" id="cpMore" aria-label="设置">'+dots+'</button>':'')+'</div>';
  if(CPV==="pick"){
    h=top+'<div class="hint" style="margin:16px 4px 6px">选择一位 Char 一起进入情侣空间</div>'+
      (contacts.length?'<div style="margin-top:8px">'+contacts.map(function(c){return '<button class="item" data-pick="'+c.id+'"><div class="avatar">'+avh(c.avatar)+'</div><div class="body"><div class="row"><span class="t">'+esc(cname(c))+'</span></div></div><i class="chk'+(CP.partner===c.id?' on':'')+'"></i></button>'}).join("")+'</div>':'<div class="empty">还没有联系人<br>先去 Contacts 添加一位 Char</div>');
  }else if(CPV==="home"){
    migrateDates();var ds=sortedDates(pdates());
    var cbg=cpBg();h=top+'<div class="banner'+(cbg?' img':'')+'"'+(cbg?' style="background-image:url('+cbg+');margin-top:16px"':' style="margin-top:16px"')+'><div class="cpIn">'+
      '<div class="cpav"><div class="avatar">'+avh((partnerC()||{}).avatar)+'</div>'+HEARTF+'<div class="avatar">'+avh(P.avatar)+'</div></div>'+
      '<div class="cpTog">Together for</div><div class="cpNum"><b>'+togetherDays()+'</b><span>days</span></div></div></div>'+
      '<div class="cc"><div class="cch"><span class="cic">'+SMILE+'</span><span class="tx"><b>Mood Diary</b><small>Record your daily emotions with each other</small></span><button class="circle sm" id="cpMood" aria-label="打开">'+CHEV+'</button></div>'+
      moodPreview()+'<button class="wbtn" id="cpWrite">'+I.edit+'<span>Write a diary</span></button></div>'+
      '<div class="cc"><div class="cch"><span class="cic">'+CAL+'</span><span class="tx"><b>Special Dates</b></span><button class="circle sm" id="cpCal" aria-label="日历">'+CHEV+'</button></div>'+
      '<div style="margin-top:8px">'+(ds.length?ds.map(dateRow).join(""):'<div class="cempty">还没有日期</div>')+'</div>'+
      '<button class="wbtn" id="cpAddDate">'+I.edit+'<span>Add a date</span></button></div>';
  }else if(CPV==="mood"){
    var all=moodAll(),pn=partnerName();
    h='<div class="ctop"><div class="cpl"><button class="circle" id="cpBack" aria-label="返回">'+BACK+'</button><h1>Mood Diary</h1></div></div>'+
      '<button class="addpill" id="cpWrite" style="margin-top:16px"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Write a diary</span></button>'+
      (all.length?all.map(function(x){
        var me=x.who==="me",armed=cpArm===x.id;
        return '<div class="cc"><div class="cch"><div class="avatar" style="width:38px;height:38px;flex:none">'+avh(me?P.avatar:(partnerC()||{}).avatar)+'</div><span class="tx"><b>'+esc(me?(P.name||"Me"):pn)+'</b><small>'+esc(mdLabel(x.date))+'</small></span><button class="pmore'+(armed?' arm':'')+'" data-dyd="'+x.id+'">'+(armed?"Delete":I.dots)+'</button></div><div class="dytx">'+esc(x.text)+'</div></div>';
      }).join(""):'<div class="empty" style="margin-top:50px">还没有日记<br>点上面写下第一篇</div>');
  }else{
    var now=new Date();if(!CM)CM={y:now.getFullYear(),m:now.getMonth()};
    var first=new Date(CM.y,CM.m,1).getDay(),dim=new Date(CM.y,CM.m+1,0).getDate(),t0=today0();
    var spd={};pdates().forEach(function(d){var a=d.date.split("-");if(+a[1]-1===CM.m)spd[+a[2]]=1});
    var cells="";["S","M","T","W","T","F","S"].forEach(function(w){cells+="<i>"+w+"</i>"});
    for(var i=0;i<first;i++)cells+="<span></span>";
    for(var k=1;k<=dim;k++){
      var td=t0.getFullYear()===CM.y&&t0.getMonth()===CM.m&&t0.getDate()===k;
      cells+='<span class="'+(td?"td ":"")+(spd[k]?"sp":"")+'">'+k+'</span>';
    }
    var inM=pdates().filter(function(d){return +d.date.split("-")[1]-1===CM.m}).sort(function(a,b){return +a.date.split("-")[2]-+b.date.split("-")[2]});
    h='<div class="ctop"><div class="cpl"><button class="circle" id="cpBack" aria-label="返回">'+BACK+'</button><h1>Calendar</h1></div></div>'+
      '<div class="cc"><div class="cmon"><button class="circle sm" id="cpPrev" aria-label="上个月" style="transform:scaleX(1)">'+BACK+'</button><b>'+MONF[CM.m]+' '+CM.y+'</b><button class="circle sm" id="cpNext" aria-label="下个月" style="transform:scaleX(-1)">'+BACK+'</button></div><div class="cal">'+cells+'</div></div>'+
      '<div class="cc"><div class="cch"><span class="cic">'+CAL+'</span><span class="tx"><b>This Month</b></span></div><div style="margin-top:8px">'+(inM.length?inM.map(dateRow).join(""):'<div class="cempty">这个月没有特别的日子</div>')+'</div></div>';
  }
  el.innerHTML=h;
}
function openDiarySheet(){
  var today=ymd(new Date());
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="shCancel">Cancel</button><span class="ttl">New Diary</span><button class="go" id="cpDiarySave">Save</button></div>'+
    '<div class="card" style="margin-top:16px"><label>Date</label><input type="date" id="dyDate" value="'+today+'"></div>'+
    '<div class="card"><label>Today\'s mood</label><textarea class="tall" id="dyText" maxlength="500" placeholder="写下今天的心情…"></textarea></div>';
  $("#sheetWrap").hidden=false;
  setTimeout(function(){var t=$("#dyText");if(t)t.focus()},60);
}
function openDateSheet(){
  CS={type:"mine"};
  var today=ymd(new Date());
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="shCancel">Cancel</button><span class="ttl">New Date</span><button class="go" id="cpAdd">Add</button></div>'+
    '<div class="seg cpseg" id="cpType" style="margin-top:16px"><button class="on" data-ct="mine">My Birthday</button><button data-ct="partner">'+esc(partnerName().slice(0,8))+"'s Birthday"+'</button><button data-ct="anniv">Anniversary</button></div>'+
    '<div class="card"><label>Title</label><input id="cpTitle" maxlength="40" placeholder="'+esc(defTitle("mine"))+'"></div>'+
    '<div class="card"><label>Date</label><input type="date" id="cpDate" value="'+today+'"></div>';
  $("#sheetWrap").hidden=false;
}
function openCpSettings(){
  CS={bg:null};
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="shCancel">Cancel</button><span class="ttl">Couple Space</span><button class="go" id="cpSave">Save</button></div>'+
    '<div class="card" style="margin-top:16px"><label>Days together</label><input id="cpDays" type="number" inputmode="numeric" min="0" max="99999" value="'+togetherDays()+'"></div>'+
    '<button class="tile wide" data-cp="bg" style="width:100%;margin-top:10px">'+I.photo+'<span class="tx"><b>Background</b><small id="cpBgNote">'+((CP.cbg&&CP.cbg[CP.partner||"_"])?'已设置':'未设置，使用 Me 页背景')+'</small></span></button>'+
    '<button class="tile wide" data-cp="chg" style="width:100%;margin-top:10px">'+I.at+'<span class="tx"><b>Change Char</b><small>'+esc(partnerName())+'</small></span></button>';
  $("#sheetWrap").hidden=false;
}
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.dataset.ct){
    CS.type=t.dataset.ct;
    document.querySelectorAll("#cpType button").forEach(function(x){x.classList.toggle("on",x===t)});
    var ti=$("#cpTitle");if(ti)ti.placeholder=defTitle(CS.type);
  }
  else if(t.id==="cpDiarySave"){
    var dd=$("#dyDate").value,tx=$("#dyText").value.trim();
    if(!dd){toast("请选择日期");return}
    if(!tx){toast("先写点什么吧");$("#dyText").focus();return}
    CP.diary.push({id:Date.now().toString(36),by:"me",date:dd,text:tx,t:Date.now()});
    if(!saveCP()){CP.diary.pop();return}
    closeSheet();toast("日记已保存");renderCouple();
  }
  else if(t.id==="cpAdd"){
    var dv=$("#cpDate").value;if(!dv){toast("请选择日期");return}
    var title=$("#cpTitle").value.trim()||defTitle(CS.type);
    pdates().push({id:Date.now().toString(36),type:CS.type,title:title,date:dv});
    if(!saveCP()){pdates().pop();return}
    closeSheet();renderCouple();toast("已添加");
  }
  else if(t.id==="cpSave"){
    var n=parseInt($("#cpDays").value,10);
    if(isNaN(n)||n<0){toast("请输入有效天数");return}
    var pe=pdays();pe.days=n;pe.setAt=ymd(new Date());if(CS.bg){if(!CP.cbg)CP.cbg={};CP.cbg[CP.partner||"_"]=CS.bg}
    if(!saveCP())return;
    closeSheet();renderCouple();toast("已保存");
  }
  else if(t.dataset.cp==="bg"){
    var bi=document.createElement("input");bi.type="file";bi.accept="image/*";
    bi.onchange=function(){if(bi.files[0])shrink(bi.files[0],900,false,function(d){CS.bg=d;var nb=$("#cpBgNote");if(nb)nb.textContent="已选择新背景，保存后生效"})};bi.click();
  }
  else if(t.dataset.cp==="chg"){closeSheet();CPV="pick";renderCouple()}
});
$("#pgCouple").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="cpBack"){if(CPV==="cal"||CPV==="mood"){CPV="home";renderCouple()}else go("me");return}
  if(b.dataset.pick){CP.partner=b.dataset.pick;saveCP();CPV="home";cpArm=null;renderCouple();$("#pgCouple").scrollTop=0;return}
  if(b.id==="cpMore"){openCpSettings();return}
  if(b.id==="cpWrite"){openDiarySheet();return}
  if(b.id==="cpAddDate"){openDateSheet();return}
  if(b.id==="cpMood"){CPV="mood";cpArm=null;renderCouple();$("#pgCouple").scrollTop=0;return}
  if(b.id==="cpCal"){CPV="cal";cpArm=null;renderCouple();$("#pgCouple").scrollTop=0;return}
  if(b.id==="cpPrev"||b.id==="cpNext"){var d=b.id==="cpPrev"?-1:1;CM.m+=d;if(CM.m<0){CM.m=11;CM.y--}if(CM.m>11){CM.m=0;CM.y++}renderCouple();return}
  if(b.dataset.dyd){
    var did=b.dataset.dyd;
    if(cpArm===did){CP.diary=(CP.diary||[]).filter(function(x){return x.id!==did});if(CP.partner)CP.cdiary[CP.partner]=charDiary(CP.partner).filter(function(x){return x.id!==did});saveCP();cpArm=null}else cpArm=did;
    renderCouple();return;
  }
  if(b.dataset.did){
    var id=b.dataset.did;
    if(cpArm===id){CP.cdates[CP.partner||"_"]=pdates().filter(function(x){return x.id!==id});saveCP();cpArm=null}else cpArm=id;
    renderCouple();
  }
};
$("#cnav").onclick=function(e){var b=e.target.closest("button");if(!b)return;CPV=b.dataset.c;cpArm=null;renderCouple();$("#pgCouple").scrollTop=0};


// ---------- Saved: texts / thoughts / stickers ----------
var SD={texts:[],thoughts:[],stickers:[]};
try{var rsd=store("saved");if(rsd){var sd0=JSON.parse(rsd);["texts","thoughts","stickers"].forEach(function(k){if(sd0[k])SD[k]=sd0[k]})}}catch(e){}
function saveSD(){try{localStorage.setItem("saved",JSON.stringify(SD));return true}catch(e){toast("存储空间不足，图片可能太大");return false}}
var STAR='<svg viewBox="0 0 24 24"><path d="M12 3.500l2.600 5.300 5.800.8-4.200 4.100 1 5.800L12 16.800l-5.200 2.700 1-5.800L3.600 9.600l5.800-.8z"/></svg>';
var BUBH='<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 01-11.600 7.100L4 20l1.100-4.500A8 8 0 1121 12z"/><path d="M12 15.500c-2.600-1.700-3.500-2.900-3.500-4a1.800 1.800 0 013.500-.6 1.800 1.800 0 013.500.6c0 1.100-.9 2.300-3.500 4z"/></svg>';
var SK={
  texts:{title:"Saved<br>Texts",sub:"Keep the words that matter.",cats:["Texts","Quotes","Memories","Others"],add:"Add to Favorites",icon:STAR,empty:"还没有收藏的短信<br>在聊天页收藏后会出现在这里"},
  thoughts:{title:"Saved<br>Thoughts",sub:"Your favorite thoughts from Char.",cats:["Quotes","Feelings","Life","Others"],add:"Add to Favorites",icon:BUBH,empty:"还没有收藏的心声<br>在聊天页收藏后会出现在这里"},
  stickers:{title:"Saved<br>Stickers",sub:"Your favorite stickers, always here.",cats:["Emoji","Animals","Memes","Others"],add:"Add Sticker",icon:SMILE,empty:"还没有表情包"}
};
var SV={kind:"texts",cat:"All"},SArm=null,SC={};
function savedCard(x){
  var a=who(x.char),armed=SArm===x.id;
  var main=SV.kind==="thoughts"?'<div class="sq">“'+esc(x.text)+'”</div>':'<div class="nm">'+esc(a.name)+'</div><div class="st">'+esc(x.text)+'</div>';
  return '<div class="scard"><div class="avatar">'+avh(a.avatar)+'</div><div class="body">'+main+'</div><div class="sr"><span class="sd">'+mdLabel(x.date)+'</span><button class="pmore'+(armed?' arm':'')+'" data-svdel="'+x.id+'">'+(armed?"Delete":I.dots)+'</button></div></div>';
}
function renderSaved(){
  var k=SK[SV.kind],st=SV.kind==="stickers",chips,items,body;
  if(st){chips=["All"].concat(k.cats).map(function(c){return {id:c,name:c}})}
  else{
    var seen={};SD[SV.kind].forEach(function(x){seen[x.char]=1});
    chips=[{id:"All",name:"All"}].concat(contacts.filter(function(c){return seen[c.id]}).map(function(c){return {id:c.id,name:nick(c)}}));
    if(!chips.some(function(c){return c.id===SV.cat}))SV.cat="All";
  }
  items=SD[SV.kind].filter(function(x){return SV.cat==="All"||(st?x.cat:x.char)===SV.cat});
  if(!items.length)body='<div class="empty" style="margin-top:50px">'+k.empty+'</div>';
  else if(st)body='<div class="sgrid">'+items.map(function(x){return '<button class="stk'+(SArm===x.id?' arm':'')+'" data-svdel="'+x.id+'"><img src="'+x.img+'"><span class="stn">'+esc(stName(x))+'</span></button>'}).join("")+'</div>';
  else body=items.map(savedCard).join("");
  $("#pgSaved").innerHTML='<div class="ctop"><button class="circle" id="svBack" aria-label="返回">'+BACK+'</button></div>'+
    '<div class="svhead"><div class="svtx"><h1>'+k.title+'</h1><p>'+k.sub+'</p></div><div class="svico">'+k.icon+'</div></div>'+
    '<div class="fchips">'+chips.map(function(c){return '<button class="fchip'+(SV.cat===c.id?' on':'')+'" data-svcat="'+esc(c.id)+'">'+esc(c.name)+'</button>'}).join("")+'</div>'+
    (st?'<button class="addpill" id="svAddBtn" style="margin:14px 0 4px"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>'+k.add+'</span></button>':'')+
    '<div style="margin-top:'+(st?'0':'4px')+'">'+body+'</div>';
}
// 聊天页以后调用：addSaved("texts"|"thoughts", 角色id, 文字) 即可把内容收藏进来
window.addSaved=function(kind,charId,text){
  if(kind!=="texts"&&kind!=="thoughts")return false;
  var arr=SD[kind];arr.unshift({id:Date.now().toString(36),char:charId,text:String(text||"").trim(),date:ymd(new Date()),t:Date.now()});
  if(!saveSD()){arr.shift();return false}return true;
};
window.getSaved=function(kind,charId){return SD[kind].filter(function(x){return !charId||x.char===charId})};
function openSavedSheet(){
  if(SV.kind!=="stickers")return;
  var k=SK[SV.kind],today=ymd(new Date()),seg='<div class="seg cpseg" id="svCats" style="margin-top:10px">'+k.cats.map(function(c,i){return '<button class="'+(i?'':'on')+'" data-scat="'+c+'">'+c+'</button>'}).join("")+'</div>';
  var head='<div class="grab"></div><div class="sh"><button class="cn" id="shCancel">Cancel</button><span class="ttl">'+(SV.kind==="stickers"?"New Sticker":"New Favorite")+'</span><button class="go" id="svAdd">Add</button></div>';
  if(SV.kind==="stickers"){
    SC={cat:k.cats[0],imgs:[]};
    $("#sheet").innerHTML=head+seg.replace('margin-top:10px','margin-top:16px')+
      '<button class="tile wide" data-simg="1" style="width:100%;margin-top:10px">'+I.photo+'<span class="tx"><b>Choose Images</b><small id="svNote">可以一次选多张</small></span></button><button class="tile wide" data-simp="1" style="width:100%;margin-top:10px"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 005.700 0l3-3a4 4 0 00-5.700-5.700l-1 1M14 10a4 4 0 00-5.700 0l-3 3a4 4 0 005.700 5.700l1-1"/></svg><span class="tx"><b>Import Pack</b><small>docx / txt，每行 名称:图片链接</small></span></button><div class="sthumbs" id="svThumbs"></div>';
  }else{
    if(!contacts.length){toast("还没有联系人");return}
    SC={char:contacts[0].id,cat:k.cats[0]};
    $("#sheet").innerHTML=head+
      '<div class="fchips" id="svChars" style="margin-top:16px">'+contacts.map(function(c,i){return '<button class="fchip'+(i?'':' on')+'" data-sch="'+c.id+'">'+esc(nick(c))+'</button>'}).join("")+'</div>'+seg+
      '<div class="card"><label>Date</label><input type="date" id="svDate" value="'+today+'"></div>'+
      '<div class="card"><label>'+(SV.kind==="thoughts"?"Thought":"Text")+'</label><textarea class="tall" id="svText" maxlength="500" placeholder="写下想收藏的内容…"></textarea></div>';
  }
  $("#sheetWrap").hidden=false;
}
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.dataset.sch){SC.char=t.dataset.sch;document.querySelectorAll("#svChars button").forEach(function(x){x.classList.toggle("on",x===t)})}
  else if(t.dataset.scat){SC.cat=t.dataset.scat;document.querySelectorAll("#svCats button").forEach(function(x){x.classList.toggle("on",x===t)})}
  else if(t.dataset.simg){
    var inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.multiple=true;
    inp.onchange=function(){
      var fs=[].slice.call(inp.files).slice(0,12),left=fs.length;if(!left)return;
      fs.forEach(function(f){readSticker(f,function(d){if(d)SC.imgs.push(d);if(--left===0){
        var th=$("#svThumbs");if(th)th.innerHTML=stRows();
        var nt=$("#svNote");if(nt)nt.textContent="已选择 "+SC.imgs.length+" 张";
      }})});
    };inp.click();
  }
  else if(t.id==="svAdd"){
    if(SV.kind==="stickers"){
      if(!SC.imgs.length){toast("先选择图片");return}
      var n0=SD.stickers.length;
      SC.imgs.forEach(function(d,i){SD.stickers.unshift({id:Date.now().toString(36)+i,cat:SC.cat,img:d.img,name:d.name,t:Date.now()})});
      if(!saveSD()){SD.stickers.splice(0,SD.stickers.length-n0);return}
    }else{
      var tx=$("#svText").value.trim(),dt=$("#svDate").value;
      if(!dt){toast("请选择日期");return}
      if(!tx){toast("先写点什么吧");$("#svText").focus();return}
      var arr=SD[SV.kind];arr.unshift({id:Date.now().toString(36),char:SC.char,cat:SC.cat,text:tx,date:dt,t:Date.now()});
      if(!saveSD()){arr.shift();return}
    }
    closeSheet();renderSaved();toast("已保存");
  }
});
$("#pgSaved").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="svBack"){go("me");return}
  if(b.dataset.svcat){SV.cat=b.dataset.svcat;SArm=null;renderSaved();return}
  if(b.id==="svAddBtn"){openSavedSheet();return}
  if(b.dataset.svdel){
    var id=b.dataset.svdel;
    if(SArm===id){SD[SV.kind]=SD[SV.kind].filter(function(x){return x.id!==id});saveSD();SArm=null}else SArm=id;
    renderSaved();
  }
};

// ---------- Wallet ----------
// 对外接口（以后聊天页的礼物/转账直接调用）：
//   walletAdd("gift_in", 角色id, 金额)  角色送我礼物，余额增加
//   walletAdd("gift_out", 角色id, 金额) 我送角色礼物，余额减少（余额不足返回 false）
//   walletAdd("topup", "me", 金额)      我充值
//   getWallet() 读取余额和交易记录
var W={bal:0,hide:false,tx:[]};
try{var rw=store("wallet");if(rw){var w0=JSON.parse(rw);if(typeof w0.bal==="number")W.bal=w0.bal;W.hide=!!w0.hide;if(w0.tx&&w0.tx.length)W.tx=w0.tx}}catch(e){}
function saveW(){try{localStorage.setItem("wallet",JSON.stringify(W));return true}catch(e){toast("存储空间不足");return false}}
function r2(n){return Math.round(n*100)/100}
function money(n){return "£"+Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",")}
var EYE='<svg viewBox="0 0 24 24"><path d="M2 12s3.600-6.500 10-6.500S22 12 22 12s-3.600 6.500-10 6.500S2 12 2 12z"/><circle cx="12" cy="12" r="2.800"/></svg>';
var EYEOFF='<svg viewBox="0 0 24 24"><path d="M2 12s3.600-6.500 10-6.500S22 12 22 12s-3.600 6.500-10 6.500S2 12 2 12z"/><circle cx="12" cy="12" r="2.800"/><path d="M4 4l16 16"/></svg>';
var WALI='<svg viewBox="0 0 24 24"><path d="M4 7.500A2.500 2.500 0 016.500 5H18a1 1 0 011 1v2"/><rect x="3" y="8" width="18" height="12" rx="3"/><circle cx="16.500" cy="14" r="1.200"/></svg>';
window.walletAdd=function(kind,charId,amount,note){
  amount=r2(+amount);if(!(amount>0)||amount>99999)return false;
  if(kind!=="topup"&&kind!=="gift_in"&&kind!=="gift_out")return false;
  var signed=kind==="gift_out"?-amount:amount;
  if(W.bal+signed<0)return false;
  W.bal=r2(W.bal+signed);
  W.tx.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),char:charId||"me",kind:kind,amt:signed,note:note||"",t:Date.now()});
  if(!saveW()){W.tx.shift();W.bal=r2(W.bal-signed);return false}
  var pg=$("#pgWallet");if(pg&&!pg.hidden)renderWallet();
  return true;
};
// getWallet() 读全部；getWallet(角色id) 只读我和该角色之间的礼物记录（Char 读取时用这个）
window.getWallet=function(charId){
  var tx=charId?W.tx.filter(function(x){return x.char===charId&&x.kind!=="topup"}):W.tx.slice();
  return{balance:W.bal,transactions:tx.map(function(x){return{kind:x.kind,amount:x.amt,note:x.note||"",date:ymd(new Date(x.t)),char:x.char}})};
};
function wRow(x){
  var me=x.kind==="gift_out"||x.char==="me",a=me?{name:"You",avatar:P.avatar}:who(x.char),desc;
  if(x.kind==="gift_in")desc="Received a gift";
  else if(x.kind==="gift_out")desc="Sent a gift"+(x.char&&x.char!=="me"?" to "+who(x.char).name:"");
  else desc="Top up";
  return '<div class="item wrow"><div class="avatar">'+avh(a.avatar)+'</div><div class="body"><div class="t">'+esc(a.name)+'</div><div class="p">'+esc(desc+(x.note?" · "+x.note:""))+'</div></div>'+
    '<div class="wr"><div class="wa">'+(x.amt>0?"+ ":"- ")+money(x.amt)+'</div><div class="wd">'+mdLabel(ymd(new Date(x.t)))+'</div></div></div>';
}
function renderWallet(){
  var rows=W.tx.map(wRow).join("");
  $("#pgWallet").innerHTML='<div class="ctop"><button class="circle" id="wBack" aria-label="返回">'+BACK+'</button></div>'+
    '<div class="svhead"><div class="svtx"><h1>My<br>Wallet</h1><p>Manage your balance and transactions.</p></div><div class="svico">'+WALI+'</div></div>'+
    '<div class="wbal"><div><div class="wlab"><span>Total Balance</span><button id="wEye" aria-label="显示/隐藏">'+(W.hide?EYEOFF:EYE)+'</button></div><div class="wamt">'+(W.hide?"$ ••••":money(W.bal))+'</div></div><button class="wtop" id="wTop">Top Up</button></div>'+
    '<button class="addpill" id="wGift" style="margin:12px 0 0"><svg viewBox="0 0 24 24"><rect x="3.500" y="9" width="17" height="11" rx="2.500"/><path d="M12 9v11M3.500 13h17M12 9C10 9 8 8 8 6.500A2 2 0 0112 6c0 0 0 1.500 0 3zM12 9c2 0 4-1 4-2.500A2 2 0 0012 6"/></svg><span>Gift</span></button>'+
    '<div class="wsec">Transactions</div>'+
    (rows?'<div>'+rows+'</div>':'<div class="empty" style="margin-top:30px">还没有交易记录<br>点上面的 Top Up 充值</div>')+
    '<div class="wup"><div><b>Unlock more features</b><small>Upgrade to get exclusive benefits.</small></div><button id="wUp">Upgrade</button></div>';
}
function openTopUp(){
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="wCancel">Cancel</button><span class="ttl">Top Up</span><button class="go" id="wGo">Add</button></div>'+
    '<div class="fchips" id="wChips" style="margin-top:16px">'+[10,20,50,100,200].map(function(a){return '<button class="fchip" data-wamt="'+a+'">$'+a+'</button>'}).join("")+'</div>'+
    '<div class="card"><label>Amount</label><input type="number" id="wIn" inputmode="decimal" min="0" step="0.01" placeholder="输入金额"></div>';
  $("#sheetWrap").hidden=false;
}
var WG={mode:"out",char:""};
function openGift(){
  if(!contacts.length){toast("还没有联系人");return}
  WG={mode:"out",char:contacts[0].id};
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="wCancel">Cancel</button><span class="ttl">Gift</span><button class="go" id="wgGo">Add</button></div>'+
    '<div class="seg cpseg" id="wMode" style="margin-top:16px"><button class="on" data-wmode="out">I Send</button><button data-wmode="in">Char Sends</button></div>'+
    '<div class="fchips" id="wgChars" style="margin-top:14px">'+contacts.map(function(c,i){return '<button class="fchip'+(i?'':' on')+'" data-wch="'+c.id+'">'+esc(nick(c))+'</button>'}).join("")+'</div>'+
    '<div class="fchips" id="wgChips" style="margin-top:12px">'+[5,10,20,50,100].map(function(a){return '<button class="fchip" data-wgamt="'+a+'">$'+a+'</button>'}).join("")+'</div>'+
    '<div class="card"><label>Amount</label><input type="number" id="wgIn" inputmode="decimal" min="0" step="0.01" placeholder="输入金额"></div>'+
    '<div class="card"><label>Note</label><input id="wgNote" maxlength="40" placeholder="留一句话（可选）"></div>';
  $("#sheetWrap").hidden=false;
}
$("#pgWallet").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="wBack"){go("me");return}
  if(b.id==="wEye"){W.hide=!W.hide;saveW();renderWallet();return}
  if(b.id==="wTop"){openTopUp();return}
  if(b.id==="wGift"){openGift();return}
  if(b.id==="wUp"){toast("Coming soon");return}
};
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.dataset.wamt){$("#wIn").value=t.dataset.wamt;document.querySelectorAll("#wChips button").forEach(function(x){x.classList.toggle("on",x===t)})}
  else if(t.dataset.wmode){WG.mode=t.dataset.wmode;document.querySelectorAll("#wMode button").forEach(function(x){x.classList.toggle("on",x===t)})}
  else if(t.dataset.wch){WG.char=t.dataset.wch;document.querySelectorAll("#wgChars button").forEach(function(x){x.classList.toggle("on",x===t)})}
  else if(t.dataset.wgamt){$("#wgIn").value=t.dataset.wgamt;document.querySelectorAll("#wgChips button").forEach(function(x){x.classList.toggle("on",x===t)})}
  else if(t.id==="wgGo"){
    var g=r2(parseFloat($("#wgIn").value)),nt=$("#wgNote").value.trim();
    if(!(g>0)){toast("请输入金额");return}
    if(g>99999){toast("单次最多 $99,999");return}
    if(WG.mode==="out"&&g>W.bal){toast("余额不足，先 Top Up");return}
    if(walletAdd(WG.mode==="out"?"gift_out":"gift_in",WG.char,g,nt)){closeSheet();renderWallet();toast(WG.mode==="out"?"礼物已送出":"收到礼物")}
  }
  else if(t.id==="wCancel")closeSheet();
  else if(t.id==="wGo"){
    var v=r2(parseFloat($("#wIn").value));
    if(!(v>0)){toast("请输入金额");return}
    if(v>99999){toast("单次最多 $99,999");return}
    if(walletAdd("topup","me",v)){closeSheet();renderWallet();toast("已充值 "+money(v))}
  }
});
$("#sheet").addEventListener("input",function(e){if(e.target.id==="wIn")document.querySelectorAll("#wChips button").forEach(function(x){x.classList.remove("on")});if(e.target.id==="wgIn")document.querySelectorAll("#wgChips button").forEach(function(x){x.classList.remove("on")})});

// ---------- 角色主页 ----------
var PVid="",PT="posts";
function openProfile(id){PVid=id;PT="posts";cmtId=null;armId=null;go("profile")}
function renderProfile(){
  var c=cget(PVid);if(!c){go("contacts");return}
  var handle=c.uid?"@"+c.uid.replace(/^@/,""):(c.user&&c.real?"@"+c.user.replace(/^@/,""):"");
  var list=posts.filter(function(x){return PT==="posts"?x.by===PVid:x.likes.indexOf(PVid)>-1});
  $("#pgProfile").innerHTML=
    '<div class="ctop"><button class="circle" id="pfBack" aria-label="返回">'+BACK+'</button><button class="circle" id="pfMore" aria-label="更多"><svg viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><circle cx="5" cy="12" r="1.700"/><circle cx="12" cy="12" r="1.700"/><circle cx="19" cy="12" r="1.700"/></svg></button></div>'+
    heroCard({bg:c.bg,av:(c.avatar?'<img src="'+c.avatar+'">':PERSON),st:stHTML(PVid,false),name:esc(cname(c)),handle:handle,sig:c.sig})+
    '<div class="seg" style="margin-top:22px"><button data-ptab="posts" class="'+(PT==="posts"?"on":"")+'">Posts</button><button data-ptab="likes" class="'+(PT==="likes"?"on":"")+'">Likes</button></div>'+
    '<div style="margin-top:6px">'+(list.length?list.map(postHTML).join(""):'<div class="empty" style="margin-top:40px">'+(PT==="posts"?"还没有动态":"还没有点赞")+'</div>')+'</div>';
  var ci=$("#pgProfile #cIn");if(ci)ci.focus();
}
$("#pgProfile").onclick=function(e){
  var b=e.target.closest("button");if(!b)return;
  if(b.id==="pfBack"){go("contacts");return}
  if(b.id==="pfEdit"){openForm(PVid);return}
  if(b.dataset.ptab){PT=b.dataset.ptab;cmtId=null;renderProfile();return}
  var act=b.dataset.act;if(!act)return;
  var id=b.dataset.id,pp=null;posts.forEach(function(x){if(x.id===id)pp=x});
  if(act==="like"&&pp){var i=pp.likes.indexOf("me");if(i>-1)pp.likes.splice(i,1);else pp.likes.push("me");savePosts()}
  else if(act==="cmt")cmtId=cmtId===id?null:id;
  else if(act==="send"&&pp){var v=$("#pgProfile #cIn").value.trim();if(!v)return;pp.cmts.push({by:"me",text:v,t:Date.now()});savePosts();cmtId=null}
  renderProfile();
};
// 以后 Char 发帖 / 点赞 / 评论调用这三个（会同步显示在 Moments 和该 Char 的主页）
window.addCharPost=function(charId,text,imgs,loc){
  if(!cget(charId)||!(String(text||"").trim()||(imgs&&imgs.length)))return false;
  posts.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),by:charId,text:String(text||"").trim(),imgs:imgs||[],loc:loc||"",mention:[],hide:[],vis:"Friends",t:Date.now(),likes:[],cmts:[]});
  return savePosts();
};
window.charLike=function(charId,postId){
  var pp=null;posts.forEach(function(x){if(x.id===postId)pp=x});
  if(!pp||!cget(charId)||pp.likes.indexOf(charId)>-1)return false;
  pp.likes.push(charId);return savePosts();
};
window.charComment=function(charId,postId,text){
  var pp=null;posts.forEach(function(x){if(x.id===postId)pp=x});
  if(!pp||!cget(charId)||!String(text||"").trim())return false;
  pp.cmts.push({by:charId,text:String(text).trim(),t:Date.now()});return savePosts();
};

// ---------- 限时状态（24 小时） ----------
// 对外接口：getStatus(id) 读取（"me" 或角色id，过期返回 null）；setStatus(id,文字) 设置，文字为空则清除
var ST={};
try{var rst=store("status");if(rst)ST=JSON.parse(rst)||{}}catch(e){}
function saveST(){try{localStorage.setItem("status",JSON.stringify(ST));return true}catch(e){return false}}
function stGet(id){var x=ST[id];if(!x)return null;if(Date.now()-x.t>864e5){delete ST[id];saveST();return null}return x}
window.getStatus=function(id){var x=stGet(id||"me");return x?{text:x.text,t:x.t,expires:x.t+864e5}:null};
window.setStatus=function(id,text){
  id=id||"me";text=String(text||"").trim().slice(0,30);
  if(id!=="me"&&!cget(id))return false;
  if(!text)delete ST[id];else ST[id]={text:text,t:Date.now()};
  var ok=saveST(),m=$("#pgMoments"),pg=$("#pgProfile");
  if(m&&!m.hidden)renderMoments();
  if(pg&&!pg.hidden)renderProfile();
  return ok;
};
function stHTML(id,own){var x=stGet(id);return x?'<div class="stbub"'+(own?' data-act="stedit"':'')+'>'+esc(x.text)+'</div>':''}
function stCapHTML(){return '<button class="stcap" data-st="1">'+I.cmt+'<span>'+(stGet("me")?"Edit Status":"Add Status")+'</span></button>'}
var STfrom="";
function statusView(){
  var x=stGet("me");
  $("#sheet").innerHTML='<div class="grab"></div><div class="sh"><button class="cn" id="stCancel">Cancel</button><span class="ttl">Status</span><button class="go" id="stGo">Share</button></div>'+
    '<div class="card" style="margin-top:16px"><label>Status</label><input id="stIn" maxlength="30" placeholder="写一句短状态…" value="'+esc(x&&x.text)+'"></div>'+
    '<div class="empty" style="margin:12px 0 0;font-size:12px">24 小时后自动消失，会显示在头像上方</div>'+
    (x?'<button class="ghost" id="stRm">Remove Status</button>':'');
  setTimeout(function(){var i=$("#stIn");if(i)i.focus()},60);
}
function openStatus(fromCompose){STfrom=fromCompose?"c":"";statusView();$("#sheetWrap").hidden=false}
$("#sheet").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.dataset.st){openStatus(true)}
  else if(t.id==="stCancel"){if(STfrom)composeView();else closeSheet()}
  else if(t.id==="stGo"||t.id==="stRm"){
    var v=t.id==="stRm"?"":$("#stIn").value.trim();
    if(t.id==="stGo"&&!v){toast("先写点什么吧");return}
    setStatus("me",v);toast(v?"状态已发布":"状态已清除");
    if(STfrom)composeView();else closeSheet();
  }
});
