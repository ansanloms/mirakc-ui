import type { JSX } from "preact";
import { useRef, useState } from "preact/hooks";
import type { components } from "../../hooks/api/schema.d.ts";
import ProgramDetail from "../molecules/Program/Detail.tsx";

type Props = {
  /**
   * Id 。
   */
  serviceId: number;

  /**
   * Program 。
   */
  program: components["schemas"]["MirakurunProgram"];
};

export default function Stream(
  { serviceId, program }: Props,
) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [selectedAudio, setSelectedAudio] = useState<number>(
    program.audios?.findIndex((audio) => audio.isMain) || 0,
  );

  const handleSelectAudio: JSX.GenericEventHandler<HTMLSelectElement> = (
    event,
  ) => {
    setSelectedAudio(Number(event.currentTarget.value));
  };

  return (
    <section
      class={["grid", "gap-4"]}
    >
      <video
        ref={videoRef}
        src={`/api/stream/${serviceId}?audio=${selectedAudio}`}
        controls
        autoPlay
        class={["w-full", "max-h-full", "aspect-video"]}
      />
      {program.audios && (
        <select onChange={handleSelectAudio}>
          {(program.audios || []).map((audio, index) => (
            <option value={index} selected={index === selectedAudio}>
              {audio.langs}
            </option>
          ))}
        </select>
      )}
      <ProgramDetail program={program} />
    </section>
  );
}
