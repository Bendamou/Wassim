import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { apiCall } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const loginSchema = z.object({
  phone: z.string().min(8, "Phone number is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { t } = useI18n();
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const res = await apiCall("POST", "/auth/phone-login", { phone: values.phone });
      login(res.user, res.token);
      
      if (res.user.role === "client") setLocation("/home");
      else if (res.user.role === "professional") setLocation("/pro/home");
      else if (res.user.role === "salon_owner") setLocation("/salon/dashboard");
      else setLocation("/");
      
    } catch (err: any) {
      toast({ title: t.error, description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border p-6 rounded-2xl shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{t.welcomeBack}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.enterPhone}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.phoneNumber}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.phonePlaceholder} {...field} data-testid="input-phone" className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
              {loading ? "..." : t.signIn}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            {t.newHere}{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              {t.createAccountLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
