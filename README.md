# Memoria 📸

Memoria is a next-generation campus media and memory management platform. Built specifically for university clubs, Memoria leverages the power of Artificial Intelligence to automatically organize, tag, and securely distribute event photos.

**🚀 Live Deployment:** [https://memoria-live-app.vercel.app](https://memoria-live-app.vercel.app)
## ✨ Key Features
* **AI Smart Tagging:** Powered by AWS Rekognition. Upload photos and let the AI instantly analyze and tag semantic objects (e.g., 'concert', 'crowd', 'outdoor', 'sports').
* **Face Recognition Integration:** Members can register their faces once. The AI automatically scans all club event photos and securely tags users in images they appear in.
* **Dynamic Watermarking:** Protect club branding. High-resolution downloads are dynamically watermarked on the fly, regardless of the photo's original aspect ratio or size.
* **Personalized Dashboard:** A completely private dashboard feed that aggregates the user's specific uploads, clubs, and tagged photos into one chronological timeline.
* **Modern Aesthetic UI:** Built with Next.js, Tailwind CSS, and Framer Motion for a stunning, responsive, and buttery-smooth user experience.

## 🚀 Tech Stack
### Frontend
* Next.js 14 (App Router)
* React & TypeScript
* Tailwind CSS
* Zustand (State Management)
* Lucide React (Icons)

### Backend
* Node.js & Express
* Prisma ORM
* PostgreSQL
* AWS S3 (Media Storage)
* AWS Rekognition (AI Vision)

## 📦 Project Structure
The repository is split into two primary environments:
* `/memoria-frontend` - The modern Next.js client application.
* `/memoria-backend` - The Node/Express API, database schema, and background AI processing workers.

## 🛠️ Local Development
1. **Clone the repository:**
   ```bash
   git clone https://github.com/hareeshmacha/Memoria.git
   ```

2. **Setup the Backend:**
   ```bash
   cd memoria-backend
   npm install
   # Configure your .env with PostgreSQL and AWS credentials
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../memoria-frontend
   npm install
   # Configure your .env.local with the backend API URL
   npm run dev
   ```

4. **Enjoy the magic!** Open `http://localhost:3000` to view the platform.

---
*Built with ❤️ for campus communities.*
