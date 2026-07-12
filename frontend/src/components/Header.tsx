import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, Monitor, Search, Loader2 } from 'lucide-react';
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

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          return (
            <React.Fragment key={name}>
              {index > 0 && <span className="text-zinc-300 dark:text-zinc-700">/</span>}
              {isLast ? (
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 capitalize">
                  {name.replace(/-/g, ' ')}
                </span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 capitalize transition-colors"
                >
                  {name.replace(/-/g, ' ')}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search Bar */}
        <div ref={searchRef} className="relative w-64 max-sm:hidden">
          <input
            type="text"
            placeholder="Search cockpit registry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all duration-300"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
          {isSearching && (
            <Loader2 className="absolute right-3 top-2.5 w-3.5 h-3.5 text-zinc-400 animate-spin" />
          )}

          {showResults && (searchTerm.length >= 2) && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden z-50 text-xs text-zinc-705 dark:text-zinc-300">
              {(searchResults.vehicles.length > 0 ||
                searchResults.drivers.length > 0 ||
                searchResults.trips.length > 0) ? (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {searchResults.vehicles.length > 0 && (
                    <div className="p-2 space-y-1">
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-1">
                        Vehicles
                      </p>
                      {searchResults.vehicles.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleResultClick('/vehicles')}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 flex justify-between font-semibold"
                        >
                          <span>{v.plateNumber}</span>
                          <span className="text-zinc-450 text-[10px]">{v.make} {v.model}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.drivers.length > 0 && (
                    <div className="p-2 space-y-1">
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-1">
                        Drivers
                      </p>
                      {searchResults.drivers.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => handleResultClick('/drivers')}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 flex justify-between font-semibold"
                        >
                          <span>{d.fullName}</span>
                          <span className="text-zinc-450 text-[10px]">{d.licenseNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.trips.length > 0 && (
                    <div className="p-2 space-y-1">
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-1">
                        Trips
                      </p>
                      {searchResults.trips.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleResultClick('/trips')}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 flex justify-between font-semibold"
                        >
                          <span>{t.tripNumber}</span>
                          <span className="text-zinc-450 text-[10px]">{t.startLocation} ➔ {t.endLocation}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                searchResults.vehicles.length === 0 &&
                searchResults.drivers.length === 0 &&
                searchResults.trips.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                    No matches found.
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Dynamic theme dropdown selection */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors flex items-center justify-center cursor-pointer"
            title="Choose Theme"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-500" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Monitor className="w-4 h-4 text-teal-500" />
            )}
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 z-50 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left cursor-pointer ${theme === 'light' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/10' : ''}`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left cursor-pointer ${theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/10' : ''}`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme('system');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left cursor-pointer ${theme === 'system' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/10' : ''}`}
              >
                <Monitor className="w-3.5 h-3.5 text-teal-500" />
                <span>System</span>
              </button>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-2 max-sm:hidden">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {user.fullName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
export default Header;
