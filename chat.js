import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, updateDoc, deleteField, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsoKZknVQVgJ4uifwyB4cmlMJ9UC6yDGU",
  authDomain: "shreshthakimuskan.firebaseapp.com",
  projectId: "shreshthakimuskan",
  storageBucket: "shreshthakimuskan.firebasestorage.app",
  messagingSenderId: "94387962116",
  appId: "1:94387962116:web:0ad40298106fd5d32f1051",
  measurementId: "G-T8BY84YBFN"
};
const CHAT_ACCOUNTS = ["muskanpandey8076@gmail.com", "shreshthatiwari24@gmail.com"];
const PRESENCE_HEARTBEAT_MS = 20000;
const PRESENCE_STALE_MS = 60000;
const FCM_VAPID_KEY = "BM73UlZ90uLZFfy2JjmAr9hHM1dcaGpenETKOEDtjZx-s8HBdwUf5QP9GVBILlsZX_hu7iebSMUeI-gNfr56WAA";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./firebase-messaging-sw.js").catch(() => {});
const loginView = document.getElementById("loginView");
const chatView = document.getElementById("chatView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const messages = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const connectionStatus = document.getElementById("connectionStatus");
const connection = document.querySelector(".connection");
const presenceStatus = document.getElementById("presenceStatus");
const signOutButton = document.getElementById("signOutButton");
const notificationButton = document.getElementById("notificationButton");
const installButton = document.getElementById("installButton");
const installDialog = document.getElementById("installDialog");
const installInstructions = document.getElementById("installInstructions");
let deferredInstallPrompt;
let messagingClient;
let stopForegroundMessages;

if (isStandalone()) {
  installButton.textContent = "Installed";
  installButton.disabled = true;
}
let stopMessages;
let stopPresenceListeners = [];
let presenceHeartbeat;
let presenceRefresh;
let presenceSessionRef;
let currentUser;
const presenceByEmail = new Map();
let firstSnapshot = true;
let emojiPickerModule;

function stopPresenceTracking() {
  stopPresenceListeners.forEach(unsubscribe => unsubscribe());
  stopPresenceListeners = [];
  clearInterval(presenceHeartbeat);
  clearInterval(presenceRefresh);
  presenceHeartbeat = null;
  presenceRefresh = null;
  presenceSessionRef = null;
  presenceByEmail.clear();
}

function formatLastSeen(timestamp) {
  if (!timestamp?.toDate) return "not seen yet";
  const date = timestamp.toDate();
  const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return date.toDateString() === new Date().toDateString()
    ? `last seen ${time}`
    : `last seen ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
}

function accountPresence(email) {
  const sessions = presenceByEmail.get(email) || [];
  const latest = sessions.reduce((newest, session) => {
    const current = session.lastSeen?.toMillis?.() || 0;
    return current > (newest?.lastSeen?.toMillis?.() || 0) ? session : newest;
  }, null);
  const online = sessions.some(session => {
    const lastSeen = session.lastSeen?.toMillis?.() || 0;
    return session.online === true && Date.now() - lastSeen < PRESENCE_STALE_MS;
  });
  return { online, latest };
}

function renderPresence() {
  if (!currentUser?.email) return;
  const myEmail = currentUser.email.toLowerCase();
  const partnerEmail = CHAT_ACCOUNTS.find(email => email !== myEmail);
  const myPresence = accountPresence(myEmail);
  const partnerPresence = accountPresence(partnerEmail);
  const partnerName = partnerEmail === "muskanpandey8076@gmail.com" ? "Muskan" : "Shreshtha";
  if (myPresence.online && partnerPresence.online) {
    presenceStatus.textContent = `You and ${partnerName} are both online`;
    presenceStatus.classList.add("is-online");
    return;
  }
  presenceStatus.classList.remove("is-online");
  const you = document.createElement("span");
  you.className = myPresence.online ? "is-online" : "is-offline";
  you.textContent = `You: ${myPresence.online ? "online" : formatLastSeen(myPresence.latest?.lastSeen)}`;
  const partner = document.createElement("span");
  partner.className = partnerPresence.online ? "is-online" : "is-offline";
  partner.textContent = `${partnerName}: ${partnerPresence.online ? "online" : formatLastSeen(partnerPresence.latest?.lastSeen)}`;
  presenceStatus.replaceChildren(you, document.createTextNode(" · "), partner);
}

async function writePresence(online) {
  if (!presenceSessionRef) return;
  try {
    await setDoc(presenceSessionRef, { online, lastSeen: serverTimestamp() }, { merge: true });
  } catch (error) {
    presenceStatus.textContent = "Presence unavailable";
  }
}

function startPresenceTracking(user) {
  stopPresenceTracking();
  currentUser = user;
  const myEmail = user.email.toLowerCase();
  const sessionId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  presenceSessionRef = doc(db, "presence", myEmail, "sessions", sessionId);
  CHAT_ACCOUNTS.forEach(email => {
    const unsubscribe = onSnapshot(collection(db, "presence", email, "sessions"), snapshot => {
      presenceByEmail.set(email, snapshot.docs.map(session => session.data()));
      renderPresence();
    }, () => {
      presenceStatus.textContent = "Presence unavailable";
    });
    stopPresenceListeners.push(unsubscribe);
  });
  writePresence(true);
  presenceHeartbeat = setInterval(() => writePresence(true), PRESENCE_HEARTBEAT_MS);
  presenceRefresh = setInterval(renderPresence, 10000);
}

window.addEventListener("pagehide", () => writePresence(false));
window.addEventListener("pageshow", () => {
  if (currentUser && presenceSessionRef) writePresence(true);
});

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.textContent = "Install app";
  installButton.classList.remove("hidden");
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.classList.add("hidden");
});

installButton.addEventListener("click", async () => {
  if (isStandalone()) {
    installInstructions.textContent = "Our chat is already on your Home Screen.";
    installDialog.showModal();
    return;
  }
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  installInstructions.textContent = isIOS
    ? "In Safari, tap Share, then choose Add to Home Screen and tap Add."
    : "Open your browser menu and choose Install app or Add to Home Screen. Our chat will open directly from its icon.";
  installDialog.showModal();
});

document.getElementById("installDone").addEventListener("click", () => installDialog.close());

async function syncNotifications(user, requestPermission = false) {
  notificationButton.disabled = true;
  try {
    if (!("Notification" in window) || !(await isSupported())) {
      notificationButton.textContent = "Notifications unavailable";
      return;
    }
    const permission = requestPermission && Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
    if (permission !== "granted") {
      notificationButton.textContent = permission === "denied" ? "Notifications blocked" : "Enable notifications";
      notificationButton.disabled = permission === "denied";
      return;
    }
    messagingClient ||= getMessaging(firebaseApp);
    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messagingClient, { vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: registration });
    await setDoc(doc(db, "notificationTokens", user.uid), {
      uid: user.uid,
      token,
      updatedAt: serverTimestamp()
    });
    notificationButton.textContent = "Notifications enabled";
    notificationButton.disabled = true;
    stopForegroundMessages ||= onMessage(messagingClient, payload => {
      if (Notification.permission !== "granted") return;
      const title = payload.notification?.title || "A note from us";
      new Notification(title, { body: payload.notification?.body || "You have a new note." });
    });
  } catch (error) {
    notificationButton.textContent = "Try notifications again";
    connectionStatus.textContent = error.message;
    notificationButton.disabled = false;
  } finally {
    if (notificationButton.textContent === "Enable notifications") notificationButton.disabled = false;
  }
}

notificationButton.addEventListener("click", () => {
  if (auth.currentUser) syncNotifications(auth.currentUser, true);
});

document.addEventListener("pointerdown", event => {
  const insideReactionControl = event.composedPath().some(target =>
    target instanceof Element && target.matches(".reaction-picker, .reaction-trigger")
  );
  if (insideReactionControl) return;
  messages.querySelectorAll(".reaction-picker:not(.hidden)").forEach(picker => picker.classList.add("hidden"));
});

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  loginError.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, document.getElementById("email").value.trim(), document.getElementById("password").value);
  } catch (error) {
    loginError.textContent = error.code === "auth/invalid-credential" ? "That email or password did not work." : error.message;
  }
});

signOutButton.addEventListener("click", async () => {
  await Promise.race([writePresence(false), new Promise(resolve => setTimeout(resolve, 1000))]);
  await signOut(auth);
});

onAuthStateChanged(auth, user => {
  stopMessages?.();
  stopPresenceTracking();
  if (!user) {
    currentUser = null;
    loginView.classList.remove("hidden");
    chatView.classList.add("hidden");
    signOutButton.classList.add("hidden");
    notificationButton.classList.add("hidden");
    stopForegroundMessages?.();
    stopForegroundMessages = null;
    connectionStatus.textContent = "Sign in to connect";
    connection.classList.remove("connected");
    presenceStatus.classList.remove("is-online");
    presenceStatus.textContent = "Sign in to see presence";
    return;
  }

  loginView.classList.add("hidden");
  chatView.classList.remove("hidden");
  signOutButton.classList.remove("hidden");
  notificationButton.classList.remove("hidden");
  notificationButton.disabled = false;
  notificationButton.textContent = "Checking notifications…";
  syncNotifications(user);
  connectionStatus.textContent = "Connecting";
  presenceStatus.textContent = "Checking who is here…";
  presenceStatus.classList.remove("is-online");
  startPresenceTracking(user);
  firstSnapshot = true;
  const recentMessages = query(collection(db, "notes"), orderBy("createdAt", "desc"), limit(100));
  stopMessages = onSnapshot(recentMessages, snapshot => {
    const wasNearBottom = messages.scrollHeight - messages.scrollTop - messages.clientHeight < 100;
    const rows = [...snapshot.docs].reverse();
    emptyState.classList.toggle("hidden", rows.length > 0);
    messages.querySelectorAll(".message").forEach(message => message.remove());
    rows.forEach(documentSnapshot => {
      const data = documentSnapshot.data();
      const message = document.createElement("article");
      message.className = `message${data.authorUid === user.uid ? " mine" : ""}`;
      const author = document.createElement("div");
      author.className = "message-author";
      author.textContent = data.authorName || "Us";
      const text = document.createElement("p");
      text.className = "message-text";
      text.textContent = data.text || "";
      const time = document.createElement("time");
      time.className = "message-time";
      time.textContent = data.createdAt?.toDate?.().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) || "Sending…";
      const footer = document.createElement("div");
      footer.className = "message-footer";
      const trigger = document.createElement("button");
      trigger.className = "reaction-trigger";
      trigger.type = "button";
      trigger.textContent = "+";
      trigger.setAttribute("aria-label", "Add reaction");
      const picker = document.createElement("emoji-picker");
      picker.className = "reaction-picker hidden";
      picker.addEventListener("emoji-click", async event => {
        const emoji = event.detail.unicode;
        const current = data.reactions?.[user.uid];
        const selected = typeof current === "string" ? current : current ? "❤️" : null;
        try {
          await updateDoc(doc(db, "notes", documentSnapshot.id), {
            [`reactions.${user.uid}`]: selected === emoji ? deleteField() : emoji
          });
        } catch (error) {
          connectionStatus.textContent = error.message;
        } finally {
          picker.classList.add("hidden");
        }
      });
      trigger.addEventListener("click", async () => {
        const opening = picker.classList.contains("hidden");
        if (opening) {
          try {
            emojiPickerModule ||= import("https://cdn.jsdelivr.net/npm/emoji-picker-element@1.29.1/index.js");
            await emojiPickerModule;
            await customElements.whenDefined("emoji-picker");
            messages.querySelectorAll(".reaction-picker").forEach(otherPicker => otherPicker.classList.add("hidden"));
            picker.classList.remove("hidden");
          } catch (error) {
            emojiPickerModule = null;
            connectionStatus.textContent = "Could not load emoji picker";
          }
        } else {
          picker.classList.add("hidden");
        }
      });
      footer.append(time, trigger);
      message.append(author, text, footer, picker);

      const reactionCounts = new Map();
      Object.entries(data.reactions || {}).forEach(([uid, value]) => {
        const emoji = typeof value === "string" ? value : "❤️";
        reactionCounts.set(emoji, (reactionCounts.get(emoji) || 0) + 1);
        if (uid === user.uid) message.dataset.myReaction = emoji;
      });
      if (reactionCounts.size) {
        const reactionRow = document.createElement("div");
        reactionRow.className = "reaction-row";
        reactionCounts.forEach((count, emoji) => {
          const chip = document.createElement("span");
          chip.className = `reaction-chip${message.dataset.myReaction === emoji ? " mine" : ""}`;
          chip.textContent = `${emoji} ${count}`;
          reactionRow.append(chip);
        });
        message.append(reactionRow);
      }
      messages.append(message);
    });
    connectionStatus.textContent = "Live and connected";
    connection.classList.add("connected");
    if (firstSnapshot || wasNearBottom) messages.scrollTop = messages.scrollHeight;
    firstSnapshot = false;
  }, error => {
    connectionStatus.textContent = "Could not connect";
    connection.classList.remove("connected");
    loginError.textContent = error.message;
  });
});

messageForm.addEventListener("submit", async event => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !auth.currentUser) return;
  sendButton.disabled = true;
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, "notes"), {
      text,
      authorUid: user.uid,
      authorName: user.displayName || user.email?.split("@")[0] || "Us",
      createdAt: serverTimestamp()
    });
    messageInput.value = "";
    messageInput.style.height = "auto";
    messageInput.focus();
  } catch (error) {
    connectionStatus.textContent = error.message;
  } finally {
    sendButton.disabled = false;
  }
});

messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 130)}px`;
});

messageInput.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    messageForm.requestSubmit();
  }
});