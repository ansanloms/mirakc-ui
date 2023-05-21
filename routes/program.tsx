import { Head } from "$fresh/runtime.ts";
import ProgramIsland from "../islands/Program.tsx";

export default function Program() {
  return (
    <>
      <Head>
        <title>番組表</title>
      </Head>
      <ProgramIsland />
    </>
  );
}
