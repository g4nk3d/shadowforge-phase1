function makeDraggable(headerId, containerId) {
  const header = document.querySelector(`#${headerId}`);
  const container = document.querySelector(`#${containerId}`);

  if (!header || !container) return;

  let offsetX = 0, offsetY = 0;
  let isDragging = false;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - container.offsetLeft;
    offsetY = e.clientY - container.offsetTop;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    if (!isDragging) return;
    container.style.left = `${e.clientX - offsetX}px`;
    container.style.top = `${e.clientY - offsetY}px`;
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
}

// Make all UI windows draggable
makeDraggable("craftingMenu", "craftingMenu");
makeDraggable("buildingMenu", "buildingMenu");
makeDraggable("inventoryMenu", "inventoryMenu");
