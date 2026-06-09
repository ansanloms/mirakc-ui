import { useState } from "react";
import type { components } from "../../lib/api/schema.d.ts";
import { BANDS } from "../../lib/service.ts";
import { startOfHourEpochMs } from "../../lib/datetime.ts";
import { t } from "../../locales/i18n.ts";
import ProgramToolbar from "../organisms/Program/Toolbar.tsx";
import ProgramTable from "../organisms/Program/Table.tsx";
import ProgramModalDetail from "../organisms/Program/Modal/Detail.tsx";
import ProgramSearchModal from "../organisms/Program/SearchModal.tsx";
import Empty from "../molecules/Empty.tsx";

type Program = components["schemas"]["MirakurunProgram"];
type Service = components["schemas"]["MirakurunService"];
type Schedule = components["schemas"]["WebRecordingSchedule"];

type BandId = "GR" | "BS" | "CS";

type Props = {
  /** 配局一覧。 */
  services: Service[];

  /** 番組一覧。 */
  programs: Program[];

  /** 録画予約一覧。 */
  recordingSchedules: Schedule[];

  /** 表示日時（タイムゾーン付き）。 */
  targetDate: Temporal.ZonedDateTime;

  /** 表示日時を設定する。 */
  setTargetDate: (targetDate: Temporal.ZonedDateTime) => void;

  /** 選択中の番組 (詳細モーダル)。 */
  selectedProgram?: Program;

  /** 番組を選択する。 */
  setProgram: (program: Program | undefined) => void;

  /** 録画予約する。 */
  addRecordingSchedule: (program: Program) => void | Promise<void>;

  /** 録画予約を解除する。 */
  removeRecordingSchedule: (program: Program) => void | Promise<void>;

  /** 録画予約の更新中。 */
  recordingLoading: boolean;
};

/** 番組表ページ。ツールバー・凡例・グリッド・各モーダルを束ねる。 */
export default function Program(props: Props) {
  const [band, setBand] = useState<BandId>("GR");
  const [searchOpen, setSearchOpen] = useState(false);

  // targetDate の「時」の先頭を起点に 24 時間分。
  const displayFromMs = startOfHourEpochMs(props.targetDate.epochMilliseconds);
  const displayToMs = displayFromMs + 24 * 60 * 60 * 1000;

  const filteredServices = props.services.filter(
    (service) => service.channel.type === band,
  );

  const bandLabel = BANDS.find((b) => b.id === band)?.label ?? band;

  const serviceOf = (program?: Program) =>
    program === undefined
      ? undefined
      : props.services.find((service) =>
        service.networkId === program.networkId &&
        service.serviceId === program.serviceId
      );

  const scheduleOf = (program?: Program) =>
    program === undefined ? undefined : props.recordingSchedules.find(
      (schedule) => schedule.program.id === program.id,
    );

  return (
    <div className="app-root">
      <ProgramToolbar
        targetDate={props.targetDate}
        onChangeDate={props.setTargetDate}
        band={band}
        onChangeBand={setBand}
        onOpenSearch={() => setSearchOpen(true)}
      />
      {filteredServices.length === 0
        ? (
          <Empty
            title={t("program.empty.title", { band: bandLabel })}
            description={t("program.empty.description", { band: bandLabel })}
          />
        )
        : (
          <ProgramTable
            services={filteredServices}
            programs={props.programs}
            recordingSchedules={props.recordingSchedules}
            displayFromMs={displayFromMs}
            displayToMs={displayToMs}
            setProgram={props.setProgram}
          />
        )}

      <ProgramModalDetail
        program={props.selectedProgram}
        service={serviceOf(props.selectedProgram)}
        recordingSchedule={scheduleOf(props.selectedProgram)}
        addRecordingSchedule={props.addRecordingSchedule}
        removeRecordingSchedule={props.removeRecordingSchedule}
        loading={props.recordingLoading}
        open={props.selectedProgram !== undefined}
        onClose={() => props.setProgram(undefined)}
      />
      <ProgramSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        programs={props.programs}
        services={props.services}
        schedules={props.recordingSchedules}
        onPick={(program) => {
          setSearchOpen(false);
          props.setProgram(program);
        }}
      />
    </div>
  );
}
