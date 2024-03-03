const ws = new WebSocket("ws://localhost:3000");
document.addEventListener("DOMContentLoaded", getUsersCount);
window.addEventListener("resize", getMessageHistory);

const messageInput = document.getElementById("msg-input");
const typingIndicator = document.querySelector(".selected-user-status");

let typingTimeout;
let currentUser = null;
let currentUsername = null;
let currentEmail = null;
let currentUserImage = null;
let selectedUser = null;
let selectedUserImg = null;
let isAuth = false;
let isUserLoading = true;
let isChatsListLoading = true;
let isChatLoading = true;
let lastSender = null;
let messagesInARow = 0;

(async () => {
  if (localStorage.getItem("token")) {
    await checkAuth();
    await getUsersList();
  }
})();

async function fetchWithAuthCheck(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (response.status === 401) {
      await checkAuth();
      const updatedOptions = {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      };
      return fetch(url, updatedOptions);
    }
    return response;
  } catch (error) {
    console.error("Ошибка при выполнении запроса:", error);
  }
}

async function checkAuth() {
  isLoading = true;
  try {
    const response = await fetch("/auth/refresh", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();
    if (data.accessToken) {
      localStorage.setItem("token", data.accessToken);
      isAuth = true;
      currentUser = data.user;
      currentUsername = data.user.username;
      currentEmail = data.user.email;
      // await getUserImage(currentUser);
      await getOurUser(currentUsername);
    }
  } catch (error) {
    console.log(error);
  } finally {
    isLoading = false;
  }
}

ws.onmessage = function (event) {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch (error) {
    console.error("Ошибка парсинга данных", error);
    return;
  }

  if (data.type === "typing") {
    if (data.receiver !== selectedUser) {
      typingIndicator.textContent = `Typing...`;
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        typingIndicator.textContent = "";
      }, 3000);
    }
  } else {
    const data = JSON.parse(event.data);

    if (data.sender === selectedUser || data.sender === currentUsername) {
      const messagesList = document.querySelector(".messages");
      const isSender = data.sender === currentUsername;
      const messageLi = document.createElement("li");
      const actionStatus = document.querySelector(".action-status");

      if (lastSender === data.sender) {
        messagesInARow++;
      } else {
        messagesInARow = 1;
      }

      const shouldHideUserImage = lastSender === data.sender;
      const specialStyleForFirstMessage =
        messagesInARow === 1 && isSender
          ? "first-message-sender"
          : messagesInARow === 1
          ? "first-message"
          : "";

      messageLi.className = `message ${isSender ? "sender" : "receiver"}`;

      const userImageDiv = document.createElement("div");
      userImageDiv.className = "u-image";
      if (shouldHideUserImage && isSender) {
        userImageDiv.style.display = "none";
      } else if (isSender && window.innerWidth <= 567) {
        userImageDiv.style.display = "none";
      }
      const img = document.createElement("img");
      img.src = isSender ? currentUserImage : selectedUserImg;
      userImageDiv.appendChild(img);

      const messageBoxDiv = document.createElement("div");
      messageBoxDiv.className = `message-box ${specialStyleForFirstMessage}`;
      if (shouldHideUserImage && isSender) {
        messageBoxDiv.style.marginRight = "53px";
      } else if (shouldHideUserImage && !isSender) {
        messageBoxDiv.style.marginLeft = "53px";
      }
      const messageP = document.createElement("p");
      messageP.textContent = data.message;
      messageBoxDiv.appendChild(messageP);

      const copyBox = document.createElement("div");
      const copyBtn = document.createElement("div");
      copyBtn.innerHTML = `<svg width="120px" height="120px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M15 1.25H10.9436C9.10583 1.24998 7.65019 1.24997 6.51098 1.40314C5.33856 1.56076 4.38961 1.89288 3.64124 2.64124C2.89288 3.38961 2.56076 4.33856 2.40314 5.51098C2.24997 6.65019 2.24998 8.10582 2.25 9.94357V16C2.25 17.8722 3.62205 19.424 5.41551 19.7047C5.55348 20.4687 5.81753 21.1208 6.34835 21.6517C6.95027 22.2536 7.70814 22.5125 8.60825 22.6335C9.47522 22.75 10.5775 22.75 11.9451 22.75H15.0549C16.4225 22.75 17.5248 22.75 18.3918 22.6335C19.2919 22.5125 20.0497 22.2536 20.6517 21.6517C21.2536 21.0497 21.5125 20.2919 21.6335 19.3918C21.75 18.5248 21.75 17.4225 21.75 16.0549V10.9451C21.75 9.57754 21.75 8.47522 21.6335 7.60825C21.5125 6.70814 21.2536 5.95027 20.6517 5.34835C20.1208 4.81753 19.4687 4.55348 18.7047 4.41551C18.424 2.62205 16.8722 1.25 15 1.25ZM17.1293 4.27117C16.8265 3.38623 15.9876 2.75 15 2.75H11C9.09318 2.75 7.73851 2.75159 6.71085 2.88976C5.70476 3.02502 5.12511 3.27869 4.7019 3.7019C4.27869 4.12511 4.02502 4.70476 3.88976 5.71085C3.75159 6.73851 3.75 8.09318 3.75 10V16C3.75 16.9876 4.38624 17.8265 5.27117 18.1293C5.24998 17.5194 5.24999 16.8297 5.25 16.0549V10.9451C5.24998 9.57754 5.24996 8.47522 5.36652 7.60825C5.48754 6.70814 5.74643 5.95027 6.34835 5.34835C6.95027 4.74643 7.70814 4.48754 8.60825 4.36652C9.47522 4.24996 10.5775 4.24998 11.9451 4.25H15.0549C15.8297 4.24999 16.5194 4.24998 17.1293 4.27117ZM7.40901 6.40901C7.68577 6.13225 8.07435 5.9518 8.80812 5.85315C9.56347 5.75159 10.5646 5.75 12 5.75H15C16.4354 5.75 17.4365 5.75159 18.1919 5.85315C18.9257 5.9518 19.3142 6.13225 19.591 6.40901C19.8678 6.68577 20.0482 7.07435 20.1469 7.80812C20.2484 8.56347 20.25 9.56458 20.25 11V16C20.25 17.4354 20.2484 18.4365 20.1469 19.1919C20.0482 19.9257 19.8678 20.3142 19.591 20.591C19.3142 20.8678 18.9257 21.0482 18.1919 21.1469C17.4365 21.2484 16.4354 21.25 15 21.25H12C10.5646 21.25 9.56347 21.2484 8.80812 21.1469C8.07435 21.0482 7.68577 20.8678 7.40901 20.591C7.13225 20.3142 6.9518 19.9257 6.85315 19.1919C6.75159 18.4365 6.75 17.4354 6.75 16V11C6.75 9.56458 6.75159 8.56347 6.85315 7.80812C6.9518 7.07435 7.13225 6.68577 7.40901 6.40901Z" fill="#ff0066"></path> </g></svg>`;
      copyBox.className = "copy-box";
      copyBtn.className = "copy-btn";
      copyBtn.addEventListener("click", () => {
        navigator.clipboard
          .writeText(data.message)
          .then(() => {
            actionStatus.classList.add("action-animation");
            setTimeout(() => {
              actionStatus.classList.remove("action-animation");
            }, 1500);
          })
          .catch((err) => {
            console.error("Ошибка при копировании текста: ", err);
          });
      });
      copyBox.appendChild(copyBtn);
      messageBoxDiv.appendChild(copyBox);

      messageLi.appendChild(userImageDiv);
      messageLi.appendChild(messageBoxDiv);
      messagesList.appendChild(messageLi);

      lastSender = data.sender;

      scrollToBottom(messagesList);
    }
  }
};

if (window.location.pathname === "/chat") {
  messageInput.addEventListener("input", () => {
    sendTypingNotification(currentUsername, selectedUser);

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      typingIndicator.textContent = "";
    }, 3000);
  });

  document
    .querySelector(".our-user-image img")
    .addEventListener("click", function () {
      document.getElementById("file_upload").click();
    });

  document
    .getElementById("file_upload")
    .addEventListener("change", function () {
      if (this.files.length > 0) {
        const ourUserImage = document.querySelector(".our-user-image");
        const image = ourUserImage.querySelector("img");
        const formData = new FormData();

        formData.append("image", this.files[0]);
        formData.append("currentUser", JSON.stringify(currentUsername));

        const file = this.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
          debugger;
          image.src = e.target.result;
        };

        reader.readAsDataURL(file);

        fetchWithAuthCheck("auth/upload", {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });
        // .then((response) => response.json())
        // .then((data) => {
        //   currentUser = data;
        //   getUserImage(currentUser);
        //   getOurUser(currentUser.username);
        // })
        // .catch((error) => {
        //   console.error("Error:", error);
        // });
      }
    });
}

function sendTypingNotification(senderName, receiverName) {
  if (ws.readyState === WebSocket.OPEN) {
    const typingNotification = {
      type: "typing",
      sender: senderName,
      to: receiverName,
    };
    ws.send(JSON.stringify(typingNotification));
  }
}

async function logout() {
  try {
    const response = await fetchWithAuthCheck("auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        currentUser: currentUsername,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    localStorage.removeItem("token");
    window.location.href = data.redirectUrl;
    isAuth = false;
  } catch (error) {
    console.log(error.message);
  }
}

async function getMessageHistory() {
  const selectedUsername = document.querySelector(".selected-user-name");
  const selectedUserImage = document.querySelector(".selected-user-image img");
  const selectedUserSkeleton = document.querySelector(".selected-user-name");
  const messagesList = document.querySelector(".messages");
  const actionStatus = document.querySelector(".action-status");

  selectedUsername.textContent = "";
  selectedUserImage.src = "";
  selectedUserImage.style.height = "0";
  if (!selectedUserSkeleton.classList.contains("skeleton")) {
    selectedUserSkeleton.classList.add("skeleton", "skeleton-name");
  }
  messagesList.innerHTML = "";

  isChatLoading = true;
  loadingRolling();
  try {
    const response = await fetchWithAuthCheck("/auth/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        to: selectedUser,
        sender: currentUsername,
      }),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const messagesData = await response.json();
    const user = await getUser(selectedUser);
    const userData = await getUserImage(user);

    isChatLoading = false;
    loadingRolling();

    selectedUserImage.src = userData.image;
    selectedUserImage.style.height = "100%";
    selectedUserImg = userData.image;
    selectedUserSkeleton.classList.remove("skeleton", "skeleton-name");
    selectedUsername.textContent = selectedUser;

    for (const data of messagesData) {
      const isSender = data.sender === currentUsername;
      const messageLi = document.createElement("li");
      messageLi.className = `message ${isSender ? "sender" : "receiver"}`;

      if (lastSender === data.sender) {
        messagesInARow++;
      } else {
        messagesInARow = 1;
      }

      const shouldHideUserImage = lastSender === data.sender;
      const specialStyleForFirstMessage =
        messagesInARow === 1 && isSender
          ? "first-message-sender"
          : messagesInARow === 1
          ? "first-message"
          : "";
      const userImageDiv = document.createElement("div");
      userImageDiv.className = "u-image";
      if (shouldHideUserImage) {
        userImageDiv.style.display = "none";
      } else if (isSender && window.innerWidth <= 567) {
        userImageDiv.style.display = "none";
      }
      const img = document.createElement("img");
      img.src = isSender ? currentUserImage : selectedUserImage.src;
      userImageDiv.appendChild(img);

      const messageBoxDiv = document.createElement("div");
      messageBoxDiv.className = `message-box ${specialStyleForFirstMessage}`;

      if (window.innerWidth <= 467 && shouldHideUserImage && isSender) {
        messageBoxDiv.style.marginRight = "0";
      } else if (window.innerWidth <= 467 && shouldHideUserImage && !isSender) {
        messageBoxDiv.style.marginLeft = "35px";
      } else {
        if (shouldHideUserImage && isSender) {
          messageBoxDiv.style.marginRight = "53px";
        } else if (shouldHideUserImage && !isSender) {
          messageBoxDiv.style.marginLeft = "53px";
        }
      }

      const messageP = document.createElement("p");
      messageP.textContent = data.message;
      messageBoxDiv.appendChild(messageP);

      const copyBox = document.createElement("div");
      const copyBtn = document.createElement("div");
      copyBtn.innerHTML = `<svg width="120px" height="120px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M15 1.25H10.9436C9.10583 1.24998 7.65019 1.24997 6.51098 1.40314C5.33856 1.56076 4.38961 1.89288 3.64124 2.64124C2.89288 3.38961 2.56076 4.33856 2.40314 5.51098C2.24997 6.65019 2.24998 8.10582 2.25 9.94357V16C2.25 17.8722 3.62205 19.424 5.41551 19.7047C5.55348 20.4687 5.81753 21.1208 6.34835 21.6517C6.95027 22.2536 7.70814 22.5125 8.60825 22.6335C9.47522 22.75 10.5775 22.75 11.9451 22.75H15.0549C16.4225 22.75 17.5248 22.75 18.3918 22.6335C19.2919 22.5125 20.0497 22.2536 20.6517 21.6517C21.2536 21.0497 21.5125 20.2919 21.6335 19.3918C21.75 18.5248 21.75 17.4225 21.75 16.0549V10.9451C21.75 9.57754 21.75 8.47522 21.6335 7.60825C21.5125 6.70814 21.2536 5.95027 20.6517 5.34835C20.1208 4.81753 19.4687 4.55348 18.7047 4.41551C18.424 2.62205 16.8722 1.25 15 1.25ZM17.1293 4.27117C16.8265 3.38623 15.9876 2.75 15 2.75H11C9.09318 2.75 7.73851 2.75159 6.71085 2.88976C5.70476 3.02502 5.12511 3.27869 4.7019 3.7019C4.27869 4.12511 4.02502 4.70476 3.88976 5.71085C3.75159 6.73851 3.75 8.09318 3.75 10V16C3.75 16.9876 4.38624 17.8265 5.27117 18.1293C5.24998 17.5194 5.24999 16.8297 5.25 16.0549V10.9451C5.24998 9.57754 5.24996 8.47522 5.36652 7.60825C5.48754 6.70814 5.74643 5.95027 6.34835 5.34835C6.95027 4.74643 7.70814 4.48754 8.60825 4.36652C9.47522 4.24996 10.5775 4.24998 11.9451 4.25H15.0549C15.8297 4.24999 16.5194 4.24998 17.1293 4.27117ZM7.40901 6.40901C7.68577 6.13225 8.07435 5.9518 8.80812 5.85315C9.56347 5.75159 10.5646 5.75 12 5.75H15C16.4354 5.75 17.4365 5.75159 18.1919 5.85315C18.9257 5.9518 19.3142 6.13225 19.591 6.40901C19.8678 6.68577 20.0482 7.07435 20.1469 7.80812C20.2484 8.56347 20.25 9.56458 20.25 11V16C20.25 17.4354 20.2484 18.4365 20.1469 19.1919C20.0482 19.9257 19.8678 20.3142 19.591 20.591C19.3142 20.8678 18.9257 21.0482 18.1919 21.1469C17.4365 21.2484 16.4354 21.25 15 21.25H12C10.5646 21.25 9.56347 21.2484 8.80812 21.1469C8.07435 21.0482 7.68577 20.8678 7.40901 20.591C7.13225 20.3142 6.9518 19.9257 6.85315 19.1919C6.75159 18.4365 6.75 17.4354 6.75 16V11C6.75 9.56458 6.75159 8.56347 6.85315 7.80812C6.9518 7.07435 7.13225 6.68577 7.40901 6.40901Z" fill="#ff0066"></path> </g></svg>`;
      copyBox.className = "copy-box";
      copyBtn.className = "copy-btn";
      copyBtn.addEventListener("click", () => {
        navigator.clipboard
          .writeText(data.message)
          .then(() => {
            actionStatus.classList.add("action-animation");
            setTimeout(() => {
              actionStatus.classList.remove("action-animation");
            }, 1500);
          })
          .catch((err) => {
            console.error("Ошибка при копировании текста: ", err);
          });
      });
      copyBox.appendChild(copyBtn);
      messageBoxDiv.appendChild(copyBox);
      messageLi.appendChild(userImageDiv);
      messageLi.appendChild(messageBoxDiv);
      messagesList.appendChild(messageLi);
      lastSender = data.sender;
    }
    scrollToBottom(messagesList);
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

async function getUsersCount() {
  try {
    const response = await fetchWithAuthCheck("/auth/users/count", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    const usersList = document.querySelector(".chats-list");
    for (let i = 1; i <= data - 1; i++) {
      const skeletonUser = document.createElement("li");
      skeletonUser.className = `skeleton-user user`;
      skeletonUser.innerHTML = `
      <div class="user-image skeleton"></div>
      <div class="user-information">
      <div class="skeleton-body">
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
      </div>
      </div>
      <div class="bell skeleton"></div>
      `;
      usersList.appendChild(skeletonUser);
    }
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

async function getUserImage(user) {
  const response = await fetchWithAuthCheck(`auth/image/${user.image}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await response.json();
  return { user: user, image: data.image };
}

async function getOurUser(username) {
  try {
    const response = await fetchWithAuthCheck("/auth/currentUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ username: username }),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    const ourUserImage = document.querySelector(".our-user-image");
    const image = ourUserImage.querySelector("img");
    const ourUserName = document.querySelector(".our-user-name");
    const ourUserEmail = document.querySelector(".our-user-email");
    const skeletonBody = document.querySelector(".skeleton-body");

    const userData = await getUserImage(data);

    skeletonBody.style.display = "none";
    currentUserImage = userData.image;
    image.src = userData.image;
    image.style.height = "100%";
    ourUserName.textContent = currentUsername;
    ourUserEmail.textContent = currentEmail;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

async function getUser(username) {
  try {
    const response = await fetchWithAuthCheck("/auth/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ username: username }),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

async function getUsersList() {
  const usersList = document.querySelector(".chats-list");
  try {
    const response = await fetchWithAuthCheck("/auth/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const usersData = await response.json();
    let isFirstUser = true;

    let index = 0;
    for (const data of usersData) {
      if (data.username === currentUsername) {
        continue;
      } else {
        const userData = await getUserImage(data);
        const userLi = document.createElement("li");

        userLi.className = `user fade-in`;
        userLi.innerHTML = `
          <div class="user-image">
            <img src="${userData.image}" alt="" />
          </div>
          <div class="user-information">
            <h3 class="user-name">${data.username}</h3>
            <h4 class="user-email">${data.email}</h4>
          </div>
          <div class="bell">
            <img src="./assets/images/bell.png" alt="" />
          </div>
        `;
        usersList.replaceChild(userLi, usersList.childNodes[index++]);
        userLi.addEventListener("click", function () {
          if (selectedUser === data.username) return;
          selectedUser = data.username;
          document
            .querySelectorAll(".user")
            .forEach((item) => item.classList.remove("selected"));
          this.classList.add("selected");

          getMessageHistory();
          toggleMenu();
        });

        if (isFirstUser) {
          selectedUser = data.username;
          isFirstUser = false;
          userLi.classList.add("selected");
          getMessageHistory();
        }
      }
    }
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

function register() {
  const email = document.getElementById("registration_email_input").value;
  const username = document.getElementById("registration_username_input").value;
  const password = document.getElementById("registration_password_input").value;
  const emailHelper = document.querySelector(".email-helper");
  const usernameHelper = document.querySelector(".username-helper");
  const passwordHelper = document.querySelector(".password-helper");

  fetch("/auth/registration", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.errors) {
        const messages = data.errors.map((error) => error.msg).join(", ");
        emailHelper.textContent = messages;
        document.getElementById("registration_username_input").value = "";
        document.getElementById("registration_password_input").value = "";
      } else {
        emailHelper.textContent = data;
        document.getElementById("registration_username_input").value = "";
        document.getElementById("registration_password_input").value = "";
      }
    })
    .catch((error) => console.log(error));
}

function login() {
  const username = document.getElementById("login_username_input").value;
  const password = document.getElementById("login_password_input").value;
  const usernameStatus = document.getElementById("login_username_status");
  const passwordStatus = document.getElementById("login_password_status");

  fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.errors || data.message) {
        const messages =
          data.errors.map((error) => error.msg).join(", ") || data.message;
        usernameStatus.textContent = messages;
      } else {
        if (data.error) {
          usernameStatus.textContent = data.error;
        } else {
          currentUsername = username;
          isAuth = true;
          localStorage.setItem("token", data.userData.accessToken);
          checkAuth();
          window.location.href = data.redirectUrl;
        }
      }
    })
    .catch((error) => {
      console.error("Login Error:", error);
    });
}

function sendMessage(event) {
  event.preventDefault(); // Предотвращаем обновление страницы

  const messageInput = document.getElementById("msg-input");
  if (currentUsername && messageInput.value) {
    const messageData = {
      to: selectedUser,
      sender: currentUsername,
      username: currentUsername,
      message: messageInput.value,
    };
    ws.send(JSON.stringify(messageData));
    messageInput.value = ""; // Очищаем поле ввода после отправки
  }
}

function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}

function loadingRolling() {
  // const userLoadingContainer = document.querySelector(
  //   ".user-loading-rolling-container"
  // );
  // const listLoadingContainer = document.querySelector(
  //   ".list-loading-rolling-container"
  // );
  const chatLoadingContainer = document.querySelector(
    ".chat-loading-rolling-container"
  );
  // if (isUserLoading) {
  //   userLoadingContainer.style.display = "flex";
  // } else if (!isUserLoading) {
  //   userLoadingContainer.style.display = "none";
  // }
  // if (isChatsListLoading) {
  //   listLoadingContainer.style.display = "flex";
  // } else if (!isChatsListLoading) {
  //   listLoadingContainer.style.display = "none";
  // }
  if (isChatLoading) {
    chatLoadingContainer.style.display = "flex";
  } else if (!isChatLoading) {
    chatLoadingContainer.style.display = "none";
  }
}
