export interface RequestNotificationEmailProps {
  pharmacyName: string
  pharmacyEmail: string
  doctorName: string
  doctorOrganization: string
  doctorEmail: string
  requestUrl: string
  patientInfo: {
    medications?: Array<{
      name: string
      dosage?: string
      frequency?: string
    }>
    conditions?: string[]
    treatmentPlan?: string
    notes?: string
  }
}

export function generateRequestNotificationEmail(props: RequestNotificationEmailProps) {
  const {
    pharmacyName,
    doctorName,
    doctorOrganization,
    doctorEmail,
    requestUrl,
    patientInfo
  } = props

  const medicationsList = patientInfo.medications?.map(m => 
    `・${m.name}${m.dosage ? ` (${m.dosage})` : ''}${m.frequency ? ` - ${m.frequency}` : ''}`
  ).join('\n') || 'なし'

  const conditionsList = patientInfo.conditions?.join('、') || 'なし'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>新規依頼通知</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #2563eb;
      color: white;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 24px;
    }
    .section {
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f9fafb;
      border-radius: 8px;
    }
    .section-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: #1f2937;
    }
    .doctor-info {
      margin-bottom: 8px;
    }
    .patient-info {
      margin-top: 16px;
    }
    .medication-list {
      margin: 8px 0;
      padding-left: 20px;
    }
    .cta-button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 12px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 24px 0;
    }
    .footer {
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .urgent {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 HOME-DRUG CONNECT</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">新規在宅医療依頼のお知らせ</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        ${pharmacyName} 御中
      </div>
      
      <p>HOME-DRUG CONNECTを通じて、新規の在宅医療依頼が届きました。</p>
      
      <div class="section">
        <div class="section-title">依頼医師情報</div>
        <div class="doctor-info">
          <strong>医師名：</strong>${doctorName}<br>
          <strong>医療機関：</strong>${doctorOrganization}<br>
          <strong>連絡先：</strong>${doctorEmail}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">患者情報概要</div>
        <div class="patient-info">
          <strong>服用中の薬剤：</strong>
          <div class="medication-list">
${medicationsList}
          </div>
          <strong>既往・現疾患：</strong>${conditionsList}<br>
          ${patientInfo.treatmentPlan ? `<strong>今後の治療方針：</strong>${patientInfo.treatmentPlan}<br>` : ''}
          ${patientInfo.notes ? `<strong>備考：</strong>${patientInfo.notes}` : ''}
        </div>
      </div>
      
      <div class="urgent">
        <strong>⚠️ 対応のお願い</strong><br>
        この依頼への対応可否について、システム上でご回答をお願いいたします。
      </div>
      
      <div style="text-align: center;">
        <a href="${requestUrl}" class="cta-button">依頼の詳細を確認する</a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
        ※このメールはHOME-DRUG CONNECTシステムから自動送信されています。<br>
        ※依頼への回答は、必ずシステム上から行ってください。
      </p>
    </div>
    
    <div class="footer">
      <p>HOME-DRUG CONNECT<br>
      在宅医療の架け橋を、デジタルで。</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
${pharmacyName} 御中

HOME-DRUG CONNECTを通じて、新規の在宅医療依頼が届きました。

【依頼医師情報】
医師名：${doctorName}
医療機関：${doctorOrganization}
連絡先：${doctorEmail}

【患者情報概要】
服用中の薬剤：
${medicationsList}

既往・現疾患：${conditionsList}
${patientInfo.treatmentPlan ? `今後の治療方針：${patientInfo.treatmentPlan}` : ''}
${patientInfo.notes ? `備考：${patientInfo.notes}` : ''}

この依頼への対応可否について、以下のURLからシステムにログインし、ご回答をお願いいたします。

${requestUrl}

※このメールはHOME-DRUG CONNECTシステムから自動送信されています。
※依頼への回答は、必ずシステム上から行ってください。

HOME-DRUG CONNECT
在宅医療の架け橋を、デジタルで。
  `

  return { html, text }
}