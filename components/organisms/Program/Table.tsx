import { css } from "twind/css";
import * as datetime from "$std/datetime/mod.ts";
import type { components } from "../../../hooks/api/schema.d.ts";
import ProgramItem from "../../molecules/Program/Item.tsx";

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

const style = {
  container: css`
display: grid;
width: 100%;
height: 100%;
overflow: scroll;
`,
  head: css`
min-width: 12rem;
height: 4rem;
grid-row: 1 / 2;
position: sticky;
top: 0;
display: flex;
align-items: center;
justify-content: center;
`,
  item: css`
cursor: pointer;
> div {
  padding: 0.8rem;
  position: sticky;
  top: 4rem;
}
`,
  hour: css`
grid-column: 1 / 2;
position: sticky;
left: 0;
text-align: right;

> div {
  padding: 0.8rem;
  position: sticky;
  top: 4rem;
}
`,
};

const genres = {
  news: 0, // ニュース・報道
  sports: 1, // スポーツ
  wideshow: 2, // 情報・ワイドショー
  drama: 3, // ドラマ
  music: 4, // 音楽
  variety: 5, // バラエティ
  movie: 6, // 映画
  anime: 7, // アニメ・特撮
  documentary: 8, // ドキュメンタリー・教養
  performance: 9, // 劇場・公演
  education: 10, // 趣味・教育
  welfare: 11, // 福祉
  reserve1: 12, // 予備
  reserve2: 13, // 予備
  expansion: 14, // 拡張
  other: 15, // その他
} as const;

const genreColors = {
  [genres.news]: "red",
  [genres.sports]: "orange",
  [genres.wideshow]: "amber",
  [genres.drama]: "yellow",
  [genres.music]: "lime",
  [genres.variety]: "green",
  [genres.movie]: "emerald",
  [genres.anime]: "teal",
  [genres.documentary]: "cyan",
  [genres.performance]: "sky",
  [genres.education]: "blue",
  [genres.welfare]: "indigo",
  [genres.reserve1]: "gray",
  [genres.reserve2]: "gray",
  [genres.expansion]: "gray",
  [genres.other]: "gray",
} as const;

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
    <div class={style.container}>
      {programs.map((program) => {
        const startAt = new Date(program.startAt);
        const endAt = new Date(program.startAt + program.duration);

        // 開始終了時間の分の和。
        const start = (startAt.getTime() - props.displayFrom.getTime()) /
          (60 * 1000);
        const end = (endAt.getTime() - props.displayFrom.getTime()) /
          (60 * 1000);

        const minStart = 0;
        const maxEnd = 60 * hourCount;

        const serviceIndex = services.findIndex((service) =>
          service.serviceId === program.serviceId
        );

        const genre = program.genres?.find((genre) =>
          Object.values(genres).map((v) => Number(v)).includes(genre.lv1)
        )?.lv1;

        const genreColor =
          genreColors[typeof genre !== "undefined" ? genre : genres.other];

        const recordingSchedule = props.recordingSchedules.find(
          (recordingSchedule) => recordingSchedule.program.id === program.id,
        );

        return (
          <div
            class={[
              style.item,
              `bg-${genreColor}-400`,
              recordingSchedule ? "border-4" : "border",
              recordingSchedule
                ? `border-stone-50`
                : `border-${genreColor}-200`,
            ]}
            style={{
              gridRowStart: (start >= minStart ? start : minStart) + 2,
              gridRowEnd: (end <= maxEnd ? end : maxEnd) + 2,
              gridColumnStart: serviceIndex + 2,
              gridColumnEnd: serviceIndex + 3,
            }}
            onClick={() => props.setProgram(program)}
          >
            <div>
              <ProgramItem program={program} />
            </div>
          </div>
        );
      })}
      {services.map((service, index) => (
        <div
          class={[style.head, "bg-white"]}
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
            class={[style.hour, "bg-white"]}
            style={{
              gridRow: `${(hour * 60) + 2} / ${((hour + 1) * 60) + 2}`,
            }}
          >
            <div>
              <p>{datetime.format(date, "M/d")}</p>
              <p>{datetime.format(date, "H:00")}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
