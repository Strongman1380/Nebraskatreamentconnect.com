interface ProgramBadgeProps {
  label: string
  variant?: 'blue' | 'teal' | 'purple' | 'gray'
}

const VARIANTS = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
}

export function ProgramBadge({ label, variant = 'blue' }: ProgramBadgeProps) {
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium ${VARIANTS[variant]}`}>
      {label}
    </span>
  )
}
