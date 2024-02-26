const page = document.querySelector(".page");
const fallingContainer = document.querySelector(".falling-container");

function Anim() {
  if (page.classList.contains("page-fade-out_right")) {
    page.classList.remove("page-fade-out_right");
  } else if (page.classList.contains("page-fade-out_left")) {
    page.classList.remove("page-fade-out_left");
  }
  if (page.classList.contains("registration-page")) {
    page.style.left = "100%";
    page.classList.add("page-fade-in_left");
    page.style.left = "0";
  } else {
    page.style.left = "-100%";
    page.classList.add("page-fade-in_right");
    page.style.left = "0";
  }

  setTimeout(() => {
    page.classList.remove("page-fade-in_right");
    page.classList.remove("page-fade-in_left");
  }, 1000);
}

document.querySelectorAll("a").forEach((link) => {
  link.onclick = (e) => {
    e.preventDefault();
    const href = e.target.getAttribute("href");

    let page = document.querySelector(".page");

    if (page.classList.contains("page-fade-in_right")) {
      page.classList.remove("page-fade-in_right");
    } else if (page.classList.contains("page-fade-in_left")) {
      page.classList.remove("page-fade-in_left");
    }

    if (page.classList.contains("registration-page")) {
      page.classList.add("page-fade-out_left");
    } else {
      page.classList.add("page-fade-out_right");
    }

    if (fallingContainer) {
      fallingContainer.style.display = "none";
    }
    setTimeout(() => {
      window.location.href = href;
    }, 900);
  };
});

document.addEventListener("DOMContentLoaded", () => {
  if (
    window.performance &&
    performance.getEntriesByType &&
    performance.getEntriesByType("navigation").length > 0
  ) {
    let navigationType = performance.getEntriesByType("navigation")[0].type;
    if (navigationType !== "reload") {
      if (fallingContainer) {
        fallingContainer.style.display = "none";
      }
      Anim();
    }
  }
});
