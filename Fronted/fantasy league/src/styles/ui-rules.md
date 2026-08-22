# UI Development Rules

Always prefer shadcn/ui components.

Priority:

1. shadcn/ui
2. Tailwind utilities
3. Custom component

Never build a button if shadcn Button exists.

Never build Dialog manually.

Never build Dropdown manually.

Use:

- Button
- Card
- Sheet
- Dialog
- Popover
- Badge
- Avatar
- Input
- Select
- Tooltip
- Tabs
- ScrollArea
- Skeleton
- Separator

Avoid:

- Inline styles
- Random colors
- CSS files
- Hardcoded spacing

Spacing:
8px system

Use:
gap-2
gap-4
gap-6
gap-8

Container:
max-w-7xl

Cards:
rounded-xl
border
bg-card

Transitions:
duration-150
ease-out

Icons:
lucide-react only