import { useAppStore } from '../../stores/app';

export type LabToastType = 'success' | 'error';

export function toast(type: LabToastType, message: string): void {
  const app = useAppStore();
  app.toast(type, message, 2500);
}
