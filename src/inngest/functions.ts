// src/inngest/functions.ts
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "app/hello.world" }] },
  async ({ event, step }) => {
    const result = await step.run("handle-task", async () => {
      return { processed: true, id: event.data.id };
    });

    await step.sleep("wait-a-moment", "5s");

        await step.sleep("step 2", "5s");
    
        await step.sleep("step 3", "5s");


    return { message: `Task ${event.data.id} complete`, result };
  }
);
