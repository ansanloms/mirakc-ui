import type { Meta, StoryObj } from "@storybook/react-vite";
import Modal from "./Modal.tsx";

const meta = {
  title: "atoms/Modal",
  component: Modal,
  args: {
    open: true,
    align: "center",
    children: (
      <div style={{ padding: "2.4rem 2.6rem" }}>
        <h2 style={{ fontSize: "2.2rem", fontWeight: 700 }}>モーダル見出し</h2>
        <p style={{ marginTop: "1.2rem", color: "var(--color-text-dim)" }}>
          共有モーダルの本文。背景クリック・Esc・閉じるボタンで閉じる。
        </p>
      </div>
    ),
  },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Center: Story = {};
export const Top: Story = { args: { align: "top" } };
export const NoCloseButton: Story = { args: { hideClose: true } };
