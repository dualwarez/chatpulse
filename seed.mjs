import crypto from 'node:crypto';
const APP_KEY='6tnym1br6iaf7', SECRET='5ljIzEkWb2vK8M';
function headers(){
  const nonce=crypto.randomBytes(8).toString('hex').slice(0,16);
  const ts=Date.now().toString();
  const sig=crypto.createHash('sha1').update(SECRET+nonce+ts).digest('hex');
  return {'App-Key':APP_KEY,'Nonce':nonce,'Timestamp':ts,'Signature':sig,'Content-Type':'application/json'};
}
async function send(chId, text){
  const res=await fetch('https://api.sg-light-api.com/v4/open-channel/message/send',{method:'POST',headers:headers(),
    body:JSON.stringify({fromUserId:'pulsebot',toChannelIds:[chId],messageType:'RC:TxtMsg',content:JSON.stringify({content:text})})});
  console.log(chId,'->',res.status,(await res.text()).slice(0,150));
}
await send('pulse-lobby','👋 Welcome to Pulse Lobby! Say hi to everyone.');
await send('pulse-design','🎨 Drop your screenshots, get feedback from the community.');
await send('pulse-shipping','🚀 Shipping today? Tell us what you launched!');
await send('pulse-voice-notes','🎤 Async standup: what did you ship today?');
