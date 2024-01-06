import type { ComponentProps } from "preact";
import Loading from "../molecules/Loading.tsx";

export default function Recording() {
  return (
    <div class={["container", "h-full", "mx-auto", "p-4"]}>
      <section class={["grid", "h-full", "place-content-center"]}>
        <Loading />
      </section>
    </div>
  );
}
