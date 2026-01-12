function makeDraggable(elementId, headerId) {
  const el = document.getElementById(elementId);
  const header = document.getElementById(headerId);
  if (!el || !header) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", function (e) {
    isDragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    document.body.style.userSelect = "none"; // prevent accidental text selection
  });

  document.addEventListener("mousemove", function (e) {
    if (!isDragging) return;
    el.style.left = `${e.clientX - offsetX}px`;
    el.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener("mouseup", function () {
    isDragging = false;
    document.body.style.userSelect = "auto";
  });
}

// Make all windows draggable
makeDraggable("craftingMenu", "craftingHeader");
makeDraggable("buildingMenu", "buildingHeader");
makeDraggable("inventoryMenu", "inventoryHeader");
