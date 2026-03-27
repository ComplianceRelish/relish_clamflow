interface DataDisplayRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  labelWidth?: string;
  highlight?: boolean;
}

export function DataDisplayRow({
  label,
  value,
  className = "",
  labelWidth = "w-1/3",
  highlight = false,
}: DataDisplayRowProps) {
  return (
    <div
      className={`flex items-start py-3 px-4 ${
        highlight ? "bg-blue-50" : "bg-white"
      } ${className}`}
    >
      <span className={`text-sm font-medium text-gray-500 ${labelWidth} flex-shrink-0`}>
        {label}
      </span>
      <span className="text-sm text-gray-900 flex-1 min-w-0 break-words">
        {value ?? <span className="text-gray-400 italic">—</span>}
      </span>
    </div>
  );
}

interface DataDisplayCardProps {
  title?: string;
  data: Array<{ label: string; value: React.ReactNode; highlight?: boolean }>;
  className?: string;
  labelWidth?: string;
  columns?: 1 | 2;
}

export function DataDisplayCard({
  title,
  data,
  className = "",
  labelWidth,
  columns = 1,
}: DataDisplayCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm ${className}`}>
      {title && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        </div>
      )}
      <div
        className={
          columns === 2
            ? "grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100"
            : "divide-y divide-gray-100"
        }
      >
        {columns === 2 ? (
          <>
            <div className="divide-y divide-gray-100">
              {data.slice(0, Math.ceil(data.length / 2)).map((item, i) => (
                <DataDisplayRow
                  key={i}
                  label={item.label}
                  value={item.value}
                  highlight={item.highlight}
                  labelWidth={labelWidth}
                />
              ))}
            </div>
            <div className="divide-y divide-gray-100">
              {data.slice(Math.ceil(data.length / 2)).map((item, i) => (
                <DataDisplayRow
                  key={i}
                  label={item.label}
                  value={item.value}
                  highlight={item.highlight}
                  labelWidth={labelWidth}
                />
              ))}
            </div>
          </>
        ) : (
          data.map((item, i) => (
            <DataDisplayRow
              key={i}
              label={item.label}
              value={item.value}
              highlight={item.highlight}
              labelWidth={labelWidth}
            />
          ))
        )}
      </div>
    </div>
  );
}
