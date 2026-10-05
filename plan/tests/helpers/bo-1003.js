function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function sim(base, jitter, {N=1000,C=60,B=0.25,T=24,cap=8,maxA=5}={}) {
  const r=rng(7); const nb=Math.round(T/B);
  const ok=Array(nb).fill(0), rej=Array(nb).fill(0);
  let pend=[]; for(let i=0;i<N;i++){const d=base; pend.push({t: jitter? r()*d : d, a:1});}
  let delivered=0,dlq=0,last=0;
  for(let b=0;b<nb;b++){
    const lo=b*B,hi=lo+B; const here=pend.filter(m=>m.t>=lo&&m.t<hi); pend=pend.filter(m=>!(m.t>=lo&&m.t<hi));
    here.sort((x,y)=>x.t-y.t);
    here.forEach((m,i)=>{ if(i<C){ok[b]++;delivered++;last=hi;} else { rej[b]++; if(m.a>=maxA){dlq++;} else { const d=Math.min(cap, base*2**m.a); pend.push({t: Math.max(hi, m.t + (jitter? r()*d : d)), a:m.a+1}); } } });
  }
  return {delivered,dlq,left:pend.length,last,peak:Math.max(...ok.map((o,i)=>o+rej[i]))};
}
for (const base of [0.5,1,2]) for (const j of [false,true]) console.log(base,j,JSON.stringify(sim(base,j)));
