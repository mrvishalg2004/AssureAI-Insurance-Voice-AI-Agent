# 🚀 Quick Start - Bulk Call System

## ⚡ 3 Steps to Get Started

### 1️⃣ Configure Bolna Agent ID (REQUIRED)
Open `.env.local` and replace the placeholder:
```bash
BOLNA_AGENT_ID=your-actual-agent-id-here
```
👉 Get your Agent ID from: https://app.bolna.dev

### 2️⃣ Start Both Servers
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend (in a new terminal)
npm run dev
```

### 3️⃣ Test the System
1. Open: http://localhost:3001
2. Login to your account
3. Click: **Admin → Bulk Calls** (in sidebar)
4. Upload: `sample-contacts.csv` (provided in the project root)
5. Watch: Calls being processed in real-time!

## �� What's Included

✅ Complete backend with MongoDB + Bolna.ai integration
✅ File upload component with validation
✅ Admin dashboard with call status tracking
✅ Sample CSV file with 10 test contacts
✅ All dependencies installed
✅ TypeScript errors fixed

## 🔍 Verify Setup

Check that these files exist:
- ✅ `server/uploads/` directory created
- ✅ `sample-contacts.csv` in project root
- ✅ Navigation shows "Bulk Calls" in admin section
- ✅ `.env.local` has all Bolna configuration

## 📱 Test Flow

1. **Upload**: Choose `sample-contacts.csv`
2. **Parse**: System validates and saves contacts
3. **Process**: Background job calls each number (2s delay)
4. **Monitor**: Dashboard shows status updates
5. **Retry**: Failed calls can be retried

## 🎯 Expected Results

After uploading `sample-contacts.csv`:
- Total Rows: 10
- Valid Rows: 10
- Saved Contacts: 10
- Status: All start as "Pending"
- After processing: Should move to "Completed" or "Failed"

## ⚠️ Important Notes

1. **Bolna Agent ID**: System won't make calls without it
2. **Phone Format**: Uses +91 country code (India)
3. **Rate Limit**: 2 seconds between calls (to avoid API limits)
4. **File Size**: Max 5 MB
5. **File Types**: CSV, XLSX, XLS only

## 📚 Full Documentation

- `SETUP_COMPLETE.md` - Complete setup guide
- `BULK_CALLS_README.md` - Detailed feature documentation

## 🆘 Troubleshooting

**Backend won't start?**
```bash
# Port 5000 might be in use
lsof -ti:5000 | xargs kill -9
npm run server
```

**Frontend won't start?**
```bash
# Port 3001 might be in use
lsof -ti:3001 | xargs kill -9
npm run dev
```

**MongoDB connection error?**
- Check `.env.local` has correct `MONGODB_URI`
- Verify MongoDB Atlas is accessible

**Bolna API error?**
- Verify `BOLNA_API_KEY` in `.env.local`
- Add actual `BOLNA_AGENT_ID` (not placeholder)
- Check Bolna.ai dashboard is active

---

**You're all set! 🎉**

Start the servers and navigate to the Bulk Calls dashboard to begin!
