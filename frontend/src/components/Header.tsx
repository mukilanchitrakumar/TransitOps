import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, Monitor, Search, Loader2, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { api } from '../services/api';

interface HeaderProps {
  isCollapsed: boolean;
}

export function Header({ isCollapsed }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{
    vehicles: any[];
    drivers: any[];
    trips: any[];
  }>({ vehicles: [], drivers: [], trips: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchTerm, 350);
  const searchRef = useRef<HTMLDivElement>(null);

  const pathnames = location.pathname.split('/').filter((x) => x);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutsideTheme(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutsideTheme);
    return () => document.removeEventListener('mousedown', handleClickOutsideTheme);
  }, []);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults({ vehicles: [], drivers: [], trips: [] });
      setIsSearching(false);
      return;
    }

    async function performSearch() {
      setIsSearching(true);
      try {
        const [vehiclesRes, driversRes, tripsRes] = await Promise.all([
          api.get(`/vehicles?search=${encodeURIComponent(debouncedSearch)}&limit=3`),
          api.get(`/drivers?search=${encodeURIComponent(debouncedSearch)}&limit=3`),
          api.get(`/trips?search=${encodeURIComponent(debouncedSearch)}&limit=3`),
        ]);
        setSearchResults({
          vehicles: vehiclesRes.data || [],
          drivers: driversRes.data || [],
          trips: tripsRes.data || [],
        });
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }

    performSearch();
  }, [debouncedSearch]);

  const handleResultClick = (path: string) => {
    setShowResults(false);
    setSearchTerm('');
    navigate(path);
  };

  const themeOptions = [
    { key: 'light' as const, label: 'Light', icon: Sun, iconColor: '#F59E0B' },
    { key: 'dark' as const, label: 'Dark', icon: Moon, iconColor: '#6366F1' },
    { key: 'system' as const, label: 'System', icon: Monitor, iconColor: '#0F766E' },
  ];

  return (
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--zinc-900-val) 85%, transparent)',
        borderBottom: '1px solid var(--zinc-200-val)',
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          return (
            <React.Fragment key={name}>
              {index > 0 && <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--zinc-300-val)' }} />}
              {isLast ? (
                <span
                  className="text-sm font-semibold capitalize"
                  style={{ color: 'var(--zinc-705-val)' }}
                >
                  {name.replace(/-/g, ' ')}
                </span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-sm capitalize transition-colors hover:underline"
                  style={{ color: 'var(--zinc-450-val)' }}
                >
                  {name.replace(/-/g, ' ')}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search */}
        <div ref={searchRef} className="relative w-60 max-sm:hidden">
          <input
            type="text"
            placeholder="Search fleet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="w-full h-9 pl-9 pr-8 text-xs font-medium rounded-lg border outline-hidden transition-all duration-200"
            style={{
              backgroundColor: 'var(--zinc-50-val)',
              borderColor: 'var(--zinc-200-val)',
              color: 'var(--zinc-700-val)',
            }}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--zinc-400-val)' }} />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin" style={{ color: 'var(--zinc-400-val)' }} />
          )}

          {showResults && searchTerm.length >= 2 && (
            <div
              className="absolute right-0 mt-1.5 w-80 rounded-xl overflow-hidden z-50 text-xs"
              style={{
                backgroundColor: 'var(--zinc-900-val)',
                border: '1px solid var(--zinc-200-val)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {(searchResults.vehicles.length > 0 ||
                searchResults.drivers.length > 0 ||
                searchResults.trips.length > 0) ? (
                <div>
                  {searchResults.vehicles.length > 0 && (
                    <div className="p-2 space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: 'var(--zinc-400-val)' }}>
                        Vehicles
                      </p>
                      {searchResults.vehicles.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleResultClick('/vehicles')}
                          className="w-full text-left px-2 py-1.5 rounded-lg flex justify-between font-semibold transition-colors cursor-pointer"
                          style={{ color: 'var(--zinc-700-val)' }}
                        >
                          <span>{v.plateNumber}</span>
                          <span style={{ color: 'var(--zinc-450-val)', fontSize: '10px' }}>{v.make} {v.model}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.drivers.length > 0 && (
                    <div className="p-2 space-y-0.5 border-t" style={{ borderColor: 'var(--zinc-200-val)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: 'var(--zinc-400-val)' }}>
                        Drivers
                      </p>
                      {searchResults.drivers.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => handleResultClick('/drivers')}
                          className="w-full text-left px-2 py-1.5 rounded-lg flex justify-between font-semibold transition-colors cursor-pointer"
                          style={{ color: 'var(--zinc-700-val)' }}
                        >
                          <span>{d.fullName}</span>
                          <span style={{ color: 'var(--zinc-450-val)', fontSize: '10px' }}>{d.licenseNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.trips.length > 0 && (
                    <div className="p-2 space-y-0.5 border-t" style={{ borderColor: 'var(--zinc-200-val)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: 'var(--zinc-400-val)' }}>
                        Trips
                      </p>
                      {searchResults.trips.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleResultClick('/trips')}
                          className="w-full text-left px-2 py-1.5 rounded-lg flex justify-between font-semibold transition-colors cursor-pointer"
                          style={{ color: 'var(--zinc-700-val)' }}
                        >
                          <span>{t.tripNumber}</span>
                          <span style={{ color: 'var(--zinc-450-val)', fontSize: '10px' }}>{t.startLocation} → {t.endLocation}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center font-medium" style={{ color: 'var(--zinc-450-val)' }}>
                  No matches found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Picker */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="p-2 rounded-lg border transition-all duration-200 cursor-pointer"
            style={{
              borderColor: 'var(--zinc-200-val)',
              color: 'var(--zinc-500-val)',
            }}
            title="Choose Theme"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4" style={{ color: '#6366F1' }} />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4" style={{ color: '#F59E0B' }} />
            ) : (
              <Monitor className="w-4 h-4" style={{ color: '#0F766E' }} />
            )}
          </button>

          {isThemeMenuOpen && (
            <div
              className="absolute right-0 mt-1.5 w-36 rounded-xl py-1 z-50 text-xs font-semibold animate-scale-in"
              style={{
                backgroundColor: 'var(--zinc-900-val)',
                border: '1px solid var(--zinc-200-val)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setTheme(opt.key);
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center gap-2 text-left cursor-pointer transition-colors ${
                      theme === opt.key ? 'font-bold' : ''
                    }`}
                    style={{
                      color: theme === opt.key ? '#0F766E' : 'var(--zinc-600-val)',
                      backgroundColor: theme === opt.key ? '#E6F5F3' : undefined,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: opt.iconColor }} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User name */}
        {user && (
          <div className="flex items-center gap-2 max-sm:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: '#E6F5F3', color: '#0F766E' }}
            >
              {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span
              className="text-sm font-semibold hidden md:inline"
              style={{ color: 'var(--zinc-700-val)' }}
            >
              {user.fullName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
export default Header;
