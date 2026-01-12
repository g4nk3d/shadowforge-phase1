function makeDraggable(el) {
  let offsetX = 0, offsetY = 0, isDragging = false;

  if (!el) return;

  el.addEventListener("mousedown", e => {
    isDragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    el.style.left = `${e.clientX - offsetX}px`;
    el.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

makeDraggable(document.getElementById("craftingMenu"));
makeDraggable(document.getElementById("buildingMenu"));
makeDraggable(document.getElementById("inventoryMenu"));
