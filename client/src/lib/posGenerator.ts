/**
 * POS Receipt Generator with QR Code
 * Generates printable POS receipts with QR code verification
 */

interface POSData {
  recordId: string
  title: string
  description: string
  amount?: number
  status: string
  createdAt: string
  user?: {
    staffId: string
    department: string
    position: string
  }
  verificationCode?: string
  items?: Array<{
    description: string
    quantity: number
    amount: number
  }>
}

/**
 * Generate a unique verification code
 */
export const generateVerificationCode = (recordId: string): string => {
  const timestamp = new Date().getTime().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${recordId.slice(-4).toUpperCase()}-${timestamp}-${random}`
}

/**
 * Generate QR Code data URL
 */
export const generateQRCodeData = async (text: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    
    // Using a simple data URL format that shows the text
    // For actual QR code generation, you would use qrcode library
    const qrText = encodeURIComponent(text)
    const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrText}`
    
    resolve(qrURL)
  })
}

/**
 * Generate POS Receipt HTML
 */
export const generatePOSHTML = async (data: POSData): Promise<string> => {
  const verificationCode = data.verificationCode || generateVerificationCode(data.recordId)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(verificationCode)}`
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>POS Receipt - ${data.recordId}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          background: #f5f5f5;
          padding: 20px;
        }
        
        .receipt {
          width: 80mm;
          background: white;
          margin: 0 auto;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        
        .header h1 {
          font-size: 18px;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .header .subtitle {
          font-size: 11px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .receipt-number {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .line {
          border-bottom: 1px dashed #333;
          margin: 10px 0;
        }
        
        .receipt-date {
          font-size: 11px;
          text-align: center;
          margin-bottom: 15px;
          color: #666;
        }
        
        .section {
          margin-bottom: 15px;
        }
        
        .section-title {
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 8px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 5px;
        }
        
        .info-label {
          font-weight: bold;
          color: #333;
        }
        
        .info-value {
          text-align: right;
          color: #666;
        }
        
        .amount {
          font-size: 14px;
          font-weight: bold;
          text-align: right;
          color: #0079e6;
          margin: 10px 0;
        }
        
        .status-badge {
          display: inline-block;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-pending {
          background: #fff3cd;
          color: #856404;
        }
        
        .status-approved {
          background: #d4edda;
          color: #155724;
        }
        
        .status-paid {
          background: #d1ecf1;
          color: #0c5460;
        }
        
        .qr-section {
          text-align: center;
          margin: 20px 0;
          padding: 15px;
          background: white;
          border: 2px solid #333;
          border-radius: 6px;
        }
        
        .qr-code {
          display: inline-block;
          margin-bottom: 10px;
          padding: 10px;
          background: white;
          border: 1px solid #ddd;
        }
        
        .qr-code img {
          max-width: 180px;
          height: auto;
          image-rendering: pixelated;
          display: block;
        }
        
        .verification-code {
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 2px;
          color: #0079e6;
          word-break: break-all;
          margin-top: 10px;
        }
        
        .footer {
          text-align: center;
          font-size: 10px;
          color: #999;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px dashed #ddd;
        }
        
        .items-table {
          width: 100%;
          font-size: 11px;
          margin: 10px 0;
        }
        
        .items-table th {
          text-align: left;
          font-weight: bold;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        
        .items-table td {
          padding: 5px 0;
        }
        
        .items-table .qty {
          text-align: center;
        }
        
        .items-table .amt {
          text-align: right;
        }
        
        .total-row {
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
          font-weight: bold;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
        }
        
        .user-info {
          font-size: 10px;
          color: #666;
          line-height: 1.4;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .receipt {
            width: 100%;
            box-shadow: none;
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Header -->
        <div class="header">
          <h1>INYANGE APPS</h1>
          <div class="subtitle">Request Management System</div>
          <div class="subtitle">© 2026 Inyange Logistics Limited</div>
        </div>
        
        <!-- Receipt Number -->
        <div class="receipt-number">Ref: ${data.recordId}</div>
        <div class="receipt-date">${new Date(data.createdAt).toLocaleString()}</div>
        
        <!-- Request Details -->
        <div class="section">
          <div class="section-title">Request Details</div>
          <div class="info-row">
            <span class="info-label">Title:</span>
            <span class="info-value">${data.title}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Description:</span>
            <span class="info-value">${data.description || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">
              <span class="status-badge status-${data.status.toLowerCase()}">
                ${data.status.toUpperCase()}
              </span>
            </span>
          </div>
        </div>
        
        <!-- Amount -->
        ${data.amount ? `
          <div class="amount">Amount: ₦${data.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</div>
        ` : ''}
        
        <!-- Items Table (if available) -->
        ${data.items && data.items.length > 0 ? `
          <div class="section">
            <div class="section-title">Items</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="qty">Qty</th>
                  <th class="amt">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="qty">${item.quantity}</td>
                    <td class="amt">₦${item.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-row">
              <span>TOTAL:</span>
              <span>₦${data.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        ` : ''}
        
        <!-- User Information -->
        ${data.user ? `
          <div class="section">
            <div class="section-title">Requested By</div>
            <div class="user-info">
              <div><strong>${data.user.staffId}</strong></div>
              <div>${data.user.department}</div>
              <div>${data.user.position}</div>
            </div>
          </div>
        ` : ''}
        
        <!-- QR Code Section -->
        <div class="qr-section">
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase;">VERIFICATION CODE</div>
          <div class="qr-code">
            <img src="${qrCodeUrl}" alt="QR Code - Scan for verification" />
          </div>
          <div style="margin-top: 12px; padding: 10px; background: #fff3cd; border-radius: 4px; border: 1px solid #ffc107;">
            <div style="font-size: 11px; font-weight: bold; color: #333; letter-spacing: 2px; word-break: break-all; font-family: monospace;">
              ${verificationCode}
            </div>
          </div>
          <div style="font-size: 9px; color: #666; margin-top: 10px;">
            <div>📱 Scan QR code to verify receipt</div>
            <div>✏️ Or manually enter code above</div>
            <div>✅ Approved by: ${data.user?.staffId || 'System'}</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Thank you for using Inyange Apps</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p style="margin-top: 10px;">Please keep this receipt for your records</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Print POS Receipt
 */
export const printPOSReceipt = async (data: POSData) => {
  const html = await generatePOSHTML(data)
  
  const printWindow = window.open('', '', 'width=800,height=600')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print()
      // Don't close automatically - let user decide
      // printWindow.close()
    }, 250)
  }
}

/**
 * Download POS Receipt as HTML
 */
export const downloadPOSReceipt = async (data: POSData) => {
  const html = await generatePOSHTML(data)
  const blob = new Blob([html], { type: 'text/html' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `POS_${data.recordId}_${new Date().getTime()}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
