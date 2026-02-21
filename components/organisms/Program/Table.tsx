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

const genreClassMap: Record<number, string> = {
  [genres.news]: styles.genreNews,
  [genres.sports]: styles.genreSports,
  [genres.wideshow]: styles.genreWideshow,
  [genres.drama]: styles.genreDrama,
  [genres.music]: styles.genreMusic,
  [genres.variety]: styles.genreVariety,
  [genres.movie]: styles.genreMovie,
  [genres.anime]: styles.genreAnime,
  [genres.documentary]: styles.genreDocumentary,
  [genres.performance]: styles.genrePerformance,
  [genres.education]: styles.genreEducation,
  [genres.welfare]: styles.genreWelfare,
  [genres.reserve1]: styles.genreOther,
  [genres.reserve2]: styles.genreOther,
  [genres.expansion]: styles.genreOther,
  [genres.other]: styles.genreOther,
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

        const genreClass = genreClassMap[genreId] ??
          genreClassMap[genres.other];

        const recordingSchedule = props.recordingSchedules.find(
          (recordingSchedule) =>
            recordingSchedule.program.id === program.id,
        );

        return (
          <div
            class={`${styles.programCell} ${genreClass}`}
            data-recording={recordingSchedule ? "true" : undefined}
            style={{
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
