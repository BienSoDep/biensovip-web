# Biensovip Web — React 19 + Vite Frontend

Frontend cho Biensovip.com — nền tảng mua bán biển số xe đẹp.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Runtime | React 19, Vite 8 |
| Language | JavaScript (JSX) — NO TypeScript |
| Routing | Hash-based custom router (`useHashRouter`) |
| UI | `@base-ui/react`, custom CSS tokens |
| Animation | `framer-motion` |
| Icons | `lucide-react` |
| Editor | `@tiptap/react` (rich text) |
| Charts | `recharts` (admin dashboard) |
| Toast | `react-hot-toast` |
| Hooks | `@mantine/hooks` |
| Lint | `oxlint` |
| Test | `@playwright/test` |
| Dates | `date-fns` |

## Project structure

```
biensovip-web/
├── vite.config.js
├── package.json
├── .oxlintrc.json
├── playwright.config.js
├── index.html
└── src/
    ├── main.jsx                    # Entry — StrictMode
    ├── App.jsx                     # Root component — all state + routing
    ├── animations/
    │   └── heroAnim.js             # Hero section animations
    ├── assets/                     # Static images
    ├── common/
    │   └── constants.js            # PER_PAGE, shared constants
    ├── components/
    │   ├── index.jsx               # Re-export barrel
    │   ├── AiChatbot.jsx           # AI chatbot floating widget
    │   ├── Breadcrumb.jsx          # Breadcrumb navigation
    │   ├── Button.jsx              # Reusable button
    │   ├── ErrorBoundary.jsx       # React error boundary
    │   ├── LazyImage.jsx           # Lazy-loaded image
    │   ├── NavBtn.jsx              # Navigation button + darkPill util
    │   ├── PlateCard.jsx           # Plate card component
    │   ├── PlateVisual.jsx         # Plate visual display
    │   ├── RequireAuth.jsx         # Auth guard wrapper
    │   ├── Skeleton.jsx            # Skeleton barrel
    │   └── skeletons/
    │       ├── SkeletonBase.jsx    # Base skeleton primitives
    │       ├── PlateCardSkeleton.jsx
    │       ├── PostCardSkeleton.jsx
    │       ├── DetailSkeleton.jsx
    │       └── PageSkeleton.jsx    # Route-level skeleton
    ├── config/
    │   └── routes.js               # Route definitions (PUBLIC_SCREENS, ADMIN_SCREENS, parseRoute, routeFor)
    ├── contexts/                    # .gitkeep — empty, ready for React Context
    ├── controllers/                 # .gitkeep — empty, ready for business logic
    ├── hooks/
    │   ├── useDelayedLoading.js    # Delay spinner to avoid flash
    │   ├── useHashRouter.js        # Custom hash-based routing
    │   ├── useSeo.js               # Dynamic document title + meta
    │   └── useStaggeredReveal.js   # Staggered animation reveal
    ├── layout/
    │   ├── AdminShell.jsx          # Admin layout wrapper
    │   ├── Footer.jsx              # Site footer
    │   ├── Header.jsx              # Site header + navigation
    │   ├── MobileDrawer.jsx        # Mobile slide-out menu
    │   └── Modals.jsx              # Centralized modals (contact, plate edit, confirm delete, etc.)
    ├── lib/
    │   ├── authStore.js            # localStorage auth (loadAuth, saveAuth)
    │   ├── mockData.js             # Mock data: plates, posts, contacts, CATS, etc.
    │   └── content/
    │       ├── index.js            # Content loader (contentGet)
    │       └── vi/                 # Vietnamese content JSON
    │           ├── about.json
    │           ├── common.json
    │           ├── faq.json
    │           ├── home.json
    │           ├── plates.json
    │           ├── posts.json
    │           ├── privacy.json
    │           ├── terms.json
    │           └── transfer.json
    ├── pages/
    │   ├── About.jsx
    │   ├── Auth.jsx                # Register, Login, Forgot password, Admin login
    │   ├── Blog.jsx                # Blog listing
    │   ├── ChatZaloContact.jsx     # Chat widget + Zalo + Contact form
    │   ├── Collaborator.jsx        # Collaborator registration
    │   ├── Compare.jsx             # Multi-plate comparison
    │   ├── Faq.jsx
    │   ├── Fav.jsx                 # Favorites list
    │   ├── Home.jsx                # Landing page + hero
    │   ├── LuckyPlate.jsx          # Fengshui plate finder
    │   ├── NotFound.jsx            # 404 page
    │   ├── Notifications.jsx       # User notifications
    │   ├── PlateDetail.jsx         # Single plate detail
    │   ├── PlateList.jsx           # Plate listing + search + filter
    │   ├── Post.jsx                # Single blog post
    │   ├── Privacy.jsx
    │   ├── Reviews.jsx             # User reviews
    │   ├── SavedSearches.jsx       # Saved search alerts
    │   ├── ServerError.jsx         # 500 error page
    │   ├── Terms.jsx
    │   ├── TransferGuide.jsx       # License plate transfer guide
    │   └── admin/
    │       ├── AdminCats.jsx       # Category management
    │       ├── AdminCollaborators.jsx
    │       ├── AdminContacts.jsx   # Contact requests
    │       ├── AdminCustomers.jsx  # Customer management
    │       ├── AdminNotifications.jsx
    │       ├── AdminPlates.jsx     # Plate CRUD
    │       ├── AdminPosts.jsx      # Blog post management
    │       ├── AdminStaff.jsx      # Staff management (RBAC)
    │       ├── AdminVideos.jsx     # Promo video management
    │       ├── Compose.jsx         # Blog post editor (Tiptap)
    │       └── Dashboard.jsx       # Admin dashboard (KPI + charts)
    ├── services/                    # .gitkeep — empty, ready for API calls
    └── styles/
        ├── app.css                 # Main stylesheet
        ├── skeleton.css            # Skeleton animation styles
        └── tokens.css              # CSS custom properties (design tokens)
```

## Architecture patterns

### State management
- **No global state library.** All state in `App.jsx` via `useState` + `patch()` helper.
- `patch()`: partial state update — `patch({ screen: 'home' })` or functional `patch(s => ({...s, page: s.page + 1}))`
- State passed down as props. No Redux, no Context yet (`contexts/` is empty).
- Auth persisted to localStorage via `authStore.js`.

### Routing
- **Hash-based.** Custom `useHashRouter` hook parses `window.location.hash`.
- Route config in `config/routes.js`: `ADMIN_SCREENS`, `PUBLIC_SCREENS`, `parseRoute()`, `routeFor()`.
- Hash format: `#/screen` or `#/screen/param`.
- Navigation via `go('screen')()` — sets state, not URL push.

### Data layer
- **Current: mock data.** `lib/mockData.js` exports `PLATES`, `POSTS`, `CATS`, `CONTACTS`, `STAFF` — all in-memory arrays.
- State mutations operate directly on these arrays (CRUD updates `st.plates` directly).
- **Future: API.** `services/` folder reserved for API client. Pattern expected: replace mock imports with API calls.

### Code splitting
- All page components loaded via `React.lazy(() => import(...))`.
- `Suspense` wraps each route with `<PageSkeleton screen={s} />` fallback.
- Admin shell, modals, and AI chatbot also lazy-loaded.

### Content system
- Vietnamese content in `lib/content/vi/*.json` — flat JSON files.
- `contentGet('common.breadcrumb.home')` — dot-notation access.
- No i18n library. Vietnamese only.

### CSS
- Design tokens in `tokens.css` — CSS custom properties (`--surface-page`, `--radius-md`, `--type-caption`, etc.).
- `app.css` — all component styles.
- `skeleton.css` — shimmer animation for skeleton loaders.
- No CSS modules, no Tailwind, no CSS-in-JS.

### Skeleton loading
- `useDelayedLoading` hook: delays spinner display to avoid flash on fast loads.
- `useStaggeredReveal`: staggered animation for list items.
- Skeleton components per pattern: card, post, detail, page-level.
- `LazyImage` component: placeholder while image loads.

### Error handling
- `ErrorBoundary` wraps entire app.
- `ServerError` page for critical failures.
- 404: `NotFound` page with navigation back.

## Key dependencies

| Package | Usage |
|---------|-------|
| `@base-ui/react` | Unstyled accessible UI primitives |
| `@mantine/hooks` | `useDebouncedValue`, utility hooks |
| `@tiptap/react` | Rich text editor (blog compose) |
| `framer-motion` | Page transitions, hero animations, staggered lists |
| `lucide-react` | Icon library |
| `recharts` | Admin dashboard charts |
| `react-hot-toast` | Toast notifications |
| `date-fns` | Date formatting |

## How to run

```bash
npm install
npm run dev           # Vite dev server
npm run build         # Production build
npm run lint          # oxlint
npm run preview       # Preview production build
npm run validate:content  # Validate content JSON files
```

## Conventions

### Naming
- **Components:** PascalCase, `.jsx` extension
- **Hooks:** camelCase `use` prefix, `.js` extension
- **Lib/utils:** camelCase, `.js` extension
- **Pages:** PascalCase, `.jsx` extension
- **Folders:** lowercase, kebab-case for multi-word (e.g. `lib/content/`)

### Component patterns
- Functional components only — no class components.
- Destructure props in signature: `function Comp({ a, b })`.
- No PropTypes — plain JavaScript.
- Export default for page components, named exports for shared components.

### File organization
- One component per file (except barrel `index.jsx`).
- Page components in `pages/` or `pages/admin/`.
- Shared components in `components/`.
- Business logic separation planned: `controllers/` for non-UI logic, `services/` for API.

### Mock data
- All mock data in `lib/mockData.js`.
- Fixed IDs (`p1`, `p2` for plates; `a1`, `a2` for posts; `c123` for contacts).
- `priceNum()` helper parses price strings to numbers for sorting.
- `validatePhone()` for Vietnamese phone number format.

## Screens (current implementation)

### Public (21 routes)
`home`, `list`, `detail`, `register`, `login`, `forgot`, `fav`, `lucky`, `about`, `blog`, `post`, `chat`, `compare`, `saved`, `reviews`, `notifications`, `collab`, `terms`, `privacy`, `transfer`, `faq`

### Admin (12 routes)
`dash`, `adminLogin`, `aplates`, `acats`, `acontacts`, `aposts`, `compose`, `acustomers`, `astaff`, `avideos`, `anotifications`, `acollabs`

### Error
`notfound`, `servererror`

## Integration with backend

- **Current state:** Frontend operates on mock data. No API integration yet.
- **Planned:** `services/` folder will contain API client modules.
- Backend URL: will use `VITE_API_URL` env var (not yet implemented).
- Auth: currently localStorage mock (`authStore.js`), will be replaced with JWT token management.
- API response format: `ApiResponse<T>` wrapper expected from backend.
- All docs: [../biensodep-infrastructure/docs/](../biensodep-infrastructure/docs/)
