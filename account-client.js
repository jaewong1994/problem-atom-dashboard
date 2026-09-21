(function(){'use strict';
 const enabled=Boolean(window.PA_TEAM_CONFIG?.enabled);let current=null;
 const cloud=enabled&&window.PA_TEAM_CONFIG.provider==='supabase'?window.PASupabaseAccount.create(window.PA_TEAM_CONFIG):null;
 const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;if(cls)el.className=cls;return el;};
 async function call(route,body){if(cloud){try{return await cloud.call(route,body);}catch(e){if(e.status===401&&route!=='login'&&document.body.dataset.page!=='index')location.assign('index.html');throw e;}}const response=await fetch('/team/'+route,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json','X-PA-Team':'1',...(current?.csrf?{'X-PA-CSRF':current.csrf}:{})}:{},body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok){if(response.status===401&&route!=='login'&&document.body.dataset.page!=='index')location.assign('index.html');throw Error(data.error||'계정 서버와 연결하지 못했습니다.');}return data;}
 function identity(){const field=document.getElementById('actor');if(field&&current?.user){field.value=current.user.name;field.readOnly=true;field.setAttribute('aria-label','로그인한 강사');}if(current?.user)try{localStorage.setItem('seminar-actor',current.user.name);}catch(_){}}
 function bar(){let el=document.getElementById('teamAccountBar');if(!el){el=node('aside',null,'team-account-bar');el.id='teamAccountBar';document.querySelector('.global-header').after(el);}el.replaceChildren();if(!current?.user){el.append(node('span','강사 계정으로 로그인해 주세요.'));return;}el.append(node('strong',current.user.name+' 강사'));if(current.mode)el.append(node('span',current.mode==='codex'?'Codex 구독으로 제작':'AI 웹으로 제작'));if(current.user.role==='admin'){const manage=node('button','계정 관리');manage.type='button';manage.onclick=admin;el.append(manage);}const logout=node('button','로그아웃');logout.type='button';logout.onclick=async()=>{try{await call('logout',{});location.assign('index.html');}catch(e){if(cloud){cloud.clear();location.assign('index.html');}else el.append(node('span',e.message));}};el.append(logout);}
 async function admin(){
  let dialog=document.getElementById('teamAdmin');if(dialog)dialog.remove();dialog=node('dialog',null,'team-admin');dialog.id='teamAdmin';dialog.setAttribute('aria-labelledby','teamAdminTitle');
  const heading=node('h2','강사 계정 관리');heading.id='teamAdminTitle';const close=node('button','닫기');close.type='button';close.onclick=()=>dialog.close();
  const header=node('div',null,'team-admin-heading');header.append(heading,close);
  const status=node('p',null,'team-status');status.setAttribute('role','status');const list=node('div',null,'team-member-list'),issued=node('section',null,'team-issued');issued.hidden=true;
  const form=node('form',null,'team-create'),label=node('label','추가할 강사 이름'),name=node('input');name.required=true;name.maxLength=20;name.autocomplete='off';label.append(name);const add=node('button','계정 추가','team-primary');add.type='submit';form.append(label,add);
  dialog.append(header,node('p','이름으로 계정을 추가하고 초대 코드를 전달하세요. 당사자가 첫 로그인 때 직접 비밀번호를 설정합니다.'),form,issued,status,list,node('small','계정을 삭제하면 로그인이 차단됩니다. 기존 분석·검수 기록은 보존되며 여기서 계정을 복원할 수 있습니다.'));document.body.append(dialog);dialog.showModal();
  function render(members){list.replaceChildren();for(const m of members){const row=node('article',null,'team-member'),info=node('div');info.append(node('strong',m.name),node('span',(m.role==='admin'?'관리자':'강사')+' · '+({pending:'비밀번호 설정 전',active:'사용 중',deleted:'삭제됨'}[m.state])));row.append(info);
   const action=(text,kind)=>{const b=node('button',text);b.type='button';b.onclick=async()=>{if(kind==='delete'&&!b.dataset.confirm){b.dataset.confirm='yes';b.textContent='로그인을 차단하고 삭제';return;}b.disabled=true;try{await run({action:kind,id:m.id},m.name);}catch(_){}finally{b.disabled=false;}};row.append(b);return b;};
   if(m.state==='deleted')action('계정 복원','restore');else{if(m.state==='pending')action('초대 코드 재발급','invite');const b=action('삭제','delete');if(m.id===current.user.id){b.disabled=true;b.title='현재 로그인한 본인 계정은 삭제할 수 없습니다.';}}
   list.append(row);
  }}
  async function run(body,teacher){status.textContent='처리 중…';try{const result=await call('admin',body);render(result.members);status.textContent=body.action==='list'?'':teacher+' · 처리했습니다.';
   if(result.invite){issued.hidden=false;issued.replaceChildren(node('h3',teacher+' 강사 초대 코드'),node('p','7일 안에 본인에게 전달해 주세요. 이 코드는 지금 한 번만 표시됩니다. 재발급하면 이전 코드는 사용할 수 없습니다.'));const value=node('textarea');value.readOnly=true;value.value=result.invite;value.setAttribute('aria-label',teacher+' 초대 코드');const copy=node('button','초대 코드 복사');copy.type='button';copy.onclick=async()=>{try{await navigator.clipboard.writeText(result.invite);copy.textContent='복사됨';}catch(_){value.select();status.textContent='선택된 코드를 복사해 주세요.';}};issued.append(value,copy);}
   return result;
  }catch(e){status.textContent=e.message;throw e;}}
  form.onsubmit=async e=>{e.preventDefault();add.disabled=true;try{await run({action:'create',name:name.value.trim()},name.value.trim());name.value='';}catch(_){}finally{add.disabled=false;}};
  try{await run({action:'list'});}catch(_){}
 }
 function next(){const value=new URLSearchParams(location.search).get('next');return value&&/^[a-z-]+\.html(?:\?[^#]*)?$/.test(value)?value:null;}
 async function entry(){
  const main=document.getElementById('main');if(document.body.dataset.page!=='index')return;
  let host=document.getElementById('teamEntry');if(!host){host=node('section',null,'team-entry');host.id='teamEntry';main.prepend(host);}host.replaceChildren();
  if(current?.user&&current.mode){main.classList.remove('team-locked');host.hidden=true;return;}
  main.classList.add('team-locked');host.hidden=false;host.append(node('p','Problem Atom · 강사 작업실','team-eyebrow'));
  const status=node('p',null,'team-status');status.setAttribute('role','status');
  if(current?.user){
   host.append(node('h1',current.user.name+' 강사님, 어떻게 제작할까요?'),node('p','이번 로그인에서 사용할 방식을 고르세요. 제작실에서도 바꿀 수 있어요.'));
   const choices=node('div',null,'team-mode-choices');
   for(const [mode,title,description]of [['codex','AI 구독 연결','이 PC에 로그인한 Codex의 Sol로 제작합니다. Codex 이용 한도를 사용해요.'],['web','AI 웹 무료 이용','Gemini·ChatGPT 등 웹의 무료 한도로 제작합니다. 요청과 답변을 복사해서 주고받아요.']]){
    const b=node('button');b.type='button';b.append(node('strong',title),node('span',description));b.onclick=async()=>{choices.querySelectorAll('button').forEach(b=>b.disabled=true);try{current=await call('mode',{mode});bar();const destination=next();if(destination)location.assign(destination);else entry();}catch(e){status.textContent=e.message;choices.querySelectorAll('button').forEach(b=>b.disabled=false);}};choices.append(b);
   }host.append(choices,node('small','무료 AI 웹의 제공 한도와 로그인 요구는 각 서비스에 따라 달라요.'),status);return;
  }
  host.append(node('h1','강사 계정으로 시작하기'),node('p','처음이면 본인의 초대 코드로 비밀번호를 설정하세요. 기존 분석 기록은 계정에 연결됩니다.'));
  const form=node('form'),label=node('label','강사 이름'),name=node('select');name.name='username';name.autocomplete='username';name.required=true;name.append(new Option('본인 이름을 선택하세요',''));label.append(name);
  const members=(await call('members')).members;for(const m of members)name.append(new Option(m.name,m.name));
  const pwLabel=node('label','비밀번호'),password=node('input');password.type='password';password.autocomplete='current-password';password.required=true;password.maxLength=256;pwLabel.append(password);
  const setup=node('div',null,'team-setup'),inviteLabel=node('label','최초 설정용 초대 코드'),invite=node('input');invite.type='password';invite.autocomplete='off';invite.maxLength=128;inviteLabel.append(invite);
  const confirmLabel=node('label','비밀번호 다시 입력'),confirm=node('input');confirm.type='password';confirm.autocomplete='new-password';confirm.maxLength=256;confirmLabel.append(confirm);setup.append(inviteLabel,confirmLabel,node('small','운영자에게 받은 본인 코드로 한 번만 설정합니다. 비밀번호는 12자 이상으로 정해 주세요.'));setup.hidden=true;
  const submit=node('button','로그인','team-primary');submit.type='submit';name.onchange=()=>{const first=members.find(m=>m.name===name.value)?.needsSetup;setup.hidden=!first;invite.required=confirm.required=Boolean(first);password.autocomplete=first?'new-password':'current-password';password.minLength=first?12:1;submit.textContent=first?'비밀번호 설정하고 시작':'로그인';status.textContent='';};
  form.append(label,pwLabel,setup,submit,status);host.append(form);
  form.onsubmit=async event=>{event.preventDefault();if(!setup.hidden&&password.value!==confirm.value){status.textContent='두 비밀번호가 일치하지 않습니다.';return;}submit.disabled=true;status.textContent='로그인 확인 중…';try{current=await call('login',{name:name.value,password:password.value,...(!setup.hidden?{invite:invite.value}:{})});password.value=confirm.value=invite.value='';identity();bar();await entry();}catch(e){status.textContent=e.message;}finally{submit.disabled=false;}};
 }
 const ready=enabled?(async()=>{const main=document.getElementById('main');main?.classList.add('team-locked');try{current=await call('me');if(document.body.dataset.page!=='index'){if(!current?.user||!current.mode){location.replace('index.html?next='+encodeURIComponent(location.pathname.split('/').pop()+location.search));return current;}main?.classList.remove('team-locked');}identity();bar();await entry();return current;}catch(e){if(main){main.classList.add('team-locked');const box=node('section',null,'team-entry');box.id='teamEntry';const retry=node('a','홈에서 다시 로그인');retry.href='index.html';box.append(node('h1','계정 서버 연결 확인'),node('p',e.message),retry);main.prepend(box);}throw e;}})():Promise.resolve(null);
 // Consumers await ready; suppress an unhandled rejection on pages with no account-dependent work.
 ready.catch(()=>{});
 window.PAAccount={enabled,ready,call,current:()=>current,identity,storageKey:key=>enabled&&current?.user?key+':'+current.user.id:key,async setMode(mode){current=await call('mode',{mode});bar();return current;}};
})();
