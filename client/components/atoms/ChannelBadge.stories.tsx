import type { Meta, StoryObj } from "@storybook/react-vite";
import ChannelBadge from "./ChannelBadge.tsx";
import { sampleServices } from "../../lib/fixtures.ts";

const meta = {
  title: "atoms/ChannelBadge",
  component: ChannelBadge,
  args: { service: sampleServices[0], size: "md" },
} satisfies Meta<typeof ChannelBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: "sm" } };
export const ExtraSmall: Story = { args: { size: "xs" } };

export const AllChannels: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
      {sampleServices.map((service) => (
        <ChannelBadge key={service.id} service={service} size="sm" />
      ))}
    </div>
  ),
};
