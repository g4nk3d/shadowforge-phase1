function makeDraggable(headerId, windowId) {
  const header = document.getElementById(headerId);
  const windowEl = document.getElementById(windowId);

  if (!header || !windowEl) return; // Avoid crashing if elements aren't found

  let offsetX = 0, offsetY = 0;
  let dragging = false;

  header.addEventListener("mousedown", e => {
    dragging = true;
    offsetX = e.clientX - windowEl.offsetLeft;
    offsetY = e.clientY - windowEl.offsetTop;
  });

  window.addEventListener("mouseup", () => dragging = false);
  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    windowEl.style.left = (e.clientX - offsetX) + "px";
    windowEl.style.top = (e.clientY - offsetY) + "px";
  });
}

// ✅ Make draggable windows after DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  makeDraggable("craftingHeader", "craftingMenu");
  makeDraggable("buildingHeader", "buildingMenu");
  makeDraggable("inventoryHeader", "inventoryMenu");
});
