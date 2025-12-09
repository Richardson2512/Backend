# Railway Same-Service Setup: Backend + Ollama

This guide shows how to deploy both your backend and Ollama in the same Railway service.

## ✅ What's Been Set Up

1. **Dockerfile** - Installs Ollama, Node.js, and pulls AI models
2. **start-railway.sh** - Startup script that runs both services
3. **.dockerignore** - Excludes unnecessary files from Docker build

## 🚀 Railway Deployment Steps

### Step 1: Push Code to Git

The Dockerfile and startup script are ready. Just commit and push:

```bash
git add insightsnap-backend/Dockerfile insightsnap-backend/start-railway.sh insightsnap-backend/.dockerignore
git commit -m "Add Dockerfile for same-service Ollama deployment"
git push origin main
```

### Step 2: Configure Railway Service

1. **Go to your Railway project**
2. **Select your backend service** (or create new one)
3. **Railway will auto-detect the Dockerfile** in `insightsnap-backend/` directory

### Step 3: Set Environment Variables

In Railway → Your Service → **Variables** tab, add:

#### Required Variables:

```
GROQ_API_KEY=your_groq_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
SCRAPECREATORS_API_KEY=your_scrapecreators_api_key_here
PORT=3001
NODE_ENV=production
```

#### Other Variables (if you have them):

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
DODO_PAYMENTS_API_KEY=your_payments_key
DODO_PAYMENTS_WEBHOOK_SECRET=your_webhook_secret
DODO_STANDARD_PLAN_ID=pdt_vB1m50QapOBhuHMN9HSqr
DODO_PRO_PLAN_ID=pdt_yAgzJnUO12DbiNRhgGkay
FRONTEND_URL=https://insightsnap.co
ALLOWED_ORIGINS=https://insightsnap.co
```

### Step 4: Configure Port

1. In Railway service → **Settings** → **Networking**
2. Set **Port**: `3001` (for your backend API)
3. Ollama runs on port 11434 internally (not exposed externally)

### Step 5: Deploy

Railway will automatically:
1. Build the Docker image (this takes 5-10 minutes as it pulls AI models)
2. Start Ollama server
3. Start your Node.js backend

## 📋 How It Works

The startup script (`start-railway.sh`):

1. **Starts Ollama** in background on port 11434
2. **Waits for Ollama** to be ready (checks `/api/tags` endpoint)
3. **Starts Node.js backend** on port 3001
4. **Waits for Node.js** (main process)

Both services run in the same container, but communicate via `localhost:11434`.

## ⚙️ Important Configuration

### OLLAMA_BASE_URL

**Set to**: `http://localhost:11434`

This is correct because:
- Ollama and backend are in the same container
- They share the same network namespace
- `localhost` refers to the same container

### Port Configuration

- **Port 3001**: Your backend API (exposed to internet)
- **Port 11434**: Ollama (internal only, not exposed)

Railway only needs to expose port 3001. Ollama runs internally.

## 🔍 Verify It's Working

After deployment, check:

1. **Railway Logs**: You should see:
   ```
   🚀 Starting Ollama server...
   ⏳ Waiting for Ollama to be ready...
   ✅ Ollama is ready!
   🔍 Checking for AI models...
   🚀 Starting Node.js backend...
   ```

2. **Test Backend Health**:
   ```bash
   curl https://your-backend-url.up.railway.app/api/search/debug
   ```

   Should return:
   ```json
   {
     "success": true,
     "services": {
       "ollama": {
         "configured": true,
         "status": "ready",
         "baseUrl": "http://localhost:11434"
       }
     }
   }
   ```

3. **Test Ollama Models** (via Railway CLI):
   ```bash
   railway run ollama list
   ```
   
   Should show:
   ```
   NAME            ID      SIZE    MODIFIED
   llama3.1:8b     xxx     ~4.7 GB  xxxx
   ```

## ⚠️ Important Notes

### Memory Requirements

Your Railway service needs **at least 8GB RAM** to run both:
- Ollama with Llama 3.1 8B loaded (~5-6GB for model)
- Node.js backend (~500MB-1GB)
- **Note:** Groq API (primary) doesn't require local resources

**Railway Hobby Plan** may have limited RAM. Consider upgrading if you see memory errors.

### Build Time

First deployment will take **10-15 minutes** because:
- Docker image downloads Ollama
- Llama 3.1 8B model is pulled during startup (~4.7GB)

**Note:** Groq API (primary) requires no model download - it's cloud-based.
Subsequent deployments are faster (models are cached).

### Cold Starts

First AI request after deployment may be slow as models load into memory. This is normal.

### Model Persistence

Models are pulled during **Docker build**, so they persist in the image. If you need to update models:

1. Update Dockerfile with new model names
2. Rebuild and redeploy

## 🛠️ Troubleshooting

### Backend can't connect to Ollama

**Error**: `ECONNREFUSED` or `Connection refused`

**Solution**:
- Check Railway logs - is Ollama starting?
- Verify `OLLAMA_BASE_URL=http://localhost:11434` is set
- Wait a bit longer - Ollama may still be starting

### Out of Memory

**Error**: Container killed or crashes

**Solution**:
- Upgrade Railway plan for more RAM
- Or use separate Ollama service (Option 1)

### Models not found

**Error**: `model not found` when making AI requests

**Solution**:
- Check logs: `railway run ollama list`
- Models should be pulled during build
- If missing, rebuild Docker image

### Slow responses

**Possible causes**:
- First request after deployment (cold start)
- Railway service under-resourced
- Model loading into memory

**Solution**: Wait for first request to complete, subsequent requests are faster.

## 🔄 Updating Models

To update or add new models:

1. Edit `insightsnap-backend/Dockerfile`
2. Add/change model pull commands:
   ```dockerfile
   RUN ollama pull new-model || true
   ```
3. Commit and push to trigger rebuild
4. Railway will rebuild with new models

## 📊 Monitoring

Watch Railway logs for:
- ✅ `Ollama is ready!` - Ollama started successfully
- ✅ `Starting Node.js backend...` - Backend starting
- ❌ Any errors in Ollama or Node.js startup

## ✅ Summary

**What You Need in Railway:**

1. ✅ Dockerfile (already created)
2. ✅ Environment Variable: `GROQ_API_KEY=your_groq_api_key_here` (Primary AI)
3. ✅ Environment Variable: `OLLAMA_BASE_URL=http://localhost:11434` (Backup AI)
4. ✅ Environment Variable: `SCRAPECREATORS_API_KEY=your_scrapecreators_api_key_here`
5. ✅ Port: `3001` (in Railway service settings)
6. ✅ Other existing env vars (Supabase, DoDo Payments, etc.)

**That's it!** Railway will handle the rest automatically. 🚀

