import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type TimeRangePickerProps = {
    value: {
        start: string
        end: string
        label: string
        timeOptions: string[]
    }
    onSelectTime: (time: string) => void
    onClear: () => void
    clearLabel: string
    selectHint: string
    selectedRangeLabel?: string
    triggerClassName?: string
}

export function TimeRangePicker({
    value,
    onSelectTime,
    onClear,
    clearLabel,
    selectHint,
    selectedRangeLabel,
    triggerClassName,
}: TimeRangePickerProps) {
    const currentTimeOption = (() => {
        const now = new Date()
        const hours = String(now.getHours()).padStart(2, '0')
        return `${hours}:00`
    })()

    return (
        <Popover>
            <div className='relative group'>
                <PopoverTrigger asChild>
                    <Button
                        variant='outline'
                        className={cn(
                            'w-full justify-start pr-9 text-left text-sm font-normal',
                            triggerClassName
                        )}
                    >
                        {value.label}
                    </Button>
                </PopoverTrigger>
                <button
                    type='button'
                    className='absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100'
                    onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        if (value.start || value.end) {
                            onClear()
                        }
                    }}
                    aria-label={clearLabel}
                    aria-disabled={!value.start && !value.end}
                >
                    <X className='h-3.5 w-3.5' />
                </button>
            </div>
            <PopoverContent align='start' className='w-80 p-4'>
                <div className='grid gap-2'>
                    <div className='flex items-center justify-between text-xs text-foreground font-medium mb-2'>
                        <span>{selectHint}</span>
                        {selectedRangeLabel ? <span className='text-foreground'>{selectedRangeLabel}</span> : null}
                    </div>
                    <div className='grid grid-cols-2 gap-x-0 gap-y-2 sm:grid-cols-4'>
                        {value.timeOptions.map((time) => {
                            const startIndex = value.timeOptions.indexOf(value.start)
                            const endIndex = value.timeOptions.indexOf(value.end)
                            const currentIndex = value.timeOptions.indexOf(time)
                            const isStart = time === value.start
                            const isEnd = time === value.end
                            const inRange =
                                value.start &&
                                value.end &&
                                currentIndex > startIndex &&
                                currentIndex < endIndex
                            const isRowStart2 = currentIndex % 2 === 0
                            const isRowEnd2 = currentIndex % 2 === 1
                            const isRowStart4 = currentIndex % 4 === 0
                            const isRowEnd4 = currentIndex % 4 === 3
                            const isNow = time === currentTimeOption
                            return (
                                <button
                                    key={time}
                                    type='button'
                                    className={`flex w-full min-w-0 items-center justify-center px-0 py-1.5 text-[13px] transition ${inRange ? 'rounded-none' : 'rounded-md'} ${inRange && isRowStart2 ? 'rounded-l-md' : ''} ${inRange && isRowEnd2 ? 'rounded-r-md' : ''} ${inRange && isRowStart4 ? 'sm:rounded-l-md' : ''} ${inRange && isRowEnd4 ? 'sm:rounded-r-md' : ''} ${isStart || isEnd
                                        ? 'bg-primary text-primary-foreground'
                                        : inRange
                                            ? 'bg-muted text-foreground'
                                            : isNow
                                                ? 'bg-accent text-accent-foreground'
                                                : 'text-foreground hover:bg-muted/60'
                                        }`}
                                    onClick={() => onSelectTime(time)}
                                >
                                    {time}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

