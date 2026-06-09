import { useMemo } from "react";

import type { components } from "../../../lib/api/schema.d.ts";
import { genreOf } from "../../../lib/genre.ts";
import { extractProgramMarks } from "../../../lib/program-status.ts";
import { t } from "../../../locales/i18n.ts";
import GenreTag from "../../atoms/GenreTag.tsx";
import ProgramMarks from "../../atoms/ProgramMarks.tsx";
import ChannelBadge from "../../atoms/ChannelBadge.tsx";
import Icon from "../../atoms/Icon.tsx";
import ProgramExtended from "../../molecules/Program/Extended.tsx";
import { formatHm, formatMd, formatWeekday } from "../../../lib/datetime.ts";
import styles from "./InfoTab.module.css";

type Service = components["schemas"]["MirakurunService"];
type Program = components["schemas"]["MirakurunProgram"];

type Props = {
  /** 番組。 */
  program: Program;
  /** サービス (チャンネル)。 */
  service: Service;
};

/** 番組情報タブ。タグ・タイトル・メタ・番組内容・詳細情報。 */
export default function InfoTab({ program, service }: Props) {
  const genre = genreOf(program);
  // program.name からステータス記号 ([字] 等) を抽出し、表示名から除去する。
  const { name: programName, marks } = useMemo(
    () => extractProgramMarks(program.name),
    [program.name],
  );
  const durationMin = Math.round(program.duration / 60000);
  const dateLabel = `${formatMd(program.startAt)}(${
    formatWeekday(program.startAt)
  })`;

  return (
    <div className={styles.tab}>
      <div className={styles.tags}>
        <GenreTag genreKey={genre.key} />
      </div>
      <h2 className={styles.title}>
        {programName}
        <ProgramMarks marks={marks} variant="title" />
      </h2>
      <div className={styles.meta}>
        <div className={styles.row}>
          <ChannelBadge service={service} size="sm" />
          <span className={styles.ch}>{service.name}</span>
        </div>
        <div className={styles.row}>
          <Icon size={17}>schedule</Icon>
          <span>
            {dateLabel}
            {formatHm(program.startAt)} –{" "}
            {formatHm(program.startAt + program.duration)}
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
