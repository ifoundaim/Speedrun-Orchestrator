import { type XmcpConfig } from "xmcp";

const HTTP_PORT = Number(process.env.PORT ?? 3333);
const HTTP_HOST = process.env.HOST ?? "127.0.0.1";
const HTTP_ENDPOINT = process.env.HTTP_ENDPOINT ?? "/mcp";

const config: XmcpConfig = {
  http: {
    port: HTTP_PORT,
    host: HTTP_HOST,
    endpoint: HTTP_ENDPOINT,
  },
  stdio: false,
  paths: {
    tools: "./src/tools",
    prompts: "./src/prompts",
    resources: "./src/resources",
  },
};

export default config;
