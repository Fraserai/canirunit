type CompatibilityReasonProps = {
  reasons: string[];
  warnings: string[];
};

export function CompatibilityReason({ reasons, warnings }: CompatibilityReasonProps) {
  return (
    <div className="compatibility-reason">
      <p>{reasons[0]}</p>
      {warnings.length > 0 ? <span>{warnings[0]}</span> : reasons[1] ? <span>{reasons[1]}</span> : null}
    </div>
  );
}
