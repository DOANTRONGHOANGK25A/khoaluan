# AI Copilot Instructions - Diploma UI

## Project Overview
This is a React + Vite frontend for a **diploma (certificate) management system** using blockchain. The application is in Vietnamese and manages the lifecycle of academic diplomas from creation through approval, issuance, and revocation.

## Architecture & Key Patterns

### Route Structure ([src/router/index.jsx](src/router/index.jsx))
- **Login route**: `/login` → `LoginPage` (unauthenticated entry point)
- **Protected routes** under `/` with `MainLayout` wrapper:
  - `/verify` → Diploma verification/lookup (public-facing)
  - `/diplomas` → Diploma list with status dashboard
  - `/create` → Create new diploma records
  - `/approval` → Review and approve pending diplomas
  - `/issuance` → Issue to blockchain or revoke diplomas
  - `/admin` → User management (admin only)
- Default redirect: `/` → `/verify`

### Component Hierarchy
```
App (ConfigProvider with Ant Design theme)
  └─ RouterProvider
      ├─ LoginPage (standalone)
      └─ MainLayout (sidebar layout with nested routes)
          ├─ Sider (navigation menu + logo)
          ├─ Header (user dropdown + collapse toggle)
          └─ Content (Outlet for active page)
```

### State Management Patterns
- Pages use local `useState` hooks (no global state library)
- Example: [DiplomaListPage.jsx](src/pages/DiplomaListPage.jsx) manages `searchText` locally
- Mock data in [src/mock/mockData.js](src/mock/mockData.js) includes `STATUS` enum (PENDING, APPROVED, ISSUED, REVOKED)

### UI Framework: Ant Design 6.2
- Configured in [App.jsx](src/app/App.jsx) with:
  - Vietnamese locale (`vi_VN`)
  - Custom theme: primary color `#1890ff`, border radius `8px`
  - Component overrides: Card and Table header background `#fafafa`
- Common components: Form, Input, Table, Tag, Modal, Card, Button, Space
- Icons from `@ant-design/icons` (SearchOutlined, FileTextOutlined, etc.)

### Data Model
The diploma object structure (from mockData):
```javascript
{
  id: number,
  serialNo: string,           // e.g., "TN2025-001"
  studentName: string,        // e.g., "Phạm Minh Hoàng"
  major: string,              // e.g., "CNTT" (IT)
  ranking: string,            // e.g., "Xuất sắc" (Excellent)
  status: STATUS,             // PENDING | APPROVED | ISSUED | REVOKED
  txId: string | null,        // Blockchain transaction ID
  date: string,               // ISO date
}
```

## Developer Workflow

### Build & Run
```bash
npm run dev       # Start Vite dev server (HMR enabled)
npm run build     # Production build to dist/
npm run lint      # Run ESLint (currently basic rules)
npm run preview   # Preview built app
```

### Key Files to Edit by Feature
| Feature | Primary Files |
|---------|---------------|
| Add new page | Create in `src/pages/`, export as named export, add route in `src/router/index.jsx` |
| Change layout/navigation | [src/layouts/MainLayout.jsx](src/layouts/MainLayout.jsx) - modify `menuItems` array |
| Update theme/colors | [src/app/App.jsx](src/app/App.jsx) - `ConfigProvider` theme object |
| Add styles | Create `.css` files in `src/styles/` and import in component |
| Mock data | [src/mock/mockData.js](src/mock/mockData.js) |

## Code Conventions

### Export Style
- Pages use **named exports**: `export function DiplomaListPage() {...}`
- Import as: `import { DiplomaListPage } from "../pages/..."`

### Naming Conventions
- Vietnamese UI labels (buttons, headers, validation messages)
- Component files: PascalCase with suffix (e.g., `DiplomaListPage.jsx`)
- CSS class names: kebab-case (e.g., `.page-container`, `.search-card`)

### Status Handling
Always use the STATUS enum from [src/mock/mockData.js](src/mock/mockData.js):
```javascript
import { STATUS } from "../mock/mockData";
const isApproved = diploma.status === STATUS.APPROVED;
```

### Common UI Patterns
- **Search cards**: Use `Card` with `Input.Search` and display `Paragraph` hints
- **Detail modals**: Open with `Modal.info()` showing formatted content in `detail-item` divs
- **Status tags**: Map status to color: ISSUED→success, REVOKED→error, PENDING→warning, APPROVED→processing

## Integration Points

### Blockchain (Future)
- Currently mocked with `txId` field (blockchain transaction hash)
- Issuance page will integrate blockchain signing/submission
- Look for API calls to blockchain service endpoint

### Backend API (Not yet integrated)
- Pages currently use mock data from [mockData.js](src/mock/mockData.js)
- Replace mock data fetching with actual API calls (endpoint TBD)
- Likely endpoints: `/api/diplomas`, `/api/approve`, `/api/issue`, `/api/verify`

## Common Debugging Tips

- **Routes not found**: Check [src/router/index.jsx](src/router/index.jsx) - ensure path matches component export
- **Styles not applied**: Verify CSS import in component and class name matches CSS file
- **Mock data not showing**: Ensure `mockDiplomas` import path is correct in page component
- **Theme not applied**: Check `ConfigProvider` in [App.jsx](src/app/App.jsx) - custom theme may override defaults
