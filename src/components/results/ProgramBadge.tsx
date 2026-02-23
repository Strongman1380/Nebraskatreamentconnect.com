interface ProgramBadgeProps {
  label: string
  variant?: 'blue' | 'teal' | 'purple' | 'gray'
}

const VARIANTS = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  teal: 'bg-teal-50 text-teal-700 border-teal-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
  gray: 'bg-gray-50 text-gray-600 border-gray-100',
}

export function ProgramBadge({ label, variant = 'blue' }: ProgramBadgeProps) {
  return (
    <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-md border font-medium leading-relaxed ${VARIANTS[variant]}`}>
      {label}
    </span>
  )
}
