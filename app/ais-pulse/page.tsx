import type { Metadata } from "next";
import { PulseAdmin } from "./pulse-admin";

export const metadata: Metadata = {
  title: "AISOLUTION Pulse",
  robots: {
    index: false,
    follow: false
  }
};

export default function PulsePage() {
  return <PulseAdmin />;
}
