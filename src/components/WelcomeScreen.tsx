import { Cpu, ScanLine } from "lucide-react";
import { mockProfileOptions, type MockProfileId } from "../lib/scanner/mockMachine";
import { PrivacyNote } from "./PrivacyNote";

type WelcomeScreenProps = {
  selectedMockProfile: MockProfileId;
  onMockProfileChange: (profileId: MockProfileId) => void;
  onScan: () => void;
};

export function WelcomeScreen({ selectedMockProfile, onMockProfileChange, onScan }: WelcomeScreenProps) {
  return (
    <main className="welcome-shell">
      <section className="welcome-hero" aria-labelledby="welcome-title">
        <div className="brand-mark" aria-hidden="true">
          <Cpu size={30} />
        </div>
        <p className="eyebrow">Local-first model matching</p>
        <h1 id="welcome-title">CanIRunAI</h1>
        <p className="tagline">See which open-source AI models your machine can run.</p>
        <p className="welcome-copy">We scan your hardware locally and match it against a live model catalog.</p>
        <button className="primary-button scan-button" type="button" onClick={onScan}>
          <ScanLine size={20} aria-hidden="true" />
          Scan My Machine
        </button>
        <PrivacyNote />
      </section>

      {import.meta.env.DEV ? (
        <section className="dev-panel" aria-label="Development mock machine selector">
          <label htmlFor="mock-profile">Mock profile</label>
          <select
            id="mock-profile"
            value={selectedMockProfile}
            onChange={(event) => onMockProfileChange(event.target.value as MockProfileId)}
          >
            {mockProfileOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </section>
      ) : null}
    </main>
  );
}
