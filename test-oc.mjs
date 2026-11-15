import crypto from 'node:crypto';
const APP_KEY='6tnym1br6iaf7', SECRET='5ljIzEkWb2vK8M';
function headers(){
  const nonce=crypto.randomBytes(8).toString('hex').slice(0,16);
  const ts=Date.now().toString();
  const sig=crypto.createHash('sha1').update(SECRET+nonce+ts).digest('hex');
  return {'App-Key':APP_KEY,'Nonce':nonce,'Timestamp':ts,'Signature':sig,'Content-Type':'application/json'};
}
async function tryCall(path, body){
  try{
    const res=await fetch('https://api.sg-light-api.com'+path,{method:'POST',headers:headers(),body:JSON.stringify(body)});
    const t=await res.text();
    console.log(path,'->',res.status,t.slice(0,180));
  }catch(e){console.log(path,'ERR',e.message)}
}
await tryCall('/v4/openchannel/create',{channelId:'pulse-lobby',name:'Pulse Lobby'});
await tryCall('/v4/open_channels',{channelId:'pulse-lobby',name:'Pulse Lobby'});
await tryCall('/v4/channel/open/create',{channelId:'pulse-lobby',name:'Pulse Lobby'});
