import crypto from 'node:crypto';
import { NCEngine, OpenChannel, SendTextMessageParams, ConnectionStatus } from '@nexconn/chat';
const APP_KEY='6tnym1br6iaf7', SECRET='5ljIzEkWb2vK8M';
async function getToken(uid,name){
  const nonce=crypto.randomBytes(8).toString('hex').slice(0,16);
  const ts=Date.now().toString();
  const sig=crypto.createHash('sha1').update(SECRET+nonce+ts).digest('hex');
  const res=await fetch('https://api.sg-light-api.com/v4/auth/access-token/issue',{
    method:'POST',headers:{'App-Key':APP_KEY,'Nonce':nonce,'Timestamp':ts,'Signature':sig,'Content-Type':'application/json'},
    body:JSON.stringify({userId:uid,name})});
  const j=await res.json();
  return j.result.accessToken;
}
NCEngine.initialize({appKey:APP_KEY});
const token=await getToken('sdktest1','SDK Tester');
console.log('token ok');
try{
  const res=await NCEngine.connect({token});
  console.log('connect:',JSON.stringify(res).slice(0,200));
}catch(e){console.log('connect ERR',e.message)}
await new Promise(r=>setTimeout(r,3000));
try{
  const ch=new OpenChannel('lobby-1');
  const r=await ch.enterChannel();
  console.log('enter:',JSON.stringify(r).slice(0,300));
}catch(e){console.log('enter ERR',e.message)}
process.exit(0);
