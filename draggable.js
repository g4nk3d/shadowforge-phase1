window.addEventListener('DOMContentLoaded', () => {
  const dragTarget = document.getElementById("craftingMenu");
  const dragHeader = document.getElementById("craftingHeader");

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  if (dragHeader && dragTarget) {
    dragHeader.addEventListener("mousedown", (e) => {
      e.preventDefault();
      isDragging = true;
      offsetX = e.clientX - dragTarget.offsetLeft;
      offsetY = e.clientY - dragTarget.offsetTop;
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      document.body.style.userSelect = "auto";
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        dragTarget.style.left = `${e.clientX - offsetX}px`;
        dragTarget.style.top = `${e.clientY - offsetY}px`;
        dragTarget.style.transform = "none"; // cancel centering
      }
    });
  }
});
