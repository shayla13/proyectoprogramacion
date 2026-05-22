type Variant = 'success' | 'warning' | 'error' | 'info' | 'gray';

export default function Badge({
  children,
  variant = 'info',
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  const styles: Record<Variant, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-700',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
