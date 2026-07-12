import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, Search, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { api } from '../services/api';

interface HeaderProps {
  isCollapsed: boolean;
}

export function Header({ isCollapsed }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
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
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults({ vehicles: [], drivers: [], trips: [] });
      setIsSearching(false);
      return;
    }

    async function performSearch() {
      try {
        setIsSearching(true);
        const queryParams = `?search=${encodeURIComponent(debouncedSearch)}&limit=3`;
        
        const [vehiclesRes, driversRes, tripsRes] = await Promise.allSettled([
          api.get(`/vehicles${queryParams}`),
          api.get(`/drivers${queryParams}`),
          api.get(`/trips${queryParams}`),
        ]);

        const results = { vehicles: [], drivers: [], trips: [] };

        if (vehiclesRes.status === 'fulfilled' && vehiclesRes.value.success) {
          results.vehicles = vehiclesRes.value.data || [];
        }
        if (driversRes.status === 'fulfilled' && driversRes.value.success) {
          results.drivers = driversRes.value.data || [];
        }
        if (tripsRes.status === 'fulfilled' && tripsRes.value.success) {
          results.trips = tripsRes.value.data || [];
        }

        setSearchResults(results);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsSearching(false);
      }
    }

    performSearch();
  }, [debouncedSearch]);

  const handleResultClick = (targetPath: string, searchPreset: string) => {
    setSearchTerm('');
    setShowResults(false);
    navigate(`${targetPath}?search=${encodeURIComponent(searchPreset)}`);
  };

  return (
    <header className={`fixed top-0 right-0 z-30 h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 transition-all duration-300 ml-auto max-md:w-full ${
      isCollapsed ? 'w-[calc(100%-5rem)]' : 'w-[calc(100%-16rem)]'
    }`}>
      <div className="flex items-center space-x-2 text-sm max-md:hidden">
        <Link to="/dashboard" className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium">
          Home
        </Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const formattedValue = value.replace('_', ' ').charAt(0).toUpperCase() + value.slice(1);

          return (
            <React.Fragment key={to}>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              {isLast ? (
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{formattedValue}</span>
              ) : (
                <Link to={to} className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium">
                  {formattedValue}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="md:hidden font-bold text-indigo-600 dark:text-indigo-400">
        TransitOps
      </div>

      <div className="flex items-center space-x-4 flex-1 justify-end">
        <div ref={searchRef} className="relative w-72 max-sm:w-44">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="w-full pl-9 pr-8 py-1.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-hidden transition-all"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-zinc-400 animate-spin" />
            )}
          </div>

          {showResults && (searchTerm.length >= 2) && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-3 overflow-hidden text-sm z-50">
              {isSearching ? (
                <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Searching...
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-3.5">
                  {searchResults.vehicles.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 px-2 uppercase tracking-wider mb-1">Vehicles</h4>
                      <div className="space-y-0.5">
                        {searchResults.vehicles.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => handleResultClick('/vehicles', v.plateNumber)}
                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-medium"
                          >
                            {v.plateNumber} - {v.make} {v.model}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.drivers.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 px-2 uppercase tracking-wider mb-1">Drivers</h4>
                      <div className="space-y-0.5">
                        {searchResults.drivers.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => handleResultClick('/drivers', d.fullName)}
                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-medium"
                          >
                            {d.fullName} ({d.licenseNumber})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.trips.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 px-2 uppercase tracking-wider mb-1">Trips</h4>
                      <div className="space-y-0.5">
                        {searchResults.trips.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleResultClick('/trips', t.tripNumber)}
                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-medium"
                          >
                            {t.tripNumber} ({t.startLocation} → {t.endLocation})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.vehicles.length === 0 &&
                    searchResults.drivers.length === 0 &&
                    searchResults.trips.length === 0 && (
                      <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                        No matches found.
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

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
