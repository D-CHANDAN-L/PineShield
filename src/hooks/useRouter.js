// src/hooks/useRouter.js
import { useState, useEffect, useCallback } from 'react';

export const ROUTES = {
  SIMULATOR: 'simulator',
  TRIAGE: 'triage',
  WHATSAPP: 'whatsapp'
};

function parseHashLocation() {
  if (typeof window === 'undefined') {
    return { route: ROUTES.SIMULATOR, params: {} };
  }

  const rawHash = (window.location.hash || '').replace(/^#\/?/, '');
  const [routePart, queryPart] = rawHash.split('?');
  const cleanRoute = (routePart || '').toLowerCase().trim();

  const validRoute = Object.values(ROUTES).includes(cleanRoute)
    ? cleanRoute
    : ROUTES.SIMULATOR;

  const params = {};
  if (queryPart) {
    try {
      const searchParams = new URLSearchParams(queryPart);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    } catch (e) {
      console.warn("Failed to parse query params:", e);
    }
  }

  return { route: validRoute, params };
}

export function useRouter() {
  const [routeState, setRouteState] = useState(() => parseHashLocation());

  useEffect(() => {
    const handleHashChange = () => {
      setRouteState(parseHashLocation());
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    // Initial check: if no hash exists on first load, establish #simulator without overriding existing deep link
    const currentParsed = parseHashLocation();
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      window.location.hash = `#${ROUTES.SIMULATOR}`;
      setRouteState({ route: ROUTES.SIMULATOR, params: {} });
    } else {
      setRouteState(currentParsed);
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigate = useCallback((route, queryParams = {}) => {
    const validRoute = Object.values(ROUTES).includes(route) ? route : ROUTES.SIMULATOR;

    let targetHash = `#${validRoute}`;
    if (queryParams && typeof queryParams === 'object' && Object.keys(queryParams).length > 0) {
      try {
        const search = new URLSearchParams(queryParams).toString();
        if (search) targetHash += `?${search}`;
      } catch (e) {}
    }

    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setRouteState({
      route: validRoute,
      params: queryParams || {}
    });
  }, []);

  return {
    currentRoute: routeState.route || ROUTES.SIMULATOR,
    queryParams: routeState.params || {},
    navigate,
    ROUTES
  };
}
