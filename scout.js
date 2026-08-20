(()=>{
  if(window.ProofScout?.mounted)return;

  const POS_KEY='proofscout-orb-pos';
  const PIN_KEY='proofscout-pinned';
  const SIZE=56;
  const PEEK=22;

  const make=(tag,className,text)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=String(text);
    return node;
  };

  function pageText(){
    const root=document.getElementById('proofscout-root');
    const prev=root?.style.display;
    if(root)root.style.display='none';
    const t=document.body?.innerText?.replace(/\s+/g,' ').slice(0,100000)||'';
    if(root)root.style.display=prev||'';
    return t;
  }

  function opportunityScan(){
    const t=pageText(); let score=10; const signals=[];
    const add=(test,points,title,copy,level='warn')=>{if(test){score+=points;signals.push({title,copy,level})}};
    add(/(processing|release|verification|activation|administrative|gas)\s+fee|pay.{0,30}(fee|deposit)|send.{0,20}(crypto|bitcoin|usdt|money)/i.test(t),28,'Payment before access','This page appears to request a fee, deposit or crypto payment before access, approval or prize release.','danger');
    add(/password|one[- ]?time (code|password)|\botp\b|seed phrase|bank login|remote access/i.test(t),34,'Sensitive credential language','Passwords, OTP codes, seed phrases and bank logins should never be sent to an organizer.','danger');
    add(/act now|next \d+ (minutes?|hours?)|immediately|last chance|limited slots|lose your slot|today guarantees/i.test(t),14,'Pressure language','Artificial urgency can prevent independent verification.');
    add(/guaranteed (approval|winner|prize|grant|job)|specially selected|you have won|pre[- ]?approved/i.test(t),16,'Guaranteed outcome','The page implies an outcome before a transparent selection process.');
    add(/(whatsapp|telegram).{0,40}(only|agent)|do not contact|confidential award/i.test(t),12,'Private-channel pressure','The page may discourage normal verification or direct users to a private agent.');
    const saysFree=/free to (enter|join|participate)|no (entry )?fee|no purchase|participation is free/i.test(t);
    const asksFee=/(processing|registration|release|verification|activation|administrative|gas)\s+fee/i.test(t);
    add(saysFree&&asksFee,22,'Contradictory fee claims','The page says entry is free but also mentions a separate fee.','danger');
    if(/official rules|judging criteria|terms and conditions|privacy policy/i.test(t)){score-=8;signals.push({title:'Published-process language',copy:'Rules, criteria or privacy terms are mentioned. Confirm that they belong to the real organizer.',level:'safe'})}
    if(saysFree){score-=5;signals.push({title:'No-fee statement',copy:'The page explicitly describes participation as free. Confirm this in official rules.',level:'safe'})}
    score=Math.max(0,Math.min(100,score));
    return {score,signals,textLength:t.length,headline:score>=65?'High-risk page signals':score>=35?'Verify before continuing':'No major pressure pattern',copy:score>=65?'Do not pay or share sensitive credentials until the real organizer independently confirms this page.':score>=35?'This page needs more independent verification before you act.':'The wording has fewer common danger patterns, but legitimacy is not guaranteed.'};
  }

  function urlScan(){
    const u=new URL(location.href), signals=[];let score=0;
    const add=(test,points,title,copy,level='warn')=>{if(test){score+=points;signals.push({title,copy,level})}};
    add(u.protocol!=='https:',30,'Connection is not encrypted','Information entered on this page can be exposed in transit.','danger');
    add(/^\d{1,3}(?:\.\d{1,3}){3}$/.test(u.hostname),22,'Raw IP address','Public services normally use a recognizable domain, not a numeric IP address.','danger');
    add(u.hostname.includes('xn--'),16,'Internationalized domain encoding','Punycode can be legitimate, but it is also used for look-alike domains. Verify each character.');
    add((u.hostname.match(/-/g)||[]).length>=3,10,'Heavily hyphenated domain','Multiple hyphens can imitate an official-looking web address.');
    add(u.hostname.split('.').length>=5,10,'Deep subdomain chain','Read the registered domain from right to left; brand words in subdomains do not prove ownership.');
    add(/@/.test(location.href),28,'User information inside URL','Text before an @ symbol can disguise the destination host.','danger');
    add(!['','80','443'].includes(u.port),8,'Unusual network port',`This page uses port ${u.port}. Confirm that the service intentionally uses it.`);
    add(/login|verify|secure|account|wallet|prize|grant|winner/i.test(u.hostname)&&!/(google|microsoft|github|devpost)\./i.test(u.hostname),8,'Trust words in domain','Words such as “secure” or “verify” are claims, not proof of ownership.');
    if(u.protocol==='https:')signals.push({title:'Encrypted connection',copy:'HTTPS protects the connection, but it does not prove the organization is genuine.',level:'safe'});
    score=Math.min(100,score);
    return {score,signals,domain:u.hostname,protocol:u.protocol.replace(':',''),headline:score>=50?'URL needs careful verification':score?'Review these URL signals':'No obvious URL anomaly',copy:'Read the true domain from right to left and compare it with the organizer’s independently located website.'};
  }

  function bugScan(){
    const issues=[]; const add=(nodes,severity,title,copy)=>{if(nodes.length)issues.push({nodes,severity,title,copy,count:nodes.length})};
    const broken=[...document.images].filter(i=>i.complete&&i.naturalWidth===0);
    add(broken,'danger','Broken images','Images failed to load and may hide important instructions or indicate a deployment problem.');
    const mixed=[...document.querySelectorAll('[src],[href]')].filter(e=>{
      const attr=e.hasAttribute('src')?'src':'href';
      return location.protocol==='https:'&&/^http:\/\//i.test(e.getAttribute(attr)||'');
    });
    add(mixed,'danger','Mixed or insecure resources','HTTPS pages should not load active resources over unencrypted HTTP.');
    const insecureForms=[...document.forms].filter(f=>{try{return new URL(f.action||location.href,location.href).protocol==='http:'}catch{return false}});
    add(insecureForms,'danger','Insecure form destination','A form appears to submit information over HTTP. Do not enter sensitive data.');
    const unlabeled=[...document.querySelectorAll('input:not([type="hidden"]),select,textarea')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!e.title);
    add(unlabeled,'warn','Unlabelled form controls','Some fields may be difficult to understand with assistive technology.');
    const emptyActions=[...document.querySelectorAll('button,a[href]')].filter(e=>!(e.innerText||e.getAttribute('aria-label')||e.title||'').trim()&&!e.querySelector('img[alt]'));
    add(emptyActions,'warn','Unnamed buttons or links','Interactive controls without accessible names are difficult for screen-reader and voice users.');
    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id).filter(Boolean);const dup=new Set(ids.filter((id,i)=>ids.indexOf(id)!==i));
    add([...dup].flatMap(id=>[...document.querySelectorAll('#'+CSS.escape(id))]),'warn','Duplicate element IDs','Repeated IDs can break labels, scripts, navigation and automated testing.');
    const blankTargets=[...document.querySelectorAll('a[target="_blank"]:not([rel~="noopener"])')];
    add(blankTargets,'warn','New-tab links lack isolation','Links opening new tabs should use rel="noopener" to reduce opener attacks.');
    const heading=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];const gaps=heading.filter((h,i)=>i&&Number(h.tagName[1])>Number(heading[i-1].tagName[1])+1);
    add(gaps,'warn','Heading levels are skipped','A broken heading outline makes page structure harder to navigate.');
    if(!document.documentElement.lang)issues.push({nodes:[document.documentElement],severity:'warn',title:'Page language missing',copy:'The HTML element has no language, which affects pronunciation and translation.',count:1});
    if(!document.title.trim())issues.push({nodes:[document.documentElement],severity:'warn',title:'Document title missing',copy:'A meaningful title helps users identify browser tabs and history.',count:1});
    if(!document.querySelector('meta[name="viewport"]'))issues.push({nodes:[document.head],severity:'warn',title:'Mobile viewport missing',copy:'The page may render poorly on phones.',count:1});
    const passwordHttp=[...document.querySelectorAll('input[type="password"]')].filter(()=>location.protocol!=='https:');
    add(passwordHttp,'danger','Password field on insecure page','Do not enter a password on an HTTP page.');
    const danger=issues.filter(i=>i.severity==='danger').reduce((n,i)=>n+i.count,0), warnings=issues.filter(i=>i.severity==='warn').reduce((n,i)=>n+i.count,0);
    const score=Math.min(100,danger*18+warnings*4);
    return {score,issues,danger,warnings,headline:danger?'Security-impacting page problems':warnings?'Quality and accessibility bugs found':'No common DOM bug detected',copy:danger?'Avoid sensitive actions until the security-impacting issues are fixed.':warnings?'The page works, but these issues can exclude users or break interactions.':'Automated checks cannot find every bug; manual testing is still necessary.'};
  }

  function loadPos(){
    try{
      const saved=JSON.parse(localStorage.getItem(POS_KEY)||'null');
      if(saved&&(saved.edge==='left'||saved.edge==='right')&&typeof saved.y==='number')return saved;
    }catch{}
    return {edge:'right', y:0.38};
  }

  function savePos(pos){
    try{localStorage.setItem(POS_KEY,JSON.stringify(pos))}catch{}
  }

  let root, panel, orb, body, active='opportunity', lastSummary='', peekTimer=null, pos=loadPos();
  let dragging=false, moved=false, startX=0, startY=0, origX=0, origY=0;

  function applyPos(){
    if(!root)return;
    const maxY=Math.max(8, window.innerHeight-SIZE-8);
    const y=Math.min(maxY, Math.max(8, pos.y*window.innerHeight));
    root.style.top=y+'px';
    root.style.bottom='auto';
    if(pos.edge==='left'){
      root.style.left='0px';
      root.style.right='auto';
      root.classList.add('ps-left');
      root.classList.remove('ps-right');
    }else{
      root.style.left='auto';
      root.style.right='0px';
      root.classList.add('ps-right');
      root.classList.remove('ps-left');
    }
  }

  function schedulePeek(){
    clearTimeout(peekTimer);
    root?.classList.remove('ps-peek');
    if(panel?.classList.contains('ps-open')||dragging)return;
    peekTimer=setTimeout(()=>root?.classList.add('ps-peek'),2200);
  }

  function status(msg){
    const node=root?.querySelector('#ps-status');
    if(!node)return;
    node.textContent=msg;
    setTimeout(()=>{if(root?.querySelector('#ps-status'))root.querySelector('#ps-status').textContent='Ready'},2500);
  }

  function appendHero(headline,copy,score,suffix,level){
    const hero=make('div',`ps-hero ${level||''}`),scoreRow=make('div','ps-score');
    scoreRow.append(make('strong','',headline),make('span','',`${score}/100 ${suffix}`));
    hero.append(scoreRow,make('p','',copy));body.append(hero);
  }
  function appendStats(items){
    const grid=make('div','ps-stat-grid');
    items.forEach(([label,value])=>{const stat=make('div','ps-stat');stat.append(make('span','',label),make('strong','',String(value)));grid.append(stat)});
    body.append(grid);return grid;
  }
  function appendSignal(s,enableHighlight=false){
    const row=make('div',`ps-signal ${s.level==='danger'?'ps-danger':s.level==='warn'?'ps-warn':''}`),dot=make('span','ps-dot',s.level==='safe'?'✓':'!');
    const details=make('div');
    details.append(make('strong','',`${s.title}${s.count?` · ${s.count}`:''}`),make('p','',s.copy));
    if(enableHighlight&&s.nodes?.length){
      const button=make('button','ps-secondary','Show on page');
      button.type='button';
      button.addEventListener('click',()=>{
        document.querySelectorAll('.proofscout-highlight').forEach(e=>e.classList.remove('proofscout-highlight'));
        s.nodes.slice(0,15).forEach(e=>e?.classList?.add('proofscout-highlight'));
        s.nodes[0]?.scrollIntoView?.({behavior:'smooth',block:'center'});
        status(`${s.count} element${s.count===1?'':'s'} highlighted`);
      });
      details.append(button);
    }
    row.append(dot,details);body.append(row);
  }
  function appendSectionTitle(text){body.append(make('div','ps-section-title',text))}
  function appendEmpty(text){body.append(make('div','ps-empty',text))}

  function render(tab){
    active=tab;body.replaceChildren();
    root.querySelectorAll('.ps-tab').forEach(b=>b.classList.toggle('ps-active',b.dataset.tab===tab));
    if(tab==='opportunity'){
      const r=opportunityScan();lastSummary=`ProofScout found a risk score of ${r.score} out of 100. ${r.headline}. ${r.copy}`;
      appendHero(r.headline,r.copy,r.score,'risk',r.score>=65?'ps-danger':r.score>=35?'ps-warn':'');
      appendStats([['Page words checked',Math.round(r.textLength/5).toLocaleString()],['Signals explained',r.signals.length]]);
      appendSectionTitle('Page signals');
      if(r.signals.length)r.signals.forEach(s=>appendSignal(s));else appendEmpty('No common opportunity-pressure phrase was detected. Verify the organizer independently.');
      const copyButton=make('button','ps-action');copyButton.type='button';
      copyButton.append(make('span','','Copy verification questions'),make('span','','→'));body.append(copyButton);
      copyButton.addEventListener('click',()=>navigator.clipboard.writeText('I am independently verifying this page before I continue. Please confirm the official deadline, eligibility, complete rules, all fees, the authorized application domain, and the correct organizer contact through an official channel. For security, I will not send passwords, OTP codes, seed phrases or banking logins.').then(()=>status('Questions copied')).catch(()=>status('Clipboard blocked')));
    }else if(tab==='url'){
      const r=urlScan();lastSummary=`URL check for ${r.domain}. Risk score ${r.score} out of 100. ${r.headline}. ${r.copy}`;
      appendHero(r.headline,r.copy,r.score,'risk',r.score>=50?'ps-danger':r.score?'ps-warn':'');
      body.append(make('div','ps-url',location.href));
      const grid=appendStats([['Protocol',r.protocol.toUpperCase()],['Domain labels',r.domain.split('.').length]]);
      grid.style.marginTop='8px';appendSectionTitle('URL signals');r.signals.forEach(s=>appendSignal(s));
    }else{
      const r=bugScan();lastSummary=`Bug doctor found ${r.danger} security-impacting problems and ${r.warnings} quality or accessibility problems. ${r.copy}`;
      appendHero(r.headline,r.copy,r.score,'severity',r.danger?'ps-danger':r.warnings?'ps-warn':'');
      appendStats([['Security-impacting',r.danger],['Quality / access',r.warnings]]);appendSectionTitle('Diagnosed issues');
      if(r.issues.length)r.issues.forEach(s=>appendSignal(s,true));else appendEmpty('No common structural bug found. Test interactions, content accuracy and server behavior manually.');
    }
    orb.classList.toggle('ps-alert', (tab==='opportunity'?opportunityScan():tab==='url'?urlScan():bugScan()).score>=65);
  }

  function togglePanel(){
    panel.classList.toggle('ps-open');
    if(panel.classList.contains('ps-open')){
      root.classList.remove('ps-peek');
      render(active);
    }else schedulePeek();
  }

  function unmount(){
    clearTimeout(peekTimer);
    root?.remove();
    root=panel=orb=body=null;
    window.ProofScout.mounted=false;
    try{localStorage.removeItem(PIN_KEY)}catch{}
    document.getElementById('mobileInstallBar')?.classList.remove('ps-hidden');
  }

  function bindDrag(){
    orb.addEventListener('pointerdown',e=>{
      if(e.button&&e.button!==0)return;
      dragging=true; moved=false;
      startX=e.clientX; startY=e.clientY;
      const r=root.getBoundingClientRect();
      origX=r.left; origY=r.top;
      root.classList.add('ps-dragging');
      root.classList.remove('ps-peek');
      orb.setPointerCapture(e.pointerId);
    });
    orb.addEventListener('pointermove',e=>{
      if(!dragging)return;
      const dx=e.clientX-startX, dy=e.clientY-startY;
      if(!moved && Math.hypot(dx,dy)<8)return;
      moved=true;
      panel.classList.remove('ps-open');
      let x=origX+dx, y=origY+dy;
      x=Math.min(window.innerWidth-SIZE, Math.max(0,x));
      y=Math.min(window.innerHeight-SIZE, Math.max(8,y));
      root.style.left=x+'px';
      root.style.right='auto';
      root.style.top=y+'px';
    });
    const end=e=>{
      if(!dragging)return;
      dragging=false;
      root.classList.remove('ps-dragging');
      try{orb.releasePointerCapture(e.pointerId)}catch{}
      if(!moved){togglePanel();return}
      const r=root.getBoundingClientRect();
      pos.edge=(r.left+r.width/2)<window.innerWidth/2?'left':'right';
      pos.y=r.top/window.innerHeight;
      savePos(pos);
      applyPos();
      schedulePeek();
    };
    orb.addEventListener('pointerup',end);
    orb.addEventListener('pointercancel',end);
  }

  function mount(opts={}){
    if(document.getElementById('proofscout-root')){
      window.ProofScout.mounted=true;
      return window.ProofScout;
    }
    root=make('div');root.id='proofscout-root';
    panel=make('div');panel.id='proofscout-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','ProofScout page assistant');
    const head=make('div','ps-head'),mark=make('span','ps-mark','P'),title=make('div','ps-title');
    title.append(make('strong','','Scout'),make('span','','Checks the page in front of you'));
    const iconButton=(id,label,titleText)=>{const b=make('button','ps-icon',label);b.id=id;b.type='button';b.title=titleText;return b};
    head.append(mark,title,iconButton('ps-speak','◖','Read summary aloud'),iconButton('ps-mic','●','Voice command'),iconButton('ps-close','×','Close'));
    const tabs=make('div','ps-tabs');
    [['opportunity','Opportunity'],['url','URL'],['bugs','Bug doctor']].forEach(([id,label],i)=>{
      const b=make('button',`ps-tab${i===0?' ps-active':''}`,label);b.type='button';b.dataset.tab=id;tabs.append(b);
    });
    body=make('div','ps-body');body.id='ps-body';
    const footer=make('div','ps-footer'),statusNode=make('span','ps-listen','Ready');statusNode.id='ps-status';
    const unpin=make('button','ps-unpin','Hide circle');unpin.type='button';
    footer.append(make('span','','On-device · no upload'), statusNode);
    if(opts.canUnpin!==false)footer.append(unpin);
    panel.append(head,tabs,body,footer);
    orb=make('button','','P');orb.id='proofscout-orb';orb.type='button';
    orb.setAttribute('aria-label','Open ProofScout');orb.title='Drag to the edge. Tap to scan this page.';
    root.append(panel,orb);
    document.documentElement.appendChild(root);
    applyPos();
    bindDrag();
    unpin.addEventListener('click',()=>{unmount();window.ProofScout.onUnpin?.()});
    root.querySelector('#ps-close').addEventListener('click',()=>{panel.classList.remove('ps-open');schedulePeek()});
    root.querySelectorAll('.ps-tab').forEach(b=>b.addEventListener('click',()=>render(b.dataset.tab)));
    root.querySelector('#ps-speak').addEventListener('click',()=>{
      speechSynthesis.cancel();
      const utter=new SpeechSynthesisUtterance(lastSummary||'Open a scan first.');
      utter.rate=.96;speechSynthesis.speak(utter);status('Reading summary');
    });
    root.querySelector('#ps-mic').addEventListener('click',()=>{
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR){status('Voice commands unavailable');return}
      const rec=new SR();rec.lang='en-US';rec.interimResults=false;status('Listening…');
      rec.onresult=e=>{
        const q=e.results[0][0].transcript.toLowerCase();
        if(/bug|diagnose|site health/.test(q))render('bugs');
        else if(/url|link|domain/.test(q))render('url');
        else if(/close|hide/.test(q))panel.classList.remove('ps-open');
        else render('opportunity');
        status('Heard: '+q);
      };
      rec.onerror=()=>status('Could not hear command');rec.start();
    });
    window.addEventListener('resize',()=>{applyPos()});
    try{
      const quick=opportunityScan();
      if(quick.score>=65)orb.classList.add('ps-alert');
    }catch{}
    if(opts.persist!==false){try{localStorage.setItem(PIN_KEY,'1')}catch{}}
    document.getElementById('mobileInstallBar')?.classList.add('ps-hidden');
    schedulePeek();
    window.ProofScout.mounted=true;
    return window.ProofScout;
  }

  window.ProofScout={
    mount, unmount, mounted:false,
    isPinned(){try{return localStorage.getItem(PIN_KEY)==='1'}catch{return false}}
  };

  if(!window.ProofScoutManual) mount({canUnpin:false, persist:false});
})();
