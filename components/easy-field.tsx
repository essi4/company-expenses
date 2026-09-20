import type { ReactNode } from "react";

export default function EasyField({
  label,
  required = false,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  help?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="easy-label" data-required={required ? "true" : "false"}>{label}</span>
      {children}
      {help && <span className="easy-help">{help}</span>}
    </label>
  );
}
