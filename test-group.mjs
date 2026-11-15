import crypto from 'node:crypto';
const APP_KEY='6tnym1br6iaf7', SECRET='5ljIzEkWb2vK8M';
function headers(){
  const nonce=crypto.randomBytes(8).toString('hex').slice(0,16);
  const ts=Date.now().toString();
  const sig=crypto.createHash('sha1').update(SECRET+nonce+ts).digest('hex');
  return {'App-Key':APP_KEY,'Nonce':nonce,'Timestamp':ts,'Signature':sig,'Content-Type':'application/json'};
}
async function call(label, path, body){
  const res=await fetch('https://api.sg-light-api.com'+path,{method:'POST',headers:headers(),body:JSON.stringify(body)});
  console.log(label,'->',res.status,(await res.text()).slice(0,200));
}
// register a permanent bot user first
await call('reg-bot','/v4/auth/access-token/issue',{userId:'pulsebot',name:'Pulse Bot'});
// create group (RongCloud style: groupId, name, owner, userIds)
await call('grp-create','/v4/group/create',{groupId:'grp-lobby',name:'Pulse Lobby',owner:'pulsebot',userIds:['pulsebot']});
