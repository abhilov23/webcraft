'use client';

import { useTRPC } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const Page = () => {
  const [value, setValue] = useState('');

  const trpc = useTRPC();
  const { data: messages } = useQuery(trpc.messages.getMany.queryOptions());

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        toast.success('Message created');
      },
      onError: () => {
        toast.error('Failed to create message');
      },
    })
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button
        disabled={createMessage.isPending}
        onClick={() => createMessage.mutate({ value: value })}
      >
        create message
      </Button>
      {JSON.stringify(messages)}
    </div>
  );
};

export default Page;
