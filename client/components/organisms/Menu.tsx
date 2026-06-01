import { t } from "../../locales/i18n.ts";
import Icon from "../atoms/Icon.tsx";

const menuList = [
  {
    path: "/program",
    icon: "event",
    title: t("program.title"),
  },
  {
    path: "/watch",
    icon: "live_tv",
    title: t("watch.title"),
  },
  {
    path: "/search",
    icon: "search",
    title: t("search.title"),
  },
  {
    path: "/recording",
    icon: "settings_cinematic_blur",
    title: t("recording.title"),
  },
] as const;

export default function Menu() {
  return (
    <ul className="menu-list">
      {menuList.map((menu) => (
        <li>
          <a href={menu.path} className="menu-link">
            <Icon>{menu.icon}</Icon>
            <p className="menu-link-text">{menu.title}</p>
          </a>
        </li>
      ))}
    </ul>
  );
}
