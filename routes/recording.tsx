import { Head } from "$fresh/runtime.ts";
import RecordingIsland from "../islands/Recording.tsx";

const Recording = () => {
  return (
    <>
      <Head>
        <title>録画一覧</title>
      </Head>
      <RecordingIsland />
    </>
  );
};

export default Recording;
