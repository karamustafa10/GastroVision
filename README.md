# Restaurant Automation System

Modern, camera-assisted, fully automated restaurant management system.

---

## 🚀 Features
- **Table, waiter, food, order, and report management**
- **Waiter performance & attention measurement** (automatic & manual)
- **Delay penalty, table/waiter timestamps, account reset**
- **Detailed reporting:** filter by table, waiter, food, date
- **Table-based detail screen:** orders, total bill, most consumed products, waiter performance
- **Camera/automation API integration**
- **Modern frontend:** Material UI, dark/light mode, animation, accessibility, PWA support

---

## 🛠️ Tech Stack
- **Backend:** Python, Flask, PyTorch, MongoDB, OpenCV
- **Frontend:** React, Material UI, framer-motion, axios, react-helmet-async
- **Database:** MongoDB

---

## 📁 Project Structure
```
cv-final/
├── backend/           # Flask backend, API, ML models, DB
│   ├── app.py
│   ├── config.py
│   ├── models/        # Data models (food, order, table, waiter)
│   ├── routes/        # API endpoints
│   ├── services/      # Video stream, business logic
│   └── ...
├── frontend/          # React frontend (Material UI, PWA)
│   ├── src/
│   └── ...
├── data/              # Data scripts, collection, README
├── notebooks/         # Jupyter notebooks (ML experiments)
├── food101_yolov8_cls.pt, food101_mobilenetv2_small.h5, yolov8n.pt  # (Large ML models, not in repo)
└── README.md
```

---

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Start MongoDB (default: mongodb://localhost:27017)
python -m app
```
- **Python 3.12+** and **MongoDB** required.
- Large model files (`*.pt`, `*.h5`) are NOT in the repo. Obtain them separately if needed.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```
- Runs on [http://localhost:3000](http://localhost:3000)

### 3. Lint & Test
- **Backend:** `pylint backend/`
- **Frontend:** `npm run lint`

---

## 📡 API Overview

### Camera/Otomation Endpoints
- **Food detection:**
  - `POST /api/camera/food_detected`  
    Body: `{ table_id, food_id, quantity }`
- **Waiter detection:**
  - `POST /api/camera/waiter_detected`  
    Body: `{ table_id, waiter_id }`

### Main Endpoints
- `GET /api/tables`   — Table operations
- `GET /api/waiters`  — Waiter operations
- `GET /api/foods`    — Food operations
- `GET /api/reports`  — Reporting
- `GET /api/video`    — Camera/automation

> For full API details, see backend/routes/*.py

---

## 📝 Development Notes
- **.gitignore** excludes: `__pycache__/`, `*.pyc`, `venv/`, `node_modules/`, `*.pt`, `*.h5`, `*.log`, `*.tmp`
- **Large model files** are not versioned. Share externally if needed.
- **Frontend**: Modern React, Material UI, PWA, dark/light mode, animations.
- **Backend**: Modular Flask, ML model integration, MongoDB.

---

## 🗺️ Roadmap
- Frontend camera test panel
- Advanced reporting & analytics
- Admin panel & user roles
- Live updates & security improvements

---

## 🤝 Contributing
- Contributions and suggestions are welcome!
- Please open issues or pull requests for improvements.

---

## 📄 License
[MIT License](LICENSE) 