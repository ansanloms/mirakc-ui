import type { components } from "../../../lib/api/schema.d.ts";
import { genreOf, genreVars } from "../../../lib/genre.ts";
import { t } from "../../../locales/i18n.ts";
import ChannelBadge from "../../atoms/ChannelBadge.tsx";
import { formatHm } from "../../../lib/datetime.ts";
import styles from "./ChannelRow.module.css";

type Service = components["schemas"]["MirakurunService"];
type Program = components["schemas"]["MirakurunProgram"];

type Props = {
  /** サービス (チャンネル)。 */
  service: Service;
  /** 放送中の番組。 */
  program?: Program;
  /** 次の番組 (あれば「次: …」を出す)。 */
  nextProgram?: Program;
  /** 放送経過割合 (0..1)。 */
  progress: number;
  /** 視聴中か。 */
  active: boolean;
  /** 行クリックでこのチャンネルを選択する。 */
  onSelect: () => void;
};

/**
 * 番組選択タブの 1 行。左にサムネ (ジャンル hue 由来のグラデ・ch バッジ・
 * 進行バー・視聴中イコライザ)、右にチャンネル名/番組タイトル/ジャンル・時刻。
 */
export default function ChannelRow(props: Props) {
  // 放送中番組が無い行は描画しない。
  if (!props.program) {
    return null;
  }

  const program = props.program;
  const genre = genreOf(program);
  const vars = genreVars(genre.key);
  const frac = Math.max(0, Math.min(1, props.progress));

  // ジャンル strong 色を背景色に向けて暗く合成したサムネ用グラデ。
  const thumbBackground =
    `linear-gradient(135deg, color-mix(in srgb, ${vars.strong} 70%, var(--color-bg)), color-mix(in srgb, ${vars.strong} 28%, var(--color-bg)))`;

  return (
    <button
      type="button"
      className={`${styles.row} ${props.active ? styles.active : ""}`}
      onClick={props.onSelect}
    >
      <span className={styles.thumb} style={{ background: thumbBackground }}>
        <ChannelBadge service={props.service} size="xs" />
        {props.active && (
          <span className={styles.playing}>
            <span className={styles.eq}>
              <i></i>
              <i></i>
              <i></i>
            </span>
          </span>
        )}
        <span
          className={styles.progress}
          style={{ width: `${frac * 100}%`, background: vars.strong }}
        />
      </span>
      <span className={styles.info}>
        <span className={styles.name}>{props.service.name}</span>
        <span className={styles.title}>{program.name ?? ""}</span>
        <span className={styles.meta}>
          <span className={styles.dot} style={{ background: vars.strong }} />
          {genre.label}
          {"　"}
          {formatHm(program.startAt)}–{formatHm(
            program.startAt + program.duration,
          )}
        </span>
        {props.nextProgram && (
          <span className={styles.next}>
            {t("watch.select.next", { title: props.nextProgram.name ?? "" })}
          </span>
        )}
      </span>
    </button>
  );
}
