import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRegister, useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Scissors } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["client", "professional"]),
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "client" },
  });

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.user, res.token);
        setLocation(res.user.role === "client" ? "/client/dashboard" : "/professional/dashboard");
        toast({ title: "Welcome back!" });
      },
      onError: (err: any) => {
        toast({ 
          title: "Login failed", 
          description: err?.data?.message || "Invalid credentials", 
          variant: "destructive" 
        });
      }
    });
  };

  const onRegister = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.user, res.token);
        setLocation(res.user.role === "client" ? "/client/dashboard" : "/professional/dashboard");
        toast({ title: "Account created!" });
      },
      onError: (err: any) => {
        toast({ 
          title: "Registration failed", 
          description: err?.data?.message || "Could not create account", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative neon elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="mb-8 flex flex-col items-center relative z-10">
        <div className="w-16 h-16 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,193,255,0.3)] mb-4">
          <Scissors className="text-white w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">WASSEM</h1>
        <p className="text-muted-foreground mt-2 text-center max-w-sm">On-demand grooming. Fast, local, competitive.</p>
      </div>

      <Card className="w-full max-w-md border-card-border bg-card/80 backdrop-blur-xl shadow-2xl z-10 relative">
        <Tabs defaultValue="login" className="w-full">
          <CardHeader className="pb-4">
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-black/50 p-1">
              <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">Register</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="login" className="mt-0">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="you@example.com" {...field} className="rounded-full bg-black/50 border-input focus-visible:ring-primary" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} className="rounded-full bg-black/50 border-input focus-visible:ring-primary" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_20px_rgba(0,193,255,0.4)]" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField control={registerForm.control} name="role" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>I am a...</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-4">
                          <div 
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${field.value === "client" ? "border-primary bg-primary/10 text-white" : "border-card-border bg-black/30 text-muted-foreground hover:border-primary/50"}`}
                            onClick={() => field.onChange("client")}
                          >
                            <span className="font-bold">Client</span>
                            <span className="text-xs opacity-70 mt-1">Need a cut</span>
                          </div>
                          <div 
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${field.value === "professional" ? "border-secondary bg-secondary/10 text-white" : "border-card-border bg-black/30 text-muted-foreground hover:border-secondary/50"}`}
                            onClick={() => field.onChange("professional")}
                          >
                            <span className="font-bold">Professional</span>
                            <span className="text-xs opacity-70 mt-1">Find clients</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} className="rounded-full bg-black/50 border-input focus-visible:ring-primary" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="you@example.com" {...field} className="rounded-full bg-black/50 border-input focus-visible:ring-primary" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} className="rounded-full bg-black/50 border-input focus-visible:ring-primary" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className={`w-full rounded-full font-bold shadow-lg ${registerForm.watch("role") === "professional" ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-[0_0_20px_rgba(255,0,255,0.4)]" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(0,193,255,0.4)]"}`} disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
