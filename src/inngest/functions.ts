// src/inngest/functions.ts
// abhilov01/vibe-nextjs-test-2


import { z } from "zod";
import { Sandbox } from "e2b";
import { createAgent, createNetwork, createTool, openai } from "@inngest/agent-kit";
import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";

export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    triggers: [{ event: "app/hello.world" }],
  },
  async ({ event, step }) => {
    const { sandboxId, sandboxUrl } = await step.run("create-sandbox", async () => {
      const sandbox = await Sandbox.create("vibe-nextjs-test-3", {
        timeoutMs: 60 * 5 * 1000,
      });
      return {
        sandboxId: sandbox.sandboxId,
        sandboxUrl: `https://${sandbox.getHost(3000)}`,
      };
    });

    const codeAgent = createAgent({
      name: "code-agent",
      system:
        "you are a expert nextJS developer, You write readable, maintainable code. you write simple Nextjs and react snippet",
   //   model: openai({
   //     model: "llama-3.3-70b-versatile", // Groq model
    //    apiKey: process.env.GROQ_API_KEY,
     //   baseUrl: "https://api.groq.com/openai/v1",
     //   defaultParameters: {
     //     temperature: 0.1,
     //   },
    //  model: openai({
    //  model: "gemini-2.0-flash",
    //  apiKey: process.env.GEMINI_API_KEY,
    //  baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    //   defaultParameters: {
    //     temperature: 0.1,
    //   },
    //   }),
  //   model: openai({
  // model: "qwen/qwen2.5-coder-7b-instruct:free",
  // apiKey: process.env.OPENROUTER_API_KEY,
  // baseUrl: "https://openrouter.ai/api/v1",
  // defaultParameters: {
  //   temperature: 0.1,
  // },
  // model: openai({
  // model: "llama-3.1-8b-instant",
  // apiKey: process.env.GROQ_API_KEY,
  // baseUrl: "https://api.groq.com/openai/v1",
  // defaultParameters: {
  //   temperature: 0.1,
  // },
 // model: openai({
 // model: "mistralai/mistral-medium-3.5-128b",
 // apiKey: process.env.NVIDIA_NIM_API_KEY,
 // baseUrl: "https://integrate.api.nvidia.com/v1",
 // defaultParameters: {
 //   temperature: 0.1,
 // },
 model: openai({
  model: "gemini-2.0-flash",
  apiKey: process.env.GEMINI_API_KEY,
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  defaultParameters: {
    temperature: 0.1,
  },
}),
      tools: [
        createTool({
          name: "terminal",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            if (!step) {
              return {
                stdout: "",
                stderr: "",
                error: "Step context is unavailable",
              };
            }

            return await step.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });

                return {
                  stdout: buffers.stdout,
                  stderr: buffers.stderr,
                };
              } catch (error) {
                return {
                  stdout: buffers.stdout,
                  stderr: buffers.stderr,
                  error: error instanceof Error ? error.message : "Unknown error",
                };
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async ({ files }, { step, network }) => {
            if (!step) return "Step context is unavailable";
            const newFiles = await step.run("createOrUpdateFiles", async () => {
              try {
                const updatedFiles = (network?.state?.data?.files ?? {}) as Record<string, string>;
                const sandbox = await getSandbox(sandboxId);

                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }
                return updatedFiles;
              } catch (error) {
                return "Error:" + error;
              }
            });
            if (typeof newFiles === "object" && network) {
              network.state.data.files = newFiles;
            }
            return newFiles;
          },
        }),
        createTool({
          name: "readFile",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            if (!step) return "Step context is unavailable";
            return await step.run("readFile", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];

                for (const filePath of files) {
                  const content = await sandbox.files.read(filePath);
                  contents.push({ path: filePath, content });
                }
                return JSON.stringify(contents);
              } catch (error) {
                return "Error:" + error;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText = lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<text_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }
          return result;
        },
      },
    });
     
    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 20,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if(summary){
          return;
        }
        return codeAgent;
      }
    })

    const result = await network.run(event.data.value);

    return {
      url : sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);
