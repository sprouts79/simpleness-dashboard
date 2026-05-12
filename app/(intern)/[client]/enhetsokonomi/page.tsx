"use client";

import { useState } from "react";
import clsx from "clsx";
import AbonnementCalc from "./AbonnementCalc";
import EcommerceCalc from "./EcommerceCalc";

type Mode = "abonnement" | "ecommerce";

export default function EnhetsokonomiPage() {
  const [mode, setMode] = useState<Mode>("abonnement");

  return (
    <div>
      <div className="mb-6 flex items-center gap-1 p-1 bg-neutral-100 rounded-lg w-fit">
        <ModeButton active={mode === "abonnement"} onClick={() => setMode("abonnement")}>
          Abonnement
        </ModeButton>
        <ModeButton active={mode === "ecommerce"} onClick={() => setMode("ecommerce")}>
          E-commerce
        </ModeButton>
      </div>

      {mode === "abonnement" ? <AbonnementCalc /> : <EcommerceCalc />}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-white text-neutral-900 shadow-sm"
          : "text-neutral-500 hover:text-neutral-900"
      )}
    >
      {children}
    </button>
  );
}
