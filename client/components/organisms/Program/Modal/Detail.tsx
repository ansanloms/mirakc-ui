import * as datetime from "@std/datetime";

import type { components } from "../../../../lib/api/schema.d.ts";
import Modal from "../../../atoms/Modal.tsx";
import Icon from "../../../atoms/Icon.tsx";
import ChannelBadge from "../../../atoms/ChannelBadge.tsx";
import GenreTag from "../../../atoms/GenreTag.tsx";
import StatusBadge from "../../../atoms/StatusBadge.tsx";
import ProgramExtended from "../../../molecules/Program/Extended.tsx";
import { genreOf, genreVars } from "../../../../lib/genre.ts";
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
};

export default function ProgramModalDetail(props: Props) {
  const { program } = props;
  const genre = program ? genreOf(program) : undefined;
  const isFinished = props.recordingSchedule?.state === "finished";
  const hasExtended = program &&
    Object.keys(program.extended ?? {}).length > 0;

  const start = program ? new Date(program.startAt) : undefined;
  const end = program
    ? new Date(program.startAt + program.duration)
    : undefined;
  const durationMin = program ? Math.round(program.duration / 60000) : 0;

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
              <GenreTag genreKey={genre.key} label={genre.label} />
              {isFinished && <StatusBadge kind="recorded" />}
            </div>

            <h2 className={styles.title}>{program.name}</h2>

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
                  {start && end &&
                    `${datetime.format(start, "M/d H:mm")} – ${
                      datetime.format(end, "H:mm")
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
            {isFinished
              ? <StatusBadge kind="recorded" />
              : props.recordingSchedule
              ? (
                <button
                  type="button"
                  className={`${styles.recBtn} ${styles.recBtnCancel}`}
                  onClick={handleCancel}
                  disabled={props.loading}
                >
                  <Icon size={18}>close</Icon>
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
                  <span className={styles.recDot} />
                  {t("program.detail.reserve")}
                </button>
              )}
            <button
              type="button"
              className={styles.ghostBtn}
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
