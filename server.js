import http from "node:http";
import { WebSocketServer } from "ws";
import path from "path";
import fs from "node:fs/promises";

const port = process.env.PORT ?? 3000;

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

webSocket.on("connection", (websocket) => {
  console.log("WebSocket connection...");

  websocket.on("message", (data) => {
    console.log("websocket message:", data.toString());
    webSocket.clients.forEach((client) => {
      client.send(data.toString());
    });
  });
});

httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
