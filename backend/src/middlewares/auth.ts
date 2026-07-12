import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { logActivity } from '../utils/audit';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Access token missing' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Access token invalid or expired' });
  }

  req.user = decoded;
  next();
}

export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logActivity({
        userId: req.user.userId,
        action: 'ACCESS_DENIED',
        module: 'AUTH',
        details: {
          path: req.path,
          method: req.method,
          requiredRoles: allowedRoles,
          userRole: req.user?.role,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(403).json({
        success: false,
        error: `Forbidden: Access restricted. Requires roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
