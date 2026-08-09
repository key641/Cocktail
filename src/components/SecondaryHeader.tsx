type SecondaryHeaderProps = {
  title: string;
  description?: string;
  progress?: string;
  backLabel: string;
  onBack: () => void;
  compact?: boolean;
};

export function SecondaryHeader({
  title,
  description,
  progress,
  backLabel,
  onBack,
  compact = false
}: SecondaryHeaderProps) {
  return (
    <header className={compact ? "secondary-header compact" : "secondary-header"}>
      <button className="secondary-back" type="button" onClick={() => { triggerHaptic("selection"); onBack(); }} aria-label={backLabel}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m14.5 6-6 6 6 6" />
        </svg>
      </button>
      <div className="secondary-heading-copy">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {progress && <span className="secondary-progress">{progress}</span>}
    </header>
  );
}
import { triggerHaptic } from "../utils/haptics";
