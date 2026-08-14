const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const samples = {
  credible: {
    url: 'https://foundation.example.org/challenge/rules',
    text: `Global Student Climate Challenge 2026\nApplications close September 14, 2026 at 5:00 PM UTC. Participation is free and no purchase is required. Open to enrolled students aged 18 or older from eligible countries. Submit a working prototype, public source repository and a three-minute demonstration video through the official application portal. First prize: $5,000 USD; second prize: $2,500 USD. Full rules, judging criteria, organizer address and privacy policy are available on our official website. Questions: challenge@foundation.example.org. We will never request passwords, one-time codes or payment to release a prize.`
  },
  risky: {
    url: 'http://global-prize-winner-now.example.net/claim',
    text: `CONGRATULATIONS!!! You have been specially selected for a guaranteed $10,000 international grant. Act in the next 2 hours or lose your slot. Pay a $75 processing and verification fee in cryptocurrency to release your funds. Contact the agent only on WhatsApp and send your passport, bank login, OTP code and wallet seed phrase. Do not contact the company directly because your award is confidential. Limited slots. Payment today guarantees approval.`
  }
};

let selectedType = 'Competition';
let currentResult = null;
let importedReview = null;
let installPrompt = null;

const rules = [
  {id:'fee', level:'high', points:28, test:t=>/(processing|registration|release|verification|activation|administrative|gas)\s+fee|pay.{0,30}(fee|deposit)|send.{0,20}(crypto|bitcoin|usdt|money)/i.test(t), title:'Upfront payment language', bad:'The offer asks for money before access, approval or prize release.', good:'No obvious upfront-payment request was detected.'},
  {id:'secret', level:'high', points:32, test:t=>/(password|one[- ]?time (code|password)|\botp\b|seed phrase|bank login|remote access)/i.test(t), title:'Secret credential request', bad:'The message appears to request credentials that legitimate organizers should never need.', good:'No password, OTP or seed-phrase request was detected.'},
  {id:'pressure', level:'warn', points:14, test:t=>/(act now|next \d+ (minutes?|hours?)|immediately|urgent|last chance|limited slots|today guarantees|lose your slot)/i.test(t), title:'Pressure and artificial urgency', bad:'Pressure language may be trying to prevent independent verification.', good:'No strong pressure language was detected.'},
  {id:'guarantee', level:'warn', points:14, test:t=>/(guaranteed (approval|winner|prize|grant|job)|specially selected|you have won|pre[- ]?approved)/i.test(t), title:'Guaranteed outcome claim', bad:'The offer implies an outcome before a transparent selection process.', good:'No guaranteed-outcome claim was detected.'},
  {id:'contradiction', level:'high', points:22, test:t=>/(free to (enter|join|participate)|no (entry )?fee|no purchase)[\s\S]{0,500}(processing|registration|release|verification|activation|administrative|gas)\s+fee|((processing|registration|release|verification|activation|administrative|gas)\s+fee)[\s\S]{0,500}(free to (enter|join|participate)|no (entry )?fee|no purchase)/i.test(t), title:'Contradictory fee claims', bad:'The text says entry is free but also requests another type of payment.', good:'No direct contradiction between free-entry and payment claims was detected.'},
  {id:'private', level:'warn', points:12, test:t=>/(whatsapp|telegram).{0,40}(only|agent)|contact.{0,20}(whatsapp|telegram)|do not contact|confidential award/i.test(t), title:'Unverifiable communication channel', bad:'The offer discourages normal verification or relies on private messaging.', good:'The text does not discourage contacting the organizer independently.'},
  {id:'rules', level:'safe', points:-8, test:t=>/(official rules|judging criteria|terms and conditions|privacy policy)/i.test(t), title:'Published process signals', bad:'The announcement mentions public rules, criteria or a privacy policy.', good:'No clear reference to published rules or judging criteria was found.'},
  {id:'free', level:'safe', points:-6, test:t=>/(free to (enter|join|participate)|no purchase|no entry (cost|fee)|participation is free)/i.test(t), title:'No-fee statement', bad:'The announcement explicitly says participation does not require payment.', good:'No explicit no-fee statement was found; verify costs in the official rules.'},
  {id:'official', level:'safe', points:-5, test:t=>/(official (website|portal)|organizer address|contact@|support@|challenge@)/i.test(t), title:'Traceable organizer information', bad:'The text includes signals that can be checked through an official channel.', good:'Organizer contact and official-channel details are limited.'}
];

function extract(text, url) {
  const money = [...text.matchAll(/(?:US?\$|USD\s*)\s?([\d,]+(?:\.\d{1,2})?)|([\d,]+)\s?(?:USD|dollars?)/gi)]
    .map(m => Number((m[1]||m[2]).replace(/,/g,''))).filter(Boolean);
  const dates = text.match(/(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?/gi) || [];
  const emails = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) || [];
  const mode = /online|virtual|remote/i.test(text) ? 'Online mentioned' : /in[- ]person|venue|onsite/i.test(text) ? 'In-person mentioned' : 'Not stated';
  let host = 'Not provided';
  try { if (url) host = new URL(url).hostname.replace(/^www\./,''); } catch {}
  const fee = /(processing|registration|release|verification|activation|administrative|gas)\s+fee|pay.{0,30}(fee|deposit)/i.test(text) ? 'Payment requested' : /free to (enter|join|participate)|no purchase|no entry (cost|fee)|participation is free/i.test(text) ? 'Explicitly free' : 'Not stated';
  return {
    'Largest prize found': money.length ? `$${Math.max(...money).toLocaleString()}` : 'Not detected',
    'Deadline found': dates[0] || 'Not detected',
    'Entry cost': fee,
    'Participation mode': mode,
    'Source domain': host,
    'Contact': emails[0] || 'Not detected'
  };
}

function analyze(text, url) {
  let raw = 18;
  const signals = rules.map(rule => {
    const matched = rule.test(text);
    if (matched) raw += rule.points;
    const positive = rule.level === 'safe';
    return {
      ...rule,
      matched,
      effectiveLevel: positive ? (matched ? 'safe' : 'neutral') : (matched ? rule.level : 'safe'),
      message: matched ? rule.bad : rule.good,
      displayPoints: matched ? rule.points : 0
    };
  });
  if (!url) raw += 7;
  else {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:') raw += 10;
      if (/bit\.ly|tinyurl|t\.co|shorturl/i.test(u.hostname)) raw += 10;
    } catch { raw += 12; }
  }
  const score = Math.max(0, Math.min(100, raw));
  return { score, signals, claims: extract(text, url), text, url, type:selectedType, timestamp:new Date().toISOString() };
}

function render(result) {
  currentResult = result;
  $('#emptyState').hidden = true;
  $('#resultState').hidden = false;
  $('#scoreValue').textContent = result.score;
  const color = result.score >= 65 ? 'var(--red)' : result.score >= 35 ? 'var(--amber)' : 'var(--green)';
  $('#scoreDial').style.background = `conic-gradient(${color} ${result.score}%, var(--line) ${result.score}%)`;
  $('#scoreDial').setAttribute('aria-label', `Risk score ${result.score} out of 100`);
  const verdict = $('#verdict');
  verdict.className = 'verdict' + (result.score >= 65 ? ' danger' : result.score >= 35 ? ' warning' : '');
  $('#verdictIcon').textContent = result.score >= 65 ? '!' : result.score >= 35 ? '?' : '✓';
  $('#verdictTitle').textContent = result.score >= 65 ? 'High-risk signals detected' : result.score >= 35 ? 'Verify before proceeding' : 'Lower-risk signals detected';
  $('#verdictCopy').textContent = result.score >= 65 ? 'Do not pay or share sensitive information until the real organizer confirms this offer.' : result.score >= 35 ? 'Some important evidence is missing or concerning. Trace the offer through independent official sources.' : 'No major danger pattern was found, but independent verification is still necessary.';
  $('#claimGrid').innerHTML = Object.entries(result.claims).map(([k,v])=>`<div class="claim"><span>${escapeHTML(k)}</span><strong title="${escapeHTML(v)}">${escapeHTML(v)}</strong></div>`).join('');
  const ordered = [...result.signals].sort((a,b)=>{
    const rank={high:0,warn:1,neutral:2,safe:3}; return rank[a.effectiveLevel]-rank[b.effectiveLevel];
  });
  $('#signalList').innerHTML = ordered.map(s=>`<div class="signal ${s.effectiveLevel==='warn'?'warn':s.effectiveLevel==='high'?'high':''}"><span class="signal-icon">${s.effectiveLevel==='safe'?'✓':s.effectiveLevel==='neutral'?'·':'!'}</span><div><strong>${escapeHTML(s.title)}</strong><p>${escapeHTML(s.message)}</p></div><span class="points">${s.displayPoints>0?`+${s.displayPoints}`:s.displayPoints<0?`${s.displayPoints}`:''}</span></div>`).join('');
  const concernCount = result.signals.filter(s=>s.matched && ['warn','high'].includes(s.level)).length;
  $('#signalSummary').textContent = `${concernCount} concern${concernCount===1?'':'s'} found`;
  const completenessFields = Object.values(result.claims).filter(v=>!['Not detected','Not stated','Not provided'].includes(v)).length;
  const hasRules = result.signals.some(s=>s.id==='rules'&&s.matched);
  const completeness = Math.min(100, Math.round((completenessFields / Object.keys(result.claims).length) * 80 + (hasRules ? 20 : 0)));
  $('#completeValue').textContent = `${completeness}%`;
  $('#completeBar').style.width = `${completeness}%`;
  $('#completeCopy').textContent = completeness >= 80 ? 'The announcement exposes most core claims. Confirm them independently on the organizer’s real website.' : completeness >= 50 ? 'Some useful claims are present, but important verification details are still missing.' : 'The announcement is difficult to audit because several core claims are missing.';
  const actions = actionItems(result);
  $('#actionList').innerHTML = actions.map((a,i)=>`<label class="action"><input type="checkbox" aria-label="Mark action complete"><span><strong>${i+1}. ${escapeHTML(a.title)}</strong><br>${escapeHTML(a.copy)}</span></label>`).join('');
  $('#resultState').scrollIntoView({behavior:'smooth', block:'start'});
}

function actionItems(r) {
  const host = r.claims['Source domain'];
  const items = [
    {title:'Find the organizer independently', copy:'Search for the organization yourself and navigate from its verified website—not from the forwarded link.'},
    {title:'Match the rules', copy:'Confirm the deadline, prize, eligibility and fees appear identically on the official rules page.'},
    {title:'Verify the domain', copy:host==='Not provided'?'Request an official webpage and verify it independently before sharing data.':`Check whether ${host} is genuinely controlled by the named organizer.`}
  ];
  if (r.score >= 35) items.unshift({title:'Pause payment and document sharing', copy:'Do not send money, identity documents or account details until the concerns are resolved.'});
  if (r.signals.find(s=>s.id==='secret'&&s.matched)) items.unshift({title:'Protect your accounts now', copy:'Never send passwords, OTP codes or seed phrases. Change exposed credentials through official services.'});
  return items.slice(0,5);
}

function escapeHTML(value='') { return String(value).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function toast(message){ const t=$('#toast'); t.textContent=message; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),2300); }
function verificationMessage(r){
  return `Hello, I am independently verifying this ${r.type.toLowerCase()} before applying. Please confirm through an official channel:\n\n1. Is the stated deadline ${r.claims['Deadline found']}?\n2. Is the largest advertised prize ${r.claims['Largest prize found']}?\n3. Is the entry cost “${r.claims['Entry cost']}”?\n4. Is ${r.claims['Source domain']} an authorized application domain?\n5. Where can I read the complete official rules and privacy policy?\n\nFor security, I will not send passwords, OTP codes, banking logins or payment until these details are independently confirmed. Thank you.`;
}
function exportEvidence(r){
  const concerns=r.signals.filter(s=>s.matched&&['warn','high'].includes(s.level)).map(s=>({signal:s.title,explanation:s.message,weight:s.points}));
  const report={product:'ProofScout',notice:'Screening aid only; not a guarantee of legitimacy.',generatedAt:new Date().toISOString(),opportunityType:r.type,riskScore:r.score,source:r.url||null,claims:r.claims,concerns,recommendedActions:actionItems(r)};
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`proofscout-evidence-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function downloadJSON(data, filename){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function redactText(text=''){
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'[EMAIL REDACTED]')
    .replace(/https?:\/\/\S+/gi,'[DIRECT LINK REDACTED]')
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g,'[NUMBER REDACTED]')
    .replace(/\b(?:[A-Z0-9]{12,})\b/g,'[IDENTIFIER REDACTED]');
}
function caseLabel(c){return `${c.claims?.['Source domain']||c.type||'Opportunity'} · ${c.score}/100 risk`;}
function completenessFor(c){const vals=Object.values(c.claims||{});const found=vals.filter(v=>!['Not detected','Not stated','Not provided'].includes(v)).length;const hasRules=(c.signals||[]).some(s=>s.id==='rules'&&s.matched);return Math.min(100,Math.round((found/Math.max(1,vals.length))*80+(hasRules?20:0)));}
function refreshCollaborationControls(){
  const cases=getCases();
  const options=cases.map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(caseLabel(c))}</option>`).join('');
  ['#compareA','#compareB','#relayCase'].forEach(sel=>{const el=$(sel);if(el)el.innerHTML=options||'<option value="">No saved cases</option>'});
  if(cases.length>1) $('#compareB').selectedIndex=1;
  $('#comparePanel').hidden=cases.length<2;
  updateRedactionPreview();
}
function updateRedactionPreview(){
  const c=getCases().find(x=>x.id===$('#relayCase')?.value);
  const el=$('#redactionPreview');if(!el)return;
  el.textContent=c ? redactText(c.text).slice(0,1800) : 'Save a case first to prepare a review request.';
}
function getCases(){ try{return JSON.parse(localStorage.getItem('proofscout-cases'))||[]}catch{return[]} }
function setCases(cases){ localStorage.setItem('proofscout-cases',JSON.stringify(cases)); updateSavedCount(); }
function updateSavedCount(){ $('#savedCount').textContent=getCases().length; }

function renderCases(){
  const cases=getCases(); $('#noCases').hidden=cases.length>0;
  $('#caseList').innerHTML=cases.map(c=>{
    const cls=c.score>=65?'high':c.score>=35?'warn':'';
    return `<article class="case-card"><div><div class="case-meta"><span class="risk-pill ${cls}">${c.score}/100 risk</span><span>${escapeHTML(c.type)}</span><span>${new Date(c.timestamp).toLocaleDateString()}</span></div><h2>${escapeHTML(c.claims['Source domain']==='Not provided'?'Untitled opportunity':c.claims['Source domain'])}</h2><p>${escapeHTML(c.text.slice(0,150))}${c.text.length>150?'…':''}</p></div><button class="delete-case" data-id="${c.id}" aria-label="Delete saved case">Delete</button></article>`;
  }).join('');
  $$('.delete-case').forEach(btn=>btn.addEventListener('click',()=>{setCases(getCases().filter(c=>c.id!==btn.dataset.id));renderCases();toast('Case deleted');}));
  refreshCollaborationControls();
}

function showView(name){
  $$('.view').forEach(v=>{v.hidden=true;v.classList.remove('active')});
  $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  const view=$(`#${name}View`); view.hidden=false; view.classList.add('active');
  if(name==='cases')renderCases();
  if(name==='relay')refreshCollaborationControls();
  window.scrollTo({top:0,behavior:'smooth'});
}

$$('.type-chip').forEach(btn=>btn.addEventListener('click',()=>{selectedType=btn.dataset.type;$$('.type-chip').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-checked',b===btn?'true':'false')})}));
$$('.sample-btn').forEach(btn=>btn.addEventListener('click',()=>{const s=samples[btn.dataset.sample];$('#sourceUrl').value=s.url;$('#sourceText').value=s.text;toast('Example loaded');}));
$('#analyzeBtn').addEventListener('click',()=>{const text=$('#sourceText').value.trim();if(text.length<45){toast('Paste at least a few complete sentences');$('#sourceText').focus();return}render(analyze(text,$('#sourceUrl').value.trim()));});
$('#clearBtn').addEventListener('click',()=>{$('#sourceText').value='';$('#sourceUrl').value='';$('#resultState').hidden=true;$('#emptyState').hidden=false;currentResult=null;});
$('#saveBtn').addEventListener('click',()=>{if(!currentResult)return;const cases=getCases();cases.unshift({...currentResult,id:crypto.randomUUID?.()||String(Date.now())});setCases(cases.slice(0,20));toast('Case saved on this device');});
$('#copyVerifyBtn').addEventListener('click',async()=>{if(!currentResult)return;try{await navigator.clipboard.writeText(verificationMessage(currentResult));toast('Verification request copied')}catch{toast('Clipboard permission was unavailable')}});
$('#exportBtn').addEventListener('click',()=>{if(currentResult){exportEvidence(currentResult);toast('Evidence report exported')}});
$('#printBtn').addEventListener('click',()=>window.print());
$('#hausaToggle').addEventListener('click',()=>{const guide=$('#hausaGuide');guide.hidden=!guide.hidden;$('#hausaToggle').setAttribute('aria-expanded',String(!guide.hidden));$('#hausaToggle').textContent=guide.hidden?'Show Hausa guide':'Hide Hausa guide'});
$('#relayCase').addEventListener('change',updateRedactionPreview);
$('#compareBtn').addEventListener('click',()=>{
  const cases=getCases(),a=cases.find(c=>c.id===$('#compareA').value),b=cases.find(c=>c.id===$('#compareB').value);if(!a||!b){toast('Choose two saved cases');return}
  const safer=a.score<=b.score?a:b;
  const side=c=>`<article class="compare-side ${c.id===safer.id?'winner':''}"><h3>${escapeHTML(c.claims['Source domain']||c.type)}</h3><div class="compare-stat"><span>Risk score</span><strong>${c.score}/100</strong></div><div class="compare-stat"><span>Evidence completeness</span><strong>${completenessFor(c)}%</strong></div><div class="compare-stat"><span>Concerns</span><strong>${(c.signals||[]).filter(s=>s.matched&&['warn','high'].includes(s.level)).length}</strong></div><div class="compare-stat"><span>Entry cost</span><strong>${escapeHTML(c.claims['Entry cost'])}</strong></div>${c.id===safer.id?'<p class="step">STRONGER CURRENT EVIDENCE</p>':''}</article>`;
  $('#compareResult').innerHTML=side(a)+side(b);$('#compareResult').hidden=false;
});
$('#exportRequestBtn').addEventListener('click',()=>{
  const c=getCases().find(x=>x.id===$('#relayCase').value);if(!c){toast('Save and choose a case first');return}
  const request={kind:'proofscout-review-request',version:1,createdAt:new Date().toISOString(),requestId:crypto.randomUUID?.()||String(Date.now()),case:{type:c.type,riskScore:c.score,claims:c.claims,concerns:(c.signals||[]).filter(s=>s.matched&&['warn','high'].includes(s.level)).map(s=>({signal:s.title,explanation:s.message})),announcement:$('#includeText').checked?redactText(c.text):'[NOT INCLUDED]'}};
  downloadJSON(request,`proofscout-second-opinion-${Date.now()}.json`);toast('Redacted review request exported');
});
$('#reviewFile').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{const data=JSON.parse(await file.text());if(data.kind!=='proofscout-review-request'||!data.case)throw new Error();importedReview=data;const c=data.case;$('#reviewSummary').innerHTML=`<strong>${escapeHTML(c.type)} · ${c.riskScore}/100 initial risk</strong><p>${escapeHTML(c.claims?.['Source domain']||'No source domain')} · ${escapeHTML(c.claims?.['Entry cost']||'Cost unknown')}</p><div class="redaction-preview">${escapeHTML(c.announcement||'No announcement included')}</div>`;$('#reviewWorkspace').hidden=false;toast('Review request opened locally')}catch{importedReview=null;$('#reviewWorkspace').hidden=true;toast('This is not a valid ProofScout request')}
});
$('#exportResponseBtn').addEventListener('click',()=>{
  if(!importedReview){toast('Import a review request first');return}const response={kind:'proofscout-review-response',version:1,requestId:importedReview.requestId,reviewedAt:new Date().toISOString(),assessment:$('#reviewVerdict').value,notes:$('#reviewNotes').value.trim(),safetyNotice:'This is a human second opinion, not a guarantee of legitimacy.'};downloadJSON(response,`proofscout-review-response-${Date.now()}.json`);toast('Review response exported')
});
$('#themeToggle').addEventListener('click',()=>{document.body.classList.toggle('high-contrast');localStorage.setItem('proofscout-contrast',document.body.classList.contains('high-contrast')?'1':'0')});
$$('.nav-link').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
$$('[data-go]').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.go)));
if(localStorage.getItem('proofscout-contrast')==='1')document.body.classList.add('high-contrast');
updateSavedCount();

window.addEventListener('beforeinstallprompt',e=>{if(!$('#installBtn'))return;e.preventDefault();installPrompt=e;if($('#installHint'))$('#installHint').textContent='Ready to install — one tap, no app store required.'});
$('#installBtn')?.addEventListener('click',async()=>{
  if(installPrompt){installPrompt.prompt();const result=await installPrompt.userChoice;$('#installHint').textContent=result.outcome==='accepted'?'Installed. On another page, tap Share → ProofScout.':'You can install whenever you are ready.';installPrompt=null;return}
  if(window.matchMedia('(display-mode: standalone)').matches){toast('ProofScout is already installed');return}
  $('#installHint').textContent='In Chrome, open the menu and tap “Install app” or “Add to Home screen.”';toast('Use Chrome menu → Install app');
});
window.addEventListener('appinstalled',()=>{if($('#installBtn')&&$('#installHint'))$('#installHint').textContent='Installed. Now share an opportunity page to ProofScout.';toast('ProofScout installed')});

function openSharedPage(){
  const p=new URLSearchParams(location.search);if(p.get('shared')!=='1')return;
  const title=p.get('title')||'Shared opportunity page',text=p.get('text')||'',url=p.get('url')||'';
  showView('scanner');$('#sourceUrl').value=url;$('#sourceText').value=[title,text,url?`Shared source: ${url}`:''].filter(Boolean).join('\n\n');
  history.replaceState({},'',location.pathname+'#inspect');
  const combined=$('#sourceText').value.trim();if(combined.length>=45){render(analyze(combined,url));toast('Shared page opened and inspected')}else{toast('Shared page opened — add any important wording you can see')}
}

if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').then(openSharedPage).catch(()=>openSharedPage())); else openSharedPage();
