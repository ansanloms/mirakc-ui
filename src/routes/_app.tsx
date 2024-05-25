import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import BaseTemplate from "../components/templates/Base.tsx";

export default function App({ Component }: PageProps) {
  return (
    <>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window._basePath = "${Deno.env.get("BASE_PATH")}";`,
          }}
        />

        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        />
        <script
          src={`${Deno.env.get("BASE_PATH") || ""}/service-worker-register.js`}
        />
      </Head>
      <BaseTemplate>
        <Component />
      </BaseTemplate>
    </>
  );
}
