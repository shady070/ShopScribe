import * as React from "react";

type ToastVariant = "default" | "success" | "destructive";

type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
};

type State = {
  toasts: Toast[];
};

type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "UPDATE_TOAST"; toast: Partial<Toast> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

const TOAST_LIMIT = 4;
const TOAST_REMOVE_DELAY = 1000;

const listeners: Array<(state: State) => void> = [];

let count = 0;
let memoryState: State = { toasts: [] };

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return `toast-${count}`;
}

function setState(state: State) {
  memoryState = state;
  listeners.forEach((listener) => listener(state));
}

function dispatch(action: ToastAction) {
  switch (action.type) {
    case "ADD_TOAST": {
      const toast = action.toast;
      setState({
        toasts: [toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
      });
      break;
    }
    case "UPDATE_TOAST": {
      setState({
        toasts: memoryState.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      });
      break;
    }
    case "DISMISS_TOAST": {
      const { toastId } = action;

      setState({
        toasts: memoryState.toasts.map((t) =>
          toastId === undefined || t.id === toastId ? { ...t, duration: 0 } : t
        ),
      });

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        memoryState.toasts.forEach((toast) => addToRemoveQueue(toast.id));
      }
      break;
    }
    case "REMOVE_TOAST": {
      const { toastId } = action;
      if (toastId === undefined) {
        setState({ toasts: [] });
        return;
      }
      setState({
        toasts: memoryState.toasts.filter((t) => t.id !== toastId),
      });
      break;
    }
  }
}

function addToRemoveQueue(toastId: string) {
  setTimeout(() => dispatch({ type: "REMOVE_TOAST", toastId }), TOAST_REMOVE_DELAY);
}

export function toast(props: Omit<Toast, "id">) {
  const id = genId();

  dispatch({
    type: "ADD_TOAST",
    toast: {
      id,
      ...props,
    },
  });

  setTimeout(() => dispatch({ type: "DISMISS_TOAST", toastId: id }), props.duration ?? 4000);

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
    update: (newProps: Partial<Toast>) =>
      dispatch({ type: "UPDATE_TOAST", toast: { id, ...newProps } }),
  };
}

export function useToast() {
  const [state, setToastState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setToastState);
    return () => {
      const index = listeners.indexOf(setToastState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}
