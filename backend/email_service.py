try:
    import resend
except ImportError:
    resend = None
import os

if resend:
    resend.api_key = os.getenv("RESEND_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM", "onboarding@resend.dev")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://watergaurd-project.vercel.app")

def send_report_submitted_email(report_id: str, category: str, location: str, user_email: str):
    if not user_email:
        print("[EMAIL] No user email provided, skipping")
        return
    short_id = f"WG-{report_id[:6].upper()}"
    if resend:
        try:
            resend.Emails.send({
                "from": EMAIL_FROM,
                "to": user_email,
                "subject": f"[WaterGuard] Report Received - {short_id}",
                "html": f"""
                <div style="font-family:sans-serif;max-width:500px;margin:auto;">
                  <h2 style="color:#2563eb;">WaterGuard</h2>
                  <p>Your water issue report has been received.</p>
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px;color:#6b7280;">Report ID</td>
                        <td style="padding:8px;font-weight:bold;">#{short_id}</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;">Category</td>
                        <td style="padding:8px;text-transform:capitalize;">{category}</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;">Location</td>
                        <td style="padding:8px;">{location}</td></tr>
                  </table>
                  <a href="{FRONTEND_URL}/track/{report_id}"
                     style="display:inline-block;margin-top:16px;padding:10px 20px;
                            background:#2563eb;color:white;border-radius:8px;
                            text-decoration:none;font-weight:bold;">
                  Track Report
                  </a>
                </div>
                """
            })
            print(f"[EMAIL] Submitted email sent to {user_email} for {short_id}")
        except Exception as e:
            print(f"[EMAIL ERROR] {e}")
    else:
        print("Resend not available, skipping email sending")


def send_report_assigned_email(report_id: str, category: str, department: str, user_email: str):
    if not user_email:
        print("[EMAIL] No user email provided, skipping")
        return
    short_id = f"WG-{report_id[:6].upper()}"
    if resend:
        try:
            resend.Emails.send({
                "from": EMAIL_FROM,
                "to": user_email,
                "subject": f"[WaterGuard] Report Assigned - {short_id}",
                "html": f"""
                <div style="font-family:sans-serif;max-width:500px;margin:auto;">
                  <h2 style="color:#2563eb;">WaterGuard</h2>
                  <p>Your report has been assigned to a department.</p>
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px;color:#6b7280;">Report ID</td>
                        <td style="padding:8px;font-weight:bold;">#{short_id}</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;">Category</td>
                        <td style="padding:8px;text-transform:capitalize;">{category}</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;">Assigned To</td>
                        <td style="padding:8px;">{department}</td></tr>
                  </table>
                  <a href="{FRONTEND_URL}/track/{report_id}"
                     style="display:inline-block;margin-top:16px;padding:10px 20px;
                            background:#2563eb;color:white;border-radius:8px;
                            text-decoration:none;font-weight:bold;">
                  Track Report
                  </a>
                </div>
                """
            })
            print(f"[EMAIL] Assigned email sent to {user_email} for {short_id}")
        except Exception as e:
            print(f"[EMAIL ERROR] {e}")
    else:
        print("Resend not available, skipping email sending")


def send_report_resolved_email(report_id: str, category: str, location: str, user_email: str):
    if not user_email:
        print("[EMAIL] No user email provided, skipping")
        return
    short_id = f"WG-{report_id[:6].upper()}"
    if resend:
        try:
            resend.Emails.send({
                "from": EMAIL_FROM,
                "to": user_email,
                "subject": f"[WaterGuard] Issue Resolved - {short_id}",
                "html": f"""
                <div style="font-family:sans-serif;max-width:500px;margin:auto;">
                  <h2 style="color:#2563eb;">WaterGuard</h2>
                  <p>Great news! Your reported issue has been resolved.</p>
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px;color:#6b7280;">Report ID</td>
                        <td style="padding:8px;font-weight:bold;">#{short_id}</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;">Category</td>
                        <td style="padding:8px;text-transform:capitalize;">{category}</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;">Location</td>
                        <td style="padding:8px;">{location}</td></tr>
                  </table>
                  <a href="{FRONTEND_URL}/track/{report_id}"
                     style="display:inline-block;margin-top:16px;padding:10px 20px;
                            background:#16a34a;color:white;border-radius:8px;
                            text-decoration:none;font-weight:bold;">
                  View Resolution
                  </a>
                </div>
                """
            })
            print(f"[EMAIL] Resolved email sent to {user_email} for {short_id}")
        except Exception as e:
            print(f"[EMAIL ERROR] {e}")
    else:
        print("Resend not available, skipping email sending")


def send_report_rejected_email(report_id: str, category: str, user_email: str):
    if not user_email:
        print("[EMAIL] No user email provided, skipping")
        return
    short_id = f"WG-{report_id[:6].upper()}"
    if resend:
        try:
            resend.Emails.send({
                "from": EMAIL_FROM,
                "to": user_email,
                "subject": f"[WaterGuard] Report Rejected - {short_id}",
                "html": f"""
                <div style="font-family:sans-serif;max-width:500px;margin:auto;">
                  <h2 style="color:#2563eb;">WaterGuard</h2>
                  <p>Your report has been reviewed and could not be processed.</p>
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px;color:#6b7280;">Report ID</td>
                        <td style="padding:8px;font-weight:bold;">#{short_id}</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;">Category</td>
                        <td style="padding:8px;text-transform:capitalize;">{category}</td></tr>
                  </table>
                  <a href="{FRONTEND_URL}/track/{report_id}"
                     style="display:inline-block;margin-top:16px;padding:10px 20px;
                            background:#dc2626;color:white;border-radius:8px;
                            text-decoration:none;font-weight:bold;">
                  View Details
                  </a>
                </div>
                """
            })
            print(f"[EMAIL] Rejected email sent to {user_email} for {short_id}")
        except Exception as e:
            print(f"[EMAIL ERROR] {e}")
    else:
        print("Resend not available, skipping email sending")