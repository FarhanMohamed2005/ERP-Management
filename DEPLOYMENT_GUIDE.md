# ERP Management System - Deployment Guide

## Quick Start for Company

### Prerequisites
- Node.js 18 or higher
- MongoDB Atlas account
- npm or yarn

### Step 1: Install Dependencies

```bash
npm run install-all
```

This installs dependencies for both frontend and server.

### Step 2: Configure Environment Variables

#### Backend (.env in `server/` folder)

Create `server/.env` with the following:

```env
# Server
NODE_ENV=production
PORT=5000

# Database - Update with company's MongoDB credentials
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/erp_management?retryWrites=true&w=majority

# JWT - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<generate-strong-random-secret-here>
JWT_EXPIRE=7d

# CORS - Update to company's domain
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email Service - Gmail or SendGrid
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Company ERP

# Gemini AI (Optional - for AI features)
GEMINI_API_KEY=your_api_key_here

# File Upload
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=.csv,.xlsx,.xls

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

#### Frontend (`client/.env`)

Create `client/.env`:

```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_APP_NAME=Company ERP Management
VITE_APP_ENV=production
```

### Step 3: Initialize Database

Run the seeder to create demo data and admin account:

```bash
cd server
npm run seed
```

**Default Credentials (CHANGE IMMEDIATELY):**
- Email: admin@erp.com
- Password: Admin@123456

**⚠️ CHANGE ALL DEFAULT PASSWORDS IMMEDIATELY AFTER FIRST LOGIN**

### Step 4: Build Frontend

```bash
cd client
npm run build
```

This creates an optimized production build in `client/dist/`.

### Step 5: Start Backend

```bash
cd server
npm run start
```

Backend will run on `http://localhost:5000`

### Step 6: Run Frontend (Development)

For development:

```bash
cd client
npm run dev
```

For production, serve the built files from `client/dist/` using nginx, Vercel, or similar.

---

## Hosting Options

### Option A: Vercel (Frontend) + Railway (Backend)

**Easiest for startups**

1. Push code to GitHub
2. Deploy frontend on Vercel
3. Deploy backend on Railway
4. Update env variables on each platform
5. Cost: ~$0/month (free tier) to $10/month

### Option B: DigitalOcean App Platform

**Best value**

1. Connect GitHub repository
2. Create web service for backend
3. Create static site for frontend
4. Cost: $5-20/month

### Option C: Self-Hosted (Recommended for Companies)

1. Rent a VPS (Ubuntu 20.04+)
2. Install Node.js, Nginx, MongoDB
3. Configure SSL with Let's Encrypt
4. Set up automated backups
5. Cost: $10-50/month depending on server specs

---

## MongoDB Atlas Setup

### 1. Create Organization & Cluster

- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create new organization
- Create M0 cluster (free) or M2+ (paid)
- Enable backup

### 2. Create Database User

- Go to Database Access
- Create new user
- Set strong password (copy for .env)
- Enable Read/Write access

### 3. Configure IP Whitelist

- Go to Network Access
- Add company's IP address (or use VPN IP)
- Allow internal network if on office network
- **IMPORTANT:** Do NOT use 0.0.0.0/0 in production

### 4. Get Connection String

- Click Connect
- Choose "Connect to your application"
- Copy connection string
- Replace `<password>` and `<dbname>`
- Paste into `MONGODB_URI` in .env

---

## SSL/HTTPS Certificate

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renew
sudo certbot renew --dry-run
```

### Using Cloudflare (Easy)

1. Add domain to Cloudflare (free)
2. Enable Flexible SSL
3. Update DNS records
4. Done! (auto-renewed)

---

## Post-Deployment Checklist

- [ ] All default passwords changed
- [ ] Strong JWT_SECRET configured
- [ ] CORS_ORIGINS updated to production domain
- [ ] Database backups enabled
- [ ] HTTPS certificate installed
- [ ] Email service tested
- [ ] Database connection verified
- [ ] Admin account verified
- [ ] Sample data loaded
- [ ] Activity logging working
- [ ] Error logs monitored
- [ ] Health check passing (`/api/health`)

---

## Monitoring & Maintenance

### Daily
- Check error logs
- Monitor database performance
- Verify backup completion

### Weekly
- Review user activity
- Check suspicious login attempts
- Update npm packages (security patches)

### Monthly
- Audit user access
- Review database size
- Test restore procedures

### Quarterly
- Security audit
- Performance optimization
- Update documentation

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
tail -f logs/app.log

# Verify environment variables
cat server/.env

# Test MongoDB connection
mongosh "your_connection_string"
```

### Frontend blank/won't load
```bash
# Clear cache
rm -rf client/dist client/node_modules/.vite

# Rebuild
npm run build
```

### Database connection issues
- Verify IP whitelist on MongoDB Atlas
- Check MONGODB_URI in .env
- Verify database user credentials
- Test connectivity: `mongosh "connection_string"`

### Email not sending
- Verify SMTP credentials
- Enable "Less secure apps" for Gmail (or use app password)
- Check firewall isn't blocking port 587

---

## Performance Tips

1. **Enable Redis caching** (optional, for scaling)
2. **Use CDN** for frontend assets
3. **Monitor database queries** with MongoDB Atlas tools
4. **Scale horizontally** by deploying multiple backend instances
5. **Use load balancer** (nginx) for multiple backends

---

## Backup & Recovery

### Automated Backups (MongoDB Atlas)

Enabled by default. To restore:

1. Go to MongoDB Atlas
2. Deployment → Restore
3. Select snapshot
4. Restore to new cluster or current

### Manual Backup

```bash
mongodump --uri "connection_string" --out ./backup
```

### Manual Restore

```bash
mongorestore --uri "connection_string" ./backup
```

---

## Support

For issues or questions:
1. Check SECURITY_AND_DEPLOYMENT.md
2. Review error logs in `server/logs/app.log`
3. Check MongoDB Atlas dashboard
4. Review deployment platform (Vercel, Railway, etc.) logs

---

**Ready for Production:** ✅

This application is fully tested and ready for enterprise deployment.
