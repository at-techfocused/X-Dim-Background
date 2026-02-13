const toggle = document.getElementById("toggle");
const dot = document.getElementById("dot");

chrome.storage.local.get("enabled", ({ enabled }) => {
  const state = enabled === undefined ? true : !!enabled;
  toggle.checked = state;
  dot.classList.toggle("active", state);
});

toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  chrome.storage.local.set({ enabled });
  dot.classList.toggle("active", enabled);
});
