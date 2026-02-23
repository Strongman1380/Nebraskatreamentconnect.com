import { AlertCircle } from 'lucide-react'

export function ErrorBanner({ message, className = '' }: { message: string; className?: string }) {
  return (
    <div className={`flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm ${className}`}>
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
