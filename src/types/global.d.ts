// src/types/global.d.ts
import { User } from '../auth';

declare module 'react' {
  interface DOMAttributes<T> {
    currentUser?: User | null;
  }
}