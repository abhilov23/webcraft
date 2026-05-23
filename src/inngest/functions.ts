// src/inngest/functions.ts

import { z } from 'zod';
import { Sandbox } from 'e2b';
import {
  createAgent,
  createNetwork,
  createTool,
  openai,
  type Tool,
} from '@inngest/agent-kit';

import { inngest } from './client';
import { getSandbox, lastAssistantTextMessageContent } from './utils';

import { PROMPT } from '@/prompt';
import prisma from '@/lib/db';

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const codeAgentFunction = inngest.createFunction(
  {
    id: 'code-agent',
    triggers: [{ event: 'code-agent/run' }],
  },

  async ({ event, step }) => {
    const MAX_TERMINAL_CALLS = 6;
    const MAX_WRITE_CALLS = 8;
    const MAX_READ_CALLS = 12;
    let terminalCalls = 0;
    let writeCalls = 0;
    let readCalls = 0;
    let lastTerminalCommand = '';
    let repeatedTerminalCommandCount = 0;

    const { sandboxId, sandboxUrl } = await step.run(
      `create-sandbox-${event.id}`,
      async () => {
        const sandbox = await Sandbox.create('vibe-nextjs-test-6', {
          timeoutMs: 60 * 60 * 1000,
        });

        await sandbox.commands.run(
          'while ! curl -s http://localhost:3000 > /dev/null; do sleep 1; done',
          {
            timeoutMs: 60_000,
          }
        );

        console.log('CREATED SANDBOX:', sandbox.sandboxId);

        return {
          sandboxId: sandbox.sandboxId,

          sandboxUrl: `https://${sandbox.getHost(3000)}`,
        };
      }
    );

    const codeAgent = createAgent<AgentState>({
      name: 'code-agent',
      description: 'An expert coding agent',
      system: PROMPT,

      model: openai({
        model: 'gemini-3-flash-preview',

        apiKey: process.env.LINKAPI_KEY,

        baseUrl: 'https://api.linkapi.ai/v1/',

        defaultParameters: {
          temperature: 0.1,
        },
      }),

      tools: [
        createTool({
          name: 'terminal',

          parameters: z.object({
            command: z.string(),
          }),

          handler: async ({ command }, { step }) => {
            if (!step)
              return {
                error: 'Step unavailable',
              };

            terminalCalls += 1;
            if (terminalCalls > MAX_TERMINAL_CALLS) {
              return {
                stdout: '',
                stderr: '',
                error: `Terminal call budget exceeded (${MAX_TERMINAL_CALLS})`,
              };
            }

            if (lastTerminalCommand === command) {
              repeatedTerminalCommandCount += 1;
            } else {
              lastTerminalCommand = command;
              repeatedTerminalCommandCount = 1;
            }

            if (repeatedTerminalCommandCount > 2) {
              return {
                stdout: '',
                stderr: '',
                error:
                  'Repeated terminal command detected; stopping to prevent loops',
              };
            }

            console.log('TERMINAL USING:', sandboxId);

            return await step.run(`terminal-${Date.now()}`, async () => {
              const buffers = {
                stdout: '',
                stderr: '',
              };

              try {
                const sandbox = await getSandbox(sandboxId);

                await sandbox.commands.run(command, {
                  onStdout: (data) => {
                    buffers.stdout += data;
                  },

                  onStderr: (data) => {
                    buffers.stderr += data;
                  },
                });

                return buffers;
              } catch (error) {
                return {
                  ...buffers,

                  error: error instanceof Error ? error.message : 'Unknown',
                };
              }
            });
          },
        }),

        createTool({
          name: 'createOrUpdateFiles',

          description: 'Create or update files',

          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),

                content: z.string(),
              })
            ),
          }),

          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>
          ) => {
            if (!step) return 'No step';

            writeCalls += 1;
            if (writeCalls > MAX_WRITE_CALLS) {
              return `Write call budget exceeded (${MAX_WRITE_CALLS})`;
            }

            console.log('FILES USING:', sandboxId);

            return await step.run(`write-files-${Date.now()}`, async () => {
              try {
                const sandbox = await getSandbox(sandboxId);

                const updatedFiles = (network?.state?.data?.files ??
                  {}) as Record<string, string>;

                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);

                  updatedFiles[file.path] = file.content;
                }

                network!.state.data.files = updatedFiles;

                return updatedFiles;
              } catch (e) {
                return 'Error: ' + e;
              }
            });
          },
        }),

        createTool({
          name: 'readFile',

          parameters: z.object({
            files: z.array(z.string()),
          }),

          handler: async ({ files }, { step }) => {
            if (!step) return 'No step';

            readCalls += 1;
            if (readCalls > MAX_READ_CALLS) {
              return `Read call budget exceeded (${MAX_READ_CALLS})`;
            }

            console.log('READ USING:', sandboxId);

            return await step.run(`read-files-${Date.now()}`, async () => {
              try {
                const sandbox = await getSandbox(sandboxId);

                const contents = [];

                for (const filePath of files) {
                  const content = await sandbox.files.read(filePath);

                  contents.push({
                    path: filePath,
                    content,
                  });
                }

                return JSON.stringify(contents);
              } catch (e) {
                return 'Error: ' + e;
              }
            });
          },
        }),
      ],

      lifecycle: {
        onResponse: async ({ result, network }) => {
          const text = lastAssistantTextMessageContent(result);

          if (text && network) {
            if (text.includes('<task_summary>')) {
              network.state.data.summary = text;
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: 'coding-agent-network',

      agents: [codeAgent],

      maxIter: 6,

      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) return;

        const files = network.state.data.files as
          | Record<string, string>
          | undefined;

        if (
          files &&
          Object.keys(files).length > 0 &&
          terminalCalls >= MAX_TERMINAL_CALLS
        ) {
          return;
        }

        return codeAgent;
      },
    });

    const result = await network.run(event.data.value);

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files ?? {}).length === 0;

    await step.run('save-result', async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            content: `Something went wrong, please try again.`,
            role: 'ASSISTANT',
            type: 'RESULT',
          },
        });
      }

      return await prisma.message.create({
        data: {
          content: result.state.data.summary,
          role: 'ASSISTANT',
          type: 'RESULT',
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: 'Fragment',
              files: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,

      title: 'Fragment',

      files: result.state.data.files,

      summary: result.state.data.summary,
    };
  }
);
