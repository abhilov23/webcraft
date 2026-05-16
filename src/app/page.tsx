"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const Page = () => {
  const trpc = useTRPC();

  const invoke = useMutation(
    trpc.invoke.mutationOptions({
      onSuccess: () => {
        toast.success("Background job invoked");
      },
      onError: () => {
        toast.error("Failed to invoke background job");
      },
    })
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Button
        disabled={invoke.isPending}
        onClick={() =>
          invoke.mutate({ text: "abhilov" })
        }
      >
        invoke background job
      </Button>
    </div>
  );
};

export default Page;
