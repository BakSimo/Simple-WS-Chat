window.addEventListener("beforeunload", logout);
const ws = new WebSocket("ws://localhost:3000");

let currentUser = null;
let selectedUser = null;

ws.onmessage = function (event) {
  const eventData = JSON.parse(event.data);

  if (eventData.sender === selectedUser || eventData.sender === currentUser) {
    const messagesList = document.getElementById("messages");
    const messageRow = document.createElement("li");
    const messageText = document.createElement("p");
    const userNameSpan = document.createElement("span");
    const isSender = eventData.username === currentUser;

    messageText.textContent = eventData.message;
    messageRow.className = isSender ? "sender" : "receiver";
    userNameSpan.textContent = eventData.username;
    userNameSpan.className = isSender ? "sender-name" : "receiver-name";
    messageRow.appendChild(messageText);
    messageRow.appendChild(userNameSpan);
    messagesList.appendChild(messageRow);

    scrollToBottom(messagesList);
  }
};

function logout() {
  if (currentUser) {
    const data = new Blob([JSON.stringify({ username: currentUser })], {
      type: "application/json",
    });
    navigator.sendBeacon("/logout", data);
  }
}

function fetchMessageHistory() {
  fetch("/history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: selectedUser,
      sender: currentUser,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((messagesData) => {
      const messagesList = document.getElementById("messages");
      messagesList.innerHTML = "";
      for (const data of messagesData) {
        const messageRow = document.createElement("li");
        const messageText = document.createElement("p");
        const userNameSpan = document.createElement("span");
        const isSender = data.username === currentUser;

        messageText.textContent = data.message;
        messageRow.className = isSender ? "sender" : "receiver";
        userNameSpan.textContent = data.username;
        userNameSpan.className = isSender ? "sender-name" : "receiver-name";
        messageRow.appendChild(messageText);
        messageRow.appendChild(userNameSpan);
        messagesList.appendChild(messageRow);
      }
      scrollToBottom(messagesList);
    })
    .catch((error) => {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    });
}

function getUsersList() {
  fetch("/users_list", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((usersData) => {
      const usersList = document.getElementById("all_users");
      usersList.innerHTML = "";
      let isFirstUser = true; // Добавлен флаг для определения первого пользователя

      for (const data of usersData) {
        const userElement = document.createElement("li");
        const areWeAUser = data.username === currentUser;

        userElement.textContent = data.username;
        userElement.className = areWeAUser ? "we-are-the-user" : "";
        userElement.classList.add("user");

        userElement.addEventListener("click", function () {
          selectedUser = data.username;

          document
            .querySelectorAll(".user")
            .forEach((item) => item.classList.remove("selected"));
          this.classList.add("selected");
          fetchMessageHistory();
        });

        usersList.appendChild(userElement);

        // Устанавливаем selectedUser равной первому пользователю и обновляем интерфейс
        if (isFirstUser && !areWeAUser) {
          selectedUser = data.username;
          isFirstUser = false; // Сбрасываем флаг, так как первый пользователь уже обработан
          userElement.classList.add("selected"); // Отмечаем первого пользователя как выбранного в UI
          fetchMessageHistory(); // Вызываем функцию для загрузки истории сообщений с первым пользователем
        }
      }
    })
    .catch((error) => {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    });
}

function register() {
  const username = document.getElementById("username_reg").value;
  const h2 = document.getElementById("status");

  fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  })
    .then((response) => response.text())
    .then((data) => {
      h2.textContent = data;
    })
    .catch((error) => console.log(error));
}

function login() {
  const username = document.getElementById("username_log").value;
  const usersList = document.getElementById("users_section");
  const loginSection = document.getElementById("login_ection");
  const messageSection = document.getElementById("message_section");
  const h2 = document.getElementById("status");

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  })
    .then((response) => {
      if (!response.ok) {
        h2.textContent = "User not found or already in use.";
      }
      return response.json();
    })
    .then((data) => {
      h2.textContent = `Welcome, ${username}!`;
      currentUser = username;
      loginSection.classList.add("hidden");
      messageSection.classList.remove("hidden");
      usersList.classList.remove("hidden");
      getUsersList();
    })
    .catch((error) => {
      console.error("Login Error:", error);
    });
}

function sendMessage() {
  const messageInput = document.getElementById("message");
  if (currentUser.length && messageInput.value.length) {
    const messageData = {
      to: selectedUser,
      sender: currentUser,
      username: currentUser,
      message: messageInput.value,
    };
    ws.send(JSON.stringify(messageData));
    messageInput.value = "";
  }
}

function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}
