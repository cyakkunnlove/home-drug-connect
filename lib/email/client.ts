import { Resend } from 'resend';

// ビルド時は環境変数がまだ利用できない場合があるため、遅延初期化
let resendInstance: Resend | null = null;

export const getResend = () => {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
};

export const resend = getResend();

export const EMAIL_FROM = 'HOME-DRUG CONNECT <noreply@homedrug-connect.com>';