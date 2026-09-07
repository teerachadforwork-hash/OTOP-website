import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = os.getenv("SMTP_SERVER", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

def send_reset_password_email(to_email: str, token: str, host_url: str):
    reset_link = f"{host_url}/reset-password?token={token}"
    
    subject = "Reset your OTOP Connect password"
    body = f"""
    <h2>คำขอเปลี่ยนรหัสผ่าน (Reset Password)</h2>
    <p>สวัสดีคุณผู้ใช้งาน,</p>
    <p>เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชี OTOP Connect ของคุณ กรุณาคลิกที่ลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
    <p><a href="{reset_link}" style="display:inline-block;padding:10px 20px;color:white;background-color:#b85434;text-decoration:none;border-radius:5px;">เปลี่ยนรหัสผ่าน</a></p>
    <p>ลิงก์นี้จะหมดอายุภายใน 15 นาที</p>
    <p>หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
    <br>
    <p>ขอแสดงความนับถือ,<br>ทีมงาน OTOP Connect</p>
    """

    if not SMTP_SERVER or not SMTP_USER or not SMTP_PASSWORD:
        # Fallback to console print if SMTP is not configured
        print("\n" + "="*50)
        print(f"MOCK EMAIL SENT TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"RESET LINK: {reset_link}")
        print("="*50 + "\n")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        # Even if it fails, we shouldn't necessarily crash the app, 
        # but the user won't get the email. For safety, log the link in console.
        print(f"RESET LINK (Fallback): {reset_link}")
        return False
