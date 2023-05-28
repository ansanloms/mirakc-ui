import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import BaseTemplate from "../components/templates/Base.tsx";

export default function App({ Component }: AppProps) {
  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        />
      </Head>
      <BaseTemplate>
        <Component />
      </BaseTemplate>
    </>
  );
}
