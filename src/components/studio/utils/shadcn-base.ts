/**
 * Genesis Sandpack Pre-baked Files
 *
 * shadcn/ui core components + lib/utils, baked into every Genesis preview
 * so the AI can `import { Button } from '@/components/ui/button'` directly.
 *
 * Each entry is the file's source. Paths are sandpack-style (leading `/`).
 * User-generated files (passed to toSandpackFiles) win over these defaults.
 */

export const SANDPACK_BASE_FILES: Record<string, string> = {
  // ─────────────────────────────────────────────────────────────────────────
  // tsconfig.json — enables @/* path alias
  // ─────────────────────────────────────────────────────────────────────────
  '/tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/lib/utils.ts — cn() helper used by every shadcn component
  // ─────────────────────────────────────────────────────────────────────────
  '/src/lib/utils.ts': `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/globals.css — shadcn HSL theme vars + tailwindcss-animate keyframes
  // (sin esto: Dialog/Sheet/Accordion/Popover abren sin animación)
  // ─────────────────────────────────────────────────────────────────────────
  '/src/globals.css': `:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 10% 3.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
}

/* tailwindcss-animate keyframes (Radix data-state animations) */
@keyframes accordion-down {
  from { height: 0 }
  to { height: var(--radix-accordion-content-height) }
}
@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height) }
  to { height: 0 }
}
@keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes fade-out { from { opacity: 1 } to { opacity: 0 } }
@keyframes zoom-in { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
@keyframes zoom-out { from { opacity: 1; transform: scale(1) } to { opacity: 0; transform: scale(0.95) } }
@keyframes slide-in-from-top { from { transform: translateY(-2%) } to { transform: translateY(0) } }
@keyframes slide-in-from-bottom { from { transform: translateY(2%) } to { transform: translateY(0) } }
@keyframes slide-in-from-left { from { transform: translateX(-100%) } to { transform: translateX(0) } }
@keyframes slide-in-from-right { from { transform: translateX(100%) } to { transform: translateX(0) } }
@keyframes slide-out-to-top { from { transform: translateY(0) } to { transform: translateY(-2%) } }
@keyframes slide-out-to-bottom { from { transform: translateY(0) } to { transform: translateY(2%) } }
@keyframes slide-out-to-left { from { transform: translateX(0) } to { transform: translateX(-100%) } }
@keyframes slide-out-to-right { from { transform: translateX(0) } to { transform: translateX(100%) } }

.animate-accordion-down { animation: accordion-down 0.2s ease-out }
.animate-accordion-up { animation: accordion-up 0.2s ease-out }
.animate-in { animation-duration: 150ms; animation-fill-mode: both }
.animate-out { animation-duration: 150ms; animation-fill-mode: both }
.fade-in-0 { animation-name: fade-in }
.fade-out-0 { animation-name: fade-out }
.zoom-in-95 { animation-name: zoom-in }
.zoom-out-95 { animation-name: zoom-out }
.slide-in-from-top-2 { animation-name: slide-in-from-top }
.slide-in-from-bottom-2 { animation-name: slide-in-from-bottom }
.slide-in-from-left { animation-name: slide-in-from-left }
.slide-in-from-right { animation-name: slide-in-from-right }
.slide-out-to-top { animation-name: slide-out-to-top }
.slide-out-to-bottom { animation-name: slide-out-to-bottom }
.slide-out-to-left { animation-name: slide-out-to-left }
.slide-out-to-right { animation-name: slide-out-to-right }

body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/button.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/button.tsx': `import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-white hover:bg-zinc-800',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
        secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
        ghost: 'text-zinc-700 hover:bg-zinc-100',
        link: 'text-zinc-900 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { buttonVariants };`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/card.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/card.tsx': `import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm', className)} {...props} />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-zinc-500', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/input.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/input.tsx': `import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/label.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/label.tsx': `import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-sm font-medium leading-none text-zinc-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/badge.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/badge.tsx': `import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-zinc-900 text-white',
        secondary: 'border-transparent bg-zinc-100 text-zinc-900',
        destructive: 'border-transparent bg-red-500 text-white',
        outline: 'border-zinc-200 text-zinc-900',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/separator.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/separator.tsx': `import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/lib/utils';

export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-zinc-200',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className,
    )}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/tabs.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/tabs.tsx': `import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-600', className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400', className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/dialog.tsx
  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/accordion.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/accordion.tsx': `import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn('border-b border-zinc-200', className)} {...props} />
));
AccordionItem.displayName = 'AccordionItem';

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn('flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180', className)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-4 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/avatar.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/avatar.tsx': `import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

export const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('aspect-square h-full w-full', className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn('flex h-full w-full items-center justify-center rounded-full bg-zinc-100 text-zinc-700 text-sm font-medium', className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/alert.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/alert.tsx': `import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11',
  {
    variants: {
      variant: {
        default: 'bg-white text-zinc-900 border-zinc-200',
        destructive: 'border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  )
);
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/textarea.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/textarea.tsx': `import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/checkbox.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/checkbox.tsx': `import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-zinc-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-zinc-900 data-[state=checked]:text-white data-[state=checked]:border-zinc-900',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      <Check className="h-3.5 w-3.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/switch.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/switch.tsx': `import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-zinc-900 data-[state=unchecked]:bg-zinc-200',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/select.tsx (compact version)
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/select.tsx': `import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn('relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-zinc-200 bg-white text-zinc-900 shadow-md', className)}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn('relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-zinc-100 data-[disabled]:opacity-50', className)}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/tooltip.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/tooltip.tsx': `import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn('z-50 overflow-hidden rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white shadow-md', className)}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/popover.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/popover.tsx': `import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn('z-50 w-72 rounded-md border border-zinc-200 bg-white p-4 text-zinc-900 shadow-md outline-none', className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/dropdown-menu.tsx (compact)
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/dropdown-menu.tsx': `import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn('z-50 min-w-[8rem] overflow-hidden rounded-md border border-zinc-200 bg-white p-1 text-zinc-900 shadow-md', className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-zinc-200', className)} {...props} />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/skeleton.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/skeleton.tsx': `import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-zinc-200', className)} {...props} />;
}`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/progress.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/progress.tsx': `import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-zinc-100', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-zinc-900 transition-all"
      style={{ transform: \`translateX(-\${100 - (value || 0)}%)\` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/table.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/table.tsx': `import * as React from 'react';
import { cn } from '@/lib/utils';

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn('[&_tr]:border-b border-zinc-200', className)} {...props} />
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn('border-b border-zinc-200 transition-colors hover:bg-zinc-50 data-[state=selected]:bg-zinc-100', className)} {...props} />
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th ref={ref} className={cn('h-12 px-4 text-left align-middle font-medium text-zinc-500 [&:has([role=checkbox])]:pr-0', className)} {...props} />
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />
  )
);
TableCell.displayName = 'TableCell';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/sonner.tsx — toast notifications (uses sonner pkg directly)
  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/sheet.tsx — slide-out drawer (mobile menus, side panels)
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/sheet.tsx': `import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;
export const SheetPortal = SheetPrimitive.Portal;

export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn('fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className)}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-white p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b border-zinc-200 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top-2',
        bottom: 'inset-x-0 bottom-0 border-t border-zinc-200 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom-2',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r border-zinc-200 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right: 'inset-y-0 right-0 h-full w-3/4 border-l border-zinc-200 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: { side: 'right' },
  }
);

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>, VariantProps<typeof sheetVariants> {}

export const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = 'right', className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

export const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
SheetFooter.displayName = 'SheetFooter';

export const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn('text-lg font-semibold text-zinc-900', className)} {...props} />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

export const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn('text-sm text-zinc-500', className)} {...props} />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/navigation-menu.tsx — mega menu (Stripe/Vercel style)
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/navigation-menu.tsx': `import * as React from 'react';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

export const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List ref={ref} className={cn('group flex flex-1 list-none items-center justify-center space-x-1', className)} {...props} />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

export const NavigationMenuItem = NavigationMenuPrimitive.Item;

export const navigationMenuTriggerStyle = cva(
  'group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-zinc-100 data-[state=open]:bg-zinc-100'
);

export const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger ref={ref} className={cn(navigationMenuTriggerStyle(), 'group', className)} {...props}>
    {children}{' '}
    <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" />
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

export const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn('left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in-0 data-[motion^=to-]:fade-out-0 md:absolute md:w-auto', className)}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

export const NavigationMenuLink = NavigationMenuPrimitive.Link;

export const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn('absolute left-0 top-full flex justify-center')}>
    <NavigationMenuPrimitive.Viewport
      className={cn('origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 md:w-[var(--radix-navigation-menu-viewport-width)]', className)}
      ref={ref}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/command.tsx — Cmd+K search palette
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/command.tsx': `import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive ref={ref} className={cn('flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-zinc-900', className)} {...props} />
));
Command.displayName = CommandPrimitive.displayName;

export const CommandDialog = ({ children, ...props }: React.ComponentProps<typeof Dialog>) => (
  <Dialog {...props}>
    <DialogContent className="overflow-hidden p-0">
      <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-500 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
        {children}
      </Command>
    </DialogContent>
  </Dialog>
);

export const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-zinc-200 px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn('flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50', className)}
      {...props}
    />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List ref={ref} className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)} {...props} />
));
CommandList.displayName = CommandPrimitive.List.displayName;

export const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group ref={ref} className={cn('overflow-hidden p-1 text-zinc-900 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-500', className)} {...props} />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

export const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn('-mx-1 h-px bg-zinc-200', className)} {...props} />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item ref={ref} className={cn('relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-100 aria-selected:text-zinc-900 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50', className)} {...props} />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

export const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('ml-auto text-xs tracking-widest text-zinc-500', className)} {...props} />
);
CommandShortcut.displayName = 'CommandShortcut';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/menubar.tsx — desktop menu (File/Edit/View)
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/menubar.tsx': `import * as React from 'react';
import * as MenubarPrimitive from '@radix-ui/react-menubar';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MenubarMenu = MenubarPrimitive.Menu;
export const MenubarGroup = MenubarPrimitive.Group;
export const MenubarPortal = MenubarPrimitive.Portal;
export const MenubarSub = MenubarPrimitive.Sub;
export const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

export const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root ref={ref} className={cn('flex h-10 items-center space-x-1 rounded-md border border-zinc-200 bg-white p-1', className)} {...props} />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

export const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger ref={ref} className={cn('flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-zinc-100 data-[state=open]:bg-zinc-100', className)} {...props} />
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

export const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = 'start', alignOffset = -4, sideOffset = 8, ...props }, ref) => (
  <MenubarPrimitive.Portal>
    <MenubarPrimitive.Content
      ref={ref}
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn('z-50 min-w-[12rem] overflow-hidden rounded-md border border-zinc-200 bg-white p-1 text-zinc-900 shadow-md', className)}
      {...props}
    />
  </MenubarPrimitive.Portal>
));
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

export const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item ref={ref} className={cn('relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-zinc-100 data-[disabled]:opacity-50', inset && 'pl-8', className)} {...props} />
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

export const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-zinc-200', className)} {...props} />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

export const MenubarShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('ml-auto text-xs tracking-widest text-zinc-500', className)} {...props} />
);
MenubarShortcut.displayName = 'MenubarShortcut';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/context-menu.tsx — right-click menu
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/context-menu.tsx': `import * as React from 'react';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuGroup = ContextMenuPrimitive.Group;
export const ContextMenuPortal = ContextMenuPrimitive.Portal;
export const ContextMenuSub = ContextMenuPrimitive.Sub;
export const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

export const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content ref={ref} className={cn('z-50 min-w-[8rem] overflow-hidden rounded-md border border-zinc-200 bg-white p-1 text-zinc-900 shadow-md', className)} {...props} />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

export const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item ref={ref} className={cn('relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-zinc-100 data-[disabled]:opacity-50', inset && 'pl-8', className)} {...props} />
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

export const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label ref={ref} className={cn('px-2 py-1.5 text-sm font-semibold text-zinc-900', inset && 'pl-8', className)} {...props} />
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

export const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-zinc-200', className)} {...props} />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/alert-dialog.tsx — confirmation dialogs
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/alert-dialog.tsx': `import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;

export const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay className={cn('fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className)} {...props} ref={ref} />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content ref={ref} className={cn('fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-zinc-200 bg-white p-6 shadow-lg duration-200 sm:rounded-lg', className)} {...props} />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

export const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

export const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

export const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

export const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={cn('text-sm text-zinc-500', className)} {...props} />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

export const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} className={cn(buttonVariants(), className)} {...props} />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

export const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel ref={ref} className={cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', className)} {...props} />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/carousel.tsx — Embla wrapper
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/carousel.tsx': `import * as React from 'react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type CarouselApi = UseEmblaCarouselType[1];
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];

type CarouselProps = {
  opts?: CarouselOptions;
  orientation?: 'horizontal' | 'vertical';
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: CarouselApi;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  orientation: 'horizontal' | 'vertical';
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) throw new Error('useCarousel must be used within a <Carousel />');
  return ctx;
}

export const Carousel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & CarouselProps>(
  ({ orientation = 'horizontal', opts, setApi, className, children, ...props }, ref) => {
    const [carouselRef, api] = useEmblaCarousel({ ...opts, axis: orientation === 'horizontal' ? 'x' : 'y' });
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) return;
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    React.useEffect(() => {
      if (!api || !setApi) return;
      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) return;
      onSelect(api);
      api.on('reInit', onSelect);
      api.on('select', onSelect);
      return () => { api?.off('select', onSelect); };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider value={{ carouselRef, api, scrollPrev: () => api?.scrollPrev(), scrollNext: () => api?.scrollNext(), canScrollPrev, canScrollNext, orientation }}>
        <div ref={ref} className={cn('relative', className)} {...props}>{children}</div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = 'Carousel';

export const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();
    return (
      <div ref={carouselRef} className="overflow-hidden">
        <div ref={ref} className={cn('flex', orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col', className)} {...props} />
      </div>
    );
  }
);
CarouselContent.displayName = 'CarouselContent';

export const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();
    return <div ref={ref} role="group" aria-roledescription="slide" className={cn('min-w-0 shrink-0 grow-0 basis-full', orientation === 'horizontal' ? 'pl-4' : 'pt-4', className)} {...props} />;
  }
);
CarouselItem.displayName = 'CarouselItem';

export const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = 'outline', size = 'icon', ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();
    return (
      <Button ref={ref} variant={variant} size={size} className={cn('absolute h-8 w-8 rounded-full', orientation === 'horizontal' ? '-left-12 top-1/2 -translate-y-1/2' : '-top-12 left-1/2 -translate-x-1/2 rotate-90', className)} disabled={!canScrollPrev} onClick={scrollPrev} {...props}>
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>
    );
  }
);
CarouselPrevious.displayName = 'CarouselPrevious';

export const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = 'outline', size = 'icon', ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();
    return (
      <Button ref={ref} variant={variant} size={size} className={cn('absolute h-8 w-8 rounded-full', orientation === 'horizontal' ? '-right-12 top-1/2 -translate-y-1/2' : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90', className)} disabled={!canScrollNext} onClick={scrollNext} {...props}>
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    );
  }
);
CarouselNext.displayName = 'CarouselNext';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/breadcrumb.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/breadcrumb.tsx': `import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Breadcrumb = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<'nav'>>(
  ({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />
);
Breadcrumb.displayName = 'Breadcrumb';

export const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<'ol'>>(
  ({ className, ...props }, ref) => (
    <ol ref={ref} className={cn('flex flex-wrap items-center gap-1.5 break-words text-sm text-zinc-500 sm:gap-2.5', className)} {...props} />
  )
);
BreadcrumbList.displayName = 'BreadcrumbList';

export const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
  )
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<'a'> & { asChild?: boolean }>(
  ({ asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : 'a';
    return <Comp ref={ref} className={cn('transition-colors hover:text-zinc-900', className)} {...props} />;
  }
);
BreadcrumbLink.displayName = 'BreadcrumbLink';

export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} role="link" aria-disabled="true" aria-current="page" className={cn('font-normal text-zinc-900', className)} {...props} />
  )
);
BreadcrumbPage.displayName = 'BreadcrumbPage';

export const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<'li'>) => (
  <li role="presentation" aria-hidden="true" className={cn('[&>svg]:size-3.5', className)} {...props}>
    {children ?? <ChevronRight />}
  </li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

export const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span role="presentation" aria-hidden="true" className={cn('flex h-9 w-9 items-center justify-center', className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/collapsible.tsx — show/hide content
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/collapsible.tsx': `import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;
export const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/aspect-ratio.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/aspect-ratio.tsx': `import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';
export const AspectRatio = AspectRatioPrimitive.Root;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/radio-group.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/radio-group.tsx': `import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn('aspect-square h-4 w-4 rounded-full border border-zinc-300 text-zinc-900 ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50', className)}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <Circle className="h-2 w-2 fill-current text-current" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/slider.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/slider.tsx': `import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root ref={ref} className={cn('relative flex w-full touch-none select-none items-center', className)} {...props}>
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-zinc-200">
      <SliderPrimitive.Range className="absolute h-full bg-zinc-900" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-zinc-900 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/scroll-area.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/scroll-area.tsx': `import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@/lib/utils';

export const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">{children}</ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

export const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn('flex touch-none select-none transition-colors', orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]', orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]', className)}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-zinc-300" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/toggle.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/toggle.tsx': `import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const toggleVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-900',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-100',
      },
      size: {
        default: 'h-10 px-3',
        sm: 'h-9 px-2.5',
        lg: 'h-11 px-5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
));
Toggle.displayName = TogglePrimitive.Root.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/toggle-group.tsx
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/toggle-group.tsx': `import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { toggleVariants } from '@/components/ui/toggle';

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({ size: 'default', variant: 'default' });

export const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root ref={ref} className={cn('flex items-center justify-center gap-1', className)} {...props}>
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

export const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);
  return (
    <ToggleGroupPrimitive.Item ref={ref} className={cn(toggleVariants({ variant: context.variant || variant, size: context.size || size }), className)} {...props}>
      {children}
    </ToggleGroupPrimitive.Item>
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/hover-card.tsx — link preview cards
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/hover-card.tsx': `import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { cn } from '@/lib/utils';

export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;

export const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn('z-50 w-64 rounded-md border border-zinc-200 bg-white p-4 text-zinc-900 shadow-md outline-none', className)}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/calendar.tsx — date picker (react-day-picker)
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/calendar.tsx': `import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(buttonVariants({ variant: 'outline' }), 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-zinc-500 rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-zinc-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(buttonVariants({ variant: 'ghost' }), 'h-9 w-9 p-0 font-normal aria-selected:opacity-100'),
        day_selected: 'bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white',
        day_today: 'bg-zinc-100 text-zinc-900',
        day_outside: 'text-zinc-400 opacity-50',
        day_disabled: 'text-zinc-400 opacity-50',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/form.tsx — react-hook-form integration
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/form.tsx': `import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export const Form = FormProvider;

type FormFieldContextValue<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = { name: TName };
const FormFieldContext = React.createContext<FormFieldContextValue>({} as any);

export const FormField = <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({ ...props }: ControllerProps<TFieldValues, TName>) => (
  <FormFieldContext.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
);

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();
  const fieldState = getFieldState(fieldContext.name, formState);
  const { id } = itemContext;
  return { id, name: fieldContext.name, formItemId: \`\${id}-form-item\`, formDescriptionId: \`\${id}-form-item-description\`, formMessageId: \`\${id}-form-item-message\`, ...fieldState };
};

type FormItemContextValue = { id: string };
const FormItemContext = React.createContext<FormItemContextValue>({} as any);

export const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  const id = React.useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = 'FormItem';

export const FormLabel = React.forwardRef<React.ElementRef<typeof Label>, React.ComponentPropsWithoutRef<typeof Label>>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();
  return <Label ref={ref} className={cn(error && 'text-red-600', className)} htmlFor={formItemId} {...props} />;
});
FormLabel.displayName = 'FormLabel';

export const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return <Slot ref={ref} id={formItemId} aria-describedby={!error ? formDescriptionId : \`\${formDescriptionId} \${formMessageId}\`} aria-invalid={!!error} {...props} />;
});
FormControl.displayName = 'FormControl';

export const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();
  return <p ref={ref} id={formDescriptionId} className={cn('text-sm text-zinc-500', className)} {...props} />;
});
FormDescription.displayName = 'FormDescription';

export const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;
  if (!body) return null;
  return <p ref={ref} id={formMessageId} className={cn('text-sm font-medium text-red-600', className)} {...props}>{body}</p>;
});
FormMessage.displayName = 'FormMessage';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/chart.tsx — recharts wrapper with responsive container
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/chart.tsx': `import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';

export type ChartConfig = { [k: string]: { label?: React.ReactNode; color?: string; icon?: React.ComponentType } };

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

export const ChartContainer = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'> & { config: ChartConfig; children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'] }>(
  ({ id, className, children, config, ...props }, ref) => (
    <ChartContext.Provider value={{ config }}>
      <div ref={ref} className={cn('flex aspect-video justify-center text-xs', className)} {...props}>
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
);
ChartContainer.displayName = 'Chart';

export const ChartTooltip = RechartsPrimitive.Tooltip;

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { active?: boolean; payload?: any[]; label?: any; hideLabel?: boolean }>(
  ({ active, payload, label, hideLabel, className, ...props }, ref) => {
    if (!active || !payload?.length) return null;
    return (
      <div ref={ref} className={cn('rounded-lg border border-zinc-200 bg-white p-3 text-xs shadow-md', className)} {...props}>
        {!hideLabel && <div className="font-semibold text-zinc-900">{label}</div>}
        <div className="grid gap-1.5">
          {payload.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: item.color || item.fill }} />
              <span className="text-zinc-500">{item.name}</span>
              <span className="ml-auto font-mono font-medium tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = 'ChartTooltipContent';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/drawer.tsx — bottom sheet (vaul)
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/drawer.tsx': `import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cn } from '@/lib/utils';

export const Drawer = ({ shouldScaleBackground = true, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = 'Drawer';

export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerPortal = DrawerPrimitive.Portal;
export const DrawerClose = DrawerPrimitive.Close;

export const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay ref={ref} className={cn('fixed inset-0 z-50 bg-black/80', className)} {...props} />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content ref={ref} className={cn('fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border border-zinc-200 bg-white', className)} {...props}>
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-zinc-100" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

export const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)} {...props} />
);
DrawerHeader.displayName = 'DrawerHeader';

export const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';

export const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

export const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={cn('text-sm text-zinc-500', className)} {...props} />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/input-otp.tsx — OTP input
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/input-otp.tsx': `import * as React from 'react';
import { OTPInput, OTPInputContext } from 'input-otp';
import { Dot } from 'lucide-react';
import { cn } from '@/lib/utils';

export const InputOTP = React.forwardRef<React.ElementRef<typeof OTPInput>, React.ComponentPropsWithoutRef<typeof OTPInput>>(
  ({ className, containerClassName, ...props }, ref) => (
    <OTPInput ref={ref} containerClassName={cn('flex items-center gap-2 has-[:disabled]:opacity-50', containerClassName)} className={cn('disabled:cursor-not-allowed', className)} {...props} />
  )
);
InputOTP.displayName = 'InputOTP';

export const InputOTPGroup = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex items-center', className)} {...props} />
);
InputOTPGroup.displayName = 'InputOTPGroup';

export const InputOTPSlot = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'> & { index: number }>(
  ({ index, className, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];
    return (
      <div ref={ref} className={cn('relative flex h-10 w-10 items-center justify-center border-y border-r border-zinc-200 text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md', isActive && 'z-10 ring-2 ring-zinc-400 ring-offset-white', className)} {...props}>
        {char}
        {hasFakeCaret && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-px animate-caret-blink bg-zinc-900 duration-1000" />
          </div>
        )}
      </div>
    );
  }
);
InputOTPSlot.displayName = 'InputOTPSlot';

export const InputOTPSeparator = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ ...props }, ref) => <div ref={ref} role="separator" {...props}><Dot /></div>
);
InputOTPSeparator.displayName = 'InputOTPSeparator';`,

  // ─────────────────────────────────────────────────────────────────────────
  // src/components/ui/sidebar.tsx — simplified sidebar (vs official 500-line version)
  // ─────────────────────────────────────────────────────────────────────────
  '/src/components/ui/sidebar.tsx': `import * as React from 'react';
import { cn } from '@/lib/utils';

type SidebarContextValue = { collapsed: boolean; setCollapsed: (v: boolean) => void; toggle: () => void };
const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within a SidebarProvider');
  return ctx;
}

export function SidebarProvider({ children, defaultCollapsed = false }: { children: React.ReactNode; defaultCollapsed?: boolean }) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle: () => setCollapsed((c) => !c) }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  const { collapsed } = useSidebar();
  return (
    <aside className={cn('flex h-full flex-col border-r border-zinc-200 bg-white transition-all duration-200', collapsed ? 'w-16' : 'w-64', className)} {...props}>
      {children}
    </aside>
  );
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex h-14 items-center border-b border-zinc-200 px-4', className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1 overflow-y-auto py-2', className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-t border-zinc-200 p-2', className)} {...props} />;
}

export function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-2 py-1', className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { collapsed } = useSidebar();
  if (collapsed) return null;
  return <div className={cn('mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500', className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('flex flex-col gap-0.5', className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn('list-none', className)} {...props} />;
}

export function SidebarMenuButton({ className, isActive, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) {
  const { collapsed } = useSidebar();
  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        isActive ? 'bg-zinc-100 font-medium text-zinc-900' : 'text-zinc-700 hover:bg-zinc-100',
        collapsed && 'justify-center',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggle } = useSidebar();
  return (
    <button onClick={toggle} className={cn('inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-zinc-100', className)} {...props}>
      <span className="sr-only">Toggle sidebar</span>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
    </button>
  );
}

export function SidebarInset({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative flex flex-1 flex-col bg-zinc-50', className)} {...props} />;
}`,

  // ═════════════════════════════════════════════════════════════════════════
  // PACK E — Tier A: shadcn faltantes (Pagination, Resizable)
  // ═════════════════════════════════════════════════════════════════════════

  '/src/components/ui/pagination.tsx': `import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonProps } from '@/components/ui/button';

export const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav role="navigation" aria-label="pagination" className={cn('mx-auto flex w-full justify-center', className)} {...props} />
);
Pagination.displayName = 'Pagination';

export const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => <ul ref={ref} className={cn('flex flex-row items-center gap-1', className)} {...props} />
);
PaginationContent.displayName = 'PaginationContent';

export const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn('', className)} {...props} />
);
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = { isActive?: boolean } & Pick<ButtonProps, 'size'> & React.ComponentProps<'a'>;

export const PaginationLink = ({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) => (
  <a aria-current={isActive ? 'page' : undefined} className={cn(buttonVariants({ variant: isActive ? 'outline' : 'ghost', size }), 'cursor-pointer', className)} {...props} />
);
PaginationLink.displayName = 'PaginationLink';

export const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to previous page" size="default" className={cn('gap-1 pl-2.5', className)} {...props}>
    <ChevronLeft className="h-4 w-4" />
    <span>Anterior</span>
  </PaginationLink>
);
PaginationPrevious.displayName = 'PaginationPrevious';

export const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to next page" size="default" className={cn('gap-1 pr-2.5', className)} {...props}>
    <span>Siguiente</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = 'PaginationNext';

export const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span aria-hidden className={cn('flex h-9 w-9 items-center justify-center', className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';`,

  '/src/components/ui/resizable.tsx': `import { GripVertical } from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';
import { cn } from '@/lib/utils';

export const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)} {...props} />
);
ResizablePanelGroup.displayName = 'ResizablePanelGroup';

export const ResizablePanel = ResizablePrimitive.Panel;

export const ResizableHandle = ({ withHandle, className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & { withHandle?: boolean }) => (
  <ResizablePrimitive.PanelResizeHandle className={cn('relative flex w-px items-center justify-center bg-zinc-200 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90', className)} {...props}>
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-zinc-200 bg-white">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);
ResizableHandle.displayName = 'ResizableHandle';`,

  // ═════════════════════════════════════════════════════════════════════════
  // PACK E — Tier B: composition recipes (Combobox, DatePicker, MultiSelect, etc)
  // ═════════════════════════════════════════════════════════════════════════

  '/src/components/ui/combobox.tsx': `import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface ComboboxOption { value: string; label: string; }
interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function Combobox({ options, value, onChange, placeholder = 'Selecciona...', emptyText = 'Sin resultados.', searchPlaceholder = 'Buscar...', className }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn('w-full justify-between', className)}>
          {selected ? selected.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} value={option.value} onSelect={(curr) => { onChange?.(curr === value ? '' : curr); setOpen(false); }}>
                  <Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}`,

  '/src/components/ui/date-picker.tsx': `import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date?: Date) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ date, onDateChange, placeholder = 'Selecciona una fecha', className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-zinc-500', className)}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onDateChange} initialFocus />
      </PopoverContent>
    </Popover>
  );
}`,

  '/src/components/ui/date-range-picker.tsx': `import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangePickerProps {
  range?: DateRange;
  onRangeChange?: (range?: DateRange) => void;
  className?: string;
}

export function DateRangePicker({ range, onRangeChange, className }: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !range && 'text-zinc-500', className)}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {range?.from ? (range.to ? <>{format(range.from, 'LLL dd, y')} - {format(range.to, 'LLL dd, y')}</> : format(range.from, 'LLL dd, y')) : <span>Selecciona un rango</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" selected={range} onSelect={onRangeChange} numberOfMonths={2} />
      </PopoverContent>
    </Popover>
  );
}`,

  '/src/components/ui/multi-select.tsx': `import * as React from 'react';
import { X, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface MultiSelectOption { value: string; label: string; }
interface MultiSelectProps {
  options: MultiSelectOption[];
  values?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, values = [], onChange, placeholder = 'Selecciona items...', className }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const toggle = (v: string) => onChange?.(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={cn('w-full justify-between h-auto min-h-10 py-2', className)}>
          <div className="flex flex-wrap gap-1">
            {values.length === 0 && <span className="text-zinc-500">{placeholder}</span>}
            {values.map((v) => {
              const opt = options.find((o) => o.value === v);
              return (
                <Badge key={v} variant="secondary" className="mr-1 gap-1">
                  {opt?.label ?? v}
                  <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); toggle(v); }} className="ml-0.5 cursor-pointer rounded-full p-0.5 hover:bg-zinc-300">
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              );
            })}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} onSelect={() => toggle(option.value)}>
                  <Check className={cn('mr-2 h-4 w-4', values.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}`,

  '/src/components/ui/tags-input.tsx': `import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TagsInputProps {
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
}

export function TagsInput({ tags = [], onTagsChange, placeholder = 'Añade tag y Enter...', className, maxTags }: TagsInputProps) {
  const [input, setInput] = React.useState('');
  const add = (val: string) => {
    const t = val.trim();
    if (!t || tags.includes(t) || (maxTags && tags.length >= maxTags)) return;
    onTagsChange?.([...tags, t]);
    setInput('');
  };
  const remove = (t: string) => onTagsChange?.(tags.filter((x) => x !== t));
  return (
    <div className={cn('flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1.5', className)}>
      {tags.map((t) => (
        <Badge key={t} variant="secondary" className="gap-1">
          {t}
          <button type="button" onClick={() => remove(t)} className="rounded-full p-0.5 hover:bg-zinc-300">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }
          else if (e.key === 'Backspace' && !input && tags.length > 0) remove(tags[tags.length - 1]);
        }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] border-0 bg-transparent text-sm outline-none placeholder:text-zinc-400"
      />
    </div>
  );
}`,

  '/src/components/ui/file-upload.tsx': `import * as React from 'react';
import { Upload, File as FileIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  className?: string;
}

export function FileUpload({ onFilesChange, accept, multiple = true, maxSizeMb = 10, className }: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const accept_ = accept;
  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming).filter((f) => f.size <= maxSizeMb * 1024 * 1024);
    const next = multiple ? [...files, ...arr] : arr;
    setFiles(next);
    onFilesChange?.(next);
  };
  const remove = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    onFilesChange?.(next);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-6 py-10 text-center transition-colors cursor-pointer', dragging && 'border-zinc-900 bg-zinc-50', !dragging && 'hover:border-zinc-400 hover:bg-zinc-50')}
      >
        <Upload className="h-8 w-8 text-zinc-400" />
        <p className="text-sm font-medium text-zinc-700">Arrastra archivos o haz click</p>
        <p className="text-xs text-zinc-500">Máx {maxSizeMb}MB{accept_ ? \` · \${accept_}\` : ''}</p>
        <input ref={inputRef} type="file" accept={accept_} multiple={multiple} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm">
              <FileIcon className="h-4 w-4 text-zinc-500" />
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-xs text-zinc-500">{(f.size / 1024).toFixed(1)} KB</span>
              <button type="button" onClick={() => remove(i)} className="rounded p-1 hover:bg-zinc-100"><X className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}`,

  '/src/components/ui/copy-button.tsx': `import * as React from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

interface CopyButtonProps extends React.ComponentProps<typeof Button> {
  value: string;
  successMessage?: string;
}

export function CopyButton({ value, successMessage = 'Copiado', className, ...props }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(successMessage);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" onClick={copy} className={cn('h-7 w-7', className)} {...props}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="sr-only">Copy</span>
    </Button>
  );
}`,

  // ═════════════════════════════════════════════════════════════════════════
  // PACK E — Tier C: Magic UI essentials
  // ═════════════════════════════════════════════════════════════════════════

  '/src/components/ui/marquee.tsx': `import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({ children, className, reverse, pauseOnHover, vertical, repeat = 4 }: MarqueeProps) {
  return (
    <div className={cn('group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]', vertical ? 'flex-col' : 'flex-row', className)}>
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn('flex shrink-0 justify-around [gap:var(--gap)]', vertical ? 'animate-marquee-vertical flex-col' : 'animate-marquee flex-row', pauseOnHover && 'group-hover:[animation-play-state:paused]', reverse && '[animation-direction:reverse]')}
        >
          {children}
        </div>
      ))}
      <style>{\`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(calc(-100% - var(--gap))) } }
        @keyframes marquee-vertical { from { transform: translateY(0) } to { transform: translateY(calc(-100% - var(--gap))) } }
        .animate-marquee { animation: marquee var(--duration) linear infinite }
        .animate-marquee-vertical { animation: marquee-vertical var(--duration) linear infinite }
      \`}</style>
    </div>
  );
}`,

  '/src/components/ui/number-ticker.tsx': `import * as React from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NumberTickerProps {
  value: number;
  direction?: 'up' | 'down';
  className?: string;
  delay?: number;
  decimalPlaces?: number;
}

export function NumberTicker({ value, direction = 'up', delay = 0, className, decimalPlaces = 0 }: NumberTickerProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : 0);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  React.useEffect(() => {
    if (isInView) {
      setTimeout(() => motionValue.set(direction === 'down' ? 0 : value), delay * 1000);
    }
  }, [motionValue, isInView, delay, value, direction]);

  React.useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat('en-US', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces }).format(Number(latest.toFixed(decimalPlaces)));
      }
    });
  }, [springValue, decimalPlaces]);

  return <span ref={ref} className={cn('inline-block tabular-nums', className)}>0</span>;
}`,

  '/src/components/ui/border-beam.tsx': `import { cn } from '@/lib/utils';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({ className, size = 200, duration = 15, delay = 0, colorFrom = '#a855f7', colorTo = '#3b82f6' }: BorderBeamProps) {
  return (
    <div
      style={{
        '--size': size,
        '--duration': \`\${duration}s\`,
        '--delay': \`\${-delay}s\`,
        '--color-from': colorFrom,
        '--color-to': colorTo,
      } as React.CSSProperties}
      className={cn('pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(2px)_solid_transparent] ![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)] after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:90%_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]', className)}>
      <style>{\`
        @keyframes border-beam { 100% { offset-distance: 100% } }
        .animate-border-beam { animation: border-beam var(--duration) infinite linear }
      \`}</style>
    </div>
  );
}`,

  '/src/components/ui/animated-gradient-text.tsx': `import { cn } from '@/lib/utils';

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedGradientText({ children, className }: AnimatedGradientTextProps) {
  return (
    <span className={cn('inline-block animate-gradient-text bg-[linear-gradient(to_right,#a855f7,#3b82f6,#06b6d4,#a855f7)] bg-[length:200%_auto] bg-clip-text font-medium text-transparent', className)}>
      {children}
      <style>{\`
        @keyframes gradient-text { 0%, 100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
        .animate-gradient-text { animation: gradient-text 4s ease infinite }
      \`}</style>
    </span>
  );
}`,

  '/src/components/ui/spotlight.tsx': `import * as React from 'react';
import { cn } from '@/lib/utils';

interface SpotlightProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function Spotlight({ children, className, color = 'rgba(168, 85, 247, 0.15)' }: SpotlightProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [hover, setHover] = React.useState(false);
  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} className={cn('relative overflow-hidden', className)}>
      <div className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300" style={{ opacity: hover ? 1 : 0, background: \`radial-gradient(600px circle at \${pos.x}px \${pos.y}px, \${color}, transparent 40%)\` }} />
      <div className="relative">{children}</div>
    </div>
  );
}`,

  // ═════════════════════════════════════════════════════════════════════════
  // PACK E — Tier D: Genesis brand
  // ═════════════════════════════════════════════════════════════════════════

  '/src/components/ui/aether-card.tsx': `import * as React from 'react';
import { cn } from '@/lib/utils';

interface AetherCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark' | 'iridescent';
}

/**
 * Aether glassmorphism card — el patrón estético signature de Creator IA Pro.
 * Combina backdrop-blur agresivo + borde translúcido + glow púrpura sutil.
 */
export const AetherCard = React.forwardRef<HTMLDivElement, AetherCardProps>(
  ({ className, variant = 'light', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative rounded-2xl border transition-all duration-300',
        variant === 'light' && 'bg-white/40 backdrop-blur-2xl border-white/50 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.4)_inset,0_0_20px_-5px_rgba(168,85,247,0.1)]',
        variant === 'dark' && 'bg-zinc-900/80 backdrop-blur-2xl border-white/10 text-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset,0_0_30px_-10px_rgba(168,85,247,0.2)]',
        variant === 'iridescent' && 'bg-gradient-to-br from-white/60 via-purple-50/40 to-blue-50/40 backdrop-blur-2xl border-white/60 shadow-[0_8px_32px_-4px_rgba(168,85,247,0.15)]',
        className,
      )}
      {...props}
    />
  )
);
AetherCard.displayName = 'AetherCard';

export function AetherCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}
export function AetherCardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-xl font-bold tracking-tight', className)} {...props} />;
}
export function AetherCardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}`,

  // ═════════════════════════════════════════════════════════════════════════
  // PACK E — Tier E: extras decorativos
  // ═════════════════════════════════════════════════════════════════════════

  '/src/components/ui/meteors.tsx': `import { cn } from '@/lib/utils';

interface MeteorsProps {
  number?: number;
  className?: string;
}

export function Meteors({ number = 20, className }: MeteorsProps) {
  const meteors = Array.from({ length: number });
  return (
    <>
      {meteors.map((_, i) => (
        <span
          key={i}
          className={cn('pointer-events-none absolute left-1/2 top-1/2 h-0.5 w-0.5 rotate-[215deg] animate-meteor-effect rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10]', className)}
          style={{
            top: \`\${Math.random() * 100}%\`,
            left: \`\${Math.random() * 100}%\`,
            animationDelay: Math.random() * 4 + 's',
            animationDuration: 2 + Math.random() * 8 + 's',
          }}
        >
          <span className="absolute left-0 top-1/2 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-slate-500 to-transparent" />
        </span>
      ))}
      <style>{\`
        @keyframes meteor-effect {
          0% { transform: rotate(215deg) translateX(0); opacity: 1 }
          70% { opacity: 1 }
          100% { transform: rotate(215deg) translateX(-500px); opacity: 0 }
        }
        .animate-meteor-effect { animation: meteor-effect linear infinite }
      \`}</style>
    </>
  );
}`,

  '/src/components/ui/retro-grid.tsx': `import { cn } from '@/lib/utils';

interface RetroGridProps {
  className?: string;
  angle?: number;
}

export function RetroGrid({ className, angle = 65 }: RetroGridProps) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden opacity-50 [perspective:200px]', className)} style={{ '--grid-angle': \`\${angle}deg\` } as React.CSSProperties}>
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="animate-grid [background-image:linear-gradient(to_right,rgba(168,85,247,0.3)_1px,transparent_0),linear-gradient(to_bottom,rgba(168,85,247,0.3)_1px,transparent_0)] [background-repeat:repeat] [background-size:60px_60px] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent to-90% dark:from-black" />
      <style>{\`
        @keyframes grid { 0% { transform: translateY(-50%) } 100% { transform: translateY(0) } }
        .animate-grid { animation: grid 15s linear infinite }
      \`}</style>
    </div>
  );
}`,

  '/src/components/ui/animated-beam.tsx': `import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLElement>;
  fromRef: React.RefObject<HTMLElement>;
  toRef: React.RefObject<HTMLElement>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  pathColor?: string;
  gradientStartColor?: string;
  gradientStopColor?: string;
}

export function AnimatedBeam({ className, containerRef, fromRef, toRef, curvature = 0, reverse = false, duration = 5, pathColor = '#e4e4e7', gradientStartColor = '#a855f7', gradientStopColor = '#3b82f6' }: AnimatedBeamProps) {
  const id = React.useId();
  const [path, setPath] = React.useState({ d: '', w: 0, h: 0 });

  const update = React.useCallback(() => {
    if (!containerRef.current || !fromRef.current || !toRef.current) return;
    const c = containerRef.current.getBoundingClientRect();
    const a = fromRef.current.getBoundingClientRect();
    const b = toRef.current.getBoundingClientRect();
    const x1 = a.left - c.left + a.width / 2;
    const y1 = a.top - c.top + a.height / 2;
    const x2 = b.left - c.left + b.width / 2;
    const y2 = b.top - c.top + b.height / 2;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2 - curvature;
    setPath({ d: \`M \${x1} \${y1} Q \${cx} \${cy} \${x2} \${y2}\`, w: c.width, h: c.height });
  }, [containerRef, fromRef, toRef, curvature]);

  React.useLayoutEffect(() => { update(); }, [update]);
  React.useEffect(() => { window.addEventListener('resize', update); return () => window.removeEventListener('resize', update); }, [update]);

  return (
    <svg className={cn('pointer-events-none absolute left-0 top-0', className)} width={path.w} height={path.h} fill="none">
      <path d={path.d} stroke={pathColor} strokeWidth={2} strokeOpacity={0.2} />
      <path d={path.d} stroke={\`url(#\${id})\`} strokeWidth={2} strokeLinecap="round" />
      <defs>
        <motion.linearGradient id={id} gradientUnits="userSpaceOnUse" initial={reverse ? { x1: '100%', y1: '0', x2: '110%', y2: '0' } : { x1: '0', y1: '0', x2: '10%', y2: '0' }} animate={reverse ? { x1: ['100%', '-10%'], y1: ['0', '0'], x2: ['110%', '0%'], y2: ['0', '0'] } : { x1: ['0', '110%'], y1: ['0', '0'], x2: ['10%', '120%'], y2: ['0', '0'] }} transition={{ duration, repeat: Infinity, ease: 'linear' }}>
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}`,

  '/src/components/ui/text-reveal.tsx': `import * as React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TextRevealProps {
  text: string;
  className?: string;
}

export function TextReveal({ text, className }: TextRevealProps) {
  const targetRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ['start 0.7', 'start 0.2'] });
  const words = text.split(' ');
  return (
    <div ref={targetRef} className={cn('relative z-0 h-[150vh]', className)}>
      <div className="sticky top-0 mx-auto flex h-screen max-w-4xl items-center bg-transparent px-6">
        <p className="flex flex-wrap p-5 text-2xl font-bold md:text-3xl lg:text-4xl">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            return <Word key={i} progress={scrollYProgress} range={[start, end]}>{word}</Word>;
          })}
        </p>
      </div>
    </div>
  );
}

function Word({ children, progress, range }: { children: React.ReactNode; progress: any; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className="relative mx-1 lg:mx-1.5">
      <span className="absolute opacity-30">{children}</span>
      <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  );
}`,

  // ═════════════════════════════════════════════════════════════════════════
  // PACK F — Page scaffolds (auth, pricing, 404)
  // La IA puede importar tal cual o usarlos como starting point
  // ═════════════════════════════════════════════════════════════════════════

  '/src/scaffolds/login-page.tsx': `import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';

export function LoginPage({ onLogin }: { onLogin?: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin?.(email, password);
      toast.success('Sesión iniciada');
    } catch (err: any) {
      toast.error(err?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Bienvenido de vuelta</h1>
          <p className="text-sm text-zinc-500">Inicia sesión con tu cuenta</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link to="/reset-password" className="text-xs text-zinc-500 hover:text-zinc-900">¿Olvidaste?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          ¿No tienes cuenta? <Link to="/signup" className="font-medium text-zinc-900 hover:underline">Regístrate</Link>
        </p>
      </Card>
    </div>
  );
}`,

  '/src/scaffolds/signup-page.tsx': `import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/sonner';

export function SignupPage({ onSignup }: { onSignup?: (data: { name: string; email: string; password: string }) => Promise<void> }) {
  const [data, setData] = useState({ name: '', email: '', password: '' });
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) return toast.error('Acepta los términos para continuar');
    setLoading(true);
    try {
      await onSignup?.(data);
      toast.success('Cuenta creada');
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
          <p className="text-sm text-zinc-500">Empieza gratis en menos de un minuto</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input id="name" required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Tu nombre" className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input id="email" type="email" required value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="tu@correo.com" className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input id="password" type="password" required minLength={8} value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} placeholder="Mínimo 8 caracteres" className="pl-10" />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox id="terms" checked={agree} onCheckedChange={(v) => setAgree(v === true)} />
            <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
              Acepto los <a href="/terms" className="underline">términos</a> y la <a href="/privacy" className="underline">política de privacidad</a>
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando...' : 'Crear cuenta'} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          ¿Ya tienes cuenta? <Link to="/login" className="font-medium text-zinc-900 hover:underline">Inicia sesión</Link>
        </p>
      </Card>
    </div>
  );
}`,

  '/src/scaffolds/reset-password-page.tsx': `import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';

export function ResetPasswordPage({ onReset }: { onReset?: (email: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onReset?.(email);
      setSent(true);
      toast.success('Email de recuperación enviado');
    } catch (err: any) {
      toast.error(err?.message || 'Error al enviar email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Recupera tu contraseña</h1>
          <p className="text-sm text-zinc-500">Te enviaremos un email con instrucciones</p>
        </div>
        {sent ? (
          <Alert>
            <AlertDescription>
              Si <strong>{email}</strong> está registrado, recibirás un email en breve. Revisa tu spam.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="pl-10" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar email'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}`,

  '/src/scaffolds/pricing-page.tsx': `import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

export interface PricingPlan {
  name: string;
  price: { monthly: number; annual: number };
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const defaultPlans: PricingPlan[] = [
  { name: 'Free', price: { monthly: 0, annual: 0 }, description: 'Para empezar a probar', features: ['1 proyecto', '10 generaciones/mes', 'Soporte por email'], cta: 'Empezar gratis' },
  { name: 'Pro', price: { monthly: 29, annual: 290 }, description: 'Para profesionales', features: ['Proyectos ilimitados', '500 generaciones/mes', 'Soporte prioritario', 'Exportar a GitHub'], cta: 'Probar Pro', highlighted: true },
  { name: 'Business', price: { monthly: 99, annual: 990 }, description: 'Para equipos grandes', features: ['Todo de Pro', '2000 generaciones/mes', 'Soporte 24/7', 'SSO + API access'], cta: 'Contactar ventas' },
];

export function PricingPage({ plans = defaultPlans, currency = '$' }: { plans?: PricingPlan[]; currency?: string }) {
  const [annual, setAnnual] = useState(false);
  return (
    <div className="min-h-screen bg-zinc-50 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Planes simples</h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">Sin cargos ocultos. Cancela cuando quieras.</p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={annual ? 'text-zinc-500' : 'font-medium'}>Mensual</span>
            <Switch checked={annual} onCheckedChange={setAnnual} />
            <span className={annual ? 'font-medium' : 'text-zinc-500'}>Anual <Badge variant="secondary" className="ml-1">-20%</Badge></span>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={\`p-8 space-y-6 relative \${plan.highlighted ? 'border-zinc-900 shadow-xl scale-105' : ''}\`}>
              {plan.highlighted && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Más popular</Badge>}
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{plan.description}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{currency}{annual ? plan.price.annual : plan.price.monthly}</span>
                  <span className="text-zinc-500">/{annual ? 'año' : 'mes'}</span>
                </div>
              </div>
              <Button className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>{plan.cta}</Button>
              <ul className="space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-zinc-900 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}`,

  '/src/scaffolds/not-found-page.tsx': `import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-9xl font-bold text-zinc-900 tracking-tighter">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Página no encontrada</h2>
          <p className="text-zinc-500">La página que buscas no existe o fue movida.</p>
        </div>
        <div className="flex gap-3 justify-center pt-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <Button asChild>
            <Link to="/"><Home className="mr-2 h-4 w-4" /> Ir al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}`,

  // ═════════════════════════════════════════════════════════════════════════
  // PACK G — Supabase auto-conectado
  // El cliente se inyecta dinámicamente en sandpack-simple.ts si el user
  // configuró Supabase via StudioCloud. Aquí dejamos los HOOKS y helpers.
  // ═════════════════════════════════════════════════════════════════════════

  '/src/hooks/use-supabase.ts': `import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Hook para obtener el usuario actual y suscribirse a cambios de auth.
 * Auto-loading, auto-update cuando login/logout sucede.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, signOut: () => supabase.auth.signOut() };
}

/**
 * Hook para la sesión actual completa (más datos que useUser).
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}

/**
 * Helpers de auth para uso directo.
 */
export const auth = {
  signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
  signUp: (email: string, password: string) => supabase.auth.signUp({ email, password }),
  signOut: () => supabase.auth.signOut(),
  resetPassword: (email: string) => supabase.auth.resetPasswordForEmail(email),
  signInWithGoogle: () => supabase.auth.signInWithOAuth({ provider: 'google' }),
  signInWithGitHub: () => supabase.auth.signInWithOAuth({ provider: 'github' }),
};`,

  // ═════════════════════════════════════════════════════════════════════════
  // PACK H — Magic UI extras (10 componentes)
  // ═════════════════════════════════════════════════════════════════════════

  '/src/components/ui/sparkles.tsx': `import * as React from 'react';
import { cn } from '@/lib/utils';

interface SparklesProps {
  children: React.ReactNode;
  className?: string;
  density?: number;
}

export function Sparkles({ children, className, density = 12 }: SparklesProps) {
  const [particles, setParticles] = React.useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const ref = React.useRef<HTMLDivElement>(null);

  const spawn = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const newParticles = Array.from({ length: density }).map((_, i) => ({
      id: Date.now() + i,
      x: e.clientX - r.left + (Math.random() - 0.5) * 60,
      y: e.clientY - r.top + (Math.random() - 0.5) * 60,
      size: 2 + Math.random() * 4,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => !newParticles.includes(p))), 800);
  };

  return (
    <div ref={ref} onMouseEnter={spawn} className={cn('relative inline-block', className)}>
      {children}
      {particles.map((p) => (
        <span
          key={p.id}
          className="pointer-events-none absolute animate-sparkle"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size, background: 'radial-gradient(circle, #a855f7, transparent)', borderRadius: '50%' }}
        />
      ))}
      <style>{\`
        @keyframes sparkle { 0% { transform: scale(0); opacity: 1 } 50% { transform: scale(1); opacity: 1 } 100% { transform: scale(0); opacity: 0 } }
        .animate-sparkle { animation: sparkle 0.8s ease-out forwards }
      \`}</style>
    </div>
  );
}`,

  '/src/components/ui/flip-words.tsx': `import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlipWordsProps {
  words: string[];
  duration?: number;
  className?: string;
}

export function FlipWords({ words, duration = 3000, className }: FlipWordsProps) {
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), duration);
    return () => clearInterval(id);
  }, [words.length, duration]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={words[index]}
        initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
        transition={{ duration: 0.4 }}
        className={cn('inline-block', className)}
      >
        {words[index]}
      </motion.span>
    </AnimatePresence>
  );
}`,

  '/src/components/ui/word-rotate.tsx': `import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WordRotateProps {
  words: string[];
  duration?: number;
  className?: string;
}

export function WordRotate({ words, duration = 2500, className }: WordRotateProps) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % words.length), duration);
    return () => clearInterval(id);
  }, [words.length, duration]);
  return (
    <div className="overflow-hidden inline-block py-1">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[i]}
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '-100%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('inline-block', className)}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}`,

  '/src/components/ui/typing-animation.tsx': `import * as React from 'react';
import { cn } from '@/lib/utils';

interface TypingAnimationProps {
  text: string;
  duration?: number;
  className?: string;
}

export function TypingAnimation({ text, duration = 50, className }: TypingAnimationProps) {
  const [displayed, setDisplayed] = React.useState('');
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (i < text.length) {
      const id = setTimeout(() => {
        setDisplayed((d) => d + text[i]);
        setI((p) => p + 1);
      }, duration);
      return () => clearTimeout(id);
    }
  }, [i, text, duration]);
  return <span className={cn('font-display', className)}>{displayed}<span className="ml-0.5 inline-block h-[1em] w-px bg-current animate-pulse" /></span>;
}`,

  '/src/components/ui/confetti-button.tsx': `import * as React from 'react';
import { Button } from '@/components/ui/button';

interface ConfettiButtonProps extends React.ComponentProps<typeof Button> {
  particleCount?: number;
}

export function ConfettiButton({ children, particleCount = 50, onClick, ...props }: ConfettiButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [particles, setParticles] = React.useState<Array<{ id: number; x: number; y: number; color: string; vx: number; vy: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const colors = ['#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
      const newParts = Array.from({ length: particleCount }).map((_, i) => ({
        id: Date.now() + i,
        x: cx,
        y: cy,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 400,
        vy: -Math.random() * 400 - 100,
      }));
      setParticles((prev) => [...prev, ...newParts]);
      setTimeout(() => setParticles((prev) => prev.filter((p) => !newParts.find((n) => n.id === p.id))), 2000);
    }
    onClick?.(e);
  };

  return (
    <>
      <Button ref={buttonRef} onClick={handleClick} {...props}>{children}</Button>
      {particles.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[9999]">
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute animate-confetti rounded-sm"
              style={{ left: p.x, top: p.y, width: 8, height: 8, background: p.color, ['--vx' as any]: \`\${p.vx}px\`, ['--vy' as any]: \`\${p.vy}px\` } as React.CSSProperties}
            />
          ))}
        </div>
      )}
      <style>{\`
        @keyframes confetti { 0% { transform: translate(0,0) rotate(0); opacity: 1 } 100% { transform: translate(var(--vx),calc(var(--vy) + 600px)) rotate(720deg); opacity: 0 } }
        .animate-confetti { animation: confetti 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards }
      \`}</style>
    </>
  );
}`,

  '/src/components/ui/shimmer-button.tsx': `import * as React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  background?: string;
  shimmerDuration?: string;
  borderRadius?: string;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({ shimmerColor = '#ffffff', shimmerSize = '0.05em', shimmerDuration = '3s', background = 'rgba(0, 0, 0, 1)', borderRadius = '100px', className, children, ...props }, ref) => (
    <button
      ref={ref}
      style={{ '--spread': '90deg', '--shimmer-color': shimmerColor, '--radius': borderRadius, '--speed': shimmerDuration, '--cut': shimmerSize, '--bg': background } as React.CSSProperties}
      className={cn('group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white [background:var(--bg)] [border-radius:var(--radius)] transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px', className)}
      {...props}
    >
      <div className="-z-30 blur-[2px] absolute inset-0 overflow-visible [container-type:size]">
        <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
          <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
        </div>
      </div>
      {children}
      <div className="insert-0 absolute size-full rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f] transform-gpu transition-all duration-300 ease-in-out group-hover:shadow-[inset_0_-6px_10px_#ffffff3f] group-active:shadow-[inset_0_-10px_10px_#ffffff3f]" />
      <div className="absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]" />
      <style>{\`
        @keyframes shimmer-slide { to { transform: translate(calc(100cqw - 100%), 0) } }
        @keyframes spin-around { 0% { transform: translateZ(0) rotate(0) } 15%, 35% { transform: translateZ(0) rotate(90deg) } 65%, 85% { transform: translateZ(0) rotate(270deg) } 100% { transform: translateZ(0) rotate(360deg) } }
        .animate-shimmer-slide { animation: shimmer-slide var(--speed) ease-in-out infinite alternate }
        .animate-spin-around { animation: spin-around calc(var(--speed) * 2) infinite linear }
      \`}</style>
    </button>
  )
);
ShimmerButton.displayName = 'ShimmerButton';`,

  '/src/components/ui/rainbow-button.tsx': `import * as React from 'react';
import { cn } from '@/lib/utils';

interface RainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'group relative inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-[length:200%] px-8 py-2 font-medium text-white transition-colors',
        'before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(0_100%_70%),hsl(60_100%_70%),hsl(120_100%_70%),hsl(180_100%_70%),hsl(240_100%_70%),hsl(300_100%_70%))] before:[filter:blur(calc(0.8*1rem))]',
        'bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,hsl(0_100%_70%),hsl(60_100%_70%),hsl(120_100%_70%),hsl(180_100%_70%),hsl(240_100%_70%),hsl(300_100%_70%))] animate-rainbow',
        className,
      )}
      {...props}
    >
      {children}
      <style>{\`
        @keyframes rainbow { 0% { background-position: 0% } 100% { background-position: 200% } }
        .animate-rainbow { animation: rainbow 2s infinite linear }
      \`}</style>
    </button>
  )
);
RainbowButton.displayName = 'RainbowButton';`,

  '/src/components/ui/particles.tsx': `import * as React from 'react';
import { cn } from '@/lib/utils';

interface ParticlesProps {
  className?: string;
  quantity?: number;
  color?: string;
  size?: number;
}

export function Particles({ className, quantity = 50, color = '#a855f7', size = 1 }: ParticlesProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: quantity }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * size + 0.5,
      alpha: Math.random(),
    }));
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.fillStyle = color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [quantity, color, size]);

  return <canvas ref={canvasRef} className={cn('pointer-events-none absolute inset-0', className)} />;
}`,

  '/src/components/ui/grid-pattern.tsx': `import { cn } from '@/lib/utils';

interface GridPatternProps {
  width?: number;
  height?: number;
  className?: string;
  strokeDasharray?: string;
}

export function GridPattern({ width = 40, height = 40, className, strokeDasharray = '0' }: GridPatternProps) {
  return (
    <svg className={cn('pointer-events-none absolute inset-0 h-full w-full fill-zinc-300/30 stroke-zinc-300/30', className)} aria-hidden>
      <defs>
        <pattern id="grid-pattern" x="0" y="0" width={width} height={height} patternUnits="userSpaceOnUse">
          <path d={\`M.5 \${height}V.5H\${width}\`} fill="none" strokeDasharray={strokeDasharray} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
}`,

  '/src/components/ui/dot-pattern.tsx': `import { cn } from '@/lib/utils';

interface DotPatternProps {
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  className?: string;
}

export function DotPattern({ width = 16, height = 16, cx = 1, cy = 1, cr = 1, className }: DotPatternProps) {
  return (
    <svg className={cn('pointer-events-none absolute inset-0 h-full w-full fill-zinc-400/40', className)} aria-hidden>
      <defs>
        <pattern id="dot-pattern" x="0" y="0" width={width} height={height} patternUnits="userSpaceOnUse">
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-pattern)" />
    </svg>
  );
}`,

  '/src/components/ui/sonner.tsx': `import { Toaster as SonnerToaster, toast } from 'sonner';

export const Toaster = (props: React.ComponentProps<typeof SonnerToaster>) => (
  <SonnerToaster
    position="top-right"
    toastOptions={{
      classNames: {
        toast: 'group toast group-[.toaster]:bg-white group-[.toaster]:text-zinc-900 group-[.toaster]:border-zinc-200 group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-zinc-500',
        actionButton: 'group-[.toast]:bg-zinc-900 group-[.toast]:text-white',
        cancelButton: 'group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-500',
      },
    }}
    {...props}
  />
);

export { toast };`,

  '/src/components/ui/dialog.tsx': `import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-zinc-200 bg-white p-6 shadow-lg duration-200 sm:rounded-lg',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-400">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-zinc-500', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;`,
};

// Dependencies the shadcn components need at runtime
export const SHADCN_DEPENDENCIES: Record<string, string> = {
  'clsx': '^2.1.1',
  'tailwind-merge': '^2.5.4',
  'class-variance-authority': '^0.7.1',
  'sonner': '^1.7.1',
  'cmdk': '^1.0.4',
  'embla-carousel-react': '^8.5.1',
  'vaul': '^1.1.2',
  'input-otp': '^1.4.1',
  'react-day-picker': '^8.10.1',
  'date-fns': '^4.1.0',
  'react-hook-form': '^7.54.2',
  '@hookform/resolvers': '^3.10.0',
  'zod': '^3.24.1',
  'recharts': '^2.15.0',
  'react-router-dom': '^6.28.0',
  // Pack E additions
  'react-resizable-panels': '^2.1.7',
  'zustand': '^5.0.2',
  '@tanstack/react-query': '^5.62.7',
  // Pack G additions
  '@supabase/supabase-js': '^2.47.10',
  // Radix primitives
  '@radix-ui/react-slot': '^1.1.1',
  '@radix-ui/react-label': '^2.1.1',
  '@radix-ui/react-separator': '^1.1.1',
  '@radix-ui/react-tabs': '^1.1.2',
  '@radix-ui/react-dialog': '^1.1.4',
  '@radix-ui/react-accordion': '^1.2.2',
  '@radix-ui/react-avatar': '^1.1.2',
  '@radix-ui/react-checkbox': '^1.1.3',
  '@radix-ui/react-switch': '^1.1.2',
  '@radix-ui/react-select': '^2.1.4',
  '@radix-ui/react-tooltip': '^1.1.6',
  '@radix-ui/react-popover': '^1.1.4',
  '@radix-ui/react-dropdown-menu': '^2.1.4',
  '@radix-ui/react-progress': '^1.1.1',
  '@radix-ui/react-navigation-menu': '^1.2.3',
  '@radix-ui/react-menubar': '^1.1.4',
  '@radix-ui/react-context-menu': '^2.2.4',
  '@radix-ui/react-alert-dialog': '^1.1.4',
  '@radix-ui/react-collapsible': '^1.1.2',
  '@radix-ui/react-aspect-ratio': '^1.1.1',
  '@radix-ui/react-radio-group': '^1.2.2',
  '@radix-ui/react-slider': '^1.2.2',
  '@radix-ui/react-scroll-area': '^1.2.2',
  '@radix-ui/react-toggle': '^1.1.1',
  '@radix-ui/react-toggle-group': '^1.1.1',
  '@radix-ui/react-hover-card': '^1.1.4',
};
