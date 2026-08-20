(()=>{
  if(window.ProofScout?.mounted)return;

  const POS_KEY='proofscout-orb-pos';
  const PIN_KEY='proofscout-pinned';
  const SIZE=56;

  const make=(tag,className,text)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=String(text);
    return node;
  };
  const qs=sel=>{try{return [...document.querySelectorAll(sel)]}catch{return[]}};
  const hideScout=fn=>{
    const el=document.getElementById('proofscout-root');
    const prev=el?.style.display;
    if(el)el.style.display='none';
    try{return fn()}finally{if(el)el.style.display=prev||'';}
  };
  const pageText=()=>hideScout(()=>document.body?.innerText?.replace(/\s+/g,' ').slice(0,120000)||'');
  const pageHTML=()=>hideScout(()=>(document.documentElement?.innerHTML||'').slice(0,450000));
  const inlineCode=()=>qs('script').filter(s=>!s.src).map(s=>s.textContent||'').join('\n').slice(0,250000);

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
    const add=(test,points,title,copy,level='warn',nodes=[])=>{if(test){score+=points;signals.push({title,copy,level,nodes,count:nodes.length||undefined})}};
    const params=[...u.searchParams.keys()].map(k=>k.toLowerCase());
    const blob=u.href+' '+[...u.searchParams].map(([k,v])=>k+'='+v).join(' ');
    add(u.protocol!=='https:',30,'Connection is not encrypted','Information entered on this page can be exposed in transit.','danger');
    add(u.protocol==='http:'&&/login|signin|account|password|bank|wallet|pay/i.test(u.href),18,'Sensitive path on HTTP','A login or payment-like path is being served without encryption.','danger');
    add(/^\d{1,3}(?:\.\d{1,3}){3}$/.test(u.hostname),22,'Raw IP address','Public services normally use a recognizable domain, not a numeric IP address.','danger');
    add(u.username||u.password,24,'Credentials embedded in the URL','Usernames or passwords in the address bar are stored in history and logs.','danger');
    add(u.hostname.includes('xn--'),16,'Internationalized domain encoding','Punycode can hide look-alike characters. Verify each label.');
    add((u.hostname.match(/-/g)||[]).length>=3,10,'Heavily hyphenated domain','Multiple hyphens can imitate an official-looking web address.');
    add(u.hostname.split('.').length>=5,10,'Deep subdomain chain','Read the registered domain from right to left; brand words in subdomains do not prove ownership.');
    add(/@/.test(location.href),28,'User information inside URL','Text before an @ symbol can disguise the destination host.','danger');
    add(!['','80','443'].includes(u.port),8,'Unusual network port',`This page uses port ${u.port}. Confirm that the service intentionally uses it.`);
    add(/login|verify|secure|account|wallet|prize|grant|winner/i.test(u.hostname)&&!/(google|microsoft|github|mozilla|devpost)\./i.test(u.hostname),8,'Trust words in domain','Words such as “secure” or “verify” are claims, not proof of ownership.');
    add(/javascript:/i.test(u.href),34,'javascript: address','The location uses a javascript URL, which is a classic XSS and phishing vehicle.','danger');
    add(/^data:/i.test(u.href),28,'data: URL document','Data URLs can hide executable HTML. Treat the page as untrusted.','danger');
    add(/[<>]|%3c|%3e|onerror\s*=|%6f%6eerror/i.test(blob),26,'Markup in the address','Angle brackets or event-handler text in the URL often indicate reflected input. Do not trust this page.','danger');
    const redirectKeys=params.filter(k=>/^(next|redirect|return|returnurl|continue|url|dest|destination|goto|rurl|redirect_uri|callback|out)$/i.test(k));
    add(redirectKeys.length,14,'Open-redirect style parameter',`The URL includes ${redirectKeys.join(', ')}. Confirm the site validates destinations against an allow-list.`);
    const idKeys=params.filter(k=>/^(id|user|userid|item|product|cat|category|page|order|sort|file|path|dir|doc|document|q|query|search|s)$/i.test(k));
    add(idKeys.length,8,'Queryable identifiers in the URL',`Parameters such as ${idKeys.slice(0,6).join(', ')} are often concatenated into lookups. The owner should use parameterized queries and access checks.`);
    add(/debug=1|test=true|dev=1|trace=1/i.test(u.search),12,'Debug flag in the URL','Debug switches can expose extra errors, stack traces or admin behaviour.');
    add([...u.searchParams.values()].some(v=>/https?:\/\//i.test(v)),10,'Absolute URL inside a parameter','A nested http(s) value can be used for open redirects or SSRF if the server fetches it.');
    add([...u.searchParams.values()].some(v=>/\.\.|%2e%2e|\/etc\/|file:\/\//i.test(v)),22,'Path-traversal style value','Dot-dot or file-scheme text in a parameter is a directory-traversal indicator.','danger');
    add(u.hash.includes('<')||/javascript:/i.test(u.hash),20,'Markup in the fragment','Hash content is readable by scripts and is a common DOM-XSS source.','danger');
    add(u.href.length>1800,6,'Extremely long URL','Very long addresses may carry injected state, tokens or overflow attempts.');
    if(u.protocol==='https:')signals.push({title:'Encrypted connection',copy:'HTTPS protects the connection, but it does not prove the organization is genuine or that the page is free of bugs.',level:'safe'});
    score=Math.min(100,score);
    return {score,signals,domain:u.hostname,protocol:u.protocol.replace(':',''),paramCount:params.length,headline:score>=50?'URL needs careful verification':score?'Review these URL signals':'No obvious URL anomaly',copy:'Scout inspected the scheme, host, port, credentials, query keys, fragments and common injection fingerprints without sending extra requests.'};
  }

  function qualityScan(){
    const issues=[]; const add=(nodes,severity,title,copy,group='Quality')=>{if(nodes.length)issues.push({nodes,severity,title,copy,count:nodes.length,group,level:severity})};
    add(qs('img').filter(i=>i.complete&&i.naturalWidth===0),'danger','Broken images','Images failed to load and may hide instructions or indicate a broken deployment.');
    add(qs('input:not([type="hidden"]),select,textarea').filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!e.title),'warn','Unlabelled form controls','Some fields may be difficult to understand with assistive technology.');
    add(qs('button,a[href]').filter(e=>!(e.innerText||e.getAttribute('aria-label')||e.title||'').trim()&&!e.querySelector('img[alt]')),'warn','Unnamed buttons or links','Interactive controls without accessible names are difficult for screen-reader and voice users.');
    const ids=qs('[id]').map(e=>e.id).filter(Boolean);const dup=new Set(ids.filter((id,i)=>ids.indexOf(id)!==i));
    add([...dup].flatMap(id=>qs('#'+CSS.escape(id))),'warn','Duplicate element IDs','Repeated IDs can break labels, scripts, navigation and automated testing.');
    add(qs('a[target="_blank"]:not([rel~="noopener"])'),'warn','New-tab links lack isolation','Links opening new tabs should use rel="noopener" to reduce tab-nabbing.');
    const heading=qs('h1,h2,h3,h4,h5,h6');const gaps=heading.filter((h,i)=>i&&Number(h.tagName[1])>Number(heading[i-1].tagName[1])+1);
    add(gaps,'warn','Heading levels are skipped','A broken heading outline makes page structure harder to navigate.');
    if(!document.documentElement.lang)issues.push({nodes:[document.documentElement],severity:'warn',level:'warn',group:'Quality',title:'Page language missing',copy:'The HTML element has no language, which affects pronunciation and translation.',count:1});
    if(!document.title.trim())issues.push({nodes:[document.documentElement],severity:'warn',level:'warn',group:'Quality',title:'Document title missing',copy:'A meaningful title helps users identify browser tabs and history.',count:1});
    if(!document.querySelector('meta[name="viewport"]'))issues.push({nodes:[document.head||document.documentElement],severity:'warn',level:'warn',group:'Quality',title:'Mobile viewport missing',copy:'The page may render poorly on phones.',count:1});
    add(qs('img:not([alt])'),'warn','Images missing alt text','Decorative images should use alt="" and informative images need a short description.');
    add(qs('iframe:not([title]):not([aria-label])'),'warn','Untitled frames','Frames need an accessible name so people can skip or enter them.');
    add(qs('[tabindex]').filter(e=>Number(e.getAttribute('tabindex'))>0),'warn','Positive tabindex values','Positive tabindex breaks natural keyboard order.');
    add(qs('a[href="#"],a[href="javascript:void(0)"],a[href="javascript:;"]'),'warn','Dead or fake links','Placeholder hrefs are not keyboard- or assistive-tech friendly.');
    const danger=issues.filter(i=>i.severity==='danger').reduce((n,i)=>n+i.count,0);
    const warnings=issues.filter(i=>i.severity==='warn').reduce((n,i)=>n+i.count,0);
    const score=Math.min(100,danger*12+warnings*3);
    return {score,issues,danger,warnings,headline:danger?'Quality problems with security impact':warnings?'Accessibility and quality issues':'No common quality bug detected',copy:'These checks read the current DOM only and work offline.'};
  }

  function securityScan(){
    const issues=[];
    const add=(nodes,severity,title,copy,group)=>{
      const list=Array.isArray(nodes)?nodes:(nodes?[nodes]:[document.documentElement]);
      if(!list.length)return;
      issues.push({nodes:list,severity,level:severity,title,copy,count:list.length,group});
    };
    const html=pageHTML();
    const code=inlineCode();
    const text=pageText();
    const mixed=location.protocol==='https:'?qs('[src],[href],[action]').filter(e=>{
      const v=e.getAttribute('src')||e.getAttribute('href')||e.getAttribute('action')||'';
      return /^http:\/\//i.test(v);
    }):[];
    add(mixed,'danger','Mixed or insecure resources','This HTTPS page still points at http:// assets. Browsers may block them, or an attacker on the network can alter them.','Transport');
    add(qs('form').filter(f=>{try{return new URL(f.action||location.href,location.href).protocol==='http:'}catch{return false}}),'danger','Insecure form destination','A form submits over HTTP. Do not enter passwords or personal data.','Transport');
    add(qs('input[type="password"]').filter(()=>location.protocol!=='https:'),'danger','Password field on an HTTP page','Do not type a password here. The network can read it.','Transport');
    add(qs('[src^="ws://"], a[href^="ws://"]'),'danger','Unencrypted WebSocket','ws:// traffic is readable and injectable on the network.','Transport');

    const jsLinks=qs('a[href^="javascript:"], iframe[src^="javascript:"], form[action^="javascript:"], embed[src^="javascript:"]');
    add(jsLinks,'danger','javascript: URL on the page','javascript: links run script in the page origin. That is a stored or reflected XSS pattern.','XSS');
    const handlers=qs(['onclick','onload','onerror','onmouseover','onfocus','onblur','onchange','onsubmit','oninput','onkeydown','onkeyup','ontouchstart'].map(a=>'['+a+']').join(','));
    add(handlers.slice(0,40),'danger','Inline event handlers','onclick and similar HTML handlers are XSS sinks if they ever include untrusted data. Prefer addEventListener.','XSS');
    add(qs('iframe[srcdoc]'),'danger','iframe srcdoc HTML','srcdoc is parsed as HTML and is a high-risk XSS sink if it includes query data.','XSS');
    add(qs('base[href]'),'warn','Base tag present','A hostile base href can rewrite relative script and form URLs (base-tag hijacking).','XSS');
    const sinks=/innerHTML\s*=|outerHTML\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(|\.html\s*\(|dangerouslySetInnerHTML|v-html|ng-bind-html/i.test(code+html);
    if(sinks) add(qs('script').filter(s=>!s.src),'danger','DOM XSS sink in page script','Inline script assigns HTML (innerHTML, document.write, v-html, or similar). If that string includes URL, hash, postMessage or form data, the page is XSS-prone.','XSS');
    const evalish=/(\beval\s*\(|new\s+Function\s*\(|setTimeout\s*\(\s*['"`]|setInterval\s*\(\s*['"`]|setImmediate\s*\(\s*['"`])/i.test(code);
    if(evalish) add(qs('script').filter(s=>!s.src),'danger','String-to-script execution','eval, new Function, or timer-with-string turns text into code. That is a direct XSS primitive if the text is attacker-controlled.','XSS');
    if(/location\.(search|hash|href).{0,80}(innerHTML|document\.write|eval|html\()/i.test(code)||/(innerHTML|document\.write).{0,80}location\.(search|hash)/i.test(code))
      add([document.documentElement],'danger','Location data written into the DOM','Script appears to take the query string or hash and inject it as HTML or code. That is a classic DOM XSS flow.','XSS');
    if(/postMessage\s*\(|addEventListener\s*\(\s*['"]message['"]/i.test(code)&&!/event\.origin|e\.origin|message\.origin/i.test(code))
      add([document.documentElement],'danger','postMessage without origin check','The page listens for messages but no origin comparison was found. Other sites can then inject data.','XSS');
    if(/document\.write\s*\(\s*unescape|eval\s*\(\s*atob|fromCharCode\s*\(/i.test(code))
      add([document.documentElement],'warn','Obfuscated script construction','unescape/atob/fromCharCode around eval often hides injected script. Treat as untrusted.','XSS');
    add(qs('[name="location"],[id="location"],[name="body"],[id="body"],[name="document"],[id="cookies"]').filter(e=>/^(INPUT|FORM|IMG|OBJECT|IFRAME)$/i.test(e.tagName)),'warn','Possible DOM clobbering names','Named inputs can overwrite document.location or document.body in some browsers.','XSS');
    if(/<script|onerror\s*=|onload\s*=/i.test(location.search+location.hash))
      add([document.documentElement],'danger','Script-like text already in the URL','The address contains script-looking markup. If any of it is reflected into HTML, this is reflected XSS.','XSS');

    const sqlErrors=/you have an error in your sql syntax|warning:\s*mysql_|unclosed quotation mark|quoted string not properly terminated|odbc sql server driver|sqlstate\[|pg_query\(|sqlite3?\.exception|ora-\d{5}|microsoft ole db|syntax error at or near|fatal error:.*?query|mysqli?_fetch|pg_fetch|sql command not properly ended/i.test(text+html);
    if(sqlErrors) add([document.body],'danger','Database error text on the page','The document already shows a SQL/database error. That usually means a query failed and leaked. The owner should use parameterized queries and generic errors. Scout did not send any test input.','SQL');
    const sqlComments=/--\s+|\/\*|\bUNION\s+SELECT\b|\bINFORMATION_SCHEMA\b/i.test(text)&&/sql|query|database/i.test(text);
    if(sqlComments) add([document.body],'warn','SQL vocabulary visible to users','Query fragments or schema words are visible. Hide diagnostics from public pages.','SQL');
    add(qs('input,textarea,select').filter(e=>/^(sql|query|stmt|statement|table|column|orderby|order_by|sort|sidx)$/i.test(e.name||e.id||'')),'warn','SQL-shaped field names','A control is named like a database clause. Map user input to an allow-list, never into a query string.','SQL');
    const riskyParams=[...new URL(location.href).searchParams.keys()].filter(k=>/^(id|user_id|item|product_id|cat|file|path|order|sort|q|query)$/i.test(k));
    if(riskyParams.length) add([document.documentElement],'warn','Lookup parameters in the URL','These keys often reach a database or file API: '+riskyParams.join(', ')+'. Confirm parameterized queries, type checks and authorization. No requests were sent.','SQL');
    if(/openDatabase\s*\(|indexedDB|webkitSQL|executeSql\s*\(/i.test(code))
      add([document.documentElement],'warn','Client-side SQL / structured storage','The page uses WebSQL, executeSql or IndexedDB. Concatenating strings into those queries is still injection.','SQL');

    const tokenRe=/csrf|xsrf|authenticity_token|_token|nonce|antiforgery/i;
    const postForms=qs('form').filter(f=>(f.method||'get').toLowerCase()==='post');
    const tokenless=postForms.filter(f=>!f.querySelector('input[type="hidden"]')||![...f.querySelectorAll('input[type="hidden"]')].some(i=>tokenRe.test(i.name+i.id+(i.value||''))));
    add(tokenless,'warn','POST form without a CSRF token field','No hidden authenticity/CSRF field was found. The server should still require a same-site token or SameSite cookies.','CSRF');
    add(qs('form').filter(f=>{
      const hasPw=f.querySelector('input[type="password"]');
      return hasPw&&(f.method||'get').toLowerCase()!=='post';
    }),'danger','Password form uses GET','Credentials would appear in the URL, history and logs.','CSRF');
    add(qs('form[action=""],form:not([action])').filter(f=>f.querySelector('input[type="password"],input[type="file"]')),'warn','Sensitive form posts to the current URL','Confirm the handler rejects cross-site posts.','CSRF');

    const secretRe=/-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk_live_[0-9a-zA-Z]{10,}|AIza[0-9A-Za-z\-_]{20,}|ghp_[0-9A-Za-z]{20,}|xox[baprs]-[0-9A-Za-z-]{10,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\./;
    if(secretRe.test(html+code)) add([document.documentElement],'danger','Secret material in page source','The HTML or inline script matches a private key, cloud token, live Stripe key, GitHub token or JWT-shaped string. Rotate it; it is already public to anyone who opened this page.','Secrets');
    add(qs('input[type="hidden"]').filter(i=>/password|passwd|pwd|secret|api[_-]?key|private/i.test(i.name+(i.value||''))),'danger','Secret kept in a hidden field','Hidden inputs are visible in the DOM and in screenshots.','Secrets');
    add(qs('input[type="text"],input:not([type])').filter(i=>/password|passwd|pwd/i.test(i.name||i.id||i.autocomplete||'')),'warn','Password-like field is not type=password','The value may be visible on screen and in password managers incorrectly.','Secrets');
    add(qs('pre,code,textarea').filter(e=>/api[_-]?key|secret|password\s*=/i.test(e.textContent||'')&&(e.textContent||'').length<4000),'warn','Credential-like text in a visible block','Remove keys from examples and support pages.','Secrets');
    let storageHits=0;
    try{
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i)||'';
        const v=localStorage.getItem(k)||'';
        if(/token|session|jwt|auth|secret|password|apikey|api_key/i.test(k+v.slice(0,80))) storageHits++;
      }
    }catch{}
    if(storageHits) add([document.documentElement],'warn','Auth-like data in localStorage',storageHits+' key(s) look like tokens. localStorage is readable by any XSS on this origin. Prefer HttpOnly cookies.','Secrets');

    const csp=[...qs('meta[http-equiv="Content-Security-Policy"],meta[http-equiv="content-security-policy"]')].map(m=>m.content||'').join(';');
    if(!csp && !document.querySelector('meta[http-equiv="Content-Security-Policy" i]'))
      add([document.head||document.documentElement],'warn','No CSP meta tag','A Content-Security-Policy (header or meta) limits XSS even when a sink exists. Headers cannot be read offline, so this only checks the document.','Hardening');
    if(/unsafe-inline/i.test(csp)) add([document.head||document.documentElement],'warn','CSP allows unsafe-inline','unsafe-inline lets injected script run. Use nonces or hashes.','Hardening');
    if(/unsafe-eval/i.test(csp)) add([document.head||document.documentElement],'warn','CSP allows unsafe-eval','unsafe-eval re-enables eval-based XSS.','Hardening');
    const third=qs('script[src]').filter(s=>{try{return new URL(s.src,location.href).origin!==location.origin}catch{return false}});
    add(third.filter(s=>!s.integrity),'warn','Third-party script without SRI',third.filter(s=>!s.integrity).length+' remote script(s) have no integrity hash. A CDN compromise would run as this site.','Hardening');
    add(qs('iframe:not([sandbox])'),'warn','iframe without sandbox','Unsandboxed frames can navigate the parent or run powerful APIs.','Hardening');
    add(qs('object,embed,applet'),'warn','Plugin / embed objects','Legacy embeds are a frequent drive-by source. Prefer HTML5.','Hardening');
    add(qs('input[type="file"]'),'warn','File upload control','Confirm type, size and content checks on the server, and that uploads cannot be executed.','Hardening');
    add(qs('a[href*=".git"],a[href*=".env"],a[href*="phpinfo"],a[href*="wp-login"],a[href*="phpmyadmin"],a[href*="/admin"]'),'warn','Sensitive path linked from the page','The markup links toward admin, phpinfo, .env or .git style paths. Those should not be public.','Hardening');
    const jq=window.jQuery?.fn?.jquery||'';
    if(jq&&/^(1\.|2\.|3\.[0-4]\.)/.test(jq)) add([document.documentElement],'warn','Outdated jQuery on window','jQuery '+jq+' has known XSS issues in older branches. Upgrade or remove it.','Hardening');
    const jqSrc=qs('script[src*="jquery"]').map(s=>s.src);
    if(jqSrc.some(s=>/jquery-1\.|jquery-2\.|jquery-3\.[0-4]/.test(s))) add(qs('script[src*="jquery"]'),'warn','Old jQuery file name','The script URL looks like a jQuery 1.x–3.4 build. Check CVEs for that version.','Hardening');
    if(/document\.cookie/i.test(code)) add([document.documentElement],'warn','Script reads document.cookie','Cookie access from JavaScript means those cookies are not HttpOnly and will leak during XSS.','Hardening');
    if(/document\.domain\s*=/i.test(code)) add([document.documentElement],'warn','document.domain assignment','Relaxing document.domain widens the XSS impact across sibling hosts.','Hardening');
    add(qs('meta[http-equiv="refresh"]'),'warn','Meta refresh','Meta refresh can be used for open redirects and phishing hops.','Hardening');
    add(qs('a[href^="file:"],a[href^="\\\\"]'),'danger','Local file link','file: or UNC links can probe the user’s machine.','Hardening');
    if(!document.querySelector('meta[name="referrer"],meta[name="referrer-policy"]'))
      add([document.head||document.documentElement],'warn','No referrer policy in the document','Without a referrer policy, tokens in URLs leak to third-party links.','Hardening');

    const danger=issues.filter(i=>i.severity==='danger').reduce((n,i)=>n+(i.count||1),0);
    const warnings=issues.filter(i=>i.severity==='warn').reduce((n,i)=>n+(i.count||1),0);
    const score=Math.min(100,danger*10+warnings*3);
    const groups=[...new Set(issues.map(i=>i.group))];
    return {
      score,issues,danger,warnings,groups,offline:true,
      headline:danger?'Security-impacting findings on this page':warnings?'Hardening gaps and injection indicators':'No common security fingerprint found',
      copy:'Scout only reads this document, its inline scripts, forms, URL and local storage. It works offline. It does not send probes, payloads or login attempts, so a clean result is not a proof of safety.'
    };
  }

  function buildCaution(sec, url, opp){
    const lines=[];
    const titles=new Set([...(sec.issues||[]),...(url.signals||[]),...(opp.signals||[])].filter(i=>i.level==='danger'||i.severity==='danger').map(i=>i.title));
    const groups=new Set((sec.issues||[]).filter(i=>i.severity==='danger').map(i=>i.group));
    if(location.protocol!=='https:' || titles.has('Connection is not encrypted') || groups.has('Transport'))
      lines.push('Do not type a password, OTP, card number or bank login. This connection or form is not safe.');
    if(groups.has('XSS') || titles.has('javascript: address') || titles.has('Markup in the address'))
      lines.push('This page has XSS-style script behaviour. Anything you enter could be stolen. Leave the fields empty.');
    if(groups.has('SQL') || titles.has('Database error text on the page'))
      lines.push('The page is leaking database errors or query-like fields. Do not submit name, ID or payment details.');
    if(groups.has('CSRF') || titles.has('Password form uses GET'))
      lines.push('A sign-in form looks unsafe. Do not log in here.');
    if(groups.has('Secrets'))
      lines.push('Secrets are already visible in this page. Do not add more credentials.');
    if((opp.signals||[]).some(s=>s.level==='danger'))
      lines.push('Do not pay, upload an ID document, or send an OTP until you verify the organizer on their real website.');
    const unique=[...new Set(lines)].slice(0,5);
    const block=unique.some(l=>/Do not type|could be stolen|Do not log in|Do not submit|Do not pay/i.test(l));
    return {
      level: unique.length?(block?'danger':'warn'):'ok',
      title: unique.length?'Do not enter sensitive information':'No urgent caution',
      lines: unique,
      block
    };
  }

  function sensitiveControl(el){
    if(!el||el.closest?.('#proofscout-root,#proofscout-panel,#proofscout-caution'))return false;
    const t=(el.type||'').toLowerCase();
    const hint=((el.autocomplete||'')+' '+(el.name||'')+' '+(el.id||'')+' '+(el.placeholder||'')).toLowerCase();
    return t==='password'||t==='email'||t==='tel'||t==='file'||/otp|cvv|card|cc-|ssn|bvn|passport|nid|pin|secret|token/i.test(hint);
  }

  let lastCaution={level:'ok',title:'',lines:[],block:false};
  function refreshCaution(){
    try{lastCaution=buildCaution(securityScan(),urlScan(),opportunityScan())}catch{lastCaution={level:'ok',title:'',lines:[],block:false}}
    const bar=document.getElementById('proofscout-caution');
    if(!bar)return;
    if(lastCaution.level==='danger'){
      bar.classList.add('ps-show');
      bar.querySelector('strong').textContent=lastCaution.title;
      bar.querySelector('span').textContent=lastCaution.lines[0]||'Pause before you type.';
    }else bar.classList.remove('ps-show');
    return lastCaution;
  }

  function appendCaution(caution){
    if(!caution||!caution.lines?.length)return;
    const box=make('div','ps-caution'+(caution.level==='warn'?' ps-warn':''));
    box.append(make('strong','',caution.title));
    const list=document.createElement('ul');
    caution.lines.forEach(line=>{const li=document.createElement('li');li.textContent=line;list.append(li)});
    box.append(list);
    body.append(box);
  }

  function loadPos(){
    try{
      const saved=JSON.parse(localStorage.getItem(POS_KEY)||'null');
      if(saved&&(saved.edge==='left'||saved.edge==='right')&&typeof saved.y==='number')return saved;
    }catch{}
    return {edge:'right', y:0.38};
  }
  function savePos(pos){try{localStorage.setItem(POS_KEY,JSON.stringify(pos))}catch{}}

  let root, panel, orb, body, active='security', lastSummary='', peekTimer=null, pos=loadPos();
  let dragging=false, moved=false, startX=0, startY=0, origX=0, origY=0;

  function applyPos(){
    if(!root)return;
    const maxY=Math.max(8, window.innerHeight-SIZE-8);
    const y=Math.min(maxY, Math.max(8, pos.y*window.innerHeight));
    root.style.top=y+'px';
    root.style.bottom='auto';
    if(pos.edge==='left'){
      root.style.left='0px';root.style.right='auto';root.classList.add('ps-left');root.classList.remove('ps-right');
    }else{
      root.style.left='auto';root.style.right='0px';root.classList.add('ps-right');root.classList.remove('ps-left');
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
        s.nodes.slice(0,20).forEach(e=>e?.classList?.add('proofscout-highlight'));
        s.nodes[0]?.scrollIntoView?.({behavior:'smooth',block:'center'});
        status(`${s.count||s.nodes.length} highlighted`);
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
      const r=opportunityScan();const caution=buildCaution(securityScan(),urlScan(),r);
      lastSummary=`${caution.lines[0]||''} ProofScout found a risk score of ${r.score} out of 100. ${r.headline}. ${r.copy}`;
      appendHero(r.headline,r.copy,r.score,'risk',r.score>=65?'ps-danger':r.score>=35?'ps-warn':'');
      appendCaution(caution);
      appendStats([['Page words checked',Math.round(r.textLength/5).toLocaleString()],['Signals explained',r.signals.length]]);
      appendSectionTitle('Page signals');
      if(r.signals.length)r.signals.forEach(s=>appendSignal(s));else appendEmpty('No common opportunity-pressure phrase was detected.');
      const copyButton=make('button','ps-action');copyButton.type='button';
      copyButton.append(make('span','','Copy verification questions'),make('span','','→'));body.append(copyButton);
      copyButton.addEventListener('click',()=>navigator.clipboard.writeText('I am independently verifying this page before I continue. Please confirm the official deadline, eligibility, complete rules, all fees, the authorized application domain, and the correct organizer contact through an official channel. For security, I will not send passwords, OTP codes, seed phrases or banking logins.').then(()=>status('Questions copied')).catch(()=>status('Clipboard blocked')));
    }else if(tab==='url'){
      const r=urlScan();const caution=buildCaution(securityScan(),r,opportunityScan());
      lastSummary=`${caution.lines[0]||''} URL check for ${r.domain}. Risk score ${r.score} out of 100. ${r.headline}.`;
      appendHero(r.headline,r.copy,r.score,'risk',r.score>=50?'ps-danger':r.score?'ps-warn':'');
      appendCaution(caution);
      body.append(make('div','ps-url',location.href));
      const grid=appendStats([['Protocol',r.protocol.toUpperCase()],['Query keys',r.paramCount]]);
      grid.style.marginTop='8px';appendSectionTitle('URL signals');r.signals.forEach(s=>appendSignal(s));
    }else if(tab==='security'){
      const r=securityScan();const caution=buildCaution(r,urlScan(),opportunityScan());
      lastSummary=`${caution.lines[0]||r.headline}. Security audit found ${r.danger} high-impact indicators and ${r.warnings} hardening gaps.`;
      appendHero(r.headline,r.copy,r.score,'severity',r.danger?'ps-danger':r.warnings?'ps-warn':'');
      appendCaution(caution);
      appendStats([['High impact',r.danger],['Hardening gaps',r.warnings],['Offline', 'Yes'],['Groups', r.groups.length]]);
      if(!r.issues.length) appendEmpty('No common XSS, SQL-error, CSRF, secret or hardening fingerprint was visible in this document. That is not a penetration-test result.');
      ['XSS','SQL','CSRF','Secrets','Transport','Hardening'].forEach(group=>{
        const items=r.issues.filter(i=>i.group===group);
        if(!items.length)return;
        appendSectionTitle(group==='SQL'?'SQL / data layer':group==='XSS'?'Cross-site scripting':group);
        items.forEach(s=>appendSignal(s,true));
      });
    }else{
      const r=qualityScan();lastSummary=`Bug doctor found ${r.danger} security-impacting quality problems and ${r.warnings} accessibility issues. ${r.copy}`;
      appendHero(r.headline,r.copy,r.score,'severity',r.danger?'ps-danger':r.warnings?'ps-warn':'');
      appendStats([['Blocking',r.danger],['Quality / access',r.warnings]]);appendSectionTitle('Diagnosed issues');
      if(r.issues.length)r.issues.forEach(s=>appendSignal(s,true));else appendEmpty('No common structural bug found.');
    }
    try{
      const hot=tab==='security'?securityScan().score:tab==='url'?urlScan().score:tab==='opportunity'?opportunityScan().score:qualityScan().score;
      orb.classList.toggle('ps-alert', hot>=65);
    }catch{}
  }

  function togglePanel(){
    panel.classList.toggle('ps-open');
    if(panel.classList.contains('ps-open')){root.classList.remove('ps-peek');render(active)}
    else schedulePeek();
  }
  function unmount(){
    clearTimeout(peekTimer);
    root?.remove();
    document.getElementById('proofscout-caution')?.remove();
    document.getElementById('proofscout-panel')?.remove();
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
      savePos(pos);applyPos();schedulePeek();
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
    title.append(make('strong','','Scout'),make('span','','Offline page intelligence'));
    const iconButton=(id,label,titleText)=>{const b=make('button','ps-icon',label);b.id=id;b.type='button';b.title=titleText;return b};
    head.append(mark,title,iconButton('ps-speak','◖','Read summary aloud'),iconButton('ps-mic','●','Voice command'),iconButton('ps-close','×','Close'));
    const tabs=make('div','ps-tabs');
    [['security','Security'],['url','URL'],['opportunity','Offer'],['bugs','Quality']].forEach(([id,label],i)=>{
      const b=make('button',`ps-tab${i===0?' ps-active':''}`,label);b.type='button';b.dataset.tab=id;tabs.append(b);
    });
    body=make('div','ps-body');body.id='ps-body';
    const footer=make('div','ps-footer'),statusNode=make('span','ps-listen','Ready');statusNode.id='ps-status';
    const unpin=make('button','ps-unpin','Hide circle');unpin.type='button';
    footer.append(make('span','','On-device · works offline'), statusNode);
    if(opts.canUnpin!==false)footer.append(unpin);
    panel.append(head,tabs,body,footer);
    orb=make('button','','P');orb.id='proofscout-orb';orb.type='button';
    orb.setAttribute('aria-label','Open ProofScout');orb.title='Drag to the edge. Tap to audit this page.';
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
        if(/security|xss|sql|inject/.test(q))render('security');
        else if(/bug|quality|access/.test(q))render('bugs');
        else if(/url|link|domain/.test(q))render('url');
        else if(/close|hide/.test(q))panel.classList.remove('ps-open');
        else render('opportunity');
        status('Heard: '+q);
      };
      rec.onerror=()=>status('Could not hear command');rec.start();
    });
    window.addEventListener('resize',()=>applyPos());
    try{if(securityScan().score>=65)orb.classList.add('ps-alert')}catch{}
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
