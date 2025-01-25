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
  [genres.news]: "red", // bg-red-400 border-red-200
  [genres.sports]: "orange", // bg-orange-400 border-orange-200
  [genres.wideshow]: "amber", // bg-amber-400 border-amber-200
  [genres.drama]: "yellow", // bg-yellow-400 border-yellow-200
  [genres.music]: "lime", // bg-lime-400 border-lime-200
  [genres.variety]: "green", // bg-green-400 border-green-200
  [genres.movie]: "emerald", // bg-emerald-400 border-emerald-200
  [genres.anime]: "teal", // bg-teal-400 border-teal-200
  [genres.documentary]: "cyan", // bg-cyan-400 border-cyan-200
  [genres.performance]: "sky", // bg-sky-400 border-sky-200
  [genres.education]: "blue", // bg-blue-400 border-blue-200
  [genres.welfare]: "indigo", // bg-indigo-400 border-indigo-200
  [genres.reserve1]: "gray", // bg-gray-400 border-gray-200
  [genres.reserve2]: "gray", // bg-gray-400 border-gray-200
  [genres.expansion]: "gray", // bg-gray-400 border-gray-200
  [genres.other]: "gray", // bg-gray-400 border-gray-200
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
    <div
      class={"grid w-full h-full overflow-auto grid-cols-[60px_repeat(24rem)]"}
    >
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

        const genreColor = genreColors[
          ((program.genres?.find((genre) =>
            Object.values(genres).map((v) => Number(v)).includes(genre.lv1)
          )?.lv1) ?? genres.other) as unknown as keyof typeof genreColors
        ];

        const recordingSchedule = props.recordingSchedules.find(
          (recordingSchedule) => recordingSchedule.program.id === program.id,
        );

        return (
          <div
            class={`cursor-pointer bg-${genreColor}-400 ${
              recordingSchedule ? "border-4" : "border"
            } ${
              recordingSchedule ? "border-stone-50" : `border-${genreColor}-200`
            }`}
            style={{
              gridRowStart: (start >= minStart ? start : minStart) + 2,
              gridRowEnd: (end <= maxEnd ? end : maxEnd) + 2,
              gridColumnStart: serviceIndex + 2,
              gridColumnEnd: serviceIndex + 3,
            }}
            onClick={() => props.setProgram(program)}
          >
            <div class={"p-3 sticky top-16"}>
              <ProgramItem program={program} />
            </div>
          </div>
        );
      })}

      {services.map((service, index) => (
        <div
          class={"min-w-48 h-16 row-start-1 row-end-2 sticky top-0 flex items-center justify-center bg-white"}
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
            class={"col-start-1 col-end-2 sticky left-0 text-right bg-white"}
            style={{
              gridRow: `${(hour * 60) + 2} / ${((hour + 1) * 60) + 2}`,
            }}
          >
            <div
              class={"p-[0.8rem] sticky top-16"}
            >
              <p>{datetime.format(date, "M/d")}</p>
              <p>{datetime.format(date, "H:00")}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
