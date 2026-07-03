import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Inbox, MailQuestion } from "lucide-react";
import { getContactMessages } from "@/lib/queries/messages";
import { MessageActions } from "@/components/admin/MessageActions";

export const metadata: Metadata = { title: "Messages" };

// Always render fresh — the whole point of this page is new mail.
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export default async function AdminMessagesPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/login?callbackUrl=/admin/messages");

  const messages = await getContactMessages();
  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl space-y-6">
      {/* Heading */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Inbox className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-sans text-2xl font-semibold text-slate-900">
            Messages
          </h1>
          <p className="font-sans text-sm text-slate-500 mt-1">
            Contact-form messages from customers
            {unread > 0 ? ` — ${unread} unread` : ""}. Reply from your email
            app using the customer&apos;s address.
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        /* ── Empty state ── */
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <MailQuestion className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="font-sans text-lg font-semibold text-slate-900">
            No messages yet
          </h2>
          <p className="font-sans text-sm text-slate-500 mt-1 max-w-sm">
            When a customer writes to you from the Contact page, their message
            appears here (and is emailed to you once email is set up).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`bg-white rounded-xl border shadow-sm p-5 space-y-3 ${
                msg.isRead ? "border-slate-100" : "border-primary/30"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!msg.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-label="Unread" />
                    )}
                    <h2 className="font-sans text-sm font-semibold text-slate-900 truncate">
                      {msg.name}
                    </h2>
                  </div>
                  <a
                    href={`mailto:${msg.email}`}
                    className="font-sans text-xs text-primary hover:underline"
                  >
                    {msg.email}
                  </a>
                  <span className="font-sans text-xs text-slate-400 ml-2">
                    {dateFmt.format(msg.createdAt)}
                  </span>
                </div>
                <MessageActions id={msg.id} isRead={msg.isRead} />
              </div>
              <p className="font-sans text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {msg.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
