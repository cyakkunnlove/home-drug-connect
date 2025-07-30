import { resend, EMAIL_FROM } from './client';
import { createClient } from '@/lib/supabase/server';

interface InquiryNotificationData {
  pharmacyEmail: string;
  pharmacyName: string;
  inquiryDetails: {
    from: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  };
}

export async function sendInquiryNotification(data: InquiryNotificationData) {
  const { pharmacyEmail, pharmacyName, inquiryDetails } = data;

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: pharmacyEmail,
      subject: `【HOME-DRUG CONNECT】新しいお問い合わせが届きました`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #374151; }
              .value { color: #111827; margin-top: 5px; }
              .message { background-color: white; padding: 15px; border-radius: 8px; margin-top: 10px; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>新しいお問い合わせ</h1>
              </div>
              <div class="content">
                <p>${pharmacyName} 様</p>
                <p>新しいお問い合わせが届きました。</p>
                
                <div class="field">
                  <div class="label">お名前</div>
                  <div class="value">${inquiryDetails.from}</div>
                </div>
                
                <div class="field">
                  <div class="label">メールアドレス</div>
                  <div class="value"><a href="mailto:${inquiryDetails.email}">${inquiryDetails.email}</a></div>
                </div>
                
                ${inquiryDetails.phone ? `
                <div class="field">
                  <div class="label">電話番号</div>
                  <div class="value">${inquiryDetails.phone}</div>
                </div>
                ` : ''}
                
                <div class="field">
                  <div class="label">件名</div>
                  <div class="value">${inquiryDetails.subject}</div>
                </div>
                
                <div class="field">
                  <div class="label">お問い合わせ内容</div>
                  <div class="message">${inquiryDetails.message.replace(/\n/g, '<br>')}</div>
                </div>
                
                <p style="margin-top: 20px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/inquiries" 
                     style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    ダッシュボードで確認
                  </a>
                </p>
              </div>
              <div class="footer">
                <p>このメールは HOME-DRUG CONNECT から自動送信されています。</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // Log email notification
    const supabase = await createClient();
    await supabase.from('email_notifications').insert({
      recipient_email: pharmacyEmail,
      subject: '新しいお問い合わせが届きました',
      template_name: 'inquiry_notification',
      sent_at: new Date().toISOString(),
    });

    return { success: true, data: emailData };
  } catch (error: any) {
    console.error('Failed to send inquiry notification:', error);
    
    // Log failed email
    const supabase = await createClient();
    await supabase.from('email_notifications').insert({
      recipient_email: pharmacyEmail,
      subject: '新しいお問い合わせが届きました',
      template_name: 'inquiry_notification',
      error: error.message,
    });

    return { success: false, error: error.message };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: '【HOME-DRUG CONNECT】ご登録ありがとうございます',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>HOME-DRUG CONNECT へようこそ</h1>
              </div>
              <div class="content">
                <p>${name} 様</p>
                <p>この度は HOME-DRUG CONNECT にご登録いただき、ありがとうございます。</p>
                
                <h2>次のステップ</h2>
                <ol>
                  <li>薬局情報を登録してください</li>
                  <li>サブスクリプションプランを選択してください</li>
                  <li>薬局情報が承認されると、検索結果に表示されるようになります</li>
                </ol>
                
                <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
                
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
                  ダッシュボードへ
                </a>
              </div>
              <div class="footer">
                <p>このメールは HOME-DRUG CONNECT から自動送信されています。</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPaymentSuccessEmail(email: string, name: string, amount: number) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: '【HOME-DRUG CONNECT】お支払いが完了しました',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #10b981; color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .invoice { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>お支払いが完了しました</h1>
              </div>
              <div class="content">
                <p>${name} 様</p>
                <p>HOME-DRUG CONNECT のご利用料金のお支払いが完了しました。</p>
                
                <div class="invoice">
                  <h3>お支払い内容</h3>
                  <p><strong>プラン:</strong> ベーシックプラン</p>
                  <p><strong>金額:</strong> ¥${amount.toLocaleString()}</p>
                  <p><strong>お支払い日:</strong> ${new Date().toLocaleDateString('ja-JP')}</p>
                </div>
                
                <p>引き続き HOME-DRUG CONNECT をよろしくお願いいたします。</p>
              </div>
              <div class="footer">
                <p>このメールは HOME-DRUG CONNECT から自動送信されています。</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send payment success email:', error);
    return { success: false, error: error.message };
  }
}