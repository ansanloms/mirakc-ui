import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { $api } from "../../../lib/api/client.ts";
import {
  addLiveCommentMapping,
  type LiveCommentMappingInput,
} from "../../../lib/api/live-comment-settings.ts";
import { buildChannelGroups } from "../../../lib/service.ts";
import MappingFormModal from "../../../components/organisms/LiveComment/MappingFormModal.tsx";

export const Route = createFileRoute("/settings/live-comments/new")({
  component: NewLiveCommentMappingModal,
});

/** 実況コメント割り当ての新規登録モーダル。閉じる = 一覧へ戻る。 */
function NewLiveCommentMappingModal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const services = $api.useQuery("get", "/services");
  const channels = $api.useQuery("get", "/channels");

  const channelGroups = useMemo(
    () => buildChannelGroups(channels.data ?? [], services.data ?? []),
    [channels.data, services.data],
  );

  const close = () => navigate({ to: "/settings/live-comments" });

  const add = useMutation({
    mutationFn: (input: LiveCommentMappingInput) =>
      addLiveCommentMapping(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-comment-settings"] });
      close();
    },
  });

  return (
    <MappingFormModal
      open
      channels={channelGroups}
      busy={add.isPending}
      onSave={(input) => add.mutate(input)}
      onClose={close}
    />
  );
}
