# Central Ministerial - INS

Sistema de gerenciamento de escalas ministeriais

## Tecnologias

- React 18
- TypeScript
- Vite

## Como executar

```bash
npm install
npm run dev


---

## **2. ARQUIVOS DA PASTA `src/`**

### `src/main.tsx`
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)