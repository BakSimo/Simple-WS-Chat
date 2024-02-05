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
let currentUsername = null;

async function connectDb() {
  await mongoClient.connect();
  db = mongoClient.db("chat");
  console.log("Connected to MongoDB");
}
connectDb();

app.use(express.json());
app.use(express.static("public"));

app.post("/register", async (req, res) => {
  const { username } = req.body;
  const usersCollection = db.collection("users");

  const userExists = await usersCollection.findOne({ username: username });
  if (userExists) {
    return res.status(404).send("User is already registered!");
  }

  await usersCollection.insertOne({ username });
  res.status(201).send("User registered " + username);
});

app.post("/login", async (req, res) => {
  const { username } = req.body;
  const usersCollection = db.collection("users");
  currentUsername = username;

  const userExists = await usersCollection.findOne({ username: username });
  if (!userExists) {
    return res.status(401).send("User not found");
  }

  if (activeUsers.has(username)) {
    return res.status(402).send("User already logged in");
  }

  res.status(200).json({ message: "User logged in", username });
});

app.post("/logout", (req, res) => {
  const { username } = req.body;
  currentUsername = null;

  if (activeUsers.has(username)) {
    activeUsers.delete(username);
    res.status(200).send("Logged out successfully");
  } else {
    res.status(404).send("User not found");
  }
});

app.post("/history", async (req, res) => {
  const messagesCollection = db.collection("messages");
  const { sender, to } = req.body;

  try {
    const messages = await messagesCollection
      .find({
        $or: [
          { $and: [{ sender: sender }, { to: to }] },
          { $and: [{ sender: to }, { to: sender }] },
        ],
      })
      .toArray();
    res.status(200).json(messages);
  } catch (error) {
    console.error("Ошибка при извлечении сообщений из базы данных:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/users_list", async (req, res) => {
  const usersCollection = db.collection("users");
  try {
    const users = await usersCollection.find({}).toArray();
    res.status(200).json(users);
  } catch (error) {
    console.error("Ошибка при извлечении пользователей из базы данных:", error);
    res.status(500).send("Internal Server Error");
  }
});

wss.on("connection", async (ws) => {
  const messagesCollection = db.collection("messages");

  ws.on("message", async (data) => {
    const clientData = JSON.parse(data);

    await messagesCollection.insertOne({
      to: clientData.to,
      sender: clientData.sender,
      username: clientData.username,
      message: clientData.message,
    });

    for (client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(clientData));
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
