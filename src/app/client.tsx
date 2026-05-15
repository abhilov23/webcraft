"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Client = ()=>{
    const trpc = useTRPC()
    const {data} = useSuspenseQuery({
        queryKey: ['hello'],
        queryFn: () => trpc.createAI.queryOptions({text: 'hello'})
    })
    return (
        <div>
            <p>{JSON.stringify(data)}</p>
        </div>
    )
}