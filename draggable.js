function makeDraggable(headerId, containerId) {
  const header = document.getElementById(headerId);
  const container = document.getElementById(containerId);
  let offsetX = 0, offsetY = 0, isDragging = false;

  header.addEventListener('mousedown', function (e) {
    isDragging = true;
    offsetX = e.clientX - container.offsetLeft;
    offsetY = e.clientY - container.offsetTop;
    document.addEventListener('mousemove', dragMouseMove);
    document.addEventListener('mouseup', stopDragging);
  });

  function dragMouseMove(e) {
    if (!isDragging) return;
    container.style.left = (e.clientX - offsetX) + 'px';
    container.style.top = (e.clientY - offsetY) + 'px';
    container.style.transform = 'none'; // Disable center translation
  }

  function stopDragging() {
    isDragging = false;
    document.removeEventListener('mousemove', dragMouseMove);
    document.removeEventListener('mouseup', stopDragging);
  }
}

// Activate drag on menus
makeDraggable('craftingHeader', 'craftingMenu');
makeDraggable('buildingHeader', 'buildingMenu');
makeDraggable('inventoryHeader', 'inventoryMenu');
