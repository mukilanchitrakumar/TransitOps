import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/db';
import { logActivity } from '../utils/audit';
import logger from '../utils/logger';

// List Users with Search and Role Filter
export async function getUsers(req: Request, res: Response) {
  try {
    const { search, role, status } = req.query;

    const whereClause: any = {
      deletedAt: null
    };

    if (role) {
      whereClause.role = role as any;
    }

    if (status) {
      whereClause.isActive = status === 'active';
    }

    if (search) {
      whereClause.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { fullName: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, users });
  } catch (error) {
    logger.error('Error fetching users:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Create User (Admin Action)
export async function createUser(req: Request, res: Response) {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Check duplicate
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role,
        isActive: true,
        emailVerified: true
      }
    });

    logActivity({
      userId: req.user?.userId,
      action: 'CREATE_USER',
      module: 'USERS',
      details: { createdUserId: user.id, createdUserEmail: user.email, role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Update User (Admin Action)
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { fullName, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        fullName,
        role,
        isActive
      }
    });

    logActivity({
      userId: req.user?.userId,
      action: 'UPDATE_USER',
      module: 'USERS',
      details: { updatedUserId: user.id, isActive, role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({ success: true, user });
  } catch (error) {
    logger.error('Error updating user:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Delete User (Admin Action - Soft Delete)
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (id === req.user?.userId) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    logActivity({
      userId: req.user?.userId,
      action: 'DELETE_USER',
      module: 'USERS',
      details: { deletedUserId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({ success: true, message: 'User soft-deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Admin Reset User Password
export async function resetUserPassword(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    logActivity({
      userId: req.user?.userId,
      action: 'RESET_PASSWORD',
      module: 'USERS',
      details: { resetUserId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Error resetting password:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// View User Login / Audit History
export async function getUserAuditHistory(req: Request, res: Response) {
  try {
    const logs = await prisma.activityLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { fullName: true, email: true } } }
    });

    return res.json({ success: true, logs });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
