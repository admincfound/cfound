interface FormattedTextProps {
  text?: string;
  className?: string;
}

export default function FormattedText({
  text = '',
  className = '',
}: FormattedTextProps) {
  if (!text) return null;

  const blocks = text.split(/\n\s*\n/);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim().length > 0);

        const isBulletBlock =
          lines.length > 1 &&
          lines.every((l) => /^[\s]*[-*•]\s+/.test(l));

        if (isBulletBlock) {
          return (
            <ul
              key={i}
              className="space-y-1.5 list-disc pl-4 marker:text-gray-300"
            >
              {lines.map((line, j) => (
                <li key={j} className="break-words text-gray-500">
                  {line.replace(/^[\s]*[-*•]\s+/, '')}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="whitespace-pre-line break-words">
            {block.trim()}
          </p>
        );
      })}
    </div>
  );
}