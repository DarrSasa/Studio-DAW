export const NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const;
export const SNAP_VALUES=['Bar','Beat','1/2 beat','1/3 beat','1/4 beat','Step','1/6 beat','1/2 step','1/3 step','1/4 step','1/6 step','(none)'] as const;
export type SnapName=typeof SNAP_VALUES[number];
export function snapSeconds(snap:SnapName,bpm:number,beats=4){const beat=60/Math.max(1,bpm);const map:Record<SnapName,number>={Bar:beat*beats,Beat:beat,'1/2 beat':beat/2,'1/3 beat':beat/3,'1/4 beat':beat/4,Step:beat/4,'1/6 beat':beat/6,'1/2 step':beat/8,'1/3 step':beat/12,'1/4 step':beat/16,'1/6 step':beat/24,'(none)':0};return map[snap]}
export function quantize(time:number,snap:SnapName,bpm:number,beats=4){const step=snapSeconds(snap,bpm,beats);return Math.max(0,step?Math.round(time/step)*step:time)}
export type KeyEstimate={key:string;scale:string;score:number};
const majorProfile=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],minorProfile=[6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
export function detectKey(chroma:number[]):KeyEstimate|null{if(!chroma||chroma.length<12||chroma.slice(0,12).every(v=>!Number.isFinite(v)||v<=0))return null;const x=chroma.slice(0,12).map(v=>Number.isFinite(v)?v:0);let best:KeyEstimate|null=null;for(let root=0;root<12;root++)for(const [scale,profile]of[['Major',majorProfile],['Minor',minorProfile]] as const){let dot=0,xx=0,pp=0;for(let i=0;i<12;i++){const v=x[(i+root)%12],p=profile[i];dot+=v*p;xx+=v*v;pp+=p*p}const score=dot/Math.sqrt(Math.max(1e-12,xx*pp));if(!best||score>best.score)best={key:NOTE_NAMES[root],scale,score}}return best}
export function midiPitchClasses(bytes:ArrayBuffer){const counts=Array(12).fill(0) as number[];for(const n of parseMidiNotes(bytes).notes)counts[n.pitch%12]++;return counts}
function fft(re:Float64Array,im:Float64Array){const n=re.length;for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]]}}for(let len=2;len<=n;len<<=1){const angle=-2*Math.PI/len,wr0=Math.cos(angle),wi0=Math.sin(angle);for(let i=0;i<n;i+=len){let wr=1,wi=0;for(let j=0;j<len/2;j++){const u=i+j,v=i+j+len/2,tr=wr*re[v]-wi*im[v],ti=wr*im[v]+wi*re[v];re[v]=re[u]-tr;im[v]=im[u]-ti;re[u]+=tr;im[u]+=ti;const nw=wr*wr0-wi*wi0;wi=wr*wi0+wi*wr0;wr=nw}}}}
export type StereoAnalysis={chroma:number[];left:number[];right:number[]};
export async function analyzeAudio(file:File):Promise<StereoAnalysis>{const Ctx=window.AudioContext||((window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext);const ctx=new Ctx();try{const buf=await ctx.decodeAudioData(await file.arrayBuffer());const n=8192,hop=Math.max(n,Math.floor(buf.sampleRate*2)),chroma=Array(12).fill(0) as number[],bins=128,left=Array(bins).fill(0) as number[],right=Array(bins).fill(0) as number[];const l=buf.getChannelData(0),r=buf.numberOfChannels>1?buf.getChannelData(1):l;for(let b=0;b<bins;b++){const from=Math.floor(b*buf.length/bins),to=Math.max(from+1,Math.floor((b+1)*buf.length/bins));let lp=0,rp=0;for(let i=from;i<to;i++){lp=Math.max(lp,Math.abs(l[i]));rp=Math.max(rp,Math.abs(r[i]))}left[b]=lp;right[b]=rp}let frames=0;for(let start=0;start+n<buf.length&&frames<40;start+=hop){const re=new Float64Array(n),im=new Float64Array(n);let rms=0;for(let i=0;i<n;i++){const s=(l[start+i]+r[start+i])*.5;rms+=s*s;re[i]=s*(.5-.5*Math.cos(2*Math.PI*i/(n-1)))}if(rms/n<1e-5)continue;fft(re,im);for(let k=2;k<n/2;k++){const f=k*buf.sampleRate/n;if(f<55||f>2000)continue;const midi=Math.round(69+12*Math.log2(f/440));if(midi>=0&&midi<128)chroma[midi%12]+=Math.hypot(re[k],im[k])}frames++}return{chroma,left,right}}finally{await ctx.close()}}
export async function audioChroma(file:File){return(await analyzeAudio(file)).chroma}
export type MidiNote={start:number;duration:number;pitch:number;velocity:number};
export function parseMidiNotes(bytes:ArrayBuffer){
 const d=new DataView(bytes);if(d.byteLength<14||String.fromCharCode(d.getUint8(0),d.getUint8(1),d.getUint8(2),d.getUint8(3))!=='MThd')throw new Error('Fișierul nu pare MIDI standard.');
 const headerLength=d.getUint32(4),tracks=d.getUint16(10),division=d.getUint16(12)&0x7fff;if(!division)throw new Error('MIDI cu diviziune de timp neacceptată.');
 let pos=8+headerLength,maxTick=0;const all:Array<{start:number;end:number;pitch:number;velocity:number}>=[],tempos=[{tick:0,micros:500000}];
 for(let ti=0;ti<tracks&&pos+8<=d.byteLength;ti++){
  if(String.fromCharCode(d.getUint8(pos),d.getUint8(pos+1),d.getUint8(pos+2),d.getUint8(pos+3))!=='MTrk')throw new Error('Structură MIDI invalidă.');
  const end=Math.min(d.byteLength,pos+8+d.getUint32(pos+4));let p=pos+8,running=0,tick=0;const active=new Map<string,{start:number;velocity:number}[]>();
  const vlq=()=>{let n=0,b=0;do{if(p>=end)break;b=d.getUint8(p++);n=(n<<7)|(b&127)}while(b&128);return n};
  while(p<end){tick+=vlq();if(p>=end)break;let status=d.getUint8(p);if(status<128){if(!running)break;status=running}else{p++;if(status<240)running=status}
   if(status===0xff){if(p>=end)break;const meta=d.getUint8(p++),len=vlq();if(meta===0x51&&len===3&&p+3<=end)tempos.push({tick,micros:(d.getUint8(p)<<16)|(d.getUint8(p+1)<<8)|d.getUint8(p+2)});p=Math.min(end,p+len);continue}
   if(status===0xf0||status===0xf7){const len=vlq();p=Math.min(end,p+len);continue}
   const type=status&0xf0,ch=status&15,count=type===0xc0||type===0xd0?1:2;if(p+count>end)break;const pitch=d.getUint8(p),vel=count===2?d.getUint8(p+1):0;p+=count;
   if(type===0x90&&vel>0){const k=`${ch}:${pitch}`,q=active.get(k)||[];q.push({start:tick,velocity:vel});active.set(k,q);maxTick=Math.max(maxTick,tick)}else if(type===0x80||(type===0x90&&vel===0)){const k=`${ch}:${pitch}`,q=active.get(k),on=q?.shift();if(on){all.push({start:on.start,end:Math.max(on.start+1,tick),pitch,velocity:on.velocity});maxTick=Math.max(maxTick,tick)}}
  }maxTick=Math.max(maxTick,tick);pos=end;
 }
 if(!maxTick)return{notes:[] as MidiNote[],totalTicks:1,division,durationSeconds:0};
 const tempoMap=tempos.sort((a,b)=>a.tick-b.tick).filter((e,i,a)=>i===a.length-1||e.tick!==a[i+1].tick);
 const secondsAt=(target:number)=>{let ticks=0,seconds=0,micros=500000;for(const e of tempoMap){if(e.tick>target)break;seconds+=(e.tick-ticks)*micros/(division*1e6);ticks=e.tick;micros=e.micros}return seconds+(target-ticks)*micros/(division*1e6)};
 const durationSeconds=secondsAt(maxTick)||maxTick/division*.5;
 return{notes:all.map(x=>{const start=secondsAt(x.start),end=secondsAt(x.end);return{pitch:x.pitch,velocity:x.velocity,start:start/durationSeconds,duration:(end-start)/durationSeconds}}),totalTicks:maxTick,division,durationSeconds};
}
