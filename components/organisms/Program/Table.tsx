import * as datetime from "@std/datetime";
import type { components } from "../../../hooks/api/schema.d.ts";
import ProgramItem from "../../molecules/Program/Item.tsx";
import styles from "./Table.module.css";

type Props = {
  /**
   * 配局一覧。
   */
  services: (components["schemas"]["MirakurunService"])[];

  /**
   * 番組一覧。
   */
  programs: (components["schemas"]["MirakurunProgram"])[];

  /**
   * 録画予約一覧。
   */
  recordingSchedules: (components["schemas"]["WebRecordingSchedule"])[];

  /**
   * 表示開始日時。
   */
  displayFrom: Date;

  /**
   * 表示終了日時。
   */
  displayTo: Date;

  /**
   * 番組を選択する。
   */
  setProgram: (
    program: components["schemas"]["MirakurunProgram"] | undefined,
  ) => void;
};

const genres = {
  news: 0,
  sports: 1,
  wideshow: 2,
  drama: 3,
  music: 4,
  variety: 5,
  movie: 6,
  anime: 7,
  documentary: 8,
  performance: 9,
  education: 10,
  welfare: 11,
  reserve1: 12,
  reserve2: 13,
  expansion: 14,
  other: 15,
} as const;

const genreColorMap: Record<number, { bg: string; border: string }> = {
  [genres.news]: { bg: "#f87171", border: "#fecaca" },
  [genres.sports]: { bg: "#fb923c", border: "#fed7aa" },
  [genres.wideshow]: { bg: "#fbbf24", border: "#fde68a" },
  [genres.drama]: { bg: "#facc15", border: "#fef08a" },
  [genres.music]: { bg: "#a3e635", border: "#d9f99d" },
  [genres.variety]: { bg: "#4ade80", border: "#bbf7d0" },
  [genres.movie]: { bg: "#34d399", border: "#a7f3d0" },
  [genres.anime]: { bg: "#2dd4bf", border: "#99f6e4" },
  [genres.documentary]: { bg: "#22d3ee", border: "#a5f3fc" },
  [genres.performance]: { bg: "#38bdf8", border: "#bae6fd" },
  [genres.education]: { bg: "#60a5fa", border: "#bfdbfe" },
  [genres.welfare]: { bg: "#818cf8", border: "#c7d2fe" },
  [genres.reserve1]: { bg: "#9ca3af", border: "#e5e7eb" },
  [genres.reserve2]: { bg: "#9ca3af", border: "#e5e7eb" },
  [genres.expansion]: { bg: "#9ca3af", border: "#e5e7eb" },
  [genres.other]: { bg: "#9ca3af", border: "#e5e7eb" },
};

export default function ProgramTable(props: Props) {
  const hourCount = (props.displayTo.getTime() - props.displayFrom.getTime()) /
    (60 * 60 * 1000);

  const programs = props.programs.filter((program) => {
    if (!program.name) {
      return false;
    }

    const startAt = new Date(program.startAt);
    const endAt = new Date(program.startAt + program.duration);

    return ((startAt > props.displayFrom && startAt < props.displayTo) ||
      (endAt > props.displayFrom && endAt < props.displayTo));
  });

  const services = props.services.filter((service) =>
    programs.some((program) => program.serviceId === service.serviceId)
  );

  return (
    <div class={styles.grid}>
      {programs.map((program) => {
        const startAt = new Date(program.startAt);
        const endAt = new Date(program.startAt + program.duration);

        const start = (startAt.getTime() - props.displayFrom.getTime()) /
          (60 * 1000);
        const end = (endAt.getTime() - props.displayFrom.getTime()) /
          (60 * 1000);

        const minStart = 0;
        const maxEnd = 60 * hourCount;

        const serviceIndex = services.findIndex((service) =>
          service.serviceId === program.serviceId
        );

        const genreId = (program.genres?.find((genre) =>
          Object.values(genres).map((v) => Number(v)).includes(genre.lv1)
        )?.lv1) ?? genres.other;

        const colors = genreColorMap[genreId] ?? genreColorMap[genres.other];

        const recordingSchedule = props.recordingSchedules.find(
          (recordingSchedule) =>
            recordingSchedule.program.id === program.id,
        );

        return (
          <div
            class={styles.programCell}
            data-recording={recordingSchedule ? "true" : undefined}
            style={{
              "--genre-bg": colors.bg,
              "--genre-border": colors.border,
              gridRowStart: (start >= minStart ? start : minStart) + 2,
              gridRowEnd: (end <= maxEnd ? end : maxEnd) + 2,
              gridColumnStart: serviceIndex + 2,
              gridColumnEnd: serviceIndex + 3,
            }}
            onClick={() => props.setProgram(program)}
          >
            <div class={styles.programContent}>
              <ProgramItem program={program} />
            </div>
          </div>
        );
      })}

      {services.map((service, index) => (
        <div
          class={styles.serviceHeader}
          style={{
            gridColumnStart: index + 2,
            gridColumnEnd: index + 3,
          }}
        >
          {service.name}
        </div>
      ))}

      {[...Array(hourCount)].map((_, i) => i).map((hour) => {
        const date = new Date(
          props.displayFrom.getTime() + hour * 60 * 60 * 1000,
        );

        return (
          <div
            class={styles.timeCell}
            style={{
              gridRow: `${(hour * 60) + 2} / ${((hour + 1) * 60) + 2}`,
            }}
          >
            <div class={styles.timeContent}>
              <p>{datetime.format(date, "M/d")}</p>
              <p>{datetime.format(date, "H:00")}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
