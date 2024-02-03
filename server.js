const express = require("express");
const { MongoClient } = require("mongodb");
const WebSocket = require("ws");
const http = require("http");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const activeUsers = new Set();

const mongoUrl = "mongodb://localhost:27017/";
const mongoClient = new MongoClient(mongoUrl);

let db;

// Подключаемся к MongoDB
async function connectDb() {
  await mongoClient.connect();
  db = mongoClient.db("chat");
  console.log("Connected to MongoDB");
}
connectDb();

// Регистрация пользователя
app.use(express.json());
app.use(express.static("public"));

app.post("/register", async (req, res) => {
  const { username } = req.body;
  const usersCollection = db.collection("users");

  // Проверка на существование пользователя
  const userExists = await usersCollection.findOne({ username: username });
  if (userExists) {
    return res.status(404).send("User already exists");
  }

  // Если пользователь не найден, продолжаем регистрацию
  await usersCollection.insertOne({ username });
  res.status(201).send("User registered " + username);
});

app.post("/login", async (req, res) => {
  const { username } = req.body;
  const usersCollection = db.collection("users");

  const userExists = await usersCollection.findOne({ username: username });
  if (!userExists) {
    return res.status(401).send("User not found");
  }

  if (activeUsers.has(username)) {
    return res.status(402).send("User already logged in");
  }

  activeUsers.add(username); // Добавляем пользователя в активные сессии
  res.status(200).json({ message: "User logged in", username });
});

// Добавляем эндпоинт для выхода пользователя
app.post("/logout", (req, res) => {
  const { username } = req.body;
  if (activeUsers.has(username)) {
    activeUsers.delete(username);
    res.status(200).send("Logged out successfully");
  } else {
    res.status(404).send("User not found");
  }
});

app.post("/history", async (req, res) => {
  const messagesCollection = db.collection("messages");
  try {
    // Извлекаем все сообщения из базы данных
    const messages = await messagesCollection.find({}).toArray();
    // Отправляем все сохраненные сообщения в ответе на запрос
    res.status(200).json(messages);
  } catch (error) {
    console.error("Ошибка при извлечении сообщений из базы данных:", error);
    res.status(500).send("Internal Server Error");
  }
});

// WebSocket для обмена сообщениями
wss.on("connection", async (ws) => {
  ws.on("message", async (data) => {
    const clientData = JSON.parse(data);

    // Исправлено: Вставляем новое сообщение в базу данных с корректной структурой
    await messagesCollection.insertOne({
      username: clientData.username,
      message: clientData.message,
    });

    // Исправлено: Отправляем новое сообщение всем подключенным клиентам
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(clientData));
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
