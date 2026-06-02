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
import { useState, useEffect } from "react";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(8, "Phone is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["client", "professional", "salon_owner"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { t } = useI18n();
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      name: "", 
      phone: "", 
      email: "", 
      role: "client" 
    },
  });

  useEffect(() => {
    const role = localStorage.getItem("tawoss_signup_role") as any;
    if (role && ["client", "professional", "salon_owner"].includes(role)) {
      form.setValue("role", role);
    }
  }, [form]);

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const res = await apiCall("POST", "/auth/phone-register", values);
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
          <h1 className="text-2xl font-bold">{t.createAccount}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.quickSetup}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.fullName}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.fullNamePlaceholder} {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.phoneNumber}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.phonePlaceholder} {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.gmailAddress}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t.gmailPlaceholder} {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-register">
              {loading ? "..." : t.createAccount}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            {t.alreadyRegistered}{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              {t.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
