import Image from "next/image"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <Image src="/logo.png" alt="Bakhriyev Learning Center" fill className="object-contain" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-white ${textSizeClasses[size]}`}>BAKHRIYEV</span>
          <span className="text-sm text-white">LEARNING CENTER</span>
        </div>
      )}
    </div>
  )
}
