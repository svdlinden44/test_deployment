import { cn } from '@/lib/utils'
import s from './Button.module.scss'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  as?: 'button' | 'a'
  href?: string
}

export function Button({ variant = 'primary', as: Tag = 'button', href, className, children, ...props }: ButtonProps) {
  const variantClass = variant === 'primary' ? s.primary : s.ghost

  if (Tag === 'a') {
    return (
      <a href={href} className={cn(variantClass, className)}>
        {children}
      </a>
    )
  }

  return (
    <button className={cn(variantClass, className)} {...props}>
      {children}
    </button>
  )
}
