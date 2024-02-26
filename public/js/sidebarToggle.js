function toggleMenu() {
  const menuToggle = document.querySelector(".brg-menu");
  const backToggle = document.querySelector(".back-btn");
  const sidebar = document.querySelector(".chats-sidebar");
  const chatContainer = document.querySelector(".chat-container");
  const headerInf = document.querySelector(".header-inf");
  //   const body = document.querySelector("body");

  menuToggle.classList.toggle("active");
  backToggle.classList.toggle("active");
  sidebar.classList.toggle("active");
  chatContainer.classList.toggle("active");
  headerInf.classList.toggle("active");
  //   body.classList.toggle("lock");
}
