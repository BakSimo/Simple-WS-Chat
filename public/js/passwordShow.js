const btn = document.querySelector(".show-password-btn");
const passwordInput = document.getElementById("registration_password_input");
const confirmPasswordInput = document.getElementById(
  "registration_confirm_password_input"
);
const passwordIcon = document.getElementById("password_icon");
const confirmPasswordIcon = document.getElementById("confirm_password_icon");

function togglePassword() {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    passwordIcon.src = "./assets/images/show_password.png";
  } else {
    passwordInput.type = "password";
    passwordIcon.src = "./assets/images/hide_password.png";
  }
}

function toggleConfirmPassword() {
  if (confirmPasswordInput.type === "password") {
    confirmPasswordInput.type = "text";
    confirmPasswordIcon.src = "./assets/images/show_password.png";
  } else {
    confirmPasswordInput.type = "password";
    confirmPasswordIcon.src = "./assets/images/hide_password.png";
  }
}
