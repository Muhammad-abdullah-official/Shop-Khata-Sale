import { Injectable, signal } from '@angular/core';

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  onConfirm: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<ConfirmState | null>(null);

  ask(opts: {
    title?: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
  }) {
    this.state.set({
      title: opts.title ?? 'Are you sure?',
      message: opts.message,
      confirmLabel: opts.confirmLabel ?? 'Confirm',
      danger: opts.danger ?? false,
      onConfirm: opts.onConfirm,
    });
  }

  confirm() {
    this.state()?.onConfirm();
    this.state.set(null);
  }

  cancel() {
    this.state.set(null);
  }
}
