import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string | number;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  value: string | number;
  onChange: (value: string) => void;
  options: DropdownOption[];
  className?: string;
  buttonClassName?: string;
  isActiveFilter?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  align?: 'left' | 'right' | 'auto';
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  className = '',
  buttonClassName = '',
  isActiveFilter = false,
  icon,
  size = 'sm',
  align = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const minMenuWidth = Math.max(rect.width, 165);
    const maxMenuWidth = Math.min(260, viewportWidth - 16);
    const width = Math.min(Math.max(rect.width, minMenuWidth), maxMenuWidth);

    let left = rect.left;
    if (align === 'right' || (align === 'auto' && rect.left + width > viewportWidth - 8)) {
      left = Math.max(8, rect.right - width);
    } else {
      left = Math.max(8, Math.min(rect.left, viewportWidth - width - 8));
    }

    const estimatedMenuHeight = Math.min(options.length * 40 + 16, 250);
    const spaceBelow = viewportHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;

    setMenuStyle({
      position: 'fixed',
      left: `${left}px`,
      width: `${width}px`,
      ...(openUpward
        ? { bottom: `${viewportHeight - rect.top + 6}px` }
        : { top: `${rect.bottom + 6}px` }),
      zIndex: 9999,
    });
  }, [align, options.length]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) {
        return;
      }
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  const sizeClasses =
    size === 'md'
      ? 'px-3.5 py-2.5 text-xs sm:text-sm rounded-xl'
      : 'px-2.5 py-1.5 text-xs rounded-xl';

  const stateClasses = isOpen
    ? 'bg-slate-800 border-emerald-500/80 text-white ring-2 ring-emerald-500/20 shadow-md'
    : isActiveFilter
      ? 'bg-emerald-950/35 border-emerald-500/60 text-emerald-300 hover:bg-emerald-950/50 shadow-sm'
      : 'bg-slate-800/90 hover:bg-slate-750 border-slate-700/80 hover:border-slate-600 text-slate-200 shadow-sm';

  return (
    <div className={`relative min-w-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full inline-flex items-center justify-between gap-1.5 border font-semibold transition-all duration-150 active:scale-[0.98] focus:outline-none ${sizeClasses} ${stateClasses} ${buttonClassName}`}
      >
        <span className="flex items-center gap-1.5 min-w-0 truncate">
          {icon && <span className="shrink-0 text-emerald-400">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption?.label ?? value}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isOpen
              ? 'rotate-180 text-emerald-400'
              : isActiveFilter
                ? 'text-emerald-400'
                : 'text-slate-400'
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="bg-[#0f172a]/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 p-1.5 max-h-64 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="space-y-0.5">
              {options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      onChange(String(opt.value));
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/90 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            isSelected
                              ? 'bg-emerald-500/25 text-emerald-200'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5] shrink-0" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
