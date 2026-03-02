"use client";

interface StyleBadgeProps {
  name: string;
}

export default function StyleBadge({ name }: StyleBadgeProps) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-apolo-yellow-light text-xs font-medium text-apolo-yellow-dark">
      {name}
    </span>
  );
}
