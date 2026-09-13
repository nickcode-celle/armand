import React,{useEffect,useMemo,useRef,useState}from"react";
import{ArrowUp,Gift,Home,Paperclip,RotateCcw,Settings,ShoppingBag}from"lucide-react";
import EntityMessage from"@/components/entity/EntityMessage";
import EmaeaBody from"@/components/entity/EmaeaBody";
import EmaeaSlogan from"@/components/entity/EmaeaSlogan";
import"./entity-ui.css";

const INITIAL_MESSAGE="Bonjour, moi c’est EMÆÄ. Et toi ?";
const ENTITY_ID_KEY="entity-instance-id";
const ENTITY_MESSAGES_KEY="entity-conversation";
const THEME_KEY="emaea-theme";
const WALLPAPER_KEY="emaea-wallpaper";

const THEMES={
  green:{label:"Vert",accent:"#39CE74",accent2:"#6EE7A0",rgb:"57,206,116",deep:"#071c11",logo:"/assets/emaea/emaea-logo-green.webp"},
  blue:{label:"Bleu",accent:"#3B82F6",accent2:"#75A7FF",rgb:"59,130,246",deep:"#08172f",logo:"/assets/emaea/emaea-logo-blue.png"},
  yellow:{label:"Jaune",accent:"#F2C94C",accent2:"#FFE17A",rgb:"242,201,76",deep:"#2b2206",logo:"/assets/emaea/emaea-logo-yellow.png"},
  red:{label:"Rouge",accent:"#EF4444",accent2:"#FF7A7A",rgb:"239,68,68",deep:"#2b0909",logo:"/assets/emaea/emaea-logo-red.png"}
};

const WALLPAPERS=[
  ["concrete-lines","Concrete Lines","#050706","#0f1612","lines"],
  ["marble-veil","Marble Veil","#090b0a","#343a37","marble"],
  ["paper-grain","Paper Grain","#17140f","#3c3427","grain"],
  ["cobalt-mist","Cobalt Mist","#030713","#11345e","mist"],
  ["amber-grid","Amber Grid","#080603","#4b2d06","grid"],
  ["slate-bloom","Slate Bloom","#07090a","#27313a","bloom"],
  ["ivory-noise","Ivory Noise","#171713","#565345","grain"],
  ["rose-circuit","Rose Circuit","#0c0508","#4b1228","circuit"],
  ["moss-haze","Moss Haze","#030805","#194a2d","mist"],
  ["silver-mesh","Silver Mesh","#060708","#3e464c","mesh"],
  ["indigo-fold","Indigo Fold","#060611","#302e69","fold"],
  ["copper-drift","Copper Drift","#0a0603","#5b2b12","drift"]
].map(([id,name,a,b,kind])=>({id,name,a,b,kind}));

const svgWallpaper=w=>{
  const common=`<defs><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .16"/></feComponentTransfer></filter><radialGradient id="g" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="${w.b}"/><stop offset="1" stop-color="${w.a}"/></radialGradient></defs>`;
  let art="";
  if(w.kind==="lines") art='<g opacity=".34" stroke="#8fb6a2" stroke-width="1">'+Array.from({length:34},(_,i)=>`<path d="M0 ${90+i*28} H1920"/>`).join('')+'</g>';
  if(w.kind==="marble") art='<g fill="none" stroke="#cbd5d1" opacity=".18" stroke-width="2"><path d="M-50 810 C350 500 480 980 920 590 S1500 210 1990 430"/><path d="M-30 260 C420 80 710 470 1080 230 S1570 520 1960 120"/></g>';
  if(w.kind==="grain") art='<rect width="1920" height="1080" filter="url(#n)" opacity=".55"/>';
  if(w.kind==="mist") art='<ellipse cx="960" cy="460" rx="760" ry="390" fill="#8fb9ff" opacity=".08"/><ellipse cx="1180" cy="620" rx="520" ry="260" fill="#fff" opacity=".035"/>';
  if(w.kind==="grid") art='<g stroke="#f2c94c" opacity=".14"><path d="M0 540H1920"/><path d="M960 0V1080"/><g>'+Array.from({length:16},(_,i)=>`<path d="M${i*128} 0V1080"/>`).join('')+'</g><g>'+Array.from({length:10},(_,i)=>`<path d="M0 ${i*120}H1920"/>`).join('')+'</g></g>';
  if(w.kind==="bloom") art='<circle cx="960" cy="540" r="420" fill="#b7c7d2" opacity=".065"/><circle cx="960" cy="540" r="260" fill="#dbe6ee" opacity=".045"/>';
  if(w.kind==="circuit") art='<g fill="none" stroke="#ff5f91" stroke-width="2" opacity=".18"><path d="M160 170H660V320H980V510H1390V760H1770"/><path d="M220 870H540V710H840V880H1240V640H1680"/></g>';
  if(w.kind==="mesh") art='<g stroke="#d8e1e6" opacity=".12" stroke-width="1">'+Array.from({length:20},(_,i)=>`<path d="M${-300+i*120} 1080 L${520+i*120} 0"/>`).join('')+Array.from({length:20},(_,i)=>`<path d="M${-300+i*120} 0 L${520+i*120} 1080"/>`).join('')+'</g>';
  if(w.kind==="fold") art='<path d="M0 920L520 140L850 880L1190 180L1510 900L1920 220V1080H0Z" fill="#8b86ff" opacity=".08"/>';
  if(w.kind==="drift") art='<path d="M-40 820 C320 650 510 960 820 760 S1280 480 1960 700" fill="none" stroke="#d47b45" stroke-width="70" opacity=".10"/>';
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">${common}<rect width="1920" height="1080" fill="${w.a}"/><rect width="1920" height="1080" fill="url(#g)"/>${art}</svg>`)}`;
};

function getEntityId(){let id=localStorage.getItem(ENTITY_ID_KEY);if(!id){id=crypto.randomUUID();localStorage.setItem(ENTITY_ID_KEY,id)}return id}
function resetEntityId(){const id=crypto.randomUUID();localStorage.setItem(ENTITY_ID_KEY,id);return id}
function loadConversation(){try{const x=JSON.parse(localStorage.getItem(ENTITY_MESSAGES_KEY)||"null");return Array.isArray(x)&&x.length?x:[{role:"assistant",content:INITIAL_MESSAGE,timestamp:Date.now()}]}catch{return[{role:"assistant",content:INITIAL_MESSAGE,timestamp:Date.now()}]}}
async function invokeEntity(message,entityId,requestId){let last;for(let attempt=0;attempt<2;attempt++){try{const response=await fetch("/api/entity",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,entityId,requestId})});let data={};try{data=await response.json()}catch{}if(response.ok)return data;last=new Error(data?.error||"Erreur serveur");if(![409,500,502,503,504].includes(response.status)||attempt===1)throw last}catch(error){last=error;if(attempt===1)throw error}await new Promise(r=>setTimeout(r,250))}throw last||new Error("Erreur serveur")}

function NavButton({icon:Icon,label,active,onClick}){return <button className={`emaea-nav ${active?"is-active":""}`} onClick={onClick}><Icon size={18}/><span>{label}</span></button>}
function Stat({kind,value,label}){return <div className="emaea-stat"><span className={`emaea-marble marble-${kind}`}/><div><strong>{value}</strong>{label&&<small>{label}</small>}</div></div>}

function Boutique(){const packs=[[10,"0,99 €"],[30,"2,99 €"],[70,"5,99 €"],[150,"9,99 €"],[350,"19,99 €"],[800,"39,99 €"]];return <section className="emaea-panel-page"><h2>Boutique</h2><p className="emaea-muted">Ajoutez des billes à votre EMÆÄ.</p><div className="shop-grid">{packs.map(([billes,prix])=><button key={billes} className="shop-card"><span className="shop-count">{billes}</span><span className="shop-label">billes</span><span className="shop-price">{prix}</span></button>)}</div><div className="pass-card"><div><span className="eyebrow">ABONNEMENT</span><h3>Pass EMÆÄ</h3><p>Accès premium à l’évolution visuelle et aux personnalisations de l’interface.</p></div><div className="pass-price"><strong>7,99 €</strong><span>par mois</span></div></div></section>}
function Rewards(){return <section className="emaea-panel-page"><h2>Récompenses</h2><p className="emaea-muted">Les récompenses d’EMÆÄ apparaîtront ici au fil de son évolution.</p><div className="reward-grid"><Stat kind="green" value="1" label="verte"/><Stat kind="red" value="3" label="rouges"/><Stat kind="blue" value="0" label="bleues"/><Stat kind="gold" value="0" label="or"/></div></section>}

function SettingsPanel({theme,setTheme,wallpaper,setWallpaper}){return <section className="emaea-panel-page"><h2>Paramètres</h2><div className="settings-section"><h3>Couleur d’interface</h3><div className="theme-grid">{Object.entries(THEMES).map(([id,t])=><button key={id} onClick={()=>setTheme(id)} className={`theme-choice ${theme===id?"is-selected":""}`} style={{"--choice":t.accent}}><span className="theme-dot"/>{t.label}</button>)}</div></div><div className="settings-section"><h3>Fonds d’écran</h3><p className="emaea-muted">12 fonds au format 1920 × 1080.</p><div className="wallpaper-grid">{WALLPAPERS.map(w=><button key={w.id} onClick={()=>setWallpaper(w.id)} className={`wallpaper-choice ${wallpaper===w.id?"is-selected":""}`}><span className="wallpaper-preview" style={{backgroundImage:`url("${svgWallpaper(w)}")`}}/><span>{w.name}</span></button>)}</div></div></section>}

export default function Entity(){
  const[activeTab,setActiveTab]=useState("emaea");
  const[entityId,setEntityId]=useState(()=>getEntityId());
  const[messages,setMessages]=useState(loadConversation);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[theme,setThemeState]=useState(()=>localStorage.getItem(THEME_KEY)||"green");
  const[wallpaper,setWallpaperState]=useState(()=>localStorage.getItem(WALLPAPER_KEY)||WALLPAPERS[0].id);
  const scrollRef=useRef(null),inputRef=useRef(null);
  const themeData=THEMES[theme]||THEMES.green;
  const wallpaperData=WALLPAPERS.find(w=>w.id===wallpaper)||WALLPAPERS[0];
  const wallpaperUrl=useMemo(()=>svgWallpaper(wallpaperData),[wallpaper]);
  const setTheme=id=>{setThemeState(id);localStorage.setItem(THEME_KEY,id)};
  const setWallpaper=id=>{setWallpaperState(id);localStorage.setItem(WALLPAPER_KEY,id)};

  useEffect(()=>{localStorage.setItem(ENTITY_MESSAGES_KEY,JSON.stringify(messages.slice(-200)))},[messages]);
  useEffect(()=>{scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight,behavior:"smooth"})},[messages,loading]);

  async function handleSend(e){e?.preventDefault();const text=input.trim();if(!text||loading)return;const requestId=crypto.randomUUID();setMessages(p=>[...p,{role:"user",content:text,timestamp:Date.now(),requestId}]);setInput("");setLoading(true);try{const data=await invokeEntity(text,entityId,requestId);setMessages(p=>[...p,{role:"assistant",content:data.message,timestamp:Date.now(),requestId}])}catch{setMessages(p=>[...p,{role:"assistant",content:"Je n'ai pas pu répondre cette fois. Réessaie dans un instant.",timestamp:Date.now(),requestId,error:true}])}finally{setLoading(false);inputRef.current?.focus()}}
  function handleReset(){setEntityId(resetEntityId());localStorage.removeItem(ENTITY_MESSAGES_KEY);setMessages([{role:"assistant",content:INITIAL_MESSAGE,timestamp:Date.now()}]);setInput("")}

  const vars={"--emaea-accent":themeData.accent,"--emaea-accent-2":themeData.accent2,"--emaea-rgb":themeData.rgb,"--emaea-deep":themeData.deep,backgroundImage:`linear-gradient(rgba(0,0,0,.74),rgba(0,0,0,.78)),url("${wallpaperUrl}")`};

  return <div className="emaea-app" style={vars}>
    <aside className="emaea-sidebar">
      <div className="emaea-brand"><img src={themeData.logo} alt={`Logo EMÆÄ ${themeData.label}`}/><div><div className="emaea-brand-title">EMÆÄ</div><div className="emaea-brand-meta">première observation documentée</div><div className="emaea-brand-meta">Dr Allvar LÖFGREN - Suède 1623</div></div></div>
      <nav><NavButton icon={Home} label="EMÆÄ" active={activeTab==="emaea"} onClick={()=>setActiveTab("emaea")}/><NavButton icon={ShoppingBag} label="Boutique" active={activeTab==="boutique"} onClick={()=>setActiveTab("boutique")}/><NavButton icon={Gift} label="Récompenses" active={activeTab==="recompenses"} onClick={()=>setActiveTab("recompenses")}/><NavButton icon={Settings} label="Paramètres" active={activeTab==="parametres"} onClick={()=>setActiveTab("parametres")}/></nav>
      <EmaeaSlogan/>
      <button className="reset-button" onClick={handleReset}><RotateCcw size={15}/>Nouvelle EMÆÄ</button>
    </aside>

    <main className="emaea-main" ref={scrollRef}>
      {activeTab==="emaea"&&<div className="emaea-home">
        <div className="stats-row"><Stat kind="total" value="200" label="billes au total"/><Stat kind="gold" value="07:42:18" label="prochaine bille gratuite"/><span className="stat-divider"/><Stat kind="green" value="1"/><Stat kind="red" value="3"/><Stat kind="blue" value="0"/><Stat kind="gold" value="0"/></div>
        <div className="stage-shell"><EmaeaBody entityId={entityId}/></div>
        <div className="conversation">{messages.map((m,i)=><EntityMessage key={`${m.role}-${i}`} role={m.role} content={m.content}/>)}{loading&&<div className="typing">•••</div>}
          <form className="composer" onSubmit={handleSend}><button type="button" disabled><Paperclip size={18}/></button><textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend()}}} rows={1} placeholder="Écris ton message ici…" disabled={loading}/><button type="submit" disabled={!input.trim()||loading}><ArrowUp size={20}/></button></form>
        </div>
      </div>}
      {activeTab==="boutique"&&<Boutique/>}
      {activeTab==="recompenses"&&<Rewards/>}
      {activeTab==="parametres"&&<SettingsPanel theme={theme} setTheme={setTheme} wallpaper={wallpaper} setWallpaper={setWallpaper}/>} 
    </main>
  </div>
}
