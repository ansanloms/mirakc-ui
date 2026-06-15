import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { $api } from "../../../lib/api/client.ts";
import {
  fetchLiveCommentMappings,
  fetchLiveCommentSuggestions,
  type LiveCommentMappingInput,
  updateLiveCommentMapping,
} from "../../../lib/api/live-comment-settings.ts";
import { buildChannelGroups } from "../../../lib/service.ts";
import MappingFormModal from "../../../components/organisms/LiveComment/MappingFormModal.tsx";

export const Route = createFileRoute("/settings/live-comments/$id")({
  component: EditLiveCommentMappingModal,
});

/** 実況コメント割り当ての編集モーダル。URL の id から対象を引いて表示する。 */
function EditLiveCommentMappingModal() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mappings = useQuery({
    queryKey: ["live-comment-settings"],
    queryFn: () => fetchLiveCommentMappings(),
  });
  const suggestions = useQuery({
    queryKey: ["live-comment-suggestions"],
    queryFn: () => fetchLiveCommentSuggestions(),
  });
  const services = $api.useQuery("get", "/services");
  const channels = $api.useQuery("get", "/channels");

  const channelGroups = useMemo(
    () => buildChannelGroups(channels.data ?? [], services.data ?? []),
    [channels.data, services.data],
  );

  const mapping = (mappings.data ?? []).find((m) => m.id === id);

  const close = () => navigate({ to: "/settings/live-comments" });

  // 読み込み完了後も対象が無い (削除済み等) なら一覧へ戻す。
  useEffect(() => {
    if (!mappings.isPending && mapping === undefined) {
      close();
    }
  }, [mappings.isPending, mapping]);

  const update = useMutation({
    mutationFn: (input: LiveCommentMappingInput) =>
      updateLiveCommentMapping(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-comment-settings"] });
      close();
    },
  });

  if (mapping === undefined) {
    return null;
  }

  return (
    <MappingFormModal
      open
      initial={mapping}
      channels={channelGroups}
      suggestions={suggestions.data ?? []}
      // 自分自身のチャンネルは選択可 (重複から除外)。
      takenChannels={(mappings.data ?? [])
        .filter((m) => m.id !== id)
        .map((m) => m.channel)}
      busy={update.isPending}
      onSave={(input) => update.mutate(input)}
      onClose={close}
    />
  );
}
