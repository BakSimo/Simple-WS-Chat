const btn = document.querySelector(".show-password-btn");
const passwordInput = document.getElementById("registration_password_input");
const confirmPasswordInput = document.getElementById(
  "registration_confirm_password_input"
);

function togglePasswordShow() {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
  } else {
    passwordInput.type = "password";
  }
}

function toggleConfirmPasswordShow() {
  if (confirmPasswordInput.type === "password") {
    confirmPasswordInput.type = "text";
  } else {
    confirmPasswordInput.type = "password";
  }
}
