import crypto from 'node:crypto';
const APP_KEY='6tnym1br6iaf7', SECRET='5ljIzEkWb2vK8M';
function headers(){
  const nonce=crypto.randomBytes(8).toString('hex').slice(0,16);
  const ts=Date.now().toString();
  const sig=crypto.createHash('sha1').update(SECRET+nonce+ts).digest('hex');
  return {'App-Key':APP_KEY,'Nonce':nonce,'Timestamp':ts,'Signature':sig,'Content-Type':'application/json'};
}
async function call(label, body){
  const res=await fetch('https://api.sg-light-api.com/v4/open-channel/message/send',{method:'POST',headers:headers(),body:JSON.stringify(body)});
  console.log(label,'->',res.status,(await res.text()).slice(0,200));
}
const content=JSON.stringify({content:'Welcome to Pulse Lobby! 👋',type:'RC:TxtMsg'});
await call('array-chan',{channelId:['pulse-lobby'],fromUserId:'sysbot',content});
await call('targetId',{targetId:'pulse-lobby',fromUserId:'sysbot',content});
await call('numChan',{channelId:'1',fromUserId:'sysbot',content});
