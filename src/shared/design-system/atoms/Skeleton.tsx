export interface SkeletonProps {
  lines: number
}

/**
 * Decorative loading placeholder. Purely visual (`aria-hidden`) -- the
 * surrounding container is responsible for announcing the loading state via
 * its own translated text or a live region.
 */
export function Skeleton({ lines }: SkeletonProps) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: lines }, (_, index) => (
        <span
          key={index}
          className="h-4 animate-pulse rounded bg-surface-raised"
        />
      ))}
    </div>
  )
}
