import { define } from "../utils.ts";
import BaseTemplate from "../components/templates/Base.tsx";

export default define.page(function App({ Component }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          // deno-lint-ignore react-no-danger
          dangerouslySetInnerHTML={{
            __html: `window._basePath = "${Deno.env.get("BASE_PATH") || ""}";`,
          }}
        />
      </head>
      <body>
        <BaseTemplate>
          <Component />
        </BaseTemplate>
      </body>
    </html>
  );
});
