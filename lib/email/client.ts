import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = 'HOME-DRUG CONNECT <noreply@homedrug-connect.com>';