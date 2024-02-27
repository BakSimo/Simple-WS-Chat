const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const authRouter = require("./routers/authRouter");
const Message = require("./models/Message");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middlewares/errorMiddleware");

const { CLIENT_URL } = require("./config");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

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
      // Здесь может быть логика аутентификации перед тем как отдать chat.html
      res.sendFile(path.join(__dirname, "public", "chat.html"));
      break;
    default:
      // Если нет конкретного маршрута, перенаправляем на страницу входа или любую другую
      res.redirect("/login");
  }
});

const start = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://tigrankarapait:tikuliktikulik2501@cluster0.lvoxgij.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      // "mongodb://localhost:27017/",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    wss.on("connection", async (ws) => {
      ws.on("message", async (data) => {
        const clientData = JSON.parse(data);
        if (clientData.type === "typing") {
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
        } else {
          const message = new Message({
            to: clientData.to,
            sender: clientData.sender,
            message: clientData.message,
          });
          await message.save();

          for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(clientData));
            }
          }
        }
      });
    });

    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};
start();
