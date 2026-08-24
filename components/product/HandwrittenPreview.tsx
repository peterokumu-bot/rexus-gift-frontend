'use client';

type Props = {
  message: string;
  paperColor: 'yellow' | 'pink';
  className?: string;
};

export function HandwrittenPreview({ message, paperColor, className = '' }: Props) {
  const bg = paperColor === 'pink' ? '#fce4ec' : '#fff9c4';
  const line = paperColor === 'pink' ? '#f8bbd0' : '#e6d98a';
  const ink = paperColor === 'pink' ? '#4a1942' : '#1a237e';

  const lines = (message || 'Your message will appear here…').split('\n');

  return (
    <div
      className={`relative rounded-sm shadow-md overflow-hidden ${className}`}
      style={{
        backgroundColor: bg,
        backgroundImage: `repeating-linear-gradient(
          transparent,
          transparent 27px,
          ${line} 27px,
          ${line} 28px
        )`,
        backgroundPosition: '0 12px',
      }}
    >
      <div
        className="absolute top-0 bottom-0 w-px"
        style={{ left: 40, background: paperColor === 'pink' ? '#e57373' : '#ef5350', opacity: 0.7 }}
      />
      <div className="relative pl-12 pr-4 py-4 min-h-[200px]">
        {lines.map((lineText, i) => (
          <p
            key={i}
            className="text-[1.15rem] sm:text-[1.35rem] leading-[28px] whitespace-pre-wrap break-words"
            style={{
              fontFamily: 'var(--font-caveat), "Segoe Script", "Comic Sans MS", cursive',
              color: ink,
              transform: i % 2 === 0 ? 'rotate(-0.3deg)' : 'rotate(0.25deg)',
            }}
          >
            {lineText || '\u00A0'}
          </p>
        ))}
      </div>
    </div>
  );
}
