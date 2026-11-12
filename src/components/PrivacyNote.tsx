import { ShieldCheck } from "lucide-react";

type PrivacyNoteProps = {
  compact?: boolean;
};

export function PrivacyNote({ compact = false }: PrivacyNoteProps) {
  return (
    <div className={compact ? "privacy-note privacy-note-compact" : "privacy-note"}>
      <ShieldCheck aria-hidden="true" size={18} />
      <div>
        <strong>Your hardware scan stays on this device.</strong>
        {!compact ? (
          <span>
            Scan runs locally. No personal files are read. No account, telemetry, network scan, or automatic installs.
          </span>
        ) : null}
      </div>
    </div>
  );
}
