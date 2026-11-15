import crypto from 'node:crypto';
const APP_KEY='6tnym1br6iaf7', SECRET='5ljIzEkWb2vK8M';
function headers(){
  const nonce=crypto.randomBytes(8).toString('hex').slice(0,16);
  const ts=Date.now().toString();
  const sig=crypto.createHash('sha1').update(SECRET+nonce+ts).digest('hex');
  return {'App-Key':APP_KEY,'Nonce':nonce,'Timestamp':ts,'Signature':sig,'Content-Type':'application/json'};
}
async function call(label,path,body){
  const res=await fetch('https://api.sg-light-api.com'+path,{method:'POST',headers:headers(),body:JSON.stringify(body)});
  console.log(label,'->',res.status,(await res.text()).slice(0,180));
}
await call('modify','/v4/user/modify',{userId:'u_f68e5e0422cd',name:'Neha'});
await call('profile','/v4/user/profiles/set',{userId:'u_f68e5e0422cd',userProfile:{name:'Neha'}});
