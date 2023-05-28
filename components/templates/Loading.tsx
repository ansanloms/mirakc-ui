import Icon from "../atoms/Icon.tsx";

export default function Loading() {
  return (
    <section
      class={[
        "grid",
        "justify-items-center",
        "items-center",
        "text-gray-200",
      ]}
    >
      <Icon spin={true} size={"16rem"}>
        refresh
      </Icon>
    </section>
  );
}
