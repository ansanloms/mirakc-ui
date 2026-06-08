import type { components } from "../../../lib/api/schema.d.ts";
import { genreOf } from "../../../lib/genre.ts";
import { t } from "../../../locales/i18n.ts";
import GenreTag from "../../atoms/GenreTag.tsx";
import StatusBadge from "../../atoms/StatusBadge.tsx";
import ChannelBadge from "../../atoms/ChannelBadge.tsx";
import Icon from "../../atoms/Icon.tsx";
import ProgramExtended from "../../molecules/Program/Extended.tsx";
import * as datetime from "@std/datetime";
import styles from "./InfoTab.module.css";

type Service = components["schemas"]["MirakurunService"];
type Program = components["schemas"]["MirakurunProgram"];

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  /** 番組。 */
  program: Program;
  /** サービス (チャンネル)。 */
  service: Service;
};

/** 番組情報タブ。タグ・タイトル・メタ・番組内容・詳細情報。 */
export default function InfoTab({ program, service }: Props) {
  const genre = genreOf(program);
  const startAt = new Date(program.startAt);
  const endAt = new Date(program.startAt + program.duration);
  const durationMin = Math.round(program.duration / 60000);
  const dateLabel = `${datetime.format(startAt, "M/d")}(${
    WEEKDAYS[startAt.getDay()]
  })`;

  return (
    <div className={styles.tab}>
      <div className={styles.tags}>
        <GenreTag genreKey={genre.key} label={genre.label} />
        <StatusBadge kind="live" />
      </div>
      <h2 className={styles.title}>{program.name ?? ""}</h2>
      <div className={styles.meta}>
        <div className={styles.row}>
          <ChannelBadge service={service} size="sm" />
          <span className={styles.ch}>{service.name}</span>
        </div>
        <div className={styles.row}>
          <Icon size={17}>schedule</Icon>
          <span>
            {dateLabel}
            {datetime.format(startAt, "H:mm")} –{" "}
            {datetime.format(endAt, "H:mm")}
          </span>
          <span className={styles.duration}>{durationMin}分</span>
        </div>
      </div>
      <div className={styles.section}>
        <h3 className={styles.heading}>{t("watch.info.content")}</h3>
        <p className={styles.paragraph}>{program.description ?? ""}</p>
      </div>
      <div className={styles.section}>
        <h3 className={styles.heading}>{t("watch.info.extended")}</h3>
        <ProgramExtended program={program} />
      </div>
    </div>
  );
}
