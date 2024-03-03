let lastPageY = 0;
let isDragging = false;
let animationFrameId = null;
let velocity = 0;

const container = document.querySelector(".messages");

function handleMouseDown(e) {
  isDragging = true;
  lastPageY = e.pageY;
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  container.style.cursor = "grabbing";
  cancelAnimationFrame(animationFrameId);
}

function handleMouseMove(e) {
  const deltaY = e.pageY - lastPageY;
  lastPageY = e.pageY;
  container.scrollTop -= deltaY;
  velocity = deltaY;
}

function handleMouseUp() {
  isDragging = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
  animateInertia();
  container.style.cursor = "";
}

function animateInertia() {
  if (Math.abs(velocity) > 0.5) {
    container.scrollTop -= velocity;
    velocity *= 0.95; // Скорость замедления
    animationFrameId = requestAnimationFrame(animateInertia);
  }
}

container.addEventListener("mousedown", handleMouseDown);
