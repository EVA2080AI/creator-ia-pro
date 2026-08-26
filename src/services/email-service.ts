// email-service — cliente de /api/email/send (Resend)
import type { Task } from "@/lib/tasks";

export type EmailTemplate = "task_created" | "task_completed" | "task_share" | "task_reminder" | "custom";

export type EmailTask = Pick<Task, "title" | "description" | "status" | "priority" | "due_date"> & { id?: string };

export interface SendEmailPayload {
  template: EmailTemplate;
  /** Solo para `task_share` y `custom`. Para el resto se usa el correo del usuario. */
  to?: string;
  subject?: string;
  message?: string;
  task?: EmailTask;
  tasks?: EmailTask[];
}

export type EmailErrorCode =
  | "NOT_CONFIGURED"
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "REQUEST_FAILED"
  | "INTERNAL";

export interface SendEmailResult {
  ok: boolean;
  id?: string | null;
  to?: string;
  error?: string;
  code?: EmailErrorCode;
}

export function toEmailTask(task: Task): EmailTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
  };
}

/** Envía un correo mediante /api/email/send. Nunca lanza: devuelve `{ ok:false, error }`. */
export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  try {
    const res = await fetch("/api/email/send", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as SendEmailResult;
    if (!res.ok && !data.code) {
      return { ok: false, code: "REQUEST_FAILED", error: data.error ?? `Error ${res.status}` };
    }
    return data;
  } catch (e) {
    return { ok: false, code: "REQUEST_FAILED", error: e instanceof Error ? e.message : "Error de red." };
  }
}
