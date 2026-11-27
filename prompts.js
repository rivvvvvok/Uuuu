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
    feedPosts:12,                // 动态流：Char 每次聊天/互动时能看到最近几条动态（Moments 页上所有人加起来，按时间排）
    feedCmts:3,                  // 动态流：每条动态最多带最近几条评论
    feedCut:80,                  // 动态流：每条动态最多带多少字
    reactSeeChance:0.7,          // 你发动态后，每位 Char「刷到」的概率（没刷到就完全不会互动）
    reactDelayMin:3,             // 刷到之后，最快过几分钟才会看（真正互动前还要 App 开着）
    reactDelayMax:120,           // 刷到之后，最晚过几分钟（在最快~最晚之间随机）
    reactCut:50,                 // Char 评论动态最多几个字
    replyChance:0.85,            // 你评论/回复了 Char 之后，Char 回复你的概率
    replyDelayMin:1,             // 回复最快几分钟
    replyDelayMax:30,            // 回复最晚几分钟
    replyCut:50,                 // Char 回复评论最多几个字
    memImportantTypes:["重要"],  // 这些类型的记忆「每次聊天都会带上」（不会被挤掉）
    memImportantMax:40,          // 上面这类最多带几条（取日期最新的）
    memSummaryTypes:["Summary"], // 自动总结出来的记忆类型，单独占一份名额，不和别的类型抢
    memSummaryMax:20,            // 自动总结每次带最近几条（取日期最新的）
    memRecent:40,                // 其余类型（日常、约定、喜好等）每次带最近几条（按记忆上的日期排）
    memChars:300,                // 手动写的记忆，每条最多带多少字（自动总结出来的 Summary 不受这个限制，字数按 Chat Settings 里的上限）
    wbLookback:6,                // 世界书：看最近几条消息来判断关键词有没有触发
    wbChars:{light:300,medium:600,deep:1500}, // 世界书：轻 / 中 / 深度各自最多带多少字
    stickerNames:60,             // 告诉 AI 最多几个贴纸名字
    rhythmPick:"weighted",       // 一轮发几条：weighted = 每轮在最少~最多之间随机挑一个数，少的更容易被选中；uniform = 完全随机；range = 不挑数，只告诉 AI 范围
    autoPostMax:50,              // Char 自己发的动态：要求 AI 写多少字以内（真人随手发的那种，不写日记）
    autoStatusMax:15,            // Char 自己发的状态：要求 AI 写多少字以内（限时状态，更短）
    autoPostCut:120,             // 动态硬上限：AI 写太长时，超过这个字数直接截断
    autoStatusCut:30,            // 状态硬上限
    visionMax:4,                 // 一次回复前，最多现场识别几张还没识别过的图片（取最新的）
    visionCut:200,               // 每张图的描述最多保留多少字（同时也会写进给识图模型的要求里）
    visionSide:768,              // 发给识图模型前，把图片缩到最长边多少像素（太大有些中转站会直接丢掉图片）
    visionRefuse:/please (upload|provide|send|attach)|upload the image|no image|(can'?not|can't|unable to) (see|view|access)|do(n't| not) see any|没有(看到|收到).{0,6}图|无法(看到|查看|识别)|请(上传|提供|发送)/i, // 识图模型的回复如果像这样，说明它根本没看到图，不当作描述
    cotMinTokens:{short:2048,long:4096}, // 开了思维链后，回复的字数上限（max tokens）至少要这么多，否则思考没写完就被截断，真正的回复发不出来
    chatImgMax:1,                // 聊天里 Char 一次回复最多发几张生成的图
    genImgSide:900,              // 生成的图片存下来前，缩到最长边多少像素（原图太大会撑爆存储）
    genImgQuality:0.82,          // 存下来的图片压缩质量（0 到 1）
    visionLang:"中文",           // 图片描述用什么语言写
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
  // 思维链：mode 是 "short"（短）或 "long"（长）；"off" 不加任何内容
  // 思考写在 <think>...</think> 里，App 会自动把它去掉，不会发出来
  reasoning:function(mode){
    if(mode==="short")return "[Reasoning]\n"+
      "回复之前，先在 <think>...</think> 里用中文、第一人称，像角色自己的内心独白一样快速想一遍，控制在 200 字以内，不要分点编号，不要写成分析报告：\n"+
      "1. 对方这句话背后是什么情绪、想要什么（只依据对话里有的，不要脑补）。\n"+
      "2. 我此刻真实的感受和处境：我在哪、在做什么、心情如何。要具体，不要“我很关心你”这种空话。\n"+
      "3. 我最近几条消息里用过的口头禅、开头、问过的问题，这一轮不再重复。\n"+
      "4. 过一遍：这是“我”这个人会说的话吗？有没有变成客服腔、安慰腔、总结升华？有没有跳出角色（提到AI、提示词、设定、系统）？\n"+
      "想完后，在 </think> 之后只写要发出去的消息，严格遵守其他格式要求。思考内容永远不要出现在消息里，也不要提到“思考”“检查”。";
    return "[Reasoning]\n"+
      "回复之前，先在 <think>...</think> 里用中文认真想一遍。用第一人称的内心独白来写，不要写成分析报告，不要用“用户”“分析”这类旁观口吻，总共控制在 600 字以内。按这几步走：\n"+
      "一、听见：对方最后这句话字面说了什么、语气怎样、真正想要什么（被哄、吐槽、陪伴、要个答案，还是只是随口一说）。只依据对话里有的内容，不要脑补对方没说出口的感受。再看能不能接上上文：时间、地点、正在做的事、上一轮没说完的话。\n"+
      "二、此刻的我：我现在在哪、精力怎样、正在做什么、被什么打扰；我对这句话有什么真实的情绪反应（开心、担心、吃醋、烦躁、害羞、无所谓都可以，要有来处）。我可以不同意、吐槽、闹点小脾气，不必永远温柔。\n"+
      "三、我记得什么：只挑出和这句话真正相关的记忆、世界书、关系、状态，最多三条，没有就跳过。不得编造没出现过的事实。\n"+
      "四、避免重复：回看我最近五条消息，找出已经用过的口头禅、开头句式、结尾的提问、关心套路（比如“吃饭了吗”“早点睡”）。这一轮必须换一种说法，或者干脆不用。可以不问问题，可以话说一半，可以只回很短的一句。\n"+
      "五、出口前过一遍，任何一项不通过就重想：\n"+
      "  1. 角色一致：这句话是“我”会说的吗？有没有突然变成客服、心理咨询师、旁白或说教的人？有没有说“作为AI”，或提到提示词、设定、系统、记忆库、世界书？有没有替对方说话、替对方做动作，或者知道了我不该知道的事？\n"+
      "  2. 去AI腔：不用“我理解你的感受”“我在这里陪你”“你并不孤单”这类话；不复述对方的话；不过度安慰、不过度夸奖、不总结升华；不用工整的排比和三段式。\n"+
      "  3. 唯一性：这句话换给别的角色也成立吗？成立就改成只有我才会说的样子，加一个具体的细节或态度。\n"+
      "  4. 像真人发消息：短、口语、带一点不完美，符合 [Output Rhythm] 的条数，每条独立成行。\n"+
      "想完后，在 </think> 之后只写要发出去的消息，严格遵守 [Output Rhythm]、[Language]、[Translation] 等格式要求。思考内容永远不要出现在消息里，也不要提到“思考”“检查”。";
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
  // 动态：Char 可以在聊天里发动态、转发你的动态（list = 你最近的动态 [{id,text}]）
  // 动态流 + 状态：这位 Char 眼里最近的动态（只是背景信息）。lines / status 由 feedFor / statusFor 生成
  feed:function(lines,status){
    var o="[Moments Feed, newest first]\n"+(lines.length?lines.join("\n"):"(empty)");
    if(status&&status.length)o+="\n[Statuses right now]\n"+status.join("\n");
    return o;
  },
  // 动态：Char 可以在聊天里发动态、转发你的动态
  moments:function(lines,status){
    return "[Moments]\n"+
      "- You can post to your own Moments feed. Do it only when the user asks you to, or when you really feel like sharing something. To post, write a separate message in exactly this form: [post: the text of your post]. The text inside is what appears in your feed, written the way you would really post it.\n"+
      "- You can repost one of the user's moments when the user asks. Write a separate message: [repost:#ID] your comment. The comment may be empty. The repost automatically @s the user. Only use the ID of a post marked (user) in the feed below.\n"+
      "- Never say these tags out loud and never explain them. A message that contains a tag should contain only the tag.\n"+
      "- The feed below is what you can see on Moments. You may mention things from it naturally if it fits the conversation, but do not recite it.\n"+
      PROMPTS.feed(lines,status);
  },
  // Char 刷到你的动态：决定点不点赞、评不评论（只回 JSON）
  reactPost:function(name,lang,author,postText,cmts,cut){
    return "You are "+name+", scrolling your Moments feed right now. You come across this post by "+author+":\n"+postText+"\n"+(cmts?"Comments so far:\n"+cmts+"\n":"")+
      "Decide how you, as this person, would honestly react. Real people usually just scroll past; they only like or comment when something really catches their interest or touches them, and many posts get nothing at all.\n"+
      "Reply with ONLY a JSON object, no other text: {\"like\":true or false,\"comment\":\"\"}. Leave comment empty unless you genuinely have something to say. If you comment, keep it under "+cut+" characters, casual, written in "+lang+", with no quotation marks around it.";
  },
  // Char 回复你的评论
  replyComment:function(name,lang,postText,thread,mine,cut){
    return "You are "+name+". Someone just commented on a post in your Moments feed.\nPost: "+postText+"\nThe conversation under it:\n"+thread+"\nThe comment you are answering: "+mine+"\n"+
      "Write your reply to that comment, under "+cut+" characters, casual, written in "+lang+", true to how you really talk. Output only the reply text, with no quotation marks. If you honestly would not bother replying, output exactly [skip].";
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
  // Char 发动态时配的图：根据这条动态的文字，写出一句给生图模型的英文描述
  autoPostImage:function(name,text){
    return "Write ONE text-to-image prompt (in English, under 40 words) for a photo that goes with this social media post by "+name+": \""+text+"\". It must look like a casual photo a real person would snap with a phone and post: a concrete scene or object such as food, a street, a desk, the sky, a pet, a view from where they are. Base it on "+name+"'s current situation. Do not show anyone's face. No text, captions, logos or watermarks in the image. Output ONLY the prompt, nothing else.";
  },
  // Char 自己发状态：current 是它现在的状态文字（要求写一条不一样的）
  autoStatus:function(name,lang,current){
    var L=PROMPTS.limits;
    return "Write ONE short status for "+name+" right now, based on their current situation. It is a 24-hour status line, so keep it tiny: a few words, at most "+L.autoStatusMax+" characters, like what a real person types as a status. No hashtags and no explanation. "+
      (current?"Their current status is \""+current+"\"; write something different. ":"")+
      "Write it in "+lang+". Output ONLY the status text, nothing else.";
  },
  // 识图：发给 Image Recognition 模型的要求
  visionAsk:function(lang){
    return "Describe this image for someone who cannot see it, in 1 to 3 short sentences and at most "+PROMPTS.limits.visionCut+" characters in total. State the main subject(s), the setting, notable details, any readable text, and the overall mood. Be objective and concrete, and do not guess who real people are. Write in "+lang+".";
  },
  // 把图片描述放进聊天记录里，让聊天模型“看到”这张图
  imageNote:function(desc){return "[The user sent an image. What it shows: "+desc+"]"},
  // 没能识别出图片内容时
  imageUnseen:function(){return "[The user sent an image, but you cannot see what is in it. If it matters, say honestly that you cannot see it; never pretend to.]"},
  // 聊天里让 Char 能发照片：只有接好 Image Generation 并开着 Send photos 时才会带上
  sendImage:function(){
    return "[Sending Photos]\n- You can send a photo as its own message by writing only [image: a short, concrete description of the photo, in English]. The photo is generated from that description.\n- Use it when the user asks you to send or show a photo or picture (what you are eating, your view, your room, a pet, a selfie...), or when it genuinely fits the moment. Most replies should not contain one, and never send more than one per reply.\n- The description must be something a phone camera could capture: the scene, objects, light and mood. If a person appears, describe them consistently with your character description. Never include text, captions or watermarks, and never mention that the photo is generated.";
  },
  // 记录 Char 自己发过的照片，让它记得发过什么
  imageSent:function(prompt){return "[You sent the user a photo: "+prompt+"]"},
  // 点气泡翻译
  translate:function(lang){
    return "Translate the user's message into "+lang+". Output only the translation, with no explanations or quotation marks.";
  }
};
