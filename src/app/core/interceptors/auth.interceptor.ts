import { HttpInterceptorFn } from '@angular/common/http';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

const cache = new Map<string, any>();

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const existingAuthorization = req.headers.get('Authorization');
  const bearerToken = token ? `Bearer ${token}` : null;

  const authReq =
    existingAuthorization || !bearerToken
      ? req
      : req.clone({
          setHeaders: {
            Authorization: bearerToken
          }
        });

  // Simple caching for GET requests
  if (req.method === 'GET') {
    const cachedResponse = cache.get(req.url);
    if (cachedResponse) {
      return of(cachedResponse);
    }
  }

  return next(authReq).pipe(
    tap(event => {
      if (req.method === 'GET' && event.type === 4) { // HttpResponse
        cache.set(req.url, event);
      }
    })
  );
};
