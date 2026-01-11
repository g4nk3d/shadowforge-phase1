function makeDraggable(headerId, windowId) {
  const header = document.getElementById(headerId);
  const windowEl = document.getElementById(windowId);

  // ✅ HARD SAFETY CHECK — PREVENTS CRASH
  if (!header || !windowEl) {
    console.warn(`Draggable skipped: ${headerId} or ${windowId} not found`);
    return;
  }

  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;

  header.addEventListener("mousedown", (e) => {
    dragging = true;
    offsetX = e.clientX - windowEl.offsetLeft;
    offsetY = e.clientY - windowEl.offsetTop;
  });

  window.addEventListener("mouseup", () => dragging = false);

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    windowEl.style.left = `${e.clientX - offsetX}px`;
    windowEl.style.top = `${e.clientY - offsetY}px`;
  });
}

// ✅ WAIT FOR DOM — CRITICAL
window.addEventListener("DOMContentLoaded", () => {
  makeDraggable("craftingHeader", "craftingMenu");
  makeDraggable("buildingHeader", "buildingMenu");
  makeDraggable("inventoryHeader", "inventoryMenu");
});
