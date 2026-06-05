'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Determine the appropriate status icon and colors
        let IconComponent = Info
        let iconBg = 'bg-primary/10 text-primary'
        let titleColor = 'text-foreground'
        let descColor = 'text-muted-foreground/90'
        let closeColor = 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
        
        if (variant === 'success') {
          IconComponent = CheckCircle2
          iconBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          titleColor = 'text-emerald-950 dark:text-emerald-50'
          descColor = 'text-emerald-800/90 dark:text-emerald-200/90'
          closeColor = 'text-emerald-700/75 hover:text-emerald-950 hover:bg-emerald-500/20 dark:text-emerald-300/75 dark:hover:text-emerald-50'
        } else if (variant === 'destructive') {
          IconComponent = AlertCircle
          iconBg = 'bg-destructive/10 text-destructive dark:text-red-400'
          titleColor = 'text-red-950 dark:text-red-50'
          descColor = 'text-red-800/90 dark:text-red-200/90'
          closeColor = 'text-red-700/75 hover:text-red-950 hover:bg-red-500/20 dark:text-red-300/75 dark:hover:text-red-50'
        } else if (variant === 'warning') {
          IconComponent = AlertTriangle
          iconBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          titleColor = 'text-amber-950 dark:text-amber-50'
          descColor = 'text-amber-800/90 dark:text-amber-200/90'
          closeColor = 'text-amber-700/75 hover:text-amber-950 hover:bg-amber-500/20 dark:text-amber-300/75 dark:hover:text-amber-50'
        } else if (
          title?.toString().toLowerCase().includes('định vị') || 
          description?.toString().toLowerCase().includes('định vị') || 
          description?.toString().toLowerCase().includes('tọa độ')
        ) {
          // Special map case for default position fallback or map notifications
          IconComponent = MapPin
          iconBg = 'bg-orange-500/10 text-orange-500'
        }

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 w-full">
              <div className={cn("p-1.5 rounded-xl flex-shrink-0 transition-transform duration-300", iconBg)}>
                <IconComponent className="h-4.5 w-4.5" />
              </div>
              <div className="grid gap-0.5 flex-1 min-w-0 pr-2">
                {title && (
                  <ToastTitle className={cn("text-xs font-black tracking-tight leading-tight", titleColor)}>
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className={cn("text-[10.5px] font-semibold leading-snug", descColor)}>
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className={cn("rounded-full p-1.5 opacity-70 hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-300 absolute right-2.5 top-2.5", closeColor)} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
