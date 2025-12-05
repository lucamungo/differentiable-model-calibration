import { defineConfig } from 'unocss'

const colors = ['violet', 'purple', 'fuchsia', 'pink', 'indigo', 'blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange', 'red']

export default defineConfig({
  safelist: [
    // Transition and animation classes
    'transition-all',
    'duration-500',
    'ease-in-out',
    'transition',
    'duration-300',
    'opacity-0',
    'opacity-100',
    'scale-90',
    'scale-100',
    'translate-x--10',
    'translate-x-0',
    // IconCard utility classes
    'rounded-lg',
    'border-2',
    'border-solid',
    'p-2',
    'flex',
    'flex-col',
    'flex-1',
    'items-center',
    'justify-center',
    'mb-1',
    'text-base',
    'font-semibold',
    'gap-1',
    'backdrop-blur',
    'h-full',
    'h-20',
    'w-20',
    'w-full',
    'px-4',
    'px-5',
    'py-2',
    'py-16',
    'text-center',
    'object-contain',
    'text-white',
    // Arbitrary value classes
    'text-[45px]',
    'h-[5rem]',
    ...colors.flatMap(color => [
      // Light theme - IconCard & ContentCard
      `border-${color}-300`,
      `bg-${color}-50/60`,
      `bg-${color}-100/60`,
      `text-${color}-600`,
      `text-${color}-700`,
      // Dark theme (legacy)
      `border-${color}-800`,
      `bg-${color}-800/20`,
      `bg-${color}-800/30`,
      `text-${color}-500`,
      // DetailCard
      `border-${color}-800/50`,
      `text-${color}-300`,
      `bg-${color}-800/10`,
      // InfoBox
      `text-${color}-400`,
      // InfoCard
      `border-${color}-600`,
      // ContentCard
      `border-${color}-700`,
    ]),
  ],
})
