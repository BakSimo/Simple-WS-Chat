const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const authRouter = require("./routers/authRouter");
const Message = require("./models/Message");
const User = require("./models/User");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middlewares/errorMiddleware");

const { CLIENT_URL } = require("./config");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

const usernamesToWs = new Map();
const wsToActiveChat = new Map();
const wsToUsernames = new WeakMap();

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: CLIENT_URL,
  })
);
app.use("/auth", authRouter);
app.use(errorMiddleware);

app.get("/:page?", (req, res) => {
  const { page } = req.params;

  switch (page) {
    case "login":
      res.sendFile(path.join(__dirname, "public", "login.html"));
      break;
    case "registration":
      res.sendFile(path.join(__dirname, "public", "register.html"));
      break;
    case "chat":
      res.sendFile(path.join(__dirname, "public", "chat.html"));
      break;
    default:
      res.redirect("/login");
  }
});

const start = async () => {
  try {
    await mongoose.connect(
      // "mongodb://root:root@mongo:27017/",
      "mongodb+srv://tigrankarapait:tikuliktikulik2501@cluster0.lvoxgij.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    wss.on("connection", async (ws) => {
      ws.on("message", async (data) => {
        const clientData = JSON.parse(data);

        if (clientData.type === "selectChat") {
          // Запоминаем для данного ws текущий активный чат
          wsToActiveChat.set(ws, clientData.chatId);
        } else if (clientData.type === "login") {
          const username = clientData.username;
          if (!usernamesToWs.has(username)) {
            usernamesToWs.set(username, []);
          }
          let connections = usernamesToWs.get(username);
          if (!connections.includes(ws)) {
            connections.push(ws);
          }

          await User.findOneAndUpdate(
            { username: username },
            { isOnline: true }
          );
          broadcastUserStatus(username, true);
          sendCurrentUsersStatus(ws);
        } else if (clientData.type === "typing") {
          for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "typing",
                  sender: clientData.sender,
                  receiver: clientData.to,
                })
              );
            }
          }
        } else if (clientData.type === "message") {
          const message = new Message({
            to: clientData.to,
            sender: clientData.sender,
            message: clientData.message,
          });
          await message.save();

          const receiverChatIds = usernamesToWs
            .get(clientData.to)
            ?.filter((ws) => wsToActiveChat.get(ws) === clientData.sender)
            .map((ws) => wsToActiveChat.get(ws));
          const senderChatIds = usernamesToWs
            .get(clientData.sender)
            ?.filter((ws) => wsToActiveChat.get(ws) === clientData.to)
            .map((ws) => wsToActiveChat.get(ws));

          usernamesToWs.get(clientData.to)?.forEach((receiverWs) => {
            if (
              receiverWs.readyState === WebSocket.OPEN &&
              receiverChatIds.includes(wsToActiveChat.get(receiverWs))
            ) {
              receiverWs.send(JSON.stringify(clientData));
            }
          });

          usernamesToWs.get(clientData.sender)?.forEach((senderWs) => {
            if (
              senderWs.readyState === WebSocket.OPEN &&
              senderChatIds.includes(wsToActiveChat.get(senderWs))
            ) {
              clientData.status = "delivered";
              senderWs.send(JSON.stringify(clientData));
            }
          });
        }
      });

      ws.on("close", async () => {
        const username = wsToUsernames.get(ws);
        if (username) {
          const connections = usernamesToWs.get(username);
          const index = connections.indexOf(ws);
          if (index !== -1) {
            connections.splice(index, 1);
            if (connections.length === 0) {
              await User.findOneAndUpdate(
                { username: username },
                { isOnline: false }
              );
              broadcastUserStatus(username, false);
              usernamesToWs.delete(username);
            }
          }
          wsToActiveChat.delete(ws);
          wsToUsernames.delete(ws);
        }
      });
    });

    function broadcastUserStatus(username, isOnline) {
      const statusMessage = JSON.stringify({
        type: "userStatusChanged",
        username: username,
        isOnline: isOnline,
      });

      usernamesToWs.forEach((clientWs, _) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(statusMessage);
        }
      });
    }

    async function sendCurrentUsersStatus(ws) {
      const allUsers = await User.find({ isOnline: true }); // Получаем всех онлайн пользователей из БД
      allUsers.forEach((user) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "userStatusChanged",
              username: user.username,
              isOnline: true,
            })
          );
        }
      });
    }
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};
start();
