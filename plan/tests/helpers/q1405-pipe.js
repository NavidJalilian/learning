const d=[3,2,4,3,2,5,3,2,4,3], e=[6,4,7,5,8,4,6,5,7,6], u=[2,1,2,2,3,1,2,2,2,1];
function noQ(d,e,u){let Drel=0,Erel=0,Ufin=0,blockD=0,blockE=0;const n=d.length;for(let i=0;i<n;i++){const ds=Drel,df=ds+d[i];const h1=Math.max(df,Erel);blockD+=h1-df;Drel=h1;const ef=h1+e[i];const h2=Math.max(ef,Ufin);blockE+=h2-ef;Erel=h2;Ufin=h2+u[i];}return {total:Ufin,blockD,blockE};}
function withQ(d,e,u,W){let t=0;const df=[];for(let i=0;i<d.length;i++){t+=d[i];df.push(t);}const wf=Array(W).fill(0);const ef=[];for(let i=0;i<d.length;i++){let k=0;for(let j=1;j<W;j++)if(wf[j]<wf[k])k=j;const s=Math.max(df[i],wf[k]);wf[k]=s+e[i];ef.push(wf[k]);}const ord=ef.map((x,i)=>i).sort((a,b)=>ef[a]-ef[b]);let uf=0;for(const i of ord){uf=Math.max(uf,ef[i])+u[i];}return {total:uf,dDone:df[df.length-1]};}
console.log(noQ(d,e,u), [1,2,3].map(W=>withQ(d,e,u,W)));
const d2=d.concat(d),e2=e.concat(e),u2=u.concat(u);
console.log(noQ(d2,e2,u2), [1,2,3].map(W=>withQ(d2,e2,u2,W)));
