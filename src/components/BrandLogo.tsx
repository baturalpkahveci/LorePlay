interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-7 w-7 rounded-md p-1',
  md: 'h-10 w-10 rounded-lg p-1.5',
  lg: 'h-12 w-12 rounded-lg p-1.5',
};

export const BrandLogo = ({ size = 'md', className = '' }: BrandLogoProps) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center overflow-hidden border border-sky-300/20 bg-[#101318] shadow-lg shadow-sky-500/15 ${sizes[size]} ${className}`}
    aria-hidden="true"
  >
    <img src="/loreplay_icon.svg" alt="" className="h-full w-full object-contain" />
  </span>
);
