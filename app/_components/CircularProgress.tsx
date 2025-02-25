import useDebounce from "../_hooks/useDebounce";

interface circularProgressProps {
    value: number,
    size?: string,
    thickness?: string,
    className?: string
}

const circularProgress = ({ value, size, thickness, className }: circularProgressProps) => {
    const style = {
        '--value': Math.round(value), 
        '--size': size || '2rem', 
        '--thickness': thickness || '0.25rem'
    } as React.CSSProperties

    return (
        <div
            className={`radial-progress text-primary ${className}`}
            style={style}
            role="progressbar" />
    )
}

export default circularProgress;