import "dotenv/config";
import http from "node:http";
import { WebSocketServer } from "ws";
import path from "path";
import fs from "node:fs/promises";
import { redisPublish, redisSubscribe } from "./redis.js";

const port = process.env.PORT ?? 3000;
const redis_channel = 'ws-message';

const httpServer = http.createServer(async (req, res) => {
  if ((req.method === "GET" || req.method === "HEAD") && req.url === "/health") {
    res.writeHead(200, {
      "content-type": "application/json",
    })

    return req.method === "HEAD" ? res.end() : res.end(JSON.stringify({ status: 'OK' }))
  }

  const index = await fs.readFile(path.resolve("./index.html"), "utf-8");
  res.setHeader("Content-Type", "text/html");
  return res.end(index);
});

const webSocket = new WebSocketServer({ server: httpServer });

redisSubscribe.subscribe(redis_channel);
redisSubscribe.on('message', (channel, message) => {
  if (channel === redis_channel) {
    webSocket.clients.forEach((client) => {
      client.send(message.toString())
    })
  }
})

webSocket.on("connection", (websocket) => {
  console.log("WebSocket connection...");

  websocket.on("message", async (data) => {
    console.log("websocket message:", data.toString());
    await redisPublish.publish(redis_channel, data.toString());
  });
});

httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
