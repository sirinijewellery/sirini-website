"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

export function ContactForm() {
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

  if (sent) {
    return (
      <div className="bg-muted/40 rounded-xl p-8 text-center space-y-3">
        <p className="text-2xl">✓</p>
        <h3 className="font-display text-xl text-foreground">Message sent!</h3>
        <p className="font-sans text-sm text-muted-foreground">We&apos;ll respond to your query within 24–48 hours.</p>
        <Button variant="outline" size="sm" onClick={() => setSent(false)} className="mt-2">
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Your Name</Label>
        <Input id="name" placeholder="Priya Sharma" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive font-sans">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive font-sans">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          placeholder="Tell us what you're looking for, or ask any question…"
          rows={5}
          className="resize-none"
          {...register("message")}
        />
        {errors.message && <p className="text-xs text-destructive font-sans">{errors.message.message}</p>}
      </div>

      <Button type="submit" disabled={loading} className="w-full h-11 font-sans gap-2">
        <Send className="h-4 w-4" />
        {loading ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
