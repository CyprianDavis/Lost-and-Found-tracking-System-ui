## KU Lost & Found Dashboard

React + Vite dashboard for managing lost items, found reports, and claims. Uses Material UI for layout and a JWT-secured API (`/api/v1/*`) for data.

### Features
- Submit and manage lost and found reports (with status tracking).
- File and review claims against found items (approve/reject with notes).
- Role/permission-aware UI (Lost Reports, Found Reports, Claims, Users, Items).
- Responsive layout with collapsible sidebar and page header actions.

### Tech Stack
- React 19, Vite 7
- Material UI 7 + icons
- Recharts for charts
- ESLint 9

### Prerequisites
- Node.js 20.19+ (see `.nvmrc`)
- npm 10+

### Setup
1) Install dependencies  
```bash
npm install
```

2) Configure API base URL  
Create `.env.local` (or `.env`) with your backend URL. Defaults to `http://localhost:8080` if unset.  
```
VITE_API_BASE_URL=http://localhost:8080
```

3) Run the app  
```bash
npm run dev
```
The dev server prints the local URL (typically http://localhost:5173).

### Available Scripts
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — lint the project

### Roles & Permissions (frontend)
- Roles: Student, Staff, Security, Admin (students/staff self-register; others are admin-managed).
- Permissions checked in UI: `REPORT_LOST_ITEM`, `REPORT_FOUND_ITEM`, `CLAIM_ITEM`, `VERIFY_CLAIM`, `MANAGE_USERS`.

### API Expectations
- JWT bearer auth; token stored in `localStorage` under `lost-found-auth`.
- Endpoints used include `/api/v1/lost-reports`, `/api/v1/found-reports`, `/api/v1/claims`, `/api/v1/items`, `/api/v1/users` (filtering via query params for paging, keyword, status, etc.).

### Notes
- If you change backend origin or ports, update `VITE_API_BASE_URL`.
- To clear an expired session, remove `lost-found-auth` from localStorage or log out in the UI.
