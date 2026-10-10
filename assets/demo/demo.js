'use strict';
(() => {
  const chapters=window.DEMO_SCENARIOS, secondsPerStep=4;
  const scenes=[];let cursor=0;
  chapters.forEach((chapter,chapterIndex)=>{chapter.start=cursor;chapter.steps.forEach((step,stepIndex)=>{scenes.push({...step,chapterIndex,stepIndex,start:cursor,end:cursor+secondsPerStep});cursor+=secondsPerStep});chapter.end=cursor});
  const duration=cursor,$=id=>document.getElementById(id);
  let time=0,playing=false,last=0,rendered=-1;
  const format=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
  function render(force=false){
    const index=Math.min(scenes.length-1,Math.floor(time/secondsPerStep)),scene=scenes[index],chapter=chapters[scene.chapterIndex];
    $('timeline').value=String(time);$('time-readout').textContent=`${format(time)} / ${format(duration)}`;
    if(!force&&index===rendered)return;rendered=index;
    $('scene-title').textContent=scene.title;$('scene-number').textContent=`${String(scene.stepIndex+1).padStart(2,'0')} / ${String(chapter.steps.length).padStart(2,'0')}`;$('chapter-label').textContent=chapter.label;$('narration').textContent=scene.text;
    $('flow-board').hidden=scene.chapterIndex!==0;$('worktree-board').hidden=scene.chapterIndex!==1;$('fix-board').hidden=scene.chapterIndex!==2;
    document.querySelectorAll('button[data-chapter]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.chapter)===scene.chapterIndex)));
    document.querySelectorAll('[data-node]').forEach(n=>{n.classList.toggle('is-active',(scene.active||[]).includes(n.dataset.node));n.classList.toggle('is-done',(scene.done||[]).includes(n.dataset.node))});
    const chapterState={};
    for(let i=0;i<=scene.stepIndex;i++)Object.assign(chapterState,chapter.steps[i]);
    [['gateway-state','gateway','等待发送'],['broker-state','broker','等待交付'],['agent-state','agent','等待原生确认'],['event-state','events','按序记录，再向客户端推送'],['resume-state','resume','读原请求与缺失事件，不重发未知写入'],['windows-state','windows','服务端任务与手机连接分别保留'],['merge-state','merge','A → B → C · 保留各分支提交'],['test-state','tests','检查契约、冲突与真实回归'],['review-state','review','补丁 + 测试证据 + 剩余限制'],['permission-state','permission','需明确授权修复'],['build-state','build','构建 / 发布分别需授权'],['update-state','update','查看已验收版本 → 下载 → 系统确认']].forEach(([id,key,fallback])=>$(id).textContent=chapterState[key]??fallback);
    document.querySelectorAll('.worker-state').forEach(n=>n.textContent=chapterState.workers??'候选任务');
    document.body.dataset.chapter=chapter.id;document.body.dataset.step=String(scene.stepIndex);
  }
  function pause(){playing=false;document.body.classList.add('paused');$('play-toggle').textContent='播放';$('play-toggle').setAttribute('aria-label','播放演示')}
  function play(){if(time>=duration)time=0;playing=true;last=performance.now();document.body.classList.remove('paused');$('play-toggle').textContent='暂停';$('play-toggle').setAttribute('aria-label','暂停演示');render()}
  function seek(value){time=Math.max(0,Math.min(duration,Number(value)||0));last=performance.now();render(true)}
  function chapter(index){pause();seek(chapters[index].start)}
  function tick(now){if(playing){time=Math.min(duration,time+Math.max(0,now-last)/1000);last=now;render();if(time>=duration)pause()}requestAnimationFrame(tick)}
  $('timeline').max=String(duration);$('timeline').addEventListener('input',()=>{pause();seek($('timeline').value)});
  $('play-toggle').addEventListener('click',()=>playing?pause():play());$('restart').addEventListener('click',()=>{seek(0);play()});
  document.querySelectorAll('button[data-chapter]').forEach(b=>b.addEventListener('click',()=>chapter(Number(b.dataset.chapter))));
  document.addEventListener('keydown',e=>{if(/INPUT|BUTTON|VIDEO|A/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();playing?pause():play()}else if(e.code==='ArrowRight'){e.preventDefault();pause();seek(time+4)}else if(e.code==='ArrowLeft'){e.preventDefault();pause();seek(time-4)}});
  if(new URLSearchParams(location.search).get('record')==='1')document.body.classList.add('record-mode');
  window.Demo=Object.freeze({play,pause,seek,chapter,state:()=>({time,duration,playing,chapter:document.body.dataset.chapter,step:Number(document.body.dataset.step),synthetic:true,realServiceActions:0})});
  render(true);requestAnimationFrame(tick);
})();
