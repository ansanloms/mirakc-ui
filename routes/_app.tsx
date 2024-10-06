import { type PageProps } from "$fresh/server.ts";
import BaseTemplate from "../components/templates/Base.tsx";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/styles.css" />
        <script
          src={`${Deno.env.get("BASE_PATH") || ""}/service-worker-register.js`}
        />
      </head>
      <body>
        <BaseTemplate>
          <Component />
        </BaseTemplate>
      </body>
    </html>
  );
}
