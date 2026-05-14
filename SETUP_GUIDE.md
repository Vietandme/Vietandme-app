# 🇻🇳 Viet & Me — Setup Guide

## Step 1: Set up the Database (Supabase)

1. Go to https://supabase.com and open your project
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `SUPABASE_SETUP.sql` and paste it in
5. Click **Run**
6. You should see "Success" — all tables are now created

### Make yourself Admin
Still in the SQL Editor, run this (replace with your email):
```sql
update profiles set role = 'admin' where email = 'your@email.com';
```

### Enable Storage
1. Go to **Storage** in the left sidebar
2. You should see a "recordings" bucket — if not, create one and set it to **Public**

---

## Step 2: Push code to GitHub

1. Download this project folder to your computer
2. Open a terminal (on Mac: search "Terminal", on Windows: use Git Bash)
3. Run these commands one by one:

```bash
cd path/to/vietnamese-learning-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vietnamese-learning-app.git
git push -u origin main
```
(Replace YOUR_USERNAME with your GitHub username)

---

## Step 3: Deploy on Vercel

1. Go to https://vercel.com
2. Click your project (or import it from GitHub)
3. Before deploying, click **Environment Variables** and add:
   - `REACT_APP_SUPABASE_URL` = `https://oawhyxnycorafrpzxfwj.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY` = (your anon key)
4. Click **Deploy**
5. Wait ~2 minutes — your app is live! 🎉

---

## Step 4: First login

1. Open your Vercel URL
2. Click **Register** and create your teacher account
3. Go back to Supabase SQL Editor and run:
   ```sql
   update profiles set role = 'admin' where email = 'your@email.com';
   ```
4. Log out and log back in — you'll now see the Teacher Dashboard!

---

## Excel Upload Format

Create an Excel file with these two sheets:

**Sheet name: "Flashcards"**
| Vietnamese | English | Pronunciation | Example | Level | Category |
|---|---|---|---|---|---|
| Xin chào | Hello | sin chow | Xin chào, bạn! | beginner | greetings |

**Sheet name: "Quiz"**
| Question | Option A | Option B | Option C | Option D | Correct Answer | Level |
|---|---|---|---|---|---|---|
| What does "Xin chào" mean? | Goodbye | Hello | Thank you | Sorry | Hello | beginner |

---

## Need help?
Come back and ask Claude anytime! 🤖
