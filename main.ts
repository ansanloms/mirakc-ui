import { App, staticFiles } from "fresh";
import { type State } from "./utils.ts";

export const app = new App<State>({
  basePath: Deno.env.get("BASE_PATH"),
});

app.use(staticFiles());

app.fsRoutes();
