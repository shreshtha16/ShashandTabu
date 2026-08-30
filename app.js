import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, setDoc, deleteField, query, orderBy,
  onSnapshot, serverTimestamp, limit, runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";
import {
  getMessaging, getToken, onMessage
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging.js";
/*
 * Firebase configuration supplied for the Shreshtha × Muskan project.
 * Firebase web config values are identifiers, not server credentials.
 */
const firebaseConfig = {
  apiKey: "AIzaSyBsoKZknVQVgJ4uifwyB4cmlMJ9UC6yDGU",
  authDomain: "shreshthakimuskan.firebaseapp.com",
  projectId: "shreshthakimuskan",
  storageBucket: "shreshthakimuskan.firebasestorage.app",
  messagingSenderId: "94387962116",
  appId: "1:94387962116:web:0ad40298106fd5d32f1051",
  measurementId: "G-T8BY84YBFN"
};

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);
const storage=getStorage(app);
const messaging=getMessaging(app);
const FCM_VAPID_KEY="BM73UlZ90uLZFfy2JjmAr9hHM1dcaGpenETKOEDtjZx-s8HBdwUf5QP9GVBILlsZX_hu7iebSMUeI-gNfr56WAA";

if("serviceWorker" in navigator)navigator.serviceWorker.register("./firebase-messaging-sw.js").catch(()=>{});

const STATIC_PHOTOS=[
 {src:"DSC_6602.jpeg",cap:"One of my favourites."},
 {src:"DSC_6452.jpeg",cap:"A little celebration together."},
 {src:"DSC_6453.jpeg",cap:"Laughing through the little moments."},
 {src:"DSC_6473.jpeg",cap:"Dressed up and feeling lucky."},
 {src:"DSC_6570.jpeg",cap:"Another beautiful memory of us."},
 {src:"1c8cae48-baee-47b4-aa78-d77f6667baa0.jpeg",cap:"A little sunflower made with love."},
 {src:"IMG_0475.jpeg",cap:"A soft little moment to remember."}
];
const QAS=[
 {q:"First thing I noticed about her?",a:"Her calmness. And her eyes."},
 {q:"Our song?",a:"Tere Bina Na Guzara."},{q:"Best memory together so far?",a:"Our roka photo session, followed by chai in a hotel room."},
 {q:"Where do we go on a lazy Sunday?",a:"Adrak wali chai, with a slow song playing in the background."},
 {q:"What does “Tabu” mean?",a:"It is short for Tabassum, which means smile — or Muskan."},
 {q:"One thing I'm looking forward to?",a:"Travelling around the world together."}
];
const LOVE_NOTES=[
 ["I still think I got very lucky when I found you.","A little reminder"],
 ["I am looking forward to all the boring, ordinary days with you.","Because ordinary with you sounds wonderful"],
 ["Please wear your jhumka. I need to know how distracted I am going to be.","A completely serious request"],
 ["Some of my favourite future memories haven't happened yet.","And that makes me smile"],
 ["You are one of the easiest people in the world to miss.","Just saying"],
 ["I want a life full of the tiny things with you.","The little things matter"],
 ["If I could choose again, I'd still choose you.","Always"],
 ["Tabu. ❤️","You know why"]
];
const LETTERS=[
 {date:"Today",dear:"Dear Muskan,",body:[
 "I have tried to find the perfect words for what you mean to me, and I keep coming back to something simple: I feel very fortunate to have found you.",
 "Thank you for the warmth you bring into my life, for the laughter we share, and for all the quiet moments that make being together feel so natural.",
 "I also love the silly little things that are just ours — the times we end up jamming over a call, even though you have to patiently listen to my not-so-great singing voice. Thank you for tolerating it all this time. 😄",
 "And yes, I know calling you “Tabu” is a little silly. Actually, probably very silly. But somehow, it became my little name for you, and now it feels special simply because it belongs to us. ❤️",
 "The ordinary mornings. The unexpected adventures. The celebrations. The difficult days we will get through together. The home we will build, and all the little memories that we have yet to make.",
 "I cannot promise that every day will be perfect. But I can promise to keep listening, keep learning, keep caring, and keep choosing you — gently and sincerely, every day.",
 "Thank you for becoming such a beautiful part of my life. I'm truly looking forward to starting this beautiful new chapter of our lives together."
 ],sign:"With all my love,<br>Shreshtha ♡"},
 {date:"A future letter",dear:"Dear Muskan,",body:["This is a blank space for a future version of me to write to you.","Maybe I will add it after a trip, on an ordinary Tuesday, or on a day when I suddenly feel grateful for how much life has changed.","Until then, this little letter is waiting for us."],sign:"Yours, in every chapter,<br>Shreshtha ♡"}
 ,{date:"A little closer",daysBeforeWedding:180,dear:"Dear Muskan,",body:["This letter unlocks as our next chapter gets closer.","There is still time before our day, but every day between now and then is part of the story too."],sign:"Counting down with you,<br>Shreshtha ♡"}
];
const BUCKET_PUBLIC=[
 "Take a road trip with no fixed itinerary","Watch a sunrise together","Go somewhere neither of us has been",
 "Cook an entire dinner together","Take the same photo every anniversary","Have a completely spontaneous weekend",
 "Visit a new country together","Build our dream home","Have a lazy Sunday with absolutely no plans",
 "Make a huge photo book of our life"
];
const QUIZ=[
 ["What would I choose for a lazy date?",["A fancy restaurant","Momos + a walk","A nightclub","A 5 AM hike"],1],
 ["What should Muskan wear on our Bullet ride?",["A hoodie","A saree","Her jhumka","A helmet only 😄"],2],
 ["What am I most excited about?",["A new phone","Our next chapter together","A new watch","Sleeping all weekend"],1],
 ["What is “Tabu”?",["A city","A secret code","A silly nickname for you","A food"],2],
 ["What do I want more of?",["More ordinary moments together","More work","More meetings","More traffic"],0]
];

document.querySelectorAll("[data-scroll]").forEach(b=>b.addEventListener("click",()=>document.querySelector(b.dataset.scroll)?.scrollIntoView()));
const nav=document.getElementById("nav");
addEventListener("scroll",()=>nav.classList.toggle("scrolled",scrollY>20));
document.getElementById("navtoggle").onclick=()=>document.getElementById("navlinks").classList.toggle("open");
document.querySelectorAll("#navlinks a").forEach(a=>a.onclick=()=>document.getElementById("navlinks").classList.remove("open"));

function theme(){
 const saved=localStorage.getItem("us-theme");
 const night=saved?saved==="night":true; document.body.classList.toggle("night",night);
 document.getElementById("themeBtn").textContent=night?"☀":"☾";
}
theme(); document.getElementById("themeBtn").onclick=()=>{const n=!document.body.classList.contains("night");document.body.classList.toggle("night",n);localStorage.setItem("us-theme",n?"night":"day");document.getElementById("themeBtn").textContent=n?"☀":"☾"};

const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.1});
document.querySelectorAll(".reveal").forEach(x=>io.observe(x));

let ni=-1;function note(){let n;do n=Math.floor(Math.random()*LOVE_NOTES.length);while(n===ni);ni=n;document.getElementById("noteText").textContent=LOVE_NOTES[n][0];document.getElementById("noteMeta").textContent=LOVE_NOTES[n][1]}
note();document.getElementById("newNote").onclick=note;

const wedding=new Date("2027-02-22T00:00:00+05:30").getTime();
function daysToWedding(){return Math.max(0,Math.ceil((wedding-Date.now())/86400000))}
function countdown(){const d=wedding-Date.now();if(d<=0){["days","hours","minutes","seconds"].forEach(x=>document.getElementById(x).textContent="00");document.getElementById("after").style.display="block";return}
days.textContent=String(Math.floor(d/86400000)).padStart(3,"0");hours.textContent=String(Math.floor(d/3600000)%24).padStart(2,"0");minutes.textContent=String(Math.floor(d/60000)%60).padStart(2,"0");seconds.textContent=String(Math.floor(d/1000)%60).padStart(2,"0")}
countdown();setInterval(countdown,1000);

timelineList.innerHTML=[
 ["The beginning","How we met","I first saw her at a wedding, when Mousi ji introduced us over dinner. She was the prettiest girl there."],
 ["A turning point","The first “us” moment","When we first spoke over a call, I was nervous and did not know what to say. After the roka, I started thinking about her all day, losing my appetite and sleep. Then I wondered: is it loveria? My doctor was the culprit, and I was the patient."],
 ["Today","Where we are now","My day begins with your good-morning message, and your sunflower brightens everything that follows. I love our calls where we jam and sing together, our shared love for momos, calling you “Tabuaaa” and “Kuchu-puchu,” and making you a warm cup of adrak wali chai every morning. These little things have become an important part of us."]
].map((x,i)=>`<div class="moment reveal"><div class="dot">${i+1}</div><div><div class="label">${x[0]}</div><h3>${x[1]}</h3><p>${x[2]}</p></div></div>`).join("");
document.querySelectorAll(".moment.reveal").forEach(x=>io.observe(x));

galleryGrid.innerHTML=STATIC_PHOTOS.map((p,i)=>`<div class="gallery-item ${i%3===1?"tall":""}" data-i="${i}" style="${p.src?`background-image:url('${p.src}')`:""}">${p.src?`<div class="cap">${p.cap}</div>`:`<div class="placeholder">Photo ${i+1}<br>add src in app.js</div>`}</div>`).join("");
let lb=0;function openLB(i){if(!STATIC_PHOTOS[i].src)return;lb=i;lbImg.src=STATIC_PHOTOS[i].src;lbCap.textContent=STATIC_PHOTOS[i].cap;lightbox.classList.add("open")}
galleryGrid.onclick=e=>{const x=e.target.closest(".gallery-item");if(x)openLB(+x.dataset.i)};lbClose.onclick=()=>lightbox.classList.remove("open");lbPrev.onclick=()=>openLB((lb-1+STATIC_PHOTOS.length)%STATIC_PHOTOS.length);lbNext.onclick=()=>openLB((lb+1)%STATIC_PHOTOS.length);lightbox.onclick=e=>{if(e.target===lightbox)lightbox.classList.remove("open")};

qaGrid.innerHTML=QAS.map((x,i)=>`<div class="qa-card"><div class="qa-inner"><div class="qa-face qa-front"><div class="q-label">Question ${i+1}</div><h4>${x.q}</h4><div class="tap">tap to reveal</div></div><div class="qa-face qa-back"><p>${x.a}</p></div></div></div>`).join("");
const ourSong=document.getElementById("ourSong");
document.querySelectorAll(".qa-card").forEach(x=>x.onclick=()=>{x.classList.toggle("flipped");if(x.querySelector("h4")?.textContent==="Our song?"){if(ourSong.paused){ourSong.play().then(()=>x.classList.add("playing")).catch(()=>x.classList.remove("playing"))}else{ourSong.pause();x.classList.remove("playing")}}});
ourSong.onended=()=>document.querySelector(".qa-card .qa-front h4")?.textContent==="Our song?"&&document.querySelector(".qa-card:has(.qa-front h4)")?.classList.remove("playing");

function letterUnlocked(letter){return letter.daysBeforeWedding==null||daysToWedding()<=letter.daysBeforeWedding}
function unlockDate(letter){return new Date(wedding-letter.daysBeforeWedding*86400000).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
function renderLetters(){const first=LETTERS.findIndex(letterUnlocked);letterTabs.innerHTML=LETTERS.map((x,i)=>{const unlocked=letterUnlocked(x);return `<button class="letter-tab ${i===first?"active":""} ${unlocked?"":"locked"}" data-i="${i}" ${unlocked?"":"disabled"}>${unlocked?"":"🔒 "}${x.date}${unlocked?"":`<small>Unlocks ${unlockDate(x)}</small>`}</button>`}).join("");lettersWrap.innerHTML=LETTERS.map((x,i)=>letterUnlocked(x)?`<div class="letter ${i===first?"active":""}" data-i="${i}"><div class="letter-date">${x.date}</div><p class="dear">${x.dear}</p>${x.body.map(p=>`<p>${p}</p>`).join("")}<div class="signature">${x.sign}</div></div>`:"").join("")}
renderLetters();
letterTabs.onclick=e=>{const b=e.target.closest(".letter-tab");if(!b||b.disabled)return;document.querySelectorAll(".letter-tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".letter").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelector(`.letter[data-i="${b.dataset.i}"]`)?.classList.add("active")};

let publicBucket=JSON.parse(localStorage.getItem("public-bucket")||"{}");
function renderPublicBucket(){bucketGrid.innerHTML=BUCKET_PUBLIC.map((x,i)=>`<div class="bucket-item ${publicBucket[i]?"done":""}" data-i="${i}"><div class="bucket-check">${publicBucket[i]?"✓":""}</div><div class="bucket-text">${x}<span class="bucket-date">${publicBucket[i]?"Completed ♡":"Not yet..."}</span></div></div>`).join("");document.querySelectorAll("#bucketGrid .bucket-item").forEach(x=>x.onclick=()=>{publicBucket[x.dataset.i]=!publicBucket[x.dataset.i];localStorage.setItem("public-bucket",JSON.stringify(publicBucket));renderPublicBucket()})}renderPublicBucket();

let qi=0,qs=0;function quiz(){if(qi>=QUIZ.length){const pct=qs/QUIZ.length*100;quizCard.innerHTML=`<div class="eyebrow">Final score</div><div class="quiz-score">${qs}/${QUIZ.length}</div><p>${pct===100?"Okay, you know me suspiciously well. ❤️":pct>=60?"Not bad, Tabu. I’ll allow it. 😌":"We clearly need more dates. 😂"}</p><button class="btn primary" id="restart">try again</button>`;restart.onclick=()=>{qi=0;qs=0;quiz();};return}const q=QUIZ[qi];quizCard.innerHTML=`<div class="quiz-progress">Question ${qi+1} of ${QUIZ.length}</div><div class="quiz-question">${q[0]}</div><div class="quiz-options">${q[1].map((o,i)=>`<button class="quiz-option" data-i="${i}">${o}</button>`).join("")}</div>`;document.querySelectorAll(".quiz-option").forEach(b=>b.onclick=()=>{if(+b.dataset.i===q[2])qs++;qi++;quiz()})}quiz();

function shuffle(){const choice=Math.floor(Math.random()*4);if(choice===0){const cards=document.querySelectorAll(".qa-card");const card=cards[Math.floor(Math.random()*cards.length)];card.classList.add("flipped");card.scrollIntoView({behavior:"smooth",block:"center"})}else if(choice===1){note();document.getElementById("note").scrollIntoView({behavior:"smooth"})}else if(choice===2){const photos=STATIC_PHOTOS.map((x,i)=>x.src?i:null).filter(x=>x!=null);if(photos.length)openLB(photos[Math.floor(Math.random()*photos.length)]);else document.getElementById("gallery").scrollIntoView({behavior:"smooth"})}else{const items=document.querySelectorAll("#bucketGrid .bucket-item");const item=items[Math.floor(Math.random()*items.length)];item?.scrollIntoView({behavior:"smooth",block:"center"});item?.classList.add("shuffle-highlight");setTimeout(()=>item?.classList.remove("shuffle-highlight"),1800)}}
document.getElementById("shuffleBtn").onclick=shuffle;

const modal=document.getElementById("modal");document.getElementById("modalClose").onclick=()=>modal.classList.remove("open");

/* ================= Firebase Auth ================= */
document.getElementById("authBtn").onclick=()=>{authModal.classList.add("open");authError.textContent=""};
document.getElementById("authClose").onclick=()=>authModal.classList.remove("open");
authModal.onclick=e=>{if(e.target===authModal)authModal.classList.remove("open")};

document.getElementById("authForm").onsubmit=async e=>{
 e.preventDefault();authError.textContent="";
 try{await signInWithEmailAndPassword(auth,authEmail.value.trim(),authPassword.value)}
 catch(err){authError.textContent=friendlyAuthError(err)}
};
document.getElementById("forgotBtn").onclick=async()=>{
 if(!authEmail.value.trim()){authError.textContent="Enter your email first.";return}
 try{await sendPasswordResetEmail(auth,authEmail.value.trim());authError.textContent="Password reset email sent.";authError.style.color="var(--rose)"}
 catch(err){authError.textContent=friendlyAuthError(err)}
};
document.getElementById("signOutBtn").onclick=()=>signOut(auth);

function friendlyAuthError(e){
 const map={"auth/invalid-credential":"Email or password is incorrect.","auth/user-not-found":"No account exists for this email.","auth/wrong-password":"Email or password is incorrect.","auth/too-many-requests":"Too many attempts. Try again later.","auth/invalid-email":"That email address is not valid."};
 return map[e.code]||e.message;
}

let unsubscribers=[];
function clearRealtime(){unsubscribers.forEach(u=>u&&u());unsubscribers=[]}
function safeName(user){return user.displayName||user.email?.split("@")[0]||"Us"}

onAuthStateChanged(auth,user=>{
 clearRealtime();
 if(!user){
   privateApp.classList.add("hidden");
   authState.innerHTML=`<div class="eyebrow">Private • just us</div><h3>Our Space is waiting.</h3><p>Sign in to see and add live notes, photos, letters and shared plans.</p><button class="btn primary" id="openLogin">enter our space ♡</button>`;
   openLogin.onclick=()=>authModal.classList.add("open");
   return;
 }
 authModal.classList.remove("open");privateApp.classList.remove("hidden");
 authState.innerHTML=`<div class="eyebrow">Connected to Firebase</div><h3>Welcome, ${escapeHTML(safeName(user))}.</h3><p>You're signed in. Both approved accounts share this space.</p>`;
 whoami.textContent=safeName(user);
 showFeedSkeletons();
 setupMessaging(user);
 subscribeNotes(user);subscribeBucket(user);subscribeMemories(user);subscribeLetters(user);
 checkStreak(user);
});

function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function skeletonRows(className,count=3){return Array.from({length:count},()=>`<div class="skeleton-row ${className}"></div>`).join("")}
function showFeedSkeletons(){liveNotes.innerHTML=skeletonRows("note-skeleton");liveBucket.innerHTML=skeletonRows("bucket-skeleton",2);liveMemories.innerHTML=skeletonRows("memory-skeleton",3);privateLetters.innerHTML=skeletonRows("letter-skeleton",2);onThisDay.innerHTML=""}

/* ================= Firestore: live notes ================= */
function subscribeNotes(user){
 const q=query(collection(db,"notes"),orderBy("createdAt","desc"),limit(50));
 const u=onSnapshot(q,snap=>{liveNotes.innerHTML=snap.docs.map(d=>{const x=d.data(),reactions=x.reactions||{},reacted=!!reactions[user.uid],count=Object.keys(reactions).length;return `<div class="feed-item"><div class="meta">${escapeHTML(x.authorName||"Us")} · ${fmtDate(x.createdAt)}</div><p>${escapeHTML(x.text||"")}</p><button class="reaction ${reacted?"reacted":""}" data-note-reaction="${d.id}">♡ <span>${count}</span></button></div>`}).join("")||`<div class="muted">No notes yet. Leave the first one. ♡</div>`;liveNotes.querySelectorAll("[data-note-reaction]").forEach(b=>b.onclick=async()=>{const active=b.classList.contains("reacted");try{await updateDoc(doc(db,"notes",b.dataset.noteReaction),{[`reactions.${user.uid}`]:active?deleteField():true})}catch(err){showPrivateError(err)}})},err=>showPrivateError(err));
 unsubscribers.push(u);
}
noteForm.onsubmit=async e=>{e.preventDefault();if(!auth.currentUser||!noteInput.value.trim())return;try{await addDoc(collection(db,"notes"),{text:noteInput.value.trim(),authorUid:auth.currentUser.uid,authorName:safeName(auth.currentUser),createdAt:serverTimestamp()});noteInput.value=""}catch(err){showPrivateError(err)}};

/* ================= Firestore: shared bucket ================= */
function subscribeBucket(){
 const q=query(collection(db,"bucketItems"),orderBy("createdAt","desc"),limit(100));
 const u=onSnapshot(q,snap=>{liveBucket.innerHTML=snap.docs.map(d=>{const x=d.data();return `<div class="live-bucket"><input type="checkbox" ${x.done?"checked":""} data-bucket="${d.id}"><span>${escapeHTML(x.text||"")}</span><button class="delete-btn" data-delete-bucket="${d.id}" aria-label="Delete item">✕</button></div>`}).join("")||`<div class="muted">Add your first thing to do together.</div>`;
 liveBucket.querySelectorAll("[data-bucket]").forEach(c=>c.onchange=()=>updateDoc(doc(db,"bucketItems",c.dataset.bucket),{done:c.checked}));
 liveBucket.querySelectorAll("[data-delete-bucket]").forEach(b=>b.onclick=()=>deleteDoc(doc(db,"bucketItems",b.dataset.deleteBucket)));
 },showPrivateError);unsubscribers.push(u);
}
bucketForm.onsubmit=async e=>{e.preventDefault();if(!auth.currentUser||!bucketInput.value.trim())return;try{await addDoc(collection(db,"bucketItems"),{text:bucketInput.value.trim(),done:false,authorUid:auth.currentUser.uid,createdAt:serverTimestamp()});bucketInput.value=""}catch(err){showPrivateError(err)}};

/* ================= Storage + Firestore: memories ================= */
function subscribeMemories(){
 const q=query(collection(db,"memories"),orderBy("createdAt","desc"),limit(50));
 const u=onSnapshot(q,snap=>{
   const memories=snap.docs.map(d=>({id:d.id,...d.data()}));
   window.__memoryList = memories;
   const now=new Date(),today=memories.filter(x=>{const date=x.createdAt?.toDate?.();return date&&date.getFullYear()<now.getFullYear()&&date.getMonth()===now.getMonth()&&date.getDate()===now.getDate()});
   onThisDay.innerHTML=today.length?`<div class="on-this-day-head">On this day</div><div class="on-this-day-grid">${today.map(memoryCard).join("")}</div>`:"";
   liveMemories.innerHTML=memories.map(memoryCard).join("")||`<div class="muted">No shared memories uploaded yet.</div>`;
   attachMemoryDeleteHandlers();
 },showPrivateError);
 unsubscribers.push(u);
}
function memoryCard(x){
 const canDelete = !!auth.currentUser && auth.currentUser.uid === x.authorUid;
 return `<div class="memory-card"><img src="${escapeAttr(x.url)}" alt=""><div class="memory-meta-row"><div class="memory-caption">${escapeHTML(x.caption||"")}</div>${canDelete?`<button class="delete-btn memory-delete" data-delete-memory="${escapeAttr(x.id)}" aria-label="Delete memory">✕</button>`:""}</div><div class="memory-meta">${escapeHTML(x.authorName||"Us")} · ${fmtDate(x.createdAt)}</div></div>`
}
function attachMemoryDeleteHandlers(){
 const containers=[onThisDay,liveMemories];
 containers.forEach(container=>{
   container?.querySelectorAll("[data-delete-memory]").forEach(button=>{
     button.onclick=async()=>{
       const id=button.dataset.deleteMemory;
       const memory=(window.__memoryList||[]).find(item=>item.id===id);
       if(!memory||!auth.currentUser)return;
       try{
         if(memory.storagePath) await deleteObject(ref(storage,memory.storagePath)).catch(()=>{});
         await deleteDoc(doc(db,"memories",id));
       }catch(err){showPrivateError(err)}
     }
   })
 })
}
memoryForm.onsubmit=async e=>{
 e.preventDefault();const file=memoryFile.files[0];if(!auth.currentUser||!file)return;
 if(!file.type.startsWith("image/")){showPrivateError({message:"Please choose an image file."});return}
 if(file.size>8*1024*1024){showPrivateError({message:"Please keep photos under 8 MB."});return}
 try{
   await auth.currentUser.getIdToken(true);
   const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
   const path=`memories/${auth.currentUser.uid}/${Date.now()}-${safe}`;
   const storageRef=ref(storage,path);await uploadBytes(storageRef,file,{contentType:file.type});
   const url=await getDownloadURL(storageRef);
   await addDoc(collection(db,"memories"),{url,storagePath:path,caption:memoryCaption.value.trim(),authorUid:auth.currentUser.uid,authorName:safeName(auth.currentUser),createdAt:serverTimestamp()});
   memoryCaption.value="";memoryFile.value="";
 }catch(err){showPrivateError(err)}
};

/* ================= Firestore: private letters ================= */
function subscribeLetters(){
 const q=query(collection(db,"privateLetters"),orderBy("createdAt","desc"),limit(50));
 const u=onSnapshot(q,snap=>{privateLetters.innerHTML=snap.docs.map(d=>{const x=d.data();return `<article class="private-letter"><small>${escapeHTML(x.authorName||"Us")} · ${fmtDate(x.createdAt)}</small><h4>${escapeHTML(x.title||"Untitled")}</h4><p>${escapeHTML(x.body||"")}</p></article>`}).join("")||`<div class="muted">No private letters yet.</div>`},showPrivateError);unsubscribers.push(u);
}
letterForm.onsubmit=async e=>{e.preventDefault();if(!auth.currentUser||!privateLetterTitle.value.trim()||!privateLetterBody.value.trim())return;try{await addDoc(collection(db,"privateLetters"),{title:privateLetterTitle.value.trim(),body:privateLetterBody.value.trim(),authorUid:auth.currentUser.uid,authorName:safeName(auth.currentUser),createdAt:serverTimestamp()});privateLetterTitle.value="";privateLetterBody.value=""}catch(err){showPrivateError(err)}};

/* ================= Firestore: daily streak ================= */
function todayKey(){return new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"})}
function daysBetween(a,b){return Math.round((new Date(b)-new Date(a))/86400000)}
async function checkStreak(user){
 const streakRef=doc(db,"streaks","shared");
 try{
  const result=await runTransaction(db,async tx=>{
   const snap=await tx.get(streakRef);
   const today=todayKey();
   if(!snap.exists()){
    const data={count:1,lastOpenDate:today,lastOpenedByUid:user.uid,lastOpenedByName:safeName(user),updatedAt:serverTimestamp()};
    tx.set(streakRef,data);return data;
   }
   const x=snap.data();
   if(x.lastOpenDate===today)return x;
   const gap=daysBetween(x.lastOpenDate,today);
   const data={count:gap===1?x.count+1:1,lastOpenDate:today,lastOpenedByUid:user.uid,lastOpenedByName:safeName(user),updatedAt:serverTimestamp()};
   tx.update(streakRef,data);return data;
  });
  renderStreak(result,user);
 }catch(err){console.error("streak error",err)}
}
function renderStreak(x,user){
 const mine=x.lastOpenedByUid===user.uid;
 streakBadge.textContent=`🔥 ${x.count} day${x.count===1?"":"s"} streak · ${mine?"you opened first today":x.lastOpenedByName+" opened first today"}`;
}

function fmtDate(ts){if(!ts?.toDate)return "just now";return ts.toDate().toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"})}
function escapeAttr(s){return String(s||"").replace(/"/g,"&quot;").replace(/</g,"%3C").replace(/>/g,"%3E")}
function showPrivateError(err){modalTitle.textContent="Something went wrong";modalText.textContent=err?.message||"Firebase returned an error. Check your Firebase setup and Security Rules.";modal.classList.add("open")}

async function setupMessaging(user){const button=document.getElementById("enableNotifications");if(!("Notification" in window)||!navigator.serviceWorker){button.disabled=true;return}button.onclick=async()=>{if(FCM_VAPID_KEY.startsWith("REPLACE_")){showPrivateError({message:"Add your Firebase Web Push certificate key in app.js first."});return}try{const permission=await Notification.requestPermission();if(permission!=="granted")return;const registration=await navigator.serviceWorker.register("firebase-messaging-sw.js");const token=await getToken(messaging,{vapidKey:FCM_VAPID_KEY,serviceWorkerRegistration:registration});await setDoc(doc(db,"notificationTokens",user.uid),{uid:user.uid,token,updatedAt:serverTimestamp()});button.textContent="notifications enabled"}catch(err){showPrivateError(err)}};onMessage(messaging,payload=>{const title=payload.notification?.title||"A note from us";new Notification(title,{body:payload.notification?.body||"You have a new note."})})}

/* Easter egg */
let typed="";addEventListener("keydown",e=>{if(e.key.length!==1)return;typed=(typed+e.key.toLowerCase()).slice(-4);if(typed==="tabu")fireConfetti()});
function fireConfetti(){for(let i=0;i<60;i++){const p=document.createElement("div");p.textContent=["♥","♡","✦"][Math.floor(Math.random()*3)];p.style.position="fixed";p.style.zIndex=100;p.style.left=Math.random()*100+"vw";p.style.top="-20px";p.style.fontSize=(12+Math.random()*16)+"px";p.style.color=["#b86b76","#e9c8c7","#dfaaad","#fff"][Math.floor(Math.random()*4)];p.style.transition=`transform ${2+Math.random()*2}s linear,opacity 3s`;document.body.appendChild(p);requestAnimationFrame(()=>p.style.transform=`translateY(105vh) rotate(${Math.random()*700}deg)`);setTimeout(()=>p.remove(),4000)}}