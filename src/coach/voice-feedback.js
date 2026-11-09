/* Transparent textual comparison, never a phoneme/grammar evaluation. No model, API or data persistence. */
window.VoxCoachFeedback=(()=>{
 const tokens=text=>String(text||'').toLowerCase().match(/[a-z]+(?:['’][a-z]+)*/g)?.map(s=>s.replace('’',"'"))||[];
 function align(reference,heard){
   const a=tokens(reference).slice(0,90),b=tokens(heard).slice(0,90),n=a.length,m=b.length;
   const dp=Array.from({length:n+1},()=>Array(m+1).fill(0));
   for(let i=0;i<=n;i++)dp[i][0]=i;
   for(let j=0;j<=m;j++)dp[0][j]=j;
   for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)
     dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
   const rows=[];let i=n,j=m;
   while(i>0||j>0){
     if(i&&j&&dp[i][j]===dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1)){
       rows.push({word:a[i-1],heard:b[j-1],kind:a[i-1]===b[j-1]?'match':'review'});i--;j--;
     }else if(i&&dp[i][j]===dp[i-1][j]+1){rows.push({word:a[i-1],heard:'',kind:'review'});i--;}
     else{rows.push({word:'',heard:b[j-1],kind:'extra'});j--;}
   }
   return rows.reverse();
 }
 function render(root,reference,heard,sayWord){
   if(!root)return {matched:0,expected:0};
   root.replaceChildren();root.className='coach-voice-compare';
   const aligned=align(reference,heard),matched=aligned.filter(x=>x.kind==='match').length,expected=tokens(reference).length;
   const title=document.createElement('strong');title.textContent='Comparación de palabras · '+matched+' de '+expected+' detectadas en orden';root.append(title);
   const label=document.createElement('p');label.textContent='Texto reconocido o corregido: no es una medición de fonemas. Toca las palabras para escucharlas lentamente.';root.append(label);
   const row=document.createElement('div');row.className='coach-word-chips';
   for(const item of aligned){
     const word=item.word||item.heard,ipa=window.VoxIPA?.lookup(word);
     const el=document.createElement('button');el.type='button';el.className='coach-word '+item.kind;
     el.textContent=word+(ipa?' /'+ipa+'/':'');
     el.setAttribute('aria-label',(item.kind==='match'?'Palabra coincidente':item.kind==='extra'?'Palabra adicional':'Palabra para revisar')+': '+word);
     el.title=item.kind==='review'?'Esperada: '+(item.word||'—')+' · transcrita: '+(item.heard||'—'):'Escuchar '+word;
     if(typeof sayWord==='function')el.addEventListener('click',()=>sayWord(word));else el.disabled=true;
     row.append(el);
   }
   root.append(row);
   const note=document.createElement('p');note.className='coach-muted';note.textContent='Una palabra marcada puede reflejar un error del reconocimiento de Chrome, no de tu pronunciación. Compara siempre el audio real.';root.append(note);
   return {matched,expected,review:aligned.filter(x=>x.kind!=='match').length};
 }
 return Object.freeze({tokens,align,render});
})();
