'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const pages = [...document.querySelectorAll('.page')];
  let deck = false, pageIndex = 0, client = 'tmux', slide = 0;
  const gallery = window.SHOWCASE_GALLERY || {tmux:[],remote:[],windows:[]};
  const scenes = {
    bed: {title:'电脑离手，任务不用重新开。',text:'打开已有窗口，看看结果；把遗漏的要求补上，或者让 Agent 先停在检查阶段。长任务仍在服务器端，网络恢复后按原会话继续读取。',doc:'docs/clients-build.md',steps:[['手机','打开已有窗口','筛选 Agent，读取状态'],['服务器','继续原任务','保留会话与请求编号'],['手机','看结果、补要求','确认下一步再执行']]},
    bug: {title:'客户端问题出现，手机里安排修复。',text:'报告 Remote/Tmux 本身的 Bug，或提出客户端新功能。授权远程 Agent 修客户端代码，服务器完成测试、构建与确认发布，再在应用内升级。反馈接收和更新入口已验收；全自动修复 worker 尚未验收。',doc:'docs/updates-feedback.md',steps:[['手机','报告本客户端 Bug / 功能','截图、说明、私有回执'],['授权 Agent / 服务器','改代码、测试、构建','独立分支和发布确认'],['手机 / Windows','应用内检查并升级','核对版本和正式更新包']]},
    file: {title:'文件传上去，再补一句要求。',text:'选择普通文件或图片，检查附件栏后发送。上传结果不确定时读取原回执；处理后的临时副本按引用关系清理，原文件和共享项目资料保留。',doc:'docs/attachments-cache.md',steps:[['手机 / Windows','选择附件','检查名称、进度与能力'],['服务器','保存受控私有副本','请求编号和摘要可核对'],['会话 / 缓存','引用、使用、释放','待发送和使用中不清理']]}
  };
  const clientInfo = {
    tmux:{version:'Android Tmux · 0.1.65',title:'窗口留在服务器，手机随时接回来。',desc:'一行可横向拖动的标签切换 Agent。图片和普通文件进入附件栏；草稿、复用和活动附件都有清理保护。'},
    remote:{version:'Android Remote · 3.29.0',title:'早期会话路线，首次搭建可以跳过。',desc:'Remote 已集成较多会话、统计与管理功能；作者为保持 Tmux 精简仍将两者并用。新搭建先选 Tmux，需要独立会话产品时再考虑 Remote。'},
    windows:{version:'Windows · 0.3.0',title:'电脑上继续使用同一套服务。',desc:'查看窗口、继续对话、传文件，分别检查应用与 Agent 的更新。正式安装前核对版本和摘要，保留登录与草稿。'}
  };
  const nodes = {
    clients:['客户端：把操作带到手机与电脑。','客户端不是模型运行位置。它显示服务端能力和状态，保留本地草稿，断网恢复时读取原会话，不把未知写入直接重发。','docs/clients-build.md'],
    gateway:['网关：让外部请求有明确边界。','域名和 HTTPS 提供入口，鉴权在服务端执行；上传大小、超时、流式响应和跨源行为分别受控。上游模型密钥不下发到手机。','docs/backend-build.md'],
    sessions:['会话服务：知道哪个请求做到了哪一步。','持久记录请求编号、事件序号和回执；断网后按原 ID 恢复。结构化会话与 tmux 窗口各有状态机，不从最后一行终端文字猜测所有状态。','docs/contracts.md'],
    adapters:['适配层：翻译协议，也翻译能力。','使用合法 CLI 登录或 API 配置，映射发送、取消、事件、思考和上下文参数。模型 API 不自动获得执行工具的能力。Kimi 等新提供方单独验收。','docs/agent-adapters.md'],
    storage:['存储：持久结果与临时输入分开。','私有上传有摘要、引用、租约和有界容量。待发送、复用、正在使用和未知归属不会被误清理；共享项目副本不归临时 GC 管理。','docs/attachments-cache.md'],
    isolation:['隔离：共享项目，保留私有边界。','Agent 使用容器或 VM 等隔离边界，自己的配置和凭据独立。共享区可按项目授权写入；不能借共享区读取其他 Agent 的私有环境或获得任意提权。','docs/architecture.md'],
    models:['模型服务：使用你自己的账号。','基础路线连接外部模型，因此不强制 GPU。订阅、CLI 和 API 的资格及费用分别确认；自托管模型另外计算硬件和电力。','docs/costs.md']
  };
  function pressed(selector, key, value) {
    document.querySelectorAll(selector).forEach(b => b.setAttribute('aria-pressed',String(b.dataset[key]===value)));
  }
  document.querySelectorAll('[data-scene]').forEach(b => b.addEventListener('click',()=>{
    const data=scenes[b.dataset.scene]; pressed('[data-scene]','scene',b.dataset.scene);
    $('scene-number').textContent=String(Object.keys(scenes).indexOf(b.dataset.scene)+1).padStart(2,'0');
    $('scene-title').textContent=data.title; $('scene-text').textContent=data.text; $('scene-doc').href=data.doc;
    $('scene-steps').replaceChildren(...data.steps.map(row=>{const li=document.createElement('li');['span','b','small'].forEach((tag,i)=>{const e=document.createElement(tag);e.textContent=row[i];li.append(e)});return li}));
  }));
  document.querySelectorAll('.topology [data-node]').forEach(b => b.addEventListener('click',()=>{
    const row=nodes[b.dataset.node]; pressed('.topology [data-node]','node',b.dataset.node);
    document.querySelectorAll('.topology [data-node]').forEach(el=>el.classList.toggle('selected',el===b));
    $('node-title').textContent=row[0];$('node-text').textContent=row[1];$('node-doc').href=row[2];
  }));
  function showImage(index=0) {
    const rows=gallery[client]||[];slide=index;const row=rows[index];
    if(!row){$('tour-image').hidden=true;$('tour-loading').hidden=false;return}
    $('tour-image').src=row.src;$('tour-image').alt=row.alt||row.title;$('tour-image').hidden=false;$('tour-loading').hidden=true;
    $('tour-caption').textContent=row.description||'真实界面，合成演示数据。';
    $('tour-image-caption').textContent=(row.caption||'真实原生界面 · 合成演示数据')+' · 点击放大';
    [...$('tour-controls').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  }
  function showClient(name) {
    client=name;slide=0;const info=clientInfo[name];pressed('[data-client]','client',name);
    $('tour-version').textContent=info.version+' · 合成演示数据';$('tour-title').textContent=info.title;$('tour-desc').textContent=info.desc;
    $('tour-controls').replaceChildren(...(gallery[name]||[]).map((row,i)=>{const b=document.createElement('button');const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');b.append(n,document.createTextNode(row.title));b.addEventListener('click',()=>showImage(i));return b}));
    showImage();
  }
  document.querySelectorAll('[data-client]').forEach(b=>b.addEventListener('click',()=>showClient(b.dataset.client)));
  showClient('tmux');
  const first=(gallery.tmux||[])[0];if(first){$('hero-shot').src=first.src;$('hero-shot').alt=first.alt||first.title;$('hero-shot').hidden=false;$('hero-demo').hidden=true}
  $('image-open').addEventListener('click',()=>{const row=(gallery[client]||[])[slide];if(!row)return;$('dialog-image').src=row.src;$('dialog-image').alt=row.alt||row.title;$('dialog-caption').textContent=row.caption||row.description||row.title;$('image-dialog').showModal()});
  $('image-close').addEventListener('click',()=>$('image-dialog').close());
  $('image-dialog').addEventListener('click',e=>{if(e.target===$('image-dialog'))$('image-dialog').close()});
  function parameters(){$('parameter-preview').textContent=`effort = ${$('effort').value} · context_limit = ${$('context').value}`}
  $('effort').addEventListener('change',parameters);$('context').addEventListener('change',parameters);
  const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2});
  function value(id){const el=$(id),n=Number(el.value);return Number.isFinite(n)?Math.max(Number(el.min||0),Math.min(Number(el.max||1000000),n)):0}
  function cost(){const server=value('server-cost'),domain=value('domain-cost'),backup=value('backup-cost'),ai=value('ai-cost'),exchange=value('exchange');const month=server+domain/12+backup+ai;
    $('monthly-usd').textContent=money.format(month);$('monthly-cny').textContent=`约 ¥${(month*exchange).toFixed(2)} / 月`;
    $('cost-server-line').textContent=money.format(server)+' / 月';$('cost-domain-line').textContent=money.format(domain/12)+' / 月';$('cost-backup-line').textContent=money.format(backup)+' / 月';$('cost-ai-line').textContent=ai?money.format(ai)+' / 月':'未计入';$('annual-usd').textContent=money.format(server*12+domain+backup*12+ai*12);
  }
  $('cost-form').addEventListener('input',cost);$('cost-form').addEventListener('change',cost);$('cost-form').addEventListener('submit',e=>e.preventDefault());cost();
  $('copy-prompt').addEventListener('click',async()=>{const text=$('build-prompt').textContent;try{await navigator.clipboard.writeText(text);$('copy-status').textContent='已复制。完整约定请连同公开仓库一起交给你的 AI。'}catch{const r=document.createRange();r.selectNodeContents($('build-prompt'));const s=window.getSelection();s.removeAllRanges();s.addRange(r);$('copy-status').textContent='已选中任务书；使用系统复制操作即可。'}});
  $('print-button').addEventListener('click',()=>window.print());
  function activate(index){pageIndex=Math.max(0,Math.min(pages.length-1,index));pages.forEach((p,i)=>p.classList.toggle('active',i===pageIndex));$('page-counter').textContent=`${pageIndex+1} / ${pages.length}`;$('prev-page').disabled=pageIndex===0;$('next-page').disabled=pageIndex===pages.length-1;if(deck){history.replaceState(null,'','#'+pages[pageIndex].id);window.scrollTo({top:0,behavior:'instant'})}}
  function jumpToAnchor(hash){const target=document.getElementById(hash.slice(1));const index=pages.indexOf(target?.closest('.page'));if(index<0)return false;activate(index);if(target!==pages[index]){history.replaceState(null,'',hash);target.scrollIntoView({behavior:'instant',block:'start'})}return true}
  function hashPage(){jumpToAnchor(location.hash)}
  $('mode-button').addEventListener('click',()=>{if(!deck){const headerBottom=document.querySelector('.topbar').getBoundingClientRect().bottom;const visible=pages.map(p=>{const r=p.getBoundingClientRect();return Math.max(0,Math.min(r.bottom,window.innerHeight)-Math.max(r.top,headerBottom))});pageIndex=visible.indexOf(Math.max(...visible))}deck=!deck;document.body.classList.toggle('deck',deck);$('deck-controls').hidden=!deck;$('mode-button').setAttribute('aria-pressed',String(deck));$('mode-button').textContent=deck?'长页阅读':'演示模式';activate(pageIndex);if(!deck)pages[pageIndex].scrollIntoView({behavior:'instant'})});
  $('prev-page').addEventListener('click',()=>activate(pageIndex-1));$('next-page').addEventListener('click',()=>activate(pageIndex+1));
  window.addEventListener('hashchange',()=>{if(deck)hashPage()});
  document.addEventListener('keydown',e=>{if(!deck||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||$('image-dialog').open)return;if(['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();activate(pageIndex+1)}else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();activate(pageIndex-1)}});
  document.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(!deck||!link)return;if(jumpToAnchor(link.getAttribute('href')))e.preventDefault()});
  activate(0);
})();
