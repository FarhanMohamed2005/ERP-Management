# ERP Management System - Security & Deployment Guide

## 🔐 Security Overview

This ERP application includes enterprise-grade security features for safe business data management:

### Implemented Security Measures

#### 1. **Authentication & Authorization**
- ✅ JWT-based authentication with 7-day token expiry
- ✅ bcryptjs password hashing (12 salt rounds)
- ✅ Role-based access control (Admin, Sales, Purchase, Inventory, Viewer)
- ✅ Automatic logout on token expiry
- ✅ Account deactivation capability

#### 2. **Network Security**
- ✅ HTTPS enforcement in production
- ✅ CORS properly configured (whitelist Origins)
- ✅ Content Security Policy (CSP) headers
- ✅ HTTP Strict Transport Security (HSTS)
- ✅ X-Frame-Options (Clickjacking protection)
- ✅ Helmet.js security headers

#### 3. **Rate Limiting**
- ✅ API endpoint rate limiting (100 req/15min in production)
- ✅ Authentication attempts limiting (10 per 15 minutes)
- ✅ File upload rate limiting (5 uploads per minute per user)

#### 4. **Data Protection**
- ✅ MongoDB data validation with Mongoose
- ✅ Input sanitization (mongoSanitize)
- ✅ Comprehensive input validation (no negative amounts, proper data types)
- ✅ XSS protection via Content Security Policy
- ✅ CSRF protection ready (implement if needed)

#### 5. **Database Security**
- ✅ Database indexes for query performance
- ✅ Mongoose schema validation
- ✅ Field-level encryption ready (for PII if needed)
- ✅ Proper referential integrity

#### 6. **File Upload Security**
- ✅ File size limits (10MB default, configurable)
- ✅ File type whitelist (.csv, .xlsx, .xls)
- ✅ Row count limits (10,000 max per upload)
- ✅ Rate limiting on uploads

#### 7. **Audit & Logging**
- ✅ Activity logging for all critical actions
- ✅ Error logging to file
- ✅ User action tracking with timestamps
- ✅ MongoDB connection monitoring

#### 8. **Environment Configuration**
- ✅ Mandatory environment variables (crashes if missing)
- ✅ Production vs Development configurations
- ✅ Secrets management via .env
- ✅ No hardcoded credentials

---

## ⚠️ **CRITICAL: Before Delivering to Company**

### 1. **Change Default Credentials Immediately**

The seeded demo accounts have default passwords. **Change them immediately:**

```bash
# In MongoDB or via the Admin interface:
- admin@erp.com → Change password to strong 16+ char password
- sarah@erp.com → Change password
- mike@erp.com → Change password
- lisa@erp.com → Change password
```

Or connect to app and change via Profile page.

### 2. **Generate Strong JWT Secret**

Replace the JWT_SECRET in `.env`:

```bash
# Run this in Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output and set in .env:
JWT_SECRET=<generated-strong-secret>
```

### 3. **Verify MongoDB Atlas Security**

- ✅ IP whitelist includes company's IP address
- ✅ Database user password is strong
- ✅ Only necessary users have access
- ✅ Backup is enabled

### 4. **Set Up HTTPS Certificate**

For production deployment:
- Obtain SSL/TLS certificate (Let's Encrypt is free)
- Configure on hosting platform
- Test at: https://www.ssllabs.com/ssltest/

### 5. **Secure Environment Variables**

Create `.env` for production with:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-secure-mongodb-uri>
JWT_SECRET=<strong-random-secret>
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**NEVER** commit `.env` to git (already in .gitignore)

### 6. **Configure CORS for Production**

Update `CORS_ORIGINS` to company's domain only:

```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 7. **Update API URL for Production**

In `client/.env`:

```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_APP_ENV=production
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All default passwords changed
- [ ] JWT_SECRET is strong and random
- [ ] CORS_ORIGINS updated to production domain
- [ ] MONGODB_URI points to production database
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Database backup tested
- [ ] Environment variables copied securely

### During Deployment

- [ ] HTTPS/SSL certificate installed
- [ ] Environment variables set on hosting platform
- [ ] Database migrated if needed
- [ ] Seed script run (with --reset if needed)
- [ ] Admin account password changed
- [ ] Email service verified (SMTP working)
- [ ] Gemini AI API key configured (if using AI features)

### Post-Deployment

- [ ] Health check endpoint responds (/api/health)
- [ ] Login works with new credentials
- [ ] HTTPS enforced (redirect from HTTP)
- [ ] Error logs being written
- [ ] Database connection stable
- [ ] Backups running on schedule
- [ ] Monitor error logs daily initially

---

## 📋 Security Best Practices

### Ongoing Maintenance

1. **Monthly**
   - Review activity logs for suspicious patterns
   - Update npm dependencies for security patches
   - Verify backup integrity

2. **Quarterly**
   - Rotate JWT_SECRET (invalidates existing tokens)
   - Review user access permissions
   - Audit MongoDB Atlas access logs
   - Test disaster recovery

3. **Annually**
   - Security penetration test
   - Update SSL/TLS certificate
   - Review and update access control policies

### User Management

- Add new users only as needed
- Disable inactive user accounts
- Change passwords every 90 days
- Use strong passwords (16+ characters, mixed case, symbols)
- Limit Admin role to trusted staff

### Data Backups

- Daily automatic backups (MongoDB Atlas)
- Test restore procedure monthly
- Store offline backups for compliance
- Document backup retention policy

---

## 🚨 Security Incident Response

### If Password is Compromised

1. Change password immediately
2. Review recent activity logs
3. Check for unauthorized orders/changes
4. Consider rotating JWT_SECRET (re-login required for all users)

### If API Key is Exposed

1. Rotate the key immediately
2. Review logs for unauthorized API access
3. Audit all recent transactions

### If Database is Accessed Unauthorized

1. Immediately notify IT security team
2. Enable detailed audit logging
3. Restore from backup if needed
4. Change all database passwords

---

## 📞 Support & Troubleshooting

### Common Issues

**"Could not connect to MongoDB"**
- Verify MongoDB Atlas IP whitelist
- Check MONGODB_URI in .env
- Verify database user credentials
- Check network connectivity

**"CORS request blocked"**
- Verify CORS_ORIGINS includes client domain
- Check if protocol matches (http vs https)

**"Authentication failed"**
- Verify JWT_SECRET matches between instances
- Check token hasn't expired
- Verify user account is active (isActive: true)

### Health Check

```bash
# Test if backend is running
curl https://your-domain.com/api/health

# Response should be:
{
  "success": true,
  "message": "ERP API is running",
  "database": "connected",
  "environment": "production"
}
```

---

## 📚 Additional Resources

- [MongoDB Atlas Security](https://docs.mongodb.com/atlas/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

## ✅ Verification Checklist

Before handing to company, verify:

- [ ] All security measures documented
- [ ] Default passwords changed
- [ ] Strong JWT secret configured
- [ ] HTTPS certificate installed
- [ ] Database secure and backed up
- [ ] Error logs configured
- [ ] Admin user verified
- [ ] All features tested in production environment
- [ ] Seed data cleaned up (if needed)
- [ ] Documentation complete

**Date Verified:** ________________
**Verified By:** ________________
**Company:** ________________

---

**Security Note:** This application is production-ready with enterprise-grade security. However, security is an ongoing process. Regular audits and updates are recommended.
