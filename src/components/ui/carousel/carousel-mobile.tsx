
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useCarousel } from "./carousel-context"
import { Carousel } from "./carousel"
import { CarouselContent } from "./carousel-content"
import { CarouselItem } from "./carousel-item"

const MobileCarousel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Carousel>
>(({ className, children, ...props }, ref) => {
  return (
    <Carousel
      ref={ref}
      className={cn("w-full relative", className)}
      {...props}
    >
      {children}
      <MobileCarouselPrevious />
      <MobileCarouselNext />
    </Carousel>
  )
})
MobileCarousel.displayName = "MobileCarousel"

const MobileCarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "ghost", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-7 w-7 rounded-full bg-white/70 shadow-sm backdrop-blur-sm",
        orientation === "horizontal"
          ? "-left-1 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft className="h-3 w-3" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
MobileCarouselPrevious.displayName = "MobileCarouselPrevious"

const MobileCarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "ghost", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-7 w-7 rounded-full bg-white/70 shadow-sm backdrop-blur-sm",
        orientation === "horizontal"
          ? "-right-1 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight className="h-3 w-3" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
MobileCarouselNext.displayName = "MobileCarouselNext"

export { MobileCarousel, MobileCarouselPrevious, MobileCarouselNext }
