(()=>{
  if(window.__proofScoutLoaded)return; window.__proofScoutLoaded=true;
  const PS_ID='proofscout-root';
  const safeText=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const pageText=()=>document.body?.innerText?.replace(/\s+/g,' ').slice(0,100000)||'';

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
    const mixed=[...document.querySelectorAll('[src],[href]')].filter(e=>location.protocol==='https:'&&/^(src|href)$/i.test(e.hasAttribute('src')?'src':'href')&&/^http:\/\//i.test(e.getAttribute(e.hasAttribute('src')?'src':'href')||''));
    add(mixed,'danger','Mixed or insecure resources','HTTPS pages should not load active resources over unencrypted HTTP.');
    const insecureForms=[...document.forms].filter(f=>{try{return new URL(f.action||location.href,location.href).protocol==='http:'}catch{return false}});
    add(insecureForms,'danger','Insecure form destination','A form appears to submit information over HTTP. Do not enter sensitive data.');
    const unlabeled=[...document.querySelectorAll('input:not([type="hidden"]),select,textarea')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!e.title);
    add(unlabeled,'warn','Unlabelled form controls','Some fields may be difficult to understand with assistive technology.');
    const emptyActions=[...document.querySelectorAll('button,a[href]')].filter(e=>!(e.innerText||e.getAttribute('aria-label')||e.title||'').trim()&&!e.querySelector('img[alt]'));
    add(emptyActions,'warn','Unnamed buttons or links','Interactive controls without accessible names are difficult for screen-reader and voice users.');
    const ids=[...document.querySelectorAll('[id]')].map(e=>e.id).filter(Boolean);const dup=new Set(ids.filter((id,i)=>ids.indexOf(id)!==i));
    add([...dup].flatMap(id=>[...document.querySelectorAll(`#${CSS.escape(id)}`)]),'warn','Duplicate element IDs','Repeated IDs can break labels, scripts, navigation and automated testing.');
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

  const root=document.createElement('div');root.id=PS_ID;
  root.innerHTML=`<div id="proofscout-panel" role="dialog" aria-label="ProofScout page assistant"><div class="ps-head"><span class="ps-mark">P</span><div class="ps-title"><strong>Scout</strong><span>Private page intelligence</span></div><button class="ps-icon" id="ps-speak" title="Read summary aloud">◖</button><button class="ps-icon" id="ps-mic" title="Voice command">●</button><button class="ps-icon" id="ps-close" aria-label="Close">×</button></div><div class="ps-tabs"><button class="ps-tab ps-active" data-tab="opportunity">Opportunity</button><button class="ps-tab" data-tab="url">URL</button><button class="ps-tab" data-tab="bugs">Bug doctor</button></div><div class="ps-body" id="ps-body"></div><div class="ps-footer"><span>On-device analysis · no upload</span><span class="ps-listen" id="ps-status">Ready</span></div></div><button id="proofscout-orb" aria-label="Open ProofScout page assistant" title="Ask Scout about this page">P</button>`;
  document.documentElement.appendChild(root);
  const panel=root.querySelector('#proofscout-panel'), body=root.querySelector('#ps-body'), orb=root.querySelector('#proofscout-orb');
  let active='opportunity', lastSummary='';
  const signalHTML=(s,i)=>`<div class="ps-signal ${s.level==='danger'?'ps-danger':s.level==='warn'?'ps-warn':''}"><span class="ps-dot">${s.level==='safe'?'✓':'!'}</span><div><strong>${safeText(s.title)}${s.count?` · ${s.count}`:''}</strong><p>${safeText(s.copy)}</p>${s.nodes?.length?`<button class="ps-secondary ps-highlight" data-issue="${i}">Show on page</button>`:''}</div></div>`;
  function render(tab){
    active=tab; root.querySelectorAll('.ps-tab').forEach(b=>b.classList.toggle('ps-active',b.dataset.tab===tab));
    if(tab==='opportunity'){
      const r=opportunityScan();lastSummary=`ProofScout found a risk score of ${r.score} out of 100. ${r.headline}. ${r.copy}`;
      body.innerHTML=`<div class="ps-hero ${r.score>=65?'ps-danger':r.score>=35?'ps-warn':''}"><div class="ps-score"><strong>${safeText(r.headline)}</strong><span>${r.score}/100 risk</span></div><p>${safeText(r.copy)}</p></div><div class="ps-stat-grid"><div class="ps-stat"><span>Page words checked</span><strong>${Math.round(r.textLength/5).toLocaleString()}</strong></div><div class="ps-stat"><span>Signals explained</span><strong>${r.signals.length}</strong></div></div><div class="ps-section-title">Page signals</div>${r.signals.length?r.signals.map(signalHTML).join(''):'<div class="ps-empty">No common opportunity-pressure phrase was detected. Verify the organizer independently.</div>'}<button class="ps-action" id="ps-copy"><span>Copy verification questions</span><span>→</span></button>`;
      root.querySelector('#ps-copy')?.addEventListener('click',()=>navigator.clipboard.writeText(`I am independently verifying this page before I continue. Please confirm the official deadline, eligibility, complete rules, all fees, the authorized application domain, and the correct organizer contact through an official channel. For security, I will not send passwords, OTP codes, seed phrases or banking logins.`).then(()=>status('Questions copied')).catch(()=>status('Clipboard blocked')));
    }else if(tab==='url'){
      const r=urlScan();lastSummary=`URL check for ${r.domain}. Risk score ${r.score} out of 100. ${r.headline}. ${r.copy}`;
      body.innerHTML=`<div class="ps-hero ${r.score>=50?'ps-danger':r.score?'ps-warn':''}"><div class="ps-score"><strong>${safeText(r.headline)}</strong><span>${r.score}/100 risk</span></div><p>${safeText(r.copy)}</p></div><div class="ps-url">${safeText(location.href)}</div><div class="ps-stat-grid" style="margin-top:8px"><div class="ps-stat"><span>Protocol</span><strong>${safeText(r.protocol.toUpperCase())}</strong></div><div class="ps-stat"><span>Domain labels</span><strong>${r.domain.split('.').length}</strong></div></div><div class="ps-section-title">URL signals</div>${r.signals.map(signalHTML).join('')}`;
    }else{
      const r=bugScan();window.__proofScoutIssues=r.issues;lastSummary=`Bug doctor found ${r.danger} security-impacting problems and ${r.warnings} quality or accessibility problems. ${r.copy}`;
      body.innerHTML=`<div class="ps-hero ${r.danger?'ps-danger':r.warnings?'ps-warn':''}"><div class="ps-score"><strong>${safeText(r.headline)}</strong><span>${r.score}/100 severity</span></div><p>${safeText(r.copy)}</p></div><div class="ps-stat-grid"><div class="ps-stat"><span>Security-impacting</span><strong>${r.danger}</strong></div><div class="ps-stat"><span>Quality / access</span><strong>${r.warnings}</strong></div></div><div class="ps-section-title">Diagnosed issues</div>${r.issues.length?r.issues.map(signalHTML).join(''):'<div class="ps-empty">No common structural bug found. Test interactions, content accuracy and server behavior manually.</div>'}`;
      root.querySelectorAll('.ps-highlight').forEach(btn=>btn.addEventListener('click',()=>{const issue=r.issues[Number(btn.dataset.issue)];document.querySelectorAll('.proofscout-highlight').forEach(e=>e.classList.remove('proofscout-highlight'));issue.nodes.slice(0,15).forEach(e=>e?.classList?.add('proofscout-highlight'));issue.nodes[0]?.scrollIntoView?.({behavior:'smooth',block:'center'});status(`${issue.count} element${issue.count===1?'':'s'} highlighted`)}));
    }
  }
  function status(msg){root.querySelector('#ps-status').textContent=msg;setTimeout(()=>{if(root.querySelector('#ps-status'))root.querySelector('#ps-status').textContent='Ready'},2500)}
  orb.addEventListener('click',()=>{panel.classList.toggle('ps-open');if(panel.classList.contains('ps-open'))render(active)});
  root.querySelector('#ps-close').addEventListener('click',()=>panel.classList.remove('ps-open'));
  root.querySelectorAll('.ps-tab').forEach(b=>b.addEventListener('click',()=>render(b.dataset.tab)));
  root.querySelector('#ps-speak').addEventListener('click',()=>{speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(lastSummary||'Open a scan first.');utter.rate=.96;speechSynthesis.speak(utter);status('Reading summary')});
  root.querySelector('#ps-mic').addEventListener('click',()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){status('Voice commands unavailable');return}const rec=new SR();rec.lang='en-US';rec.interimResults=false;status('Listening…');rec.onresult=e=>{const q=e.results[0][0].transcript.toLowerCase();if(/bug|diagnose|site health/.test(q))render('bugs');else if(/url|link|domain/.test(q))render('url');else if(/close|hide/.test(q))panel.classList.remove('ps-open');else render('opportunity');status(`Heard: ${q}`)};rec.onerror=()=>status('Could not hear command');rec.start();
  });
  const quick=opportunityScan();if(quick.score>=65)orb.classList.add('ps-alert');
})();
