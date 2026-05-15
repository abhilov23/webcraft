import { caller } from '@/trpc/server';

const Page = async () => {
  const result = await caller.createAI({ text: "abhilov PREFETCH" });

  return <div>{JSON.stringify(result)}</div>;
};

export default Page;
