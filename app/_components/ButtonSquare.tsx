interface ButtonSquareProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: 'lg' | 'md' | 'sm' | 'xs';
  tip?: string;
}

const ButtonSquare = ({
  className,
  onClick,
  size = 'md',
  children,
  tip,
}: ButtonSquareProps) => {
  const sizes: Record<string, string> = {
    lg: 'btn-lg',
    md: '',
    sm: 'btn-sm',
    xs: 'btn-xs',
  };

  return (
    <button
      className={`btn btn-square btn-ghost ${sizes[size]} ${className}`}
      onClick={onClick}
      {...(className?.includes('tooltip') && tip ? { 'data-tip': tip } : '')}
    >
      {children}
    </button>
  );
};

export default ButtonSquare;
