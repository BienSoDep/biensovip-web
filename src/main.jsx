import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/tokens.css'
import './styles/app.css'
import './styles/skeleton.css'
import App from './App.jsx'

// The sticky header overlaps page content instead of reserving space for it,
// so a mouse click on a button/link near the top of a scrolled list focuses
// an element the browser considers partly hidden — its native focus handler
// then "corrects" by yanking the whole page's scroll position, which reads
// as every click flinging the page to the top. Mousedown fires before focus,
// so calling focus() here first (with preventScroll) lets the real click's
// focus follow without triggering that scroll correction.
const preventFocusScroll = (e) => {
  const el = e.target.closest('a,button,input,select,textarea,[tabindex]');
  if (el) el.focus({ preventScroll: true });
};
document.addEventListener('pointerdown', preventFocusScroll, true);
document.addEventListener('mousedown', preventFocusScroll, true);
document.addEventListener('touchstart', preventFocusScroll, true);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
