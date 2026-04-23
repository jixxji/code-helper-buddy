// content.js — injected into leetcode.com/problems/* pages
// This script detects problem info and adds a subtle floating trigger button

(function () {
  // Avoid double-injection
  if (document.getElementById("leetbuddy-fab")) return;

  // Small floating "LB" button pinned to bottom-right
  const fab = document.createElement("div");
  fab.id = "leetbuddy-fab";
  fab.innerHTML = `<span>⚡</span>`;
  fab.title = "Open LeetBuddy";
  document.body.appendChild(fab);

  fab.addEventListener("click", () => {
    // Just open the extension popup via a notification
    // (Chrome doesn't allow programmatic popup open from content scripts,
    //  so we signal the user to click the toolbar icon)
    const toast = document.createElement("div");
    toast.id = "leetbuddy-toast";
    toast.textContent = "Click the ⚡ LeetBuddy icon in your toolbar!";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  });
})();
