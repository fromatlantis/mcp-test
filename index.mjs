import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0"
});

// ... set up server resources, tools, and prompts ...
server.tool(
    "fetch-weather",
    { city: z.string() },
    async ({ city }) => {
      // const response = await fetch(`https://api.weather.com/${city}`);
      // const data = await response.text();
      console.log('city2', city)
      return {
        content: [{ type: "text", text: `It's 90 degrees and sunny.` }]
      };
    }
);

const app = express();

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports = {};

app.get("/sse", async (_, res) => {

  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  // console.log('sse', transport)
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

app.listen(3001);