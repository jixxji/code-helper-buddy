# ⚡ LeetBuddy — Your AI Coding Mentor

A Chrome extension that acts as a **mentor-style assistant** while you solve LeetCode problems. Instead of spoiling the answer, it nudges you in the right direction with hints, leading questions, and gentle guidance.

Built with vanilla JavaScript + Google Gemini API.

## ✨ Features

- 🤖 **Three hint levels** — Nudge, Hint, or Approach (you control how much help you get)
- 💬 **Conversational chat** — Ask follow-up questions naturally
- ⚡ **Quick prompts** — One-click common questions like "Where do I start?" or "What data structure?"
- 🔑 **Your own API key** — Stored locally, never sent anywhere but Google
- 🎯 **Problem detection** — Auto-detects which LeetCode problem you're on

## 🚀 Getting Started

### 1. Get a Free Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key** and copy it

### 2. Install the Extension
1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `leetcode-buddy` folder

### 3. Use It!
1. Open any LeetCode problem: `leetcode.com/problems/...`
2. Click the ⚡ LeetBuddy icon in your Chrome toolbar
3. Paste your API key when prompted (one-time setup)
4. Start asking for hints!

## 📁 Project Structure

leetcode-buddy/
├── manifest.json     # Chrome extension config
├── popup.html        # Extension popup UI
├── popup.css         # Styling
├── popup.js          # Main logic + Gemini API calls
├── content.js        # Injected into LeetCode pages
├── content.css       # Styles for injected elements
├── icons/            # Extension icons
└── README.md


## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| AI | Google Gemini 2.0 Flash API |
| Extension | Chrome Manifest V3 |

## 💡 How It Works

1. You open a LeetCode problem
2. LeetBuddy detects the problem name from the URL
3. When you ask a question, it builds a prompt that includes:
   - The problem context
   - Your selected hint level
   - Conversation history
   - Instructions to **not** give away the answer
4. Gemini responds with a helpful, non-spoiler nudge

## 🔒 Privacy

- Your API key is stored in Chrome's local storage (never leaves your browser except to call Google's API)
- No data is sent to any third-party server
- Conversation history is in-memory only (cleared when popup closes)


## 🧠 Prompt Engineering

The core of this project is the system prompt. The key insight: telling the AI **what NOT to do** is just as important as what to do.

Rules:
- NEVER write complete solutions or working code
- NEVER just give the answer directly  
- If they ask for the direct answer, gently redirect them
- Guide with questions, not answers


Made with ❤️ as a first portfolio project.