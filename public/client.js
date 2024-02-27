const ws = new WebSocket("ws://localhost:3000");

const messageInput = document.getElementById("msg-input");
const typingIndicator = document.querySelector(".selected-user-status");
let typingTimeout;

let currentUser = null;
let currentUsername = null;
let currentEmail = null;
let selectedUser = null;
let isAuth = false;
let isLoading = false;

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
      await getUserImage(currentUser);
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
      messageLi.className = `message ${isSender ? "sender" : "receiver"}`;
      messageLi.innerHTML = `
        <div class="u-image">
          <img src="${
            isSender
              ? "./assets/images/our-user-img.png"
              : "./assets/images/user-img.png"
          }" alt="" />
        </div>
        <div class="message-box">
          <p>${data.message}</p>
        </div>`;

      messagesList.appendChild(messageLi);
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
    }, 2000);
  });

  // document.getElementById("uploadForm").addEventListener("submit", function (e) {
  //   e.preventDefault();
  
  //   const formData = new FormData();
  //   const imageInput = document.getElementById("file_upload");
  
  //   if (imageInput.files.length > 0) {
  //     formData.append("image", imageInput.files[0]);
  //     formData.append("currentUser", JSON.stringify(currentUsername));
  
  //     fetch("auth/upload", {
  //       method: "POST",
  //       credentials: "include",
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //       },
  //       body: formData,
  //     })
  //       .then((response) => response.json())
  //       .then((data) => {
  //         currentUser = data;
  //         getUserImage(currentUser);
  //       })
  //       .catch((error) => {
  //         console.error("Error:", error);
  //       });
  //   }
  // });
}

async function getUserImage(user) {

  const baseUrl = "http://localhost:3000/"; // Замените на ваш базовый URL
  const imageUrl = `auth/image/${user.image}`;
  const fullUrl = baseUrl + imageUrl;

  const response = await fetch(fullUrl, {
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
  debugger
  return { user: user, image: data.image };
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

async function fetchMessageHistory() {
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
    const messagesList = document.querySelector(".messages");
    messagesList.innerHTML = "";

    for (const data of messagesData) {
      const isSender = data.sender === currentUsername;
      const messageLi = document.createElement("li");
      messageLi.className = `message ${isSender ? "sender" : "receiver"}`;

      messageLi.innerHTML = `
        <div class="u-image">
        <img src="${
          isSender
            ? "./assets/images/our-user-img.png"
            : "./assets/images/user-img.png"
        }" alt="" />
        </div>
        <div class="message-box">
          <p>${data.message}</p>
        </div>`;

      messagesList.appendChild(messageLi);
    }
    scrollToBottom(messagesList);
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

async function getOurUser(username) {
  try {
    const response = await fetchWithAuthCheck("/auth/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({username: username}),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    const ourUserImage = document.querySelector(".our-user-image");
    const image = ourUserImage.querySelector("img");
    const ourUserName = document.querySelector(".our-user-name");
    const ourUserEmail = document.querySelector(".our-user-email");

    const userData = await getUserImage(data);
    image.src = userData.image;
    ourUserName.textContent = currentUsername;
    ourUserEmail.textContent = currentEmail;
      
    }
   catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

async function getUsersList() {
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

    const usersList = document.querySelector(".chats-list");
    const selectedUsername = document.querySelector(".selected-user-name");

    usersList.innerHTML = "";
    let isFirstUser = true;

    for (const data of usersData) {
      if (data.username === currentUsername) {
        continue;
      }else{
        const userData = await getUserImage(data);
        const areWeAUser = data.username === currentUsername;
        const userLi = document.createElement("li");
  
        userLi.className = `user ${areWeAUser ? "weAreUser" : ""}`;
        userLi.innerHTML = `
          <div class="user-image">
            <img src="${userData.image} alt="" />
          </div>
          <div class="user-information">
            <h3 class="user-name">${data.username}</h3>
            <h4 class="user-email">${data.email}</h4>
          </div>
          <div class="bell">
            <img src="./assets/images/bell.png" alt="" />
          </div>
        `;
  
        usersList.appendChild(userLi);
  
        userLi.addEventListener("click", function () {
          selectedUser = data.username;
  
          document
            .querySelectorAll(".user")
            .forEach((item) => item.classList.remove("selected"));
          this.classList.add("selected");
          selectedUsername.textContent = selectedUser;
          fetchMessageHistory();
        });
  
        if (isFirstUser && !areWeAUser) {
          selectedUser = data.username;
          isFirstUser = false;
          userLi.classList.add("selected");
          selectedUsername.textContent = selectedUser;
          fetchMessageHistory();
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

function sendMessage() {
  const messageInput = document.getElementById("msg-input");
  if (currentUsername && messageInput.value) {
    const messageData = {
      to: selectedUser,
      sender: currentUsername,
      username: currentUsername,
      message: messageInput.value,
    };
    ws.send(JSON.stringify(messageData));
    messageInput.value = "";
  }
}

function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}
