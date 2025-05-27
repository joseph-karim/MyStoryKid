import { addSubscriberToListmonk } from './listmonkService';
import { sendPasswordResetEmail } from './emailService';

/**
 * Sign up a new user and add to Listmonk
 * @param {string} email
 * @param {string} password
 * @param {string} name
 * @returns {Promise<Object>} - Supabase user
 */
export async function signUpUser(email, password, name) {
  // Sign up user in Supabase
  const { user, error } = await supabase.auth.signUp({ email, password }, { data: { name } });
  if (error) throw error;
  // Add to Listmonk as subscriber
  try {
    await addSubscriberToListmonk(email, name);
  } catch (err) {
    console.error('[authService] Failed to add user to Listmonk:', err.message);
    // Continue even if Listmonk fails
  }
  return user;
}

/**
 * Send a password reset email to the user
 * @param {string} email
 * @param {string} name
 * @returns {Promise<void>}
 */
export async function sendUserPasswordReset(email, name) {
  // Generate password reset link from Supabase
  const { data, error } = await supabase.auth.api.resetPasswordForEmail(email);
  if (error) throw error;
  const resetUrl = data?.action_link || data?.url;
  if (!resetUrl) throw new Error('No reset URL returned from Supabase');
  // Send password reset email via Listmonk
  try {
    await sendPasswordResetEmail({ toEmail: email, toName: name, resetUrl });
  } catch (err) {
    console.error('[authService] Failed to send password reset email:', err.message);
    // Continue even if email fails
  }
} 