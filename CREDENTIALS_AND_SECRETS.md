# Credentials & Secrets Management

## ⚠️ CRITICAL SECURITY REQUIREMENTS

### Before Using in Production

**Change ALL of these immediately:**

1. **Default Admin Password**
   - Current: Admin@123456
   - Action: Log in and change via Profile page

2. **JWT Secret**
   - Current: In .env file
   - Action: Generate new random secret:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Update: `JWT_SECRET=<new-secret>` in server/.env

3. **Database Credentials**
   - Ensure MongoDB Atlas user password is strong
   - Do NOT share database password

4. **CORS Origins**
   - Current: Localhost development origins
   - Action: Update to company domain:
     ```env
     CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
     ```

5. **Email Credentials**
   - SMTP_USER: Update to company email
   - SMTP_PASS: Use app password (not regular password)
   - For Gmail: Generate app password at myaccount.google.com/apppasswords

6. **Gemini API Key** (if using AI features)
   - Keep private, never commit to git
   - Rotate periodically

---

## Environment Variables Checklist

### Required (Application will fail without these)
- [ ] MONGODB_URI
- [ ] JWT_SECRET

### Important (Affects functionality)
- [ ] DATABASE_PASSWORD (strong, 16+ chars)
- [ ] CORS_ORIGINS (production domain)
- [ ] SMTP_* (for email notifications)
- [ ] GEMINI_API_KEY (for AI features)

### Optional (Has defaults)
- [ ] PORT (default: 5000)
- [ ] JWT_EXPIRE (default: 7d)
- [ ] LOG_LEVEL (default: info)

---

## Secrets Management Best Practices

### DO ✅
- Store secrets in .env file (NOT in code)
- Use strong, random strings (32+ characters)
- Rotate secrets periodically
- Use environment variables on hosting platform
- Enable audit logging
- Backup .env securely (encrypted, offline)

### DON'T ❌
- Commit .env to git (already in .gitignore)
- Share secrets via email or Slack
- Use predictable secrets (1234, password, etc.)
- Store secrets in comments
- Put secrets in database (except hashed passwords)
- Share authentication details with users

---

## Demo Credentials (Development Only)

**⚠️ Change immediately in production**

| Email | Password | Role |
|-------|----------|------|
| admin@erp.com | Admin@123456 | Admin |
| sarah@erp.com | Sales@123456 | Sales |
| mike@erp.com | Purchase@123456 | Purchase |
| lisa@erp.com | Inventory@123456 | Inventory |

**How to change:**
1. Log in with admin account
2. Go to Users page
3. Search for user
4. Click Edit
5. Click "Change Password"
6. Enter new strong password (16+ chars recommended)
7. Save

---

## API Keys & External Services

### MongoDB Atlas
- **Security Level:** High
- **Scope:** Database access
- **Rotation:** Every 90 days recommended
- **Disable if:** Suspected breach
- **Location:** `MONGODB_URI` in server/.env

### Gemini AI
- **Security Level:** High
- **Scope:** AI features only
- **Rotation:** Every 6 months
- **Disable if:** Budget exceeded or misuse detected
- **Location:** `GEMINI_API_KEY` in server/.env
- **Cost:** Pay-as-you-go (set quotas in Google Cloud)

### Email Service (Gmail/SendGrid)
- **Security Level:** Medium
- **Scope:** Sending notifications
- **Rotation:** Every 90 days
- **Action:** Use app password, not account password
- **Location:** `SMTP_USER`, `SMTP_PASS` in server/.env

---

## Password Policy

### Requirements
- **Minimum Length:** 8 characters (recommended: 16+)
- **Character Types:** Uppercase, lowercase, numbers, symbols
- **Examples:**
  - ✅ MySecure@Pass123
  - ✅ CompanyERP#2024Secure
  - ❌ password123
  - ❌ 12345678
  - ❌ QwertyAsdf

### Password Expiration
- **For Admins:** 60 days
- **For Users:** 90 days
- **Implementation:** Can be set in Settings page

### Password History
- **Remember:** Last 5 passwords
- **Cannot reuse:** Previous 5 passwords
- **Enforced:** Yes

---

## Session Management

### Token Expiry
- **Default:** 7 days
- **Can change:** In `JWT_EXPIRE` in server/.env
- **Security note:** Shorter = more secure, longer = better UX

### Auto Logout
- **Triggers on:** Token expiry
- **User redirected to:** Login page
- **User loses:** All unsaved data (warn before logout)

### Concurrent Sessions
- **Currently allowed:** Unlimited per user
- **To limit:** Can be implemented if needed

---

## Account Security Features

### Implemented ✅
- Password hashing with bcryptjs (12 rounds)
- Account deactivation
- Activity logging (all actions tracked)
- Failed login tracking
- Password reset via email
- Token expiration

### Recommended to Add
- Two-factor authentication (2FA)
- Login alerts via email
- Device/location tracking
- Passwordless authentication
- Biometric login

---

## Incident Response

### If Admin Password is Compromised
1. **Immediately change password**
   - Log in with new password
   - Go to Users → Find compromised account
   - Change password
   
2. **Review recent activity**
   - Go to Activity Log
   - Check for suspicious actions
   - Review recent admin changes

3. **Audit database**
   - Check for unauthorized records
   - Review financial transactions
   - Check for data exfiltration

4. **Rotate JWT Secret** (Optional - will log out all users)
   ```env
   JWT_SECRET=<new-random-secret>
   ```
   - All active sessions will be invalidated
   - Users must log in again

### If API Key is Compromised
1. **Rotate immediately**
   - Go to service (Gemini, SendGrid, etc.)
   - Generate new key
   - Update .env and redeploy

2. **Check usage logs**
   - Look for unauthorized API calls
   - Check billing for unexpected charges

3. **Monitor closely**
   - Watch API logs for 30 days
   - Set up alerts for unusual activity

---

## Backup & Recovery Procedures

### What to Backup
- [ ] server/.env (encrypted, offline storage)
- [ ] MongoDB database (automated in Atlas)
- [ ] Email templates and confirmations
- [ ] JWT_SECRET (secure location)

### Backup Frequency
- **Database:** Daily (automatic via MongoDB Atlas)
- **Environment file:** On each change
- **Code with secrets:** NEVER (use .env for secrets)

### Restore Procedure
1. Get .env from secure backup location
2. Connect to backup MongoDB cluster
3. Restore latest backup snapshot
4. Verify data integrity
5. Restart application

---

## Compliance & Legal

### Data Protection (GDPR)
- Personal data must be:
  - Collected lawfully
  - Stored securely
  - Retained only as long as needed
  - Deleted upon request (right to be forgotten)

### Implementation
- User data: Accessible in Users/Customers modules
- Deletion: Available in delete/archive features
- Audit trail: Activity Log shows all data access
- Encryption: In transit (HTTPS) and at rest (MongoDB encryption)

### SOC 2 Compliance (if required)
- ✅ Access controls (role-based)
- ✅ Audit logging
- ✅ Encryption (in transit)
- ⚠️ Encryption at rest (requires MongoDB Enterprise)
- ✅ Monitoring & alerts
- ⚠️ 24/7 security operations center (outsource to provider)

---

## Checklist: Before Handing to Company

- [ ] All default passwords changed to strong passwords
- [ ] JWT_SECRET is 32+ random characters
- [ ] CORS_ORIGINS updated to production domain
- [ ] Email credentials verified and working
- [ ] Gemini API key (optional) working if enabled
- [ ] MongoDB Atlas IP whitelist includes company IP
- [ ] Database backup tested and verified
- [ ] HTTPS certificate installed and valid
- [ ] All secrets removed from code
- [ ] .env file is in .gitignore
- [ ] Documentation provided to company
- [ ] Admin account tested and verified
- [ ] Sample data loaded and verified
- [ ] Audit logs configured and working

---

**Last Updated:** [Deployment Date]
**Last Rotated:** [Last Secret Rotation Date]
**Next Rotation Due:** [90 days from rotation date]

---

## Emergency Contacts

- MongoDB Support: https://www.mongodb.com/support
- Gemini API Support: https://cloud.google.com/support
- Email Provider Support: [Gmail or SendGrid contact]
- Application Maintainer: [Your Contact Info]
