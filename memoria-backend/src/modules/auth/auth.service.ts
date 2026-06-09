import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';
import crypto from 'crypto';
import { sendEmail } from '../../lib/email';

export class AuthService {
  static async register(data: RegisterInput) {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        password_hash,
        auth_provider: 'local',
      },
      select: {
        id: true,
        email: true,
        username: true,
        full_name: true,
        avatar_s3_key: true,
        face_indexed: true,
        token_version: true,
      },
    });

    const accessToken = this.generateAccessToken(user.id, user.token_version ?? 1);
    return { user, accessToken };
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password_hash) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(data.password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Increment login count
    await prisma.user.update({
      where: { id: user.id },
      data: {
        login_count: { increment: 1 },
        last_login_at: new Date()
      }
    });

    const accessToken = this.generateAccessToken(user.id, user.token_version ?? 1);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        avatar_s3_key: user.avatar_s3_key,
        face_indexed: user.face_indexed,
      },
      accessToken,
    };
  }

  static generateAccessToken(userId: string, version: number) {
    return jwt.sign({ id: userId, version }, env.JWT_SECRET, { expiresIn: '7d' });
  }

  static async forgotPassword(data: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Don't throw to prevent email enumeration, just return simulated success
      console.log(`[Simulated Email] Password reset requested for non-existent email: ${data.email}`);
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        type: 'password_reset',
        expires_at: expiresAt,
      }
    });

    const resetLink = `http://localhost:3000/reset-password?token=${rawToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Reset your Memoria password',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset for your Memoria account.</p>
        <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetLink}">Reset Password</a>
        <br><br>
        <p>If you did not request this, please ignore this email.</p>
      `
    });
  }

  static async resetPassword(data: ResetPasswordInput) {
    const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');
    
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash }
    });

    if (!tokenRecord || tokenRecord.used || tokenRecord.expires_at < new Date() || tokenRecord.type !== 'password_reset') {
      throw new Error('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.user_id },
        data: { 
          password_hash,
          token_version: { increment: 1 } // Invalidate existing JWTs
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      })
    ]);
  }
}
