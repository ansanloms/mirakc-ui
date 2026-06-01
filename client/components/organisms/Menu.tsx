import { Link } from "@tanstack/react-router";
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
  // SPA 化に伴い <a href> を TanStack Router の <Link> に置換。フルリロードを避け、
  // defaultPreload:"intent" によりホバー時プリフェッチが効く。
  return (
    <ul className="menu-list">
      {menuList.map((menu) => (
        <li key={menu.path}>
          <Link to={menu.path} className="menu-link">
            <Icon>{menu.icon}</Icon>
            <p className="menu-link-text">{menu.title}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
