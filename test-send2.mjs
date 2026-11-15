import crypto from 'node:crypto';
const APP_KEY='6tnym1br6iaf7', SECRET='5ljIzEkWb2vK8M';
function headers(ct){
  const nonce=crypto.randomBytes(8).toString('hex').slice(0,16);
  const ts=Date.now().toString();
  const sig=crypto.createHash('sha1').update(SECRET+nonce+ts).digest('hex');
  return {'App-Key':APP_KEY,'Nonce':nonce,'Timestamp':ts,'Signature':sig,'Content-Type':ct};
}
async function call(path, bodyObj, ct){
  const res=await fetch('https://api.sg-light-api.com'+path,{method:'POST',headers:headers(ct),body: ct.includes('json')?JSON.stringify(bodyObj):new URLSearchParams(bodyObj).toString()});
  console.log(path,ct.slice(0,20),'->',res.status,(await res.text()).slice(0,200));
}
const content=JSON.stringify({content:'Welcome to Pulse Lobby! 👋',type:'RC:TxtMsg'});
await call('/v4/open-channel/message/send',{channelId:'pulse-lobby',fromUserId:'sysbot',content},'application/x-www-form-urlencoded');
await call('/v4/open-channel/message/send',{channelId:'pulse-lobby',fromUserId:'sysbot',content:content},'application/json');
