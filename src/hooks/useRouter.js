// src/hooks/useRouter.js
import { useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const ROUTES = {
  SIMULATOR: 'simulator',
  TRIAGE: 'triage',
  WHATSAPP: 'whatsapp'
};

export function useRouter() {
  const location = useLocation();
  const reactRouterNavigate = useNavigate();

  // Parse current route from pathname (e.g. "/simulator" -> "simulator", "/" -> "simulator")
  const currentRoute = useMemo(() => {
    const rawSegment = (location.pathname || '')
      .replace(/^\/+/, '')
      .split('/')[0]
      ?.toLowerCase()
      .trim();

    if (rawSegment && Object.values(ROUTES).includes(rawSegment)) {
      return rawSegment;
    }
    return ROUTES.SIMULATOR;
  }, [location.pathname]);

  // Parse query parameters from location.search (e.g. "?error=NO_RESPONSE")
  const queryParams = useMemo(() => {
    const params = {};
    if (location.search) {
      try {
        const searchParams = new URLSearchParams(location.search);
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }
      } catch (err) {
        console.warn('[PineShield Router] Query parse warning:', err);
      }
    }
    return params;
  }, [location.search]);

  // If on bare root "/", immediately normalize to "/simulator" without breaking back/forward history
  useEffect(() => {
    const path = (location.pathname || '').replace(/\/+$/, '');
    if (!path || path === '') {
      reactRouterNavigate(`/${ROUTES.SIMULATOR}`, { replace: true });
    }
  }, [location.pathname, reactRouterNavigate]);

  // Navigate callback matching the legacy interface: navigate(route, queryParams)
  const navigate = useCallback((route, params = {}) => {
    const targetRoute = Object.values(ROUTES).includes(route)
      ? route
      : ROUTES.SIMULATOR;

    let targetPath = `/${targetRoute}`;
    if (params && typeof params === 'object' && Object.keys(params).length > 0) {
      const search = new URLSearchParams(params).toString();
      if (search) {
        targetPath += `?${search}`;
      }
    }

    reactRouterNavigate(targetPath);
  }, [reactRouterNavigate]);

  return {
    currentRoute,
    queryParams,
    navigate,
    ROUTES
  };
}
