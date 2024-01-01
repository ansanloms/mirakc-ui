import { t } from "../../locales/i18n.ts";
import Icon from "../atoms/Icon.tsx";

const menuList = [
  {
    path: "/program",
    icon: "event",
    title: t("program.title"),
  },
  {
    path: "/recording",
    icon: "settings_cinematic_blur",
    title: t("recording.title"),
  },
] as const;

export default function Menu() {
  return (
    <ul class={["grid", "gap-y-8", "p-8"]}>
      {menuList.map((menu) => (
        <li>
          <a href={menu.path} class={["flex", "items-center", "gap-x-2"]}>
            <Icon>{menu.icon}</Icon>
            <p>{menu.title}</p>
          </a>
        </li>
      ))}
    </ul>
  );
}
