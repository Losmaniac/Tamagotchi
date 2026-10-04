import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './ui/App';

const Gallery = lazy(() => import('./ui/dev/Gallery'));
const showGallery = new URLSearchParams(location.search).has('gallery');

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    {showGallery ? (
      <Suspense>
        <Gallery />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
