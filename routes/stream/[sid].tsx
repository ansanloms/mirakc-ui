import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import StreamTemplate from "../../islands/Stream.tsx";

const Stream = ({ params }: PageProps) => {
  const { sid } = params;

  return (
    <>
      <Head>
        <title>視聴</title>
      </Head>
      <StreamTemplate serviceId={Number(sid)} />
    </>
  );
};

export default Stream;
