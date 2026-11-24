/* ============================================================
   prompts.js —— 所有「内置提示词」和「喂给 AI 的数量上限」都集中在这一个文件
   以后想调提示词、调记忆怎么取，只改这个文件，不用碰别的代码。
   注意：
   - 引号里的文字就是真正发给 AI 的内容，\n 表示换行，改的时候别删掉引号和逗号。
   - 下面每条前面的中文注释，说明它什么时候被用到、可以用哪些变量。
   - 提示词的各个小标题（比如 [Memories]）是给 AI 看的分段标记，改成别的也行，但最好保持清楚。
   ============================================================ */
window.PROMPTS={

  // ===== 一、数量和长度上限 =====
  limits:{
    memImportantTypes:["重要"],  // 这些类型的记忆「每次聊天都会带上」（不会被挤掉）
    memImportantMax:40,          // 上面这类最多带几条（取日期最新的）
    memRecent:60,                // 其他类型的记忆，每次带最近几条（按记忆上的日期排）
    memChars:300,                // 手动写的记忆，每条最多带多少字（自动总结出来的 Summary 不受这个限制，字数按 Chat Settings 里的上限）
    wbLookback:6,                // 世界书：看最近几条消息来判断关键词有没有触发
    wbChars:{light:300,medium:600,deep:1500}, // 世界书：轻 / 中 / 深度各自最多带多少字
    stickerNames:60,             // 告诉 AI 最多几个贴纸名字
    rhythmPick:"weighted",       // 一轮发几条：weighted = 每轮在最少~最多之间随机挑一个数，少的更容易被选中；uniform = 完全随机；range = 不挑数，只告诉 AI 范围
    autoPostMax:50,              // Char 自己发的动态：要求 AI 写多少字以内（真人随手发的那种，不写日记）
    autoStatusMax:15,            // Char 自己发的状态：要求 AI 写多少字以内（限时状态，更短）
    autoPostCut:120,             // 动态硬上限：AI 写太长时，超过这个字数直接截断
    autoStatusCut:30,            // 状态硬上限
    summaryLang:"中文",          // 记忆自动总结用什么语言写
    summaryGapMin:60             // 聊天里两条消息隔了超过这么多分钟（或跨天），总结时就当成新的一段，只在段首写一次时间
  },

  // ===== 二、角色基础设定 =====
  // 可用变量：{{user}} 你的昵称  {{userPersona}} 你的人设  {{char}} 角色名  {{charDesc}} 角色描述
  system:"你是{{char}}，正在和{{user}}聊天。\n\n【你的设定】\n{{charDesc}}\n\n【对方的信息】\n{{userPersona}}\n\n请始终保持角色，用自然的聊天口吻回复。",

  // ===== 三、说话风格（每次聊天都会带上）=====
  style:"[Style]\n- You are texting. Write short, natural messages the way a real person texts.\n- Put each separate message on its own line, without numbering.\n- Do not narrate actions in asterisks unless the character would. Never mention being an AI or a language model.\n- Reply in the language the user is writing in, unless the character description says otherwise.",

  // ===== 四、每次聊天时拼进去的资料段 =====
  // 记忆：items = [{type,text,date}]
  memories:function(items){
    var L=PROMPTS.limits;
    return "[Memories]\n"+items.map(function(m){return "- ["+m.type+"] "+(m.date?"("+m.date+(m.time?" "+m.time:"")+") ":"")+(m.type==="Summary"?String(m.text):String(m.text).slice(0,L.memChars))}).join("\n");
  },
  // 世界书：items = [{title,content,depth}]
  worldBook:function(items){
    var L=PROMPTS.limits;
    return "[World Book]\nDepth guide: light = background hint, mention only if it fits naturally; medium = stay consistent with it when relevant; deep = core canon that always shapes how you think, speak and act, even when not mentioned.\n"+
      items.map(function(x){var d=x.depth||"medium";return "- ("+d+") "+x.title+": "+String(x.content).slice(0,L.wbChars[d]||L.wbChars.medium)}).join("\n");
  },
  // 关系网：rows = [{withName,selfRole,otherRole,note}]
  relationships:function(rows){
    return "[Relationships]\n"+rows.map(function(r){return "- "+r.withName+": "+r.selfRole+(r.otherRole&&r.otherRole!==r.selfRole?" / "+r.otherRole:"")+(r.note?" ("+r.note+")":"")}).join("\n");
  },
  // 状态：charText / userText 是双方当前状态文字，没有就是空
  status:function(charText,userText){
    var l=[];
    if(charText)l.push("Your current status: "+charText);
    if(userText)l.push("The user's current status: "+userText);
    return l.length?"[Status]\n"+l.join("\n"):"";
  },
  // 情侣空间：在一起的天数
  coupleDays:function(days){return "[Relationship days]\nDays counted with the user: "+days},
  // 当前时间
  now:function(){return "[Now]\n"+new Date().toLocaleString()},

  // ===== 五、聊天设置里各个开关对应的提示词 =====
  timeZones:function(charTime,charTz,userTime,userTz){
    var l=[];
    if(charTz)l.push("Your local time: "+charTime+" ("+charTz+")");
    if(userTz)l.push("The user's local time: "+userTime+" ("+userTz+")");
    return l.length?"[Time Zones]\n"+l.join("\n"):"";
  },
  places:function(charRegion,userRegion){
    var l=[];
    if(charRegion)l.push("You are in: "+charRegion);
    if(userRegion)l.push("The user is in: "+userRegion);
    return l.length?"[Places]\n"+l.join("\n"):"";
  },
  // 收到转账：listText 例如 "£10.00 (note) and £5.00"
  transfer:function(listText){
    return "[Transfer]\nThe user has sent you "+listText+". React in character. On its own separate line, write [accept] to take the money or [return] to give it back. Use exactly one of them and put nothing else on that line.";
  },
  blocked:function(){
    return "[Blocked]\nThe user has blocked you. You can still send messages, but every message you send shows a black exclamation mark on the user's side, meaning it was flagged as blocked. You can see that mark. React in character (hurt, confused, persistent, or accepting, whatever fits).";
  },
  // 心声（Inner Voice）
  innerVoice:function(){
    return "[Inner Voice]\n- After your messages, add ONE final line in exactly this form: [thought: your private inner thought right now]\n- It is what you really think or feel at this moment, in first person, one or two short sentences, in the language you normally use. It is never said aloud and it is not one of your messages.";
  },
  // Char 说外语时：language 是 Char 的语言，translation 要求每句后面附翻译（用 ||| 隔开）
  language:function(lang){return "[Language]\nWrite your messages in "+lang+"."},
  translation:function(trLang){
    return "[Translation]\nEvery message line must be followed by its translation into "+(trLang||"中文")+", written as: original ||| translation\nExample: Hi there ||| 你好\nOne message per line. Use the ||| separator exactly once per line and nowhere else.";
  },
  // 思维链（先在 <think> 里想一遍再回复）
  reasoning:function(){
    return "[Reasoning]\n- Before every reply, think it through privately inside <think>...</think>: who you are, how you usually talk, what you remember, what the user really means, and how you would naturally respond.\n- Put your actual messages after </think>. Never mention or quote your reasoning in the messages.";
  },
  // 引用回复
  quoting:function(){
    return "[Quoting]\n- To reply to one specific earlier message from the user, begin that message with [quote:<a few exact words from their message>]. Use it only when it really helps, never in every reply.";
  },
  // 贴纸：names 是可用贴纸名字数组，freq 是 low / mid / high
  stickers:function(names,freq){
    return "[Stickers]\n- You can send a sticker as its own message by writing only [sticker:NAME]. Available names: "+names.join(", ")+".\n- "+({low:"Send one rarely.",mid:"Send one now and then when it fits the mood.",high:"Send one often."}[freq]||"")+" Never invent names.";
  },
  // 生活轨迹：trl = {time, now:{text,place,detail}, items:[{from,to,text}]}
  lifeTrail:function(trl){
    return "[Life Trail]\n- Your local time now: "+trl.time+
      (trl.now?"\n- Right now you are: "+trl.now.text+(trl.now.place?" @ "+trl.now.place:"")+(trl.now.detail?" ("+String(trl.now.detail).slice(0,100)+")":""):"")+
      "\n- Your schedule today: "+trl.items.map(function(x){return x.from+"-"+x.to+" "+x.text}).join("; ")+
      "\n- This is background knowledge only. Do not bring it up on your own, do not announce what you are doing, and do not recite the schedule. Mention it only when the user asks (for example what you are doing or where you are) or when it truly matters, such as being too busy to reply right away. When asked, answer naturally in your own words and stay consistent with it; for anything not listed, improvise something that fits.";
  },
  // 一次回复发几条消息
  // n 是这一轮要发的条数（由 pickCount 随机挑出）；n 为空就只告诉 AI 范围
  outputRhythm:function(min,max,n){
    if(n==null)return "[Output Rhythm]\n- Each reply should contain between "+min+" and "+max+" separate messages. Fewer is fine when there is little to say; never pad with filler to reach the maximum.";
    return "[Output Rhythm]\n- This reply: send exactly "+n+" separate message"+(n>1?"s":"")+" (the allowed range is "+min+" to "+max+").\n- Do not pad. If you have little to say, keep each message short instead of adding filler or repeating yourself.";
  },
  // 每轮在 min~max 之间随机挑一个条数
  pickCount:function(min,max){
    var mode=PROMPTS.limits.rhythmPick;
    if(mode==="range")return null;
    if(min>=max)return min;
    var k,w=[],sum=0;
    for(k=min;k<=max;k++){var x=mode==="uniform"?1:(max-k+1);w.push(x);sum+=x}
    var r=Math.random()*sum;
    for(k=min;k<=max;k++){r-=w[k-min];if(r<0)return k}
    return max;
  },

  // ===== 六、后台任务的提示词 =====
  // 记忆自动总结：name 是角色名，cap 是字数上限，lang 见上面的 summaryLang
  summary:function(name,user,cap,lang){
    return "你是聊天记录的记忆整理员。把下面的聊天记录整理成客观的事实记忆。\n"+
      "【视角】第三方旁观视角，直接用人名称呼双方（"+name+"、"+user+"），不要用“我”，不要代入任何一方。\n"+
      "【内容】只记录事实：发生了什么、说了什么、做了什么决定或承诺、双方提到的个人信息、喜好、计划和安排。\n"+
      "【时间】聊天记录里以“=== 时间 ===”标出的行，表示从这个时间起的一段连续对话。每一段只在段首写一次时间（格式如“2026-11-23 22:30”），同一段里的事实不要再逐条写时间；只有对话里明确提到某个具体时间安排时，才写出那个时间。\n"+
      "【禁止】不要写成日记；不要抒情、心理描写、感受和评价；不要推测，没说过的内容不要编；不要比喻和修饰性的话。\n"+
      "【篇幅】总字数不得超过 "+cap+" 字，尽量控制在 "+Math.max(1,Math.floor(cap*0.9))+" 字以内。内容太多写不下时，按重要性取舍：承诺、决定、个人信息、有具体时间的安排优先保留，寒暄和琐碎细节舍弃。必须写完整，不能写到一半被截断。\n"+
      "【格式】每段以时间开头。纯文本，不要开场白，不要 markdown。请用"+lang+"书写（人名和专有名词可以保留原文）。";
  },
  // 总结超过字数上限时，让 AI 自己压缩（保留重要的、舍弃次要的），而不是直接截断
  condense:function(cap,lang){
    return "把下面的记忆压缩到 "+cap+" 字以内。保留最重要的事实（承诺、决定、个人信息、有具体时间的安排），舍弃次要细节。不要新增任何内容，不要改变视角，保持原来的格式（每段以时间开头）。纯文本，不要开场白，必须写完整，总字数不得超过 "+cap+" 字。请用"+lang+"书写。";
  },


  // 生成当天的生活轨迹
  trailAsk:function(name,date,region,tz,lang){
    return "Write "+name+"'s schedule for today ("+date+"). "+(region?"They are in "+region+". ":"")+(tz?"Use their local time ("+tz+"). ":"")+
      "Return ONLY a JSON array of 6 to 10 objects like {\"from\":\"HH:MM\",\"to\":\"HH:MM\",\"text\":\"...\",\"place\":\"...\",\"detail\":\"...\"}, in chronological order, 24-hour clock, covering the whole day from waking up to going to bed (an overnight sleep slot may end the next morning). "+
      "\"text\" is a short headline (under 40 characters) of what they are doing. \"place\" is where they are (under 20 characters). \"detail\" is 1 or 2 concrete short sentences, at most 100 characters in total, about how this stretch of time goes: what they do, who they are with, and their mood. "+
      "Stay true to their persona and daily life. Write all fields in "+lang+". No markdown, no explanation.";
  },
  // Char 自己发动态：recent 是它最近发过的几条（避免重复）
  autoPost:function(name,lang,recent){
    var L=PROMPTS.limits;
    return "Write ONE new moments post that "+name+" would publish right now, based on "+name+"'s current situation, the time of day and mood. It must read like a real person's quick post on social media: usually a single short sentence or fragment, at most about "+L.autoPostMax+" characters, casual, with no hashtags, no summary of the day, no diary-style reflection and no explanation. Use an emoji only if it fits. "+
      (recent&&recent.length?"Do not repeat or closely paraphrase these recent posts: "+recent.join(" | ")+". ":"")+
      "Write it in "+lang+". Output ONLY the post text, nothing else.";
  },
  // Char 自己发状态：current 是它现在的状态文字（要求写一条不一样的）
  autoStatus:function(name,lang,current){
    var L=PROMPTS.limits;
    return "Write ONE short status for "+name+" right now, based on their current situation. It is a 24-hour status line, so keep it tiny: a few words, at most "+L.autoStatusMax+" characters, like what a real person types as a status. No hashtags and no explanation. "+
      (current?"Their current status is \""+current+"\"; write something different. ":"")+
      "Write it in "+lang+". Output ONLY the status text, nothing else.";
  },
  // 点气泡翻译
  translate:function(lang){
    return "Translate the user's message into "+lang+". Output only the translation, with no explanations or quotation marks.";
  }
};
