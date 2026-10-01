import React, { useEffect, useMemo, useRef } from 'react';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StudioImage } from './StudioImage';

export const SearchOverlay: React.FC = () => {
  const {
    products,
    categories,
    settings,
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    navigate,
    getEffectivePricing,
  } = useStore();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Live filtered products across name, brand, category, SKU, and specifications
  const matchedProducts = useMemo(() => {
    if (!normalizedQuery) return products.slice(0, 4);
    return products.filter((p) => {
      const specString = Object.values(p.specs).filter(Boolean).join(' ');
      const haystack = `${p.name} ${p.brand} ${p.category} ${p.sku} ${p.shortSpec} ${specString}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [products, normalizedQuery]);

  // Live category & brand combination suggestions (e.g. "HP Laptops", "HP Printers")
  const liveSuggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [
        { label: 'HP Laptops', query: 'HP', categoryId: 'laptops' as const },
        { label: 'HP Printers', query: 'HP', categoryId: 'printers' as const },
        { label: 'Apple M4 Max Workstations', query: 'M4 Max' },
        { label: '6K Reference Monitors', query: '6K' },
        { label: 'Titanium Smartphones', query: 'Titanium' },
        { label: 'Wi-Fi 7 Mesh Networking', query: 'Wi-Fi 7' },
      ];
    }

    const suggestions: Array<{
      label: string;
      query: string;
      categoryId?: any;
    }> = [];

    const matchingBrands = Array.from(
      new Set(
        products
          .filter((p) => p.brand.toLowerCase().includes(normalizedQuery))
          .map((p) => p.brand)
      )
    );

    matchingBrands.forEach((brand) => {
      categories.forEach((cat) => {
        const hasMatch = products.some(
          (p) => p.brand === brand && p.category === cat.id
        );
        if (hasMatch) {
          suggestions.push({
            label: `${brand} ${cat.name}`,
            query: brand,
            categoryId: cat.id,
          });
        }
      });
      suggestions.push({
        label: `${brand} Accessories & Systems`,
        query: brand,
      });
    });

    categories.forEach((cat) => {
      if (cat.name.toLowerCase().includes(normalizedQuery)) {
        suggestions.push({
          label: `All ${cat.name}`,
          query: cat.name,
          categoryId: cat.id,
        });
      }
    });

    return suggestions.slice(0, 6);
  }, [normalizedQuery, products, categories]);

  if (!isSearchOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Tech Sokoni Catalog"
      className="fixed inset-0 z-50 bg-[#F4F3EF]/96 backdrop-blur-xl overflow-y-auto"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-[#141413]/12">
          <span className="text-xs font-mono-num uppercase tracking-[0.22em] text-[#6E6D68]">
            TECH SOKONI · ARCHIVE SEARCH
          </span>
          <button
            onClick={() => setIsSearchOpen(false)}
            className="flex items-center gap-1.5 text-xs font-mono-num uppercase tracking-[0.2em] text-[#141413] hover:opacity-70 cursor-pointer"
          >
            <span>Close</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="py-8 border-b border-[#141413]/15 flex items-center gap-4">
          <Search className="w-6 h-6 text-[#6E6D68] shrink-0 stroke-[1.5]" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product, brand (e.g. HP, Apple, Dell), SKU, or specification..."
            className="w-full bg-transparent font-editorial text-2xl sm:text-4xl text-[#141413] placeholder:text-[#8E8D87] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-mono-num uppercase tracking-widest text-[#6E6D68] hover:text-[#141413] cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results Split */}
        <div className="py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Live Suggestions */}
          <div className="lg:col-span-4 space-y-4">
            <p className="text-[11px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68]">
              {normalizedQuery ? 'Suggested Departments' : 'Quick Searches'}
            </p>
            <div className="divide-y divide-[#141413]/8 border-t border-b border-[#141413]/10">
              {liveSuggestions.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (item.categoryId) {
                      setIsSearchOpen(false);
                      navigate({
                        page: 'category',
                        categoryId: item.categoryId,
                      });
                    } else {
                      setSearchQuery(item.query);
                    }
                  }}
                  className="w-full py-3 flex items-center justify-between text-left text-sm text-[#141413] hover:pl-1.5 transition-all cursor-pointer"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#6E6D68]" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Matching Hardware Systems */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68]">
                {normalizedQuery
                  ? `Matching Systems (${matchedProducts.length})`
                  : 'Featured Showroom Systems'}
              </p>
            </div>

            {matchedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchedProducts.map((product) => {
                  const pricing = getEffectivePricing(product);
                  return (
                    <button
                      key={product.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate({ page: 'product', productId: product.id });
                      }}
                      className="bg-[#EAE9E4]/70 hover:bg-[#EAE9E4] border border-[#141413]/10 p-4 flex items-center gap-4 text-left transition-colors cursor-pointer"
                    >
                      <div className="w-20 h-20 bg-[#F4F3EF] p-2 shrink-0 flex items-center justify-center">
                        <StudioImage
                          src={product.images[0]}
                          alt={product.name}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-mono-num uppercase tracking-wider text-[#6E6D68]">
                          {product.brand} · {product.sku}
                        </p>
                        <h4 className="text-sm font-semibold text-[#141413] truncate mt-0.5">
                          {product.name}
                        </h4>
                        <p className="text-xs text-[#6E6D68] truncate mt-0.5">
                          {product.shortSpec}
                        </p>
                        <p className="text-xs font-mono-num font-semibold text-[#141413] mt-1.5">
                          {settings.currencySymbol}
                          {pricing.finalPrice.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center border border-[#141413]/10 bg-[#EAE9E4]/40">
                <p className="text-sm text-[#141413]">
                  No products matched &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs text-[#6E6D68] mt-1">
                  Try searching for &ldquo;HP&rdquo;, &ldquo;MacBook&rdquo;,
                  &ldquo;OLED&rdquo;, &ldquo;1TB&rdquo;, or &ldquo;Printer&rdquo;.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
