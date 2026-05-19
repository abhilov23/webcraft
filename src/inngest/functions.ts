// src/inngest/functions.ts

import {Sandbox} from "@e2b/code-interpreter";
import { createAgent, openai } from "@inngest/agent-kit";
import { inngest } from "./client";
import { getSandbox } from "./utils";

export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    triggers: [{ event: "app/hello.world" }],
  },
  async ({ event, step }) => {

    const SandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("abhilov01/vibe-nextjs-test");
      return sandbox.sandboxId;
    });

    const codeAgent = createAgent({
      name: "code-agent",
      system:"you are a expert nextJS developer, You write readable, maintainable code. you write simple Nextjs and react snippet",
      model: openai({
        model: "llama-3.3-70b-versatile", // Groq model
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: "https://api.groq.com/openai/v1",
      })
    });

    const result = await codeAgent.run(
      `Write the following code snippet in nextjs: ${event.data.value}`
    );

    const sandboxUrl = await step.run("get-sandbox-url", async ()=>{
      const sandbox = await getSandbox(SandboxId);
      const host = sandbox.getHost(3000); // Assuming your Next.js app runs on port 3000
      return `https://${host}`;
    })

    return {
      message: result,
      sandboxUrl
    };
  }
);
