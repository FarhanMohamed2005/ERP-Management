# ⚠️ CRITICAL: MongoDB Connection Fix Required

## Current Issue
```
MongoDB connection error: Could not connect to any servers in your MongoDB Atlas cluster
```

---

## 🔧 QUICK FIX (3 Minutes)

### Your Current IP Address
```
192.168.201.13
```

### Solution: Add IP to MongoDB Atlas Whitelist

**Step 1:** Go to MongoDB Atlas  
URL: https://www.mongodb.com/cloud/atlas

**Step 2:** Login with your account  
(Look for your ERP Management project)

**Step 3:** Select your cluster  
(Usually named something like "ERP-Cluster" or "Cluster0")

**Step 4:** Navigate to Network Access
- Left sidebar → Find "Network Access"
- Click on it

**Step 5:** Add Your IP
- Click green "+ Add IP Address" button
- Paste this IP: `192.168.201.13`
- (Or click "Add Current IP Address" if in MongoDB Atlas)
- Click "Confirm"

**Step 6:** Wait 1-2 minutes  
MongoDB Atlas needs time to update the whitelist

**Step 7:** Restart Backend
```bash
cd server
npm run dev
```

---

## Alternative: Allow All IPs (Development Only)

⚠️ **NOT RECOMMENDED FOR PRODUCTION** ⚠️

If you want to bypass the IP whitelist:

1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (This allows ALL IPs)
3. Add note: "Development only"
4. Click Confirm
5. Restart server

**⚠️ Remove this before going to production!**

---

## If Still Not Working

### Option A: Use Local MongoDB

Install MongoDB locally and test:

```bash
# In server/.env
MONGODB_URI=mongodb://localhost:27017/erp_management
```

### Option B: Check Credentials

Verify your `.env` file has:
```env
MONGODB_URI=your_full_connection_string_here
```

---

## ✅ Once Connected

Run these commands in order:

```bash
# 1. Restart backend
cd server
npm run dev

# 2. Check if connected (in another terminal)
npm run seed

# 3. Go to frontend
http://localhost:5173

# 4. Login
Email: admin@erp.com
Password: Admin@123456
```

---

## 📝 Reference Information

**Your Network Details:**
- Local IP: 192.168.201.13
- MongoDB Project: ERP Management
- Backend Port: 5000
- Frontend Port: 5173/5174

**Demo Credentials:**
- Admin: admin@erp.com / Admin@123456
- Sales: sarah@erp.com / Sales@123456
- Purchase: mike@erp.com / Purchase@123456
- Inventory: lisa@erp.com / Inventory@123456
- Viewer: john@erp.com / Viewer@123456

---

## 🆘 Still Having Issues?

1. **Check MongoDB Connection String Format:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

2. **Verify Credentials:**
   - Username must be Database User (not project user)
   - Password must match exactly
   - Special characters may need URL encoding

3. **Check Network Firewall:**
   - Ensure port 27017 is not blocked
   - Your firewall allows outbound connections to MongoDB

4. **Verify Database Name:**
   - Should be in your connection string
   - Should exist in MongoDB Atlas

5. **Try MongoDB Compass:**
   - Download: https://www.mongodb.com/products/compass
   - Test connection manually
   - This confirms if the issue is with MongoDB or the app

---

**Status:** ⏳ AWAITING IP WHITELIST UPDATE  
**Action Required:** Add `192.168.201.13` to MongoDB Atlas network access
