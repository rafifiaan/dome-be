import { kyselyDb } from '../db/connection';
import crypto from 'crypto';
import mailjet from 'node-mailjet';

// Mailjet Configuration
const mailjetClient = mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET
);

export const loginUser = async (username, password) => {
  try {
    const result = await kyselyDb
      .selectFrom('users') 
      .select(['id', 'name', 'username', 'password', 'id_roles'])
      .where('username', '=', username)
      .execute();

    if (result.length === 0) {
      throw new Error('User not found');
    }

    const storedPassword = result[0].password.trim();
    const providedPassword = password.trim();
    if (storedPassword !== providedPassword) {
      throw new Error('Invalid password');
    }

    console.log(`Login successful! User ID: ${result[0].id}, Name: ${result[0].name}, Username: ${result[0].username}, , Role ID: ${result[0].id_roles}`);

    return {
      id: result[0].id,
      name: result[0].name,
      username: result[0].username,
      id_roles: result[0].id_roles,
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

export const changePassword = async (userId, old_password, new_password) => {
  try {
    const result = await kyselyDb
      .selectFrom('users')
      .select(['password'])
      .where('id', '=', userId)
      .execute();

    if (result.length === 0) {
      throw new Error('User not found');
    }

    const storedPassword = result[0].password.trim();
    if (storedPassword !== old_password.trim()) { 
      throw new Error('Old password is incorrect');
    }

    // Update password
    await kyselyDb
      .updateTable('users')
      .set({ password: new_password.trim() }) 
      .where('id', '=', userId)
      .execute();

    console.log(`Password changed successfully for user ID: ${userId}`);

    return {
      message: 'Password changed successfully',
      old_password: storedPassword,
      new_password: new_password.trim() 
    };
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const result = await kyselyDb
      .selectFrom('users') 
      .select(['id', 'name', 'username', 'id_roles'])
      .execute();
    
    return result;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};


export const getUserById = async (userId) => {
  try {
    const result = await kyselyDb
      .selectFrom('users')
      .select(['id', 'name', 'username', 'id_roles'])
      .where('id', '=', userId)
      .execute();

    if (result.length === 0) {
      throw new Error('User not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
};

export const requestPasswordReset = async (username) => {
  try {
    const user = await kyselyDb
      .selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .execute();

    if (!user || user.length === 0) {
      throw new Error('User not found');
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Update database with token and expiration time
    await kyselyDb
      .updateTable('users')
      .set({ reset_token: token, reset_token_expires: expires })
      .where('username', '=', username)
      .execute();

    // Send email with token using Mailjet
    const resetLink = `${process.env.DEPLOY_HOST}/reset/${token}?username=${username}`
    const msg = {
      Messages: [
        {
          From: {
            Email: 'bs997555@gmail.com', 
            Name: 'Dome Telkom Inc.', 
          },
          To: [
            {
              Email: username, // username is email or NIK
            },
          ],
          Subject: 'Password Reset',
          TextPart: `Click this link to reset your password: ${resetLink}`,
        },
      ],
    };

    await mailjetClient.post('send', { version: 'v3.1' }).request(msg);
    console.log('Password reset email sent');
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
};

export const resetPassword = async (token, newPassword, username) => {
  try {
    const now = new Date();

    // Find user with valid token and username
    const result = await kyselyDb
      .selectFrom('users')
      .selectAll()
      .where('reset_token', '=', token)
      .where('reset_token_expires', '>', now)
      .where('username', '=', username) 
      .execute();

      console.log("Query result:", result);

    if (!result || result.length === 0) {
      throw new Error('Token is invalid or expired');
    }

    // Update password and delete token
    await kyselyDb
      .updateTable('users')
      .set({
        password: newPassword.trim(), 
        reset_token: null,
        reset_token_expires: null,
      })
      .where('reset_token', '=', token)
      .where('username', '=', username) 
      .execute();

  } catch (error) {
    throw new Error('Error resetting password:' + error.message);
  }
};
