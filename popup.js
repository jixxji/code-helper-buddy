const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

let apiKey = "";
let hintMode = "nudge"; // nudge | hint | approach
let conversationHistory = []; // {role, text}[]
let currentProblem = "";

const setupScreen   = document.getElementById("setupScreen");
const mainScreen    = document.getElementById("mainScreen");
const apiKeyInput   = document.getElementById("apiKeyInput");
const saveKeyBtn    = document.getElementById("saveKeyBtn");
const resetKeyBtn   = document.getElementById("resetKeyBtn");
const messagesEl    = document.getElementById("messages");
const userInput     = document.getElementById("userInput");
const sendBtn       = document.getElementById("sendBtn");
const statusDot     = document.getElementById("statusDot");
const problemName   = document.getElementById("problemName");
const pills         = document.querySelectorAll(".pill");
const quickBtns     = document.querySelectorAll(".quick-btn");


(async () => {
  const stored = await chrome.storage.local.get(["apiKey"]);
  if (stored.apiKey) {
    apiKey = stored.apiKey;
    showMainScreen();
    loadProblemContext();
  }
})();

//API Key Save
saveKeyBtn.addEventListener("click", async () => {
  const val = apiKeyInput.value.trim();
  if (!val) return shake(apiKeyInput);
  apiKey = val;
  await chrome.storage.local.set({ apiKey: val });
  showMainScreen();
  loadProblemContext();
});

apiKeyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveKeyBtn.click();
});

resetKeyBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove("apiKey");
  apiKey = "";
  conversationHistory = [];
  setupScreen.classList.remove("hidden");
  mainScreen.classList.add("hidden");
  apiKeyInput.value = "";
});

//Hint Mode Pills
pills.forEach((pill) => {
  pill.addEventListener("click", () => {
    pills.forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    hintMode = pill.dataset.mode;
  });
});

//Quick Prompts
quickBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const prompt = btn.dataset.prompt;
    sendMessage(prompt);
  });
});

//Send on Enter
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

sendBtn.addEventListener("click", handleSend);

function handleSend() {
  const text = userInput.value.trim();
  if (!text || !apiKey) return;
  userInput.value = "";
  autoResizeTextarea();
  sendMessage(text);
}

userInput.addEventListener("input", autoResizeTextarea);

function autoResizeTextarea() {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 80) + "px";
}

async function loadProblemContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.includes("leetcode.com/problems/")) {
      const slug = tab.url.split("/problems/")[1]?.split("/")[0] || "";
      currentProblem = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      problemName.textContent = currentProblem;
      statusDot.classList.add("online");
    } else {
      problemName.textContent = "Open a LeetCode problem";
      statusDot.classList.remove("online");
    }
  } catch {
    problemName.textContent = "—";
  }
}
