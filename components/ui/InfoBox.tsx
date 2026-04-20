interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function InfoBox({ children, title }: Props) {
  return (
    <div className="card max-w-xl px-6 py-5 text-sm">
      {title && (
        <div className="fieldset-header mt-0 mb-4">
          <span>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}
