import React from "react";
import { Shield, Check } from "lucide-react";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ className = "", size = "md" }) => {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  const iconSizeMap = {
    sm: 10,
    md: 14,
    lg: 18
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center text-primary ${sizeMap[size]} ${className}`}
      title="Verified by Tawoss"
    >
      <Shield className="absolute inset-0 w-full h-full fill-primary/20 stroke-primary" strokeWidth={2} />
      <Check size={iconSizeMap[size]} className="relative text-white stroke-[3px]" />
    </div>
  );
};
