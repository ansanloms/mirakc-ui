import { Link } from "@tanstack/react-router";
import type { components } from "../../../lib/api/schema.d.ts";
import type { GenreKey } from "../../../lib/genre.ts";
import { genreOf } from "../../../lib/genre.ts";
import { formatH, formatHm, nowEpochMs } from "../../../lib/datetime.ts";
import { recordingStatusKind } from "../../../lib/schedule.ts";
import ChannelBadge from "../../atoms/ChannelBadge.tsx";
import ProgramItem from "../../molecules/Program/Item.tsx";
import styles from "./Table.module.css";

type Props = {
  /** 配局一覧 (band で絞り込み済み)。 */
  services: components["schemas"]["MirakurunService"][];

  /** 番組一覧。 */
  programs: components["schemas"]["MirakurunProgram"][];

  /** 録画予約一覧。 */
  recordingSchedules: components["schemas"]["WebRecordingSchedule"][];

  /** 表示開始日時 (epoch ms)。 */
  displayFromMs: number;

  /** 表示終了日時 (epoch ms)。 */
  displayToMs: number;

  /** 番組を選択する。 */
  setProgram: (
    program: components["schemas"]["MirakurunProgram"] | undefined,
  ) => void;

  /** 現在時刻 (ms)。現在時刻ラインの位置に使う。テスト時に固定できるよう注入可能。 */
  now?: number;
};

const GENRE_CLASS: Record<GenreKey, string> = {
  news: styles.genreNews,
  sports: styles.genreSports,
  wideshow: styles.genreWideshow,
  drama: styles.genreDrama,
  music: styles.genreMusic,
  variety: styles.genreVariety,
  movie: styles.genreMovie,
  anime: styles.genreAnime,
  documentary: styles.genreDocumentary,
  performance: styles.genrePerformance,
  education: styles.genreEducation,
  welfare: styles.genreWelfare,
  other: styles.genreOther,
};

/** 時刻列の幅 (rem)。 */
const TIME_COL = 5.6;
/** サービス 1 列の幅 (rem)。 */
const SERVICE_COL = 17;

export default function ProgramTable(props: Props) {
  const fromMs = props.displayFromMs;
  const toMs = props.displayToMs;
  const hourCount = (toMs - fromMs) / (60 * 60 * 1000);
  const maxEnd = 60 * hourCount;

  const programs = props.programs.filter((program) => {
    if (!program.name) {
      return false;
    }
    const startAt = program.startAt;
    const endAt = program.startAt + program.duration;
    return (startAt > fromMs && startAt < toMs) ||
      (endAt > fromMs && endAt < toMs);
  });

  const services = props.services.filter((service) =>
    programs.some((program) => program.serviceId === service.serviceId)
  );

  const now = props.now ?? nowEpochMs();
  const showNow = fromMs <= now && now < toMs;
  const nowRow = Math.round((now - fromMs) / (60 * 1000)) + 2;

  return (
    <div className={styles.scroll}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `${TIME_COL}rem repeat(${
            Math.max(services.length, 1)
          }, ${SERVICE_COL}rem)`,
        }}
      >
        <div className={styles.cornerHead}>
          {formatH(fromMs)}時
        </div>

        {services.map((service, index) => (
          <Link
            key={service.id}
            to="/watch/$serviceId"
            params={{ serviceId: String(service.id) }}
            search={{ audioTrack: 0, quality: "720p", caption: true }}
            state={{ selected: true }}
            className={styles.serviceHeader}
            style={{ gridColumn: `${index + 2} / ${index + 3}` }}
          >
            <ChannelBadge service={service} size="sm" />
            <span className={styles.serviceHeaderName}>{service.name}</span>
          </Link>
        ))}

        {[...Array(hourCount)].map((_, hour) => {
          const hourMs = fromMs + hour * 60 * 60 * 1000;
          return (
            <div
              key={hour}
              className={styles.timeCell}
              style={{ gridRow: `${hour * 60 + 2} / ${(hour + 1) * 60 + 2}` }}
            >
              <span className={styles.timeNum}>
                {formatH(hourMs)}
              </span>
            </div>
          );
        })}

        {programs.map((program) => {
          const start = (program.startAt - fromMs) / (60 * 1000);
          const end = (program.startAt + program.duration - fromMs) /
            (60 * 1000);
          const serviceIndex = services.findIndex((service) =>
            service.serviceId === program.serviceId
          );
          if (serviceIndex < 0) {
            return null;
          }

          const { key } = genreOf(program);
          const schedule = props.recordingSchedules.find(
            (recordingSchedule) => recordingSchedule.program.id === program.id,
          );
          const mark = schedule
            ? recordingStatusKind(schedule.state)
            : undefined;

          return (
            <div
              key={program.id}
              className={`${styles.programCell} ${GENRE_CLASS[key]}`}
              data-mark={mark}
              style={{
                gridRowStart: Math.max(start, 0) + 2,
                gridRowEnd: Math.min(end, maxEnd) + 2,
                gridColumn: `${serviceIndex + 2} / ${serviceIndex + 3}`,
              }}
              role="button"
              tabIndex={0}
              onClick={() => props.setProgram(program)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  props.setProgram(program);
                }
              }}
            >
              <ProgramItem
                program={program}
                state={schedule?.state}
                now={now}
              />
            </div>
          );
        })}

        {showNow && (
          <>
            <div
              className={styles.nowChip}
              style={{
                gridColumn: "1 / 2",
                gridRow: `${nowRow} / ${nowRow + 1}`,
              }}
            >
              {formatHm(now)}
            </div>
            <div
              className={styles.nowLine}
              style={{
                gridColumn: "2 / -1",
                gridRow: `${nowRow} / ${nowRow + 1}`,
              }}
              aria-hidden="true"
            />
          </>
        )}
      </div>
    </div>
  );
}
