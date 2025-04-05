interface ButtonSquareProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: 'lg' | 'md' | 'sm' | 'xs';
  tip?: string;
  disabled?: boolean;
}

const ButtonSquare = ({
  className,
  onClick,
  size = 'md',
  children,
  tip,
  disabled,
}: ButtonSquareProps) => {
  const sizes: Record<string, string> = {
    lg: 'btn-lg',
    md: '',
    sm: 'btn-sm',
    xs: 'btn-xs',
  };

  const classes = className?.includes('btn-')
    ? className
    : `btn-ghost ${className}`;

  return (
    <button
      className={`btn btn-square ${sizes[size]} ${classes}`}
      onClick={onClick}
      disabled={disabled}
      {...(className?.includes('tooltip') && tip ? { 'data-tip': tip } : '')}
    >
      {children}
    </button>
  );
};

export default ButtonSquare;
