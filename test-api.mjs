import crypto from 'node:crypto';
const APP_KEY='6tnym1br6iaf7', SECRET='5ljIzEkWb2vK8M';
const nonce=crypto.randomBytes(8).toString('hex').slice(0,16);
const ts=Date.now().toString();
const sig=crypto.createHash('sha1').update(SECRET+nonce+ts).digest('hex');
const res=await fetch('https://api.sg-light-api.com/v4/auth/access-token/issue',{
  method:'POST',
  headers:{'App-Key':APP_KEY,'Nonce':nonce,'Timestamp':ts,'Signature':sig,'Content-Type':'application/json'},
  body:JSON.stringify({userId:'tester1',name:'Tester One',avatarUrl:''})
});
const txt=await res.text();
console.log(res.status, txt.slice(0,300));
