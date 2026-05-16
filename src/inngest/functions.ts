// src/inngest/functions.ts

import { createAgent, openai } from "@inngest/agent-kit";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    triggers: [{ event: "app/hello.world" }],
  },
  async ({ event, step }) => {

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

    await step.sleep("wait-a-moment", "5s");

    console.log(result.output);

    return {
      message: result,
    };
  }
);