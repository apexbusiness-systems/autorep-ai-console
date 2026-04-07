import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-7 w-[52px] items-center rounded-full p-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDark
          ? "bg-secondary border border-border"
          : "bg-primary/15 border border-primary/25"
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Track icons */}
      <Sun className={cn(
        "absolute left-1.5 h-3.5 w-3.5 transition-all duration-300",
        isDark ? "text-muted-foreground/40 scale-75" : "text-primary scale-100"
      )} />
      <Moon className={cn(
        "absolute right-1.5 h-3.5 w-3.5 transition-all duration-300",
        isDark ? "text-gold scale-100" : "text-muted-foreground/40 scale-75"
      )} />

      {/* Thumb */}
      <span
        className={cn(
          "pointer-events-none flex h-5 w-5 items-center justify-center rounded-full shadow-md transition-all duration-300",
          isDark
            ? "translate-x-[25px] bg-gold/90"
            : "translate-x-0 bg-primary"
        )}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-primary-foreground" />
        ) : (
          <Sun className="h-3 w-3 text-primary-foreground" />
        )}
      </span>
    </button>
  )
}
