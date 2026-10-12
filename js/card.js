/* Kadi + QR ya mgeni kuwa picha moja ya PNG. Inahitaji js/qrcode.js */
function qrImg(t,s=280){const q=QRMake(t),n=q.length,m=Math.max(2,Math.floor(s/(n+8))),c=document.createElement('canvas'),x=c.getContext('2d');c.width=c.height=m*(n+8);x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.fillStyle='#000';q.forEach((r,i)=>r.forEach((v,j)=>v&&x.fillRect((j+4)*m,(i+4)*m,m,m)));return c.toDataURL()}
const loadImg=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
/* Kadi juu, chini kuna kipande chenye QR + jina (haifunika muundo wa kadi) */
async function cardPng(g,e){let im=null;try{im=await loadImg(e.card)}catch(x){}
 const W=im?im.naturalWidth:720,H=im?im.naturalHeight:0,B=Math.round(W*.74),c=document.createElement('canvas'),x=c.getContext('2d');c.width=W;c.height=H+B;
 x.fillStyle='#0a1209';x.fillRect(0,0,W,H+B);if(im)x.drawImage(im,0,0);
 const q=Math.round(W*.42),qx=Math.round((W-q)/2),qy=H+Math.round(W*.045),p=14;
 x.fillStyle='#fff';x.roundRect?(x.beginPath(),x.roundRect(qx-p,qy-p,q+2*p,q+2*p,18),x.fill()):x.fillRect(qx-p,qy-p,q+2*p,q+2*p);
 const qi=await loadImg(qrImg(g.code,600));x.imageSmoothingEnabled=false;x.drawImage(qi,qx,qy,q,q);
 x.textAlign='center';x.fillStyle='#fff';x.font='700 '+Math.round(W*.05)+'px system-ui,sans-serif';x.fillText(g.name,W/2,qy+q+W*.09,W-40);
 x.fillStyle='#e0a92e';x.font=Math.round(W*.032)+'px system-ui,sans-serif';x.fillText([e.name,g.table].filter(Boolean).join(' · '),W/2,qy+q+W*.145,W-40);
 if(g.short){x.fillStyle='#fff';x.font='700 '+Math.round(W*.045)+'px ui-monospace,monospace';x.fillText('Code: '+g.short,W/2,qy+q+W*.215,W-40)}
 return new Promise(r=>c.toBlob(r,'image/png'))}
