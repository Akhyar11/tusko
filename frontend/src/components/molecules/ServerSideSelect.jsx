import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, Check, X, Loader2 } from 'lucide-react';

/**
 * Molecule: ServerSideSelect
 * Reusable server-side select component with debounced server search and infinite scroll padding.
 * 
 * @param {Object} props
 * @param {string|number} props.value - Selected value
 * @param {function} props.onChange - Callback when value changes: (value, selectedOption) => void
 * @param {Array} props.options - Static options array [{ value, label, ... }]
 * @param {function} props.loadOptions - Async function: async (searchQuery, page) => { options, hasMore }
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether select is disabled
 * @param {boolean} props.isClearable - Whether value can be cleared
 * @param {number} props.scrollPadding - Scroll threshold in px to trigger next page load (default: 40)
 * @param {number} props.pageSize - Number of items per page (default: 15)
 * @param {string} props.className - Additional classnames for trigger container
 * @param {function} props.renderOption - Custom option renderer: (option, isSelected) => ReactNode
 */
export default function ServerSideSelect({
  value,
  onChange = () => {},
  options: staticOptions = [],
  loadOptions = null,
  placeholder = 'Pilih opsi...',
  disabled = false,
  isClearable = false,
  scrollPadding = 40,
  pageSize = 15,
  className = '',
  renderOption = null,
  name = '',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedOptions, setDisplayedOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef(null);
  const dropdownListRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Normalize static options to { value, label } format
  const normalizedStaticOptions = useCallback(() => {
    return staticOptions.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          ...opt,
          value: opt.value !== undefined ? opt.value : opt.id,
          label: opt.label || opt.name || String(opt.value || opt.id)
        };
      }
      return { value: opt, label: String(opt) };
    });
  }, [staticOptions]);

  // Fetch / slice options for a given page and search query
  const fetchPage = useCallback(async (query, pageNum, isInitial = false) => {
    if (loadOptions) {
      if (pageNum === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const result = await loadOptions(query, pageNum);
        const newOpts = Array.isArray(result) ? result : (result.options || []);
        const more = result && typeof result.hasMore === 'boolean' 
          ? result.hasMore 
          : newOpts.length >= pageSize;

        setDisplayedOptions(prev => pageNum === 1 ? newOpts : [...prev, ...newOpts]);
        setHasMore(more);
      } catch (err) {
        console.error('ServerSideSelect fetch error:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    } else {
      // Local fallback with server-side pagination & filter simulation
      if (pageNum === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const all = normalizedStaticOptions();
      const filtered = query.trim()
        ? all.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
        : all;

      const startIndex = (pageNum - 1) * pageSize;
      const sliced = filtered.slice(startIndex, startIndex + pageSize);
      const more = startIndex + pageSize < filtered.length;

      setTimeout(() => {
        setDisplayedOptions(prev => pageNum === 1 ? sliced : [...prev, ...sliced]);
        setHasMore(more);
        setIsLoading(false);
        setIsLoadingMore(false);
      }, isInitial ? 0 : 100);
    }
  }, [loadOptions, normalizedStaticOptions, pageSize]);

  // Open dropdown & focus search input
  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery('');
    setPage(1);
    fetchPage('', 1, true);
    setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
    }, 50);
  };

  // Close dropdown
  const handleClose = () => {
    setIsOpen(false);
  };

  // Handle Search Input with debounce
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setPage(1);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchPage(q, 1);
    }, 250);
  };

  // Handle Scroll with scrollPadding threshold
  const handleListScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    // Check if scrolled near the bottom within scrollPadding
    if (scrollTop + clientHeight >= scrollHeight - scrollPadding) {
      if (hasMore && !isLoading && !isLoadingMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPage(searchQuery, nextPage);
      }
    }
  };

  // Click outside and Escape key handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [isOpen]);

  // Find currently selected option object
  const selectedOption = displayedOptions.find(o => String(o.value) === String(value))
    || normalizedStaticOptions().find(o => String(o.value) === String(value))
    || (value ? { value, label: String(value) } : null);

  const handleSelect = (option) => {
    onChange(option.value, option);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', null);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden input for HTML form submission if needed */}
      {name && (
        <input 
          type="hidden" 
          name={name} 
          value={value || ''} 
          required={required} 
        />
      )}

      {/* Select Trigger Box */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white border rounded-none flex items-center justify-between gap-2 transition-all cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'border-black ring-1 ring-black bg-white' : 'border-neutral-300'
        } ${className}`}
      >
        <span className={`truncate font-medium ${selectedOption ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {isClearable && value && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 text-neutral-400 hover:text-black cursor-pointer rounded-none transition-colors"
              title="Hapus Pilihan"
            >
              <X size={13} />
            </span>
          )}
          <span className="text-neutral-500">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </button>

      {/* Dropdown Floating Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-neutral-300 rounded-none shadow-xl z-50 animate-in fade-in duration-150">
          
          {/* Server-side Search Input Inside Dropdown */}
          <div className="p-2 border-b border-neutral-200 bg-neutral-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-neutral-400" size={14} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Ketik untuk mencari di server..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-black text-neutral-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    fetchPage('', 1);
                  }}
                  className="absolute right-2 top-2 text-xs text-neutral-400 hover:text-black cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Options List with Infinite Scroll & scrollPadding */}
          <div
            ref={dropdownListRef}
            onScroll={handleListScroll}
            className="max-h-56 overflow-y-auto divide-y divide-neutral-100"
            style={{ overscrollBehavior: 'contain' }}
          >
            {isLoading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-neutral-500 text-xs font-mono">
                <Loader2 size={18} className="animate-spin text-amber-500" />
                <span>Memuat data server...</span>
              </div>
            ) : displayedOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-neutral-500 font-sport uppercase tracking-wider">
                Tidak ada opsi ditemukan
              </div>
            ) : (
              displayedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full px-3.5 py-2.5 text-xs text-left flex items-center justify-between gap-2 transition-colors cursor-pointer rounded-none ${
                      isSelected
                        ? 'bg-neutral-950 text-white font-bold'
                        : 'hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    {renderOption ? (
                      renderOption(opt, isSelected)
                    ) : (
                      <span className="truncate">{opt.label}</span>
                    )}

                    {isSelected && (
                      <Check size={14} className="text-amber-400 shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })
            )}

            {/* Loading more indicator at bottom during scroll padding threshold */}
            {isLoadingMore && (
              <div className="py-2.5 bg-neutral-50 flex items-center justify-center gap-2 text-[11px] font-mono text-neutral-500">
                <Loader2 size={13} className="animate-spin text-amber-500" />
                <span>Memuat lebih banyak...</span>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
