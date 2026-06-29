"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

export function FooterContactSection() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Message sent! We'll get back to you soon.");
        setSent(true);
        reset();
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Could not send message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-[#1A1208] text-white/90">
      <div className="px-6 md:px-16 py-16 md:py-20 max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
          {/* Left — copy */}
          <div>
            <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-[#C9A96E] mb-4">
              Get in Touch
            </p>
            <h2 className="font-display text-[32px] md:text-[40px] font-light leading-[1.1] text-white mb-5">
              Have a question or need help?
            </h2>
            <p className="font-sans text-sm text-white/60 leading-relaxed max-w-md">
              Whether it&apos;s about an order, styling advice, custom pieces or bulk
              enquiries — drop us a message and we&apos;ll respond within 24 hours.
            </p>
          </div>

          {/* Right — form */}
          <div>
            {sent ? (
              <div className="text-center py-10">
                <p className="text-2xl mb-3">&#10003;</p>
                <h3 className="font-display text-xl text-white mb-2">
                  Message sent!
                </h3>
                <p className="font-sans text-sm text-white/50 mb-4">
                  We&apos;ll respond within 24–48 hours.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="font-sans text-sm text-[#C9A96E] hover:text-white transition-colors cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="footer-name"
                      className="font-sans text-xs text-white/50 uppercase tracking-wider"
                    >
                      Name
                    </label>
                    <input
                      id="footer-name"
                      placeholder="Priya Sharma"
                      {...register("name")}
                      className="bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-400">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="footer-email"
                      className="font-sans text-xs text-white/50 uppercase tracking-wider"
                    >
                      Email
                    </label>
                    <input
                      id="footer-email"
                      type="email"
                      placeholder="you@example.com"
                      {...register("email")}
                      className="bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-400">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="footer-message"
                    className="font-sans text-xs text-white/50 uppercase tracking-wider"
                  >
                    Message
                  </label>
                  <textarea
                    id="footer-message"
                    rows={3}
                    placeholder="Tell us what you're looking for..."
                    {...register("message")}
                    className="bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9A96E] transition-colors resize-none"
                  />
                  {errors.message && (
                    <p className="text-xs text-red-400">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="self-start inline-flex items-center gap-2 px-8 py-3 bg-[#C9A96E] text-[#1A1208] font-sans text-sm font-semibold tracking-wider uppercase hover:bg-[#E8D5B0] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
