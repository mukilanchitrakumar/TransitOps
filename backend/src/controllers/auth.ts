import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/db';
import { generateToken } from '../utils/jwt';
import { logActivity } from '../utils/audit';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      logActivity({
        action: 'AUTHENTICATION_FAILURE',
        module: 'AUTH',
        details: { email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      logActivity({
        action: 'AUTHENTICATION_FAILURE',
        module: 'AUTH',
        details: { email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logActivity({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    if (req.user) {
      logActivity({
        userId: req.user.userId,
        action: 'LOGOUT',
        module: 'AUTH',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.clearCookie('token');
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, error: 'User profile not found or inactive' });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// User Self-Registration
export async function register(req: Request, res: Response) {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, error: 'Email, password, and full name are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role || 'DRIVER';

    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role: assignedRole,
        isActive: true,
        emailVerified: true
      }
    });

    logActivity({
      userId: user.id,
      action: 'REGISTRATION_SUCCESS',
      module: 'AUTH',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({
      success: true,
      message: 'Registration successful! Please log in.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Change Password (Authenticated User)
export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Old password and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const match = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!match) {
      return res.status(400).json({ success: false, error: 'Incorrect old password' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    logActivity({
      userId: user.id,
      action: 'CHANGE_PASSWORD',
      module: 'AUTH',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Global tokens cache for forgot password simulated recoveries
const simulatedTokens = new Map<string, { email: string; expires: number }>();

// Forgot Password (Simulated Token Creation)
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Avoid enum leak for production standards, but return ok
      return res.json({ success: true, message: 'Simulated password reset instructions registered.' });
    }

    // Generate random 6-character token code
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    const expires = Date.now() + 15 * 60 * 1000; // 15 mins expiry

    simulatedTokens.set(token, { email, expires });

    logActivity({
      userId: user.id,
      action: 'FORGOT_PASSWORD_REQUEST',
      module: 'AUTH',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({
      success: true,
      message: 'A recovery code was simulated in backend memory.',
      code: token // Expose code to front-end for easy hackathon demo testing!
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Reset Password via Simulated Token Code
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Reset token and new password are required' });
    }

    const record = simulatedTokens.get(token);
    if (!record || record.expires < Date.now()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    const user = await prisma.user.findUnique({ where: { email: record.email } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    // Revoke token
    simulatedTokens.delete(token);

    logActivity({
      userId: user.id,
      action: 'RESET_PASSWORD_VIA_TOKEN',
      module: 'AUTH',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({ success: true, message: 'Password reset successfully!' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Session Token Refresh
export async function refreshSession(req: Request, res: Response) {
  try {
    const currentToken = req.cookies?.token;
    if (!currentToken) {
      return res.status(401).json({ success: false, error: 'Refresh failed: session cookie not found' });
    }

    // Return the same or renewed session cookie
    res.cookie('token', currentToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ success: true, message: 'Session refreshed' });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
