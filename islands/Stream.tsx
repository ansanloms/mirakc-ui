import { useEffect, useState } from "preact/hooks";
import StreamTemplate from "../components/templates/Stream.tsx";
import LoadingTemplate from "../components/templates/Loading.tsx";
import type { components } from "../hooks/api/schema.d.ts";
import { useGet } from "../hooks/api/index.ts";

type Props = {
  serviceId: number;
};

export default function Stream({ serviceId }: Props) {
  const getProgramsOfService = useGet("/services/{id}/programs");

  const [nowOnAirProgram, setNowOnAirProgram] = useState<
    components["schemas"]["MirakurunProgram"]
  >();

  const getNowOnAirProgram = async (targetDate: Date) => {
    const { data: programs } = await getProgramsOfService.mutate(
      {
        params: { path: { id: serviceId } },
      },
    );

    return (programs || []).find((program) => {
      const startAt = new Date(program.startAt);
      const endAt = new Date(program.startAt + program.duration);

      return (startAt <= targetDate && endAt >= targetDate);
    });
  };

  useEffect(() => {
    getNowOnAirProgram(new Date()).then(setNowOnAirProgram);

    const timer = setInterval(() => {
      getNowOnAirProgram(new Date()).then(setNowOnAirProgram);
    }, 60 * 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!nowOnAirProgram) {
    return (
      <div>
        <LoadingTemplate />
      </div>
    );
  }

  return (
    <div>
      <StreamTemplate serviceId={serviceId} program={nowOnAirProgram} />
    </div>
  );
}
