import { X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DateRangePickerProps = {
    value: DateRange | undefined
    onChange: (range: DateRange | undefined) => void
    label: string
    clearLabel: string
    triggerClassName?: string
}

export function DateRangePicker({ value, onChange, label, clearLabel, triggerClassName }: DateRangePickerProps) {
    return (
        <Popover>
            <div className='relative group'>
                <PopoverTrigger asChild>
                    <Button
                        variant='outline'
                        className={cn(
                            'w-full justify-start overflow-hidden pr-9 text-left text-sm font-normal',
                            triggerClassName
                        )}
                    >
                        <span className='truncate'>{label}</span>
                    </Button>
                </PopoverTrigger>
                <button
                    type='button'
                    className='absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100'
                    onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        if (value?.from) {
                            onChange(undefined)
                        }
                    }}
                    aria-label={clearLabel}
                    aria-disabled={!value?.from}
                >
                    <X className='h-3.5 w-3.5' />
                </button>
            </div>
            <PopoverContent align='start' className='w-auto p-0'>
                <Calendar
                    mode='range'
                    selected={value}
                    onSelect={onChange}
                    numberOfMonths={2}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}

