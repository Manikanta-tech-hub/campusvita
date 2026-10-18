import { GlassButton } from "./glass";

type ButtonProps = {
  text: string;
  variant?: "primary" | "accent" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
};

export default function Button({
  text,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  onClick,
  type,
  className,
}: ButtonProps) {
  return (
    <GlassButton
      variant={variant}
      size={size}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      type={type}
      className={className}
    >
      {text}
    </GlassButton>
  );
}
