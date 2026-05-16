// src/inngest/functions.ts

import { createAgent, openai } from "@inngest/agent-kit";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    triggers: [{ event: "app/hello.world" }],
  },
  async ({ event, step }) => {

    const summarizer = createAgent({
      name: "summarizer",
      system:"you are a expert summarizer, You summarize in 2 words",
      model: openai({
        model: "llama-3.3-70b-versatile", // Groq model
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: "https://api.groq.com/openai/v1",
      })
    });

    const result = await summarizer.run(
      `Summarize the following test: ${event.data.value}`
    );

    await step.sleep("wait-a-moment", "5s");

    console.log(result.output);

    return {
      message: result.output,
    };
  }
);