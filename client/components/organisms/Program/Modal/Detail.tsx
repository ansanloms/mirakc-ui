import { useMemo } from "react";
import { Link } from "@tanstack/react-router";

import type { components } from "../../../../lib/api/schema.d.ts";
import Modal from "../../../atoms/Modal.tsx";
import Icon from "../../../atoms/Icon.tsx";
import ChannelBadge from "../../../atoms/ChannelBadge.tsx";
import GenreTag from "../../../atoms/GenreTag.tsx";
import RecordingStatusBadge from "../../../atoms/RecordingStatusBadge.tsx";
import ProgramMarks from "../../../atoms/ProgramMarks.tsx";
import ProgramExtended from "../../../molecules/Program/Extended.tsx";
import { genreOf, genreVars } from "../../../../lib/genre.ts";
import { extractProgramMarks } from "../../../../lib/program-status.ts";
import { formatHm, formatMdHm } from "../../../../lib/datetime.ts";
import { defaultWatchSearch } from "../../../../lib/watch-search.ts";
import { t } from "../../../../locales/i18n.ts";
import styles from "./Detail.module.css";

type Program = components["schemas"]["MirakurunProgram"];
type Service = components["schemas"]["MirakurunService"];
type Schedule = components["schemas"]["WebRecordingSchedule"];

type Props = {
  /** 番組。 */
  program?: Program;

  /** サービス (チャンネル)。 */
  service?: Service;

  /** 録画予約。 */
  recordingSchedule?: Schedule;

  /** 録画予約する。 */
  addRecordingSchedule: (program: Program) => void | Promise<void>;

  /** 録画予約を解除する。 */
  removeRecordingSchedule: (program: Program) => void | Promise<void>;

  /** 更新中。 */
  loading: boolean;

  /** 表示状況。 */
  open: boolean;

  /** モーダルを閉じる。 */
  onClose: () => void;

  /**
   * 現在時刻。放送状態 (未開始/放送中/終了) の判定に使う。component 内で時計を
   * 読まず、データ源 (route) が注入する。
   */
  currentDate: Temporal.ZonedDateTime;
};

export default function ProgramModalDetail(props: Props) {
  const { program } = props;
  // program.name からステータス記号 ([字] 等) を抽出し、表示名から除去する。
  const { name: programName, marks } = useMemo(
    () => extractProgramMarks(program?.name),
    [program?.name],
  );
  const genre = program ? genreOf(program) : undefined;
  const hasExtended = program &&
    Object.keys(program.extended ?? {}).length > 0;

  const durationMin = program ? Math.round(program.duration / 60000) : 0;

  // 放送状態。upcoming = 未開始 / airing = 放送中 / ended = 終了。
  // 録画予約は upcoming のときだけ、視聴は airing のときだけ可能。
  const now = props.currentDate.epochMilliseconds;
  const status: "upcoming" | "airing" | "ended" = !program
    ? "upcoming"
    : now < program.startAt
    ? "upcoming"
    : now < program.startAt + program.duration
    ? "airing"
    : "ended";
  const watchService = status === "airing" ? props.service : undefined;
  const hasPrimary = watchService !== undefined || status === "upcoming";

  const handleReserve = () => {
    if (props.loading || !program) {
      return;
    }
    props.addRecordingSchedule(program);
  };

  const handleCancel = () => {
    if (props.loading || !program) {
      return;
    }
    props.removeRecordingSchedule(program);
  };

  return (
    <Modal open={props.open} onClose={props.onClose} align="center">
      {program && genre && (
        <div className={styles.modal}>
          <div
            className={styles.accent}
            style={{ background: genreVars(genre.key).strong }}
          />
          <div className={styles.body}>
            <div className={styles.tags}>
              <GenreTag genreKey={genre.key} />
              {props.recordingSchedule && (
                <RecordingStatusBadge state={props.recordingSchedule.state} />
              )}
            </div>

            <h2 className={styles.title}>
              {programName}
              <ProgramMarks marks={marks} variant="title" />
            </h2>

            <div className={styles.meta}>
              <div className={styles.metaRow}>
                {props.service && (
                  <ChannelBadge service={props.service} size="sm" />
                )}
                {props.service && (
                  <span className={styles.metaCh}>{props.service.name}</span>
                )}
              </div>
              <div className={styles.metaRow}>
                <Icon size={17}>schedule</Icon>
                <span className={styles.metaTime}>
                  {program &&
                    `${formatMdHm(program.startAt)} – ${
                      formatHm(program.startAt + program.duration)
                    }`}
                </span>
                <span className={styles.metaDur}>
                  {t("program.duration", { min: durationMin })}
                </span>
              </div>
            </div>

            {program.description && (
              <div className={styles.section}>
                <h3 className={styles.sectionHead}>
                  {t("program.detail.content")}
                </h3>
                <p className={styles.sectionBody}>{program.description}</p>
              </div>
            )}

            {hasExtended && (
              <div className={styles.section}>
                <h3 className={styles.sectionHead}>
                  {t("program.detail.extended")}
                </h3>
                <ProgramExtended program={program} />
              </div>
            )}
          </div>

          <div className={styles.foot}>
            {watchService
              ? (
                // 放送中: 視聴ページへ。
                <Link
                  className={`${styles.recBtn} ${styles.recBtnWatch}`}
                  to="/watch/$serviceId"
                  params={{ serviceId: String(watchService.id) }}
                  search={defaultWatchSearch}
                  state={{ selected: true }}
                >
                  <Icon size={18}>play_arrow</Icon>
                  {t("program.detail.watch")}
                </Link>
              )
              : status === "upcoming"
              ? (
                // 未開始: 録画予約 / 解除。
                props.recordingSchedule
                  ? (
                    <button
                      type="button"
                      className={`${styles.recBtn} ${styles.recBtnCancel}`}
                      onClick={handleCancel}
                      disabled={props.loading}
                    >
                      {props.loading
                        ? <Icon size={18} spin>progress_activity</Icon>
                        : <Icon size={18}>close</Icon>}
                      {t("program.detail.cancelReserve")}
                    </button>
                  )
                  : (
                    <button
                      type="button"
                      className={styles.recBtn}
                      onClick={handleReserve}
                      disabled={props.loading}
                    >
                      {props.loading
                        ? <Icon size={18} spin>progress_activity</Icon>
                        : <span className={styles.recDot} />}
                      {t("program.detail.reserve")}
                    </button>
                  )
              )
              // 終了 (録画済でない): 操作ボタンなし。
              : null}
            <button
              type="button"
              className={`${styles.ghostBtn}${
                hasPrimary ? "" : ` ${styles.ghostBtnSolo}`
              }`}
              onClick={props.onClose}
            >
              {t("program.detail.close")}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
