const logo = document.querySelector(".falling-container");
let animationApplied = false;
let secondAnimationApplied = false;
let isAnimationEnd = false;
let isLogoEnd = false;

logo.addEventListener("animationend", (e) => {
  if (e.animationName === "fallingLogoAnimation") {
    logo.classList.add("shaking");
  } else if (e.animationName === "shakingLogoAnimation") {
    logo.classList.add("up");
  }
});

function checkAndApplyAnimation() {
  const mobileCircles = document.querySelectorAll(".mobile-circle");
  if (
    (window.innerWidth <= 767 && !animationApplied && !isAnimationEnd) ||
    (window.innerHeight <= 431 && !animationApplied && !isAnimationEnd)
  ) {
    document.querySelector(".login-container").classList.add("login-up");
    document.querySelector(".login-page-header").classList.add("header-down");
    document.querySelector(".login-footer").classList.add("footer-up");

    mobileCircles.forEach((circle) => {
      let animationDelay = parseFloat(
        window.getComputedStyle(circle).getPropertyValue("animation-delay")
      );
      animationDelay += 3.8;
      circle.style.animationDelay = `${animationDelay}s`;
    });

    setTimeout(() => {
      document.querySelector(".page").style.left = 0;
      document.querySelector(".login-container").style.top = "0";
      document.querySelector(".login-page-header").style.top = "0";
      document.querySelector(".falling-container").style.display = "none";
    }, 3200);

    setTimeout(() => {
      document.querySelector(".login-footer").style.bottom = "0";
    }, 4000);
    animationApplied = true;
    isLogoEnd = true;
  } else if (
    (window.innerHeight <= 431 && !animationApplied && !isLogoEnd) ||
    (window.innerWidth <= 767 && !secondAnimationApplied && !isLogoEnd)
  ) {
    mobileCircles.forEach((circle) => {
      let animationDelay = parseFloat(
        window.getComputedStyle(circle).getPropertyValue("animation-delay")
      );
      animationDelay -= 3.8;
      circle.style.animationDelay = `${animationDelay}s`;
    });
    secondAnimationApplied = true;
  }
}

function windowNormalChecker() {
  if (window.innerWidth > 767) {
    document.querySelector(".page").style.left = "0";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (
    window.performance &&
    performance.getEntriesByType &&
    performance.getEntriesByType("navigation").length > 0
  ) {
    let navigationType = performance.getEntriesByType("navigation")[0].type;
    if (navigationType === "reload") {
      windowNormalChecker();
      checkAndApplyAnimation();
    } else {
      document.querySelector(".page").style.left = "-100%";
      isAnimationEnd = true;
    }
  }
});
window.addEventListener("resize", checkAndApplyAnimation);
