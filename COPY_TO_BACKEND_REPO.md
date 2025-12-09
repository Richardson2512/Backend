# 📋 Files to Copy to Backend Repository

## Backend Repo: https://github.com/getinsightsnap/Backend.git

---

## ✅ Complete Checklist

Everything in this `insightsnap-backend` folder is ready to copy to your backend repo!

### Files Already Updated:

- ✅ **routes/payments.js** (766 lines) - Complete DoDo Payments webhook integration
- ✅ **server.js** - Payment routes registered (lines 16 & 90)
- ✅ **package.json** - All dependencies added:
  - `dodopayments: ^2.2.1`
  - `standardwebhooks: ^1.0.0`
  - `@supabase/supabase-js: ^2.76.1`
- ✅ **env.example** - DoDo Payments configuration added

---

## 🚀 How to Copy to Backend Repo

### Option 1: Copy Entire Folder
```bash
# Copy the entire insightsnap-backend folder
cp -r insightsnap-backend/* /path/to/Backend/
```

### Option 2: Copy Individual Files
```bash
# Navigate to your backend repo
cd /path/to/Backend

# Copy the payment route
cp /path/to/project/insightsnap-backend/routes/payments.js routes/

# Copy updated server.js
cp /path/to/project/insightsnap-backend/server.js server.js

# Copy updated package.json
cp /path/to/project/insightsnap-backend/package.json package.json

# Copy updated env.example
cp /path/to/project/insightsnap-backend/env.example env.example
```

### Option 3: Manual Copy (Recommended for Review)
1. Open both folders side by side
2. Copy `routes/payments.js` → Backend repo
3. Update `server.js` in Backend repo (add 2 lines for payment routes)
4. Update `package.json` in Backend repo (add 3 dependencies)
5. Update `env.example` in Backend repo (add DoDo config section)

---

## 📦 After Copying to Backend Repo

```bash
cd Backend

# Install new dependencies
npm install

# Verify no errors
npm start

# Check routes are registered
# You should see: ✅ Webhook verifier initialized (or warning if no secret)

# Commit changes
git add .
git commit -m "feat: Add DoDo Payments webhook integration"
git push origin main
```

---

## 🔑 Railway Environment Variables to Add

After pushing to GitHub, add these in Railway:

```bash
DODO_PAYMENTS_API_KEY=WeqI558uuijIF9Ph.C3CAaxCfKrFngrqlebvW-YYT7RGBjK_WordlLbi0vYyYEXo5
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_your_webhook_secret_here
DODO_STANDARD_PLAN_ID=pdt_vB1m50QapOBhuHMN9HSqr
DODO_PRO_PLAN_ID=pdt_yAgzJnUO12DbiNRhgGkay
```

Make sure these are already set:
```bash
SUPABASE_URL=https://gytwrtduuauffcrvnlza.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=https://insightsnap.com
```

---

## 🧪 Test After Deployment

1. **Health Check:**
   ```bash
   curl https://your-backend.railway.app/api/payments/health
   ```

2. **API Key Test:**
   ```bash
   curl https://your-backend.railway.app/api/payments/test
   ```

3. **Check Railway Logs:**
   - Look for: "Webhook verifier initialized"
   - No "Cannot find module" errors
   - Server starts successfully

---

## 📝 Key Changes Summary

### NEW FILES:
- `routes/payments.js` - Complete payment integration (766 lines)

### UPDATED FILES:
- `server.js` - Added payment routes import and registration
- `package.json` - Added dodopayments, standardwebhooks, @supabase/supabase-js
- `env.example` - Added DoDo Payments configuration section

### LINES TO ADD TO server.js:
```javascript
// Line 16 (with other requires)
const paymentRoutes = require('./routes/payments');

// Line 90 (with other app.use)
app.use('/api/payments', paymentRoutes);
```

---

## 🎯 What This Adds

**New API Endpoints:**
- `POST /api/payments/create-checkout` - Create payment session
- `POST /api/payments/webhook` - Receive DoDo webhooks
- `GET /api/payments/health` - Health check
- `GET /api/payments/test` - Test API key

**Features:**
- Webhook signature verification (Standard Webhooks spec)
- Automatic user tier updates in Supabase
- Support for trials, renewals, cancellations
- Handles all subscription events
- Comprehensive error handling and logging

---

## ✅ You're Ready!

Everything in this `insightsnap-backend` folder is complete and ready to copy to your Backend repository at https://github.com/getinsightsnap/Backend.git

Just copy the files, run `npm install`, commit, push, and add environment variables to Railway!

