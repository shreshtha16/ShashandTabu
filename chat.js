import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsoKZknVQVgJ4uifwyB4cmlMJ9UC6yDGU",
  authDomain: "shreshthakimuskan.firebaseapp.com",
  projectId: "shreshthakimuskan",
  storageBucket: "shreshthakimuskan.firebasestorage.app",
  messagingSenderId: "94387962116",
  appId: "1:94387962116:web:0ad40298106fd5d32f1051",
  measurementId: "G-T8BY84YBFN"
};

const auth = getAuth(initializeApp(firebaseConfig));
const db = getFirestore(auth.app);
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
const signOutButton = document.getElementById("signOutButton");
let stopMessages;
let firstSnapshot = true;

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  loginError.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, document.getElementById("email").value.trim(), document.getElementById("password").value);
  } catch (error) {
    loginError.textContent = error.code === "auth/invalid-credential" ? "That email or password did not work." : error.message;
  }
});

signOutButton.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, user => {
  stopMessages?.();
  if (!user) {
    loginView.classList.remove("hidden");
    chatView.classList.add("hidden");
    signOutButton.classList.add("hidden");
    connectionStatus.textContent = "Sign in to connect";
    connection.classList.remove("connected");
    return;
  }

  loginView.classList.add("hidden");
  chatView.classList.remove("hidden");
  signOutButton.classList.remove("hidden");
  connectionStatus.textContent = "Connecting";
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
      message.append(author, text, time);
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