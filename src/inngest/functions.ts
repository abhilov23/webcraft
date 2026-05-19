// src/inngest/functions.ts
// abhilov01/vibe-nextjs-test-2



import { Sandbox } from "e2b";
import { createAgent, openai } from "@inngest/agent-kit";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    triggers: [{ event: "app/hello.world" }],
  },
  async ({ event, step }) => {
    const { sandboxUrl } = await step.run("create-sandbox", async () => {
      const sandbox = await Sandbox.create("vibe-nextjs-test-3", {
        timeoutMs: 60 * 60 * 1000,
      });
      return {
        sandboxId: sandbox.sandboxId,
        sandboxUrl: `https://${sandbox.getHost(3000)}`,
      };
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


    return {
      message: result,
      sandboxUrl
    };
  }
);
