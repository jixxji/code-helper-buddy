// ==========================================
//  LeetBuddy — popup.js
// ==========================================

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// ---- State ----
let apiKey = "";
let hintMode = "nudge"; // nudge | hint | approach
let conversationHistory = []; // {role, text}[]
let currentProblem = "";

// ---- DOM ----
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

// ---- Init ----
(async () => {
  const stored = await chrome.storage.local.get(["apiKey"]);
  if (stored.apiKey) {
    apiKey = stored.apiKey;
    showMainScreen();
    loadProblemContext();
  }
})();

// ---- API Key Save ----
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

// ---- Hint Mode Pills ----
pills.forEach((pill) => {
  pill.addEventListener("click", () => {
    pills.forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    hintMode = pill.dataset.mode;
  });
});

// ---- Quick Prompts ----
quickBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const prompt = btn.dataset.prompt;
    sendMessage(prompt);
  });
});

// ---- Send on Enter (Shift+Enter for newline) ----
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

// ---- Load Problem from Active Tab ----
async function loadProblemContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.includes("leetcode.com/problems/")) {
      // Extract problem title from URL slug
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

// ---- Send Message to Gemini ----
async function sendMessage(userText) {
  if (!apiKey) return;

  // Add user bubble
  appendMessage("user", userText);
  conversationHistory.push({ role: "user", text: userText });

  // Show loading
  const loadingId = appendLoading();
  sendBtn.disabled = true;

  try {
    const systemPrompt = buildSystemPrompt();
    const contents = buildContents(systemPrompt);

    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || "API error");
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Hmm, I couldn't come up with a response. Try again!";

    removeLoading(loadingId);
    appendMessage("bot", reply);
    conversationHistory.push({ role: "assistant", text: reply });
    statusDot.classList.add("online");
    statusDot.classList.remove("error");

  } catch (err) {
    removeLoading(loadingId);
    appendMessage("bot", `⚠️ Error: ${err.message}. Check your API key or try again.`);
    statusDot.classList.add("error");
    statusDot.classList.remove("online");
  }

  sendBtn.disabled = false;
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ---- Build System Prompt based on Hint Mode ----
function buildSystemPrompt() {
  const modeInstructions = {
    nudge: `You give very subtle nudges — ask a leading question or point them toward the right line of thinking WITHOUT revealing the approach or algorithm. One sentence max. Example: "What happens if you use extra memory here?"`,
    hint: `You give a helpful hint — describe a useful observation or constraint without naming the algorithm or full solution. 2-3 sentences max.`,
    approach: `You describe the general approach or algorithm category (e.g., "sliding window", "BFS", "DP") and explain WHY it fits, but you do NOT write any code. Keep it to 4-5 sentences.`,
  };

  return `You are LeetBuddy, a friendly and encouraging coding mentor helping a student solve LeetCode problems. 
Your job is to guide them WITHOUT giving away the full solution or writing code for them.

Current problem: "${currentProblem || "a LeetCode problem"}"
Hint level: ${hintMode.toUpperCase()}

${modeInstructions[hintMode]}

Rules:
- NEVER write complete solutions or fully working code
- NEVER just give the answer directly
- If they ask for the direct answer, gently redirect them to think it through
- Keep responses concise and encouraging
- Use simple language, not academic jargon
- If they seem frustrated, be extra encouraging
- You can ask them clarifying questions to understand their current thinking
- Format nicely (use short bullet points sparingly if needed, but keep it conversational)
`;
}

// ---- Build Gemini Contents Array ----
function buildContents(systemPrompt) {
  // Gemini doesn't have a system role — prepend as first user turn
  const msgs = [
    {
      role: "user",
      parts: [{ text: systemPrompt + "\n\nAcknowledge you understand your role in one short sentence." }],
    },
    {
      role: "model",
      parts: [{ text: "Got it — I'm here to guide you with hints and questions, not to hand over the answer!" }],
    },
  ];

  // Add conversation history
  conversationHistory.forEach(({ role, text }) => {
    msgs.push({
      role: role === "user" ? "user" : "model",
      parts: [{ text }],
    });
  });

  return msgs;
}

// ---- UI Helpers ----
function showMainScreen() {
  setupScreen.classList.add("hidden");
  mainScreen.classList.remove("hidden");
}

function appendMessage(type, text) {
  const div = document.createElement("div");
  div.className = `message ${type === "user" ? "user-message" : "bot-message"}`;

  if (type === "bot") {
    div.innerHTML = `
      <div class="bot-avatar">🤖</div>
      <div class="bubble">${escapeAndFormat(text)}</div>
    `;
  } else {
    div.innerHTML = `<div class="bubble">${escapeHTML(text)}</div>`;
  }

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function appendLoading() {
  const id = "loading-" + Date.now();
  const div = document.createElement("div");
  div.className = "message bot-message";
  div.id = id;
  div.innerHTML = `
    <div class="bot-avatar">🤖</div>
    <div class="bubble">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return id;
}

function removeLoading(id) {
  document.getElementById(id)?.remove();
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAndFormat(str) {
  // Basic markdown-ish formatting
  return escapeHTML(str)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code style='background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-family:monospace'>$1</code>")
    .replace(/\n/g, "<br>");
}

function shake(el) {
  el.style.animation = "none";
  el.offsetHeight; // reflow
  el.style.animation = "shake 0.3s ease";
  el.addEventListener("animationend", () => el.style.animation = "", { once: true });
}
