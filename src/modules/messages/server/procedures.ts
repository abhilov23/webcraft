import prisma from '@/lib/db';
import { inngest } from '@/inngest/client';
import { baseProcedure, createTRPCRouter } from '@/trpc/init';
import { TRPCError } from '@trpc/server';
import z from 'zod';

export const messagesRouter = createTRPCRouter({
    getMany: baseProcedure.query(async ()=>{
        const messages = await prisma.message.findMany({
            orderBy: {
                updatedAt: "asc"
            }
        });
        return messages;
    }),

    create: baseProcedure
        .input(
            z.object({
                value: z.string().min(1, {message: "message is required"})
            })
        ).mutation(async ({input})=>{
            let createdMessage;
            try {
                createdMessage = await prisma.message.create({
                    data:{
                        content: input.value,
                        role: "USER",
                        type: "RESULT"
                    }
                });
            } catch (error) {
                console.error("Failed to create message", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Could not create message",
                });
            }

            try {
                await inngest.send({
                    name: "app/hello.world",
                    data:{
                      value: input.value
                    }
                   });
            } catch (error) {
                console.error("Failed to dispatch app/hello.world event", error);
            }

               return createdMessage;
        })
});

