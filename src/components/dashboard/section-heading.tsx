type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        <p className="section-heading__eyebrow">{eyebrow}</p>
        <h2 className="section-heading__title">{title}</h2>
        <p className="section-heading__description">{description}</p>
      </div>

      {actionLabel ? (
        <button type="button" className="button-primary">{actionLabel}</button>
      ) : null}
    </div>
  );
}
