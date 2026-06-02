import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useCreateJob } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Scissors, MapPin, Clock, DollarSign, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const schema = z.object({
  service: z.enum(["haircut", "beard", "nails", "full_grooming", "makeup_artist", "hair_colorist", "nail_technician", "lash_artist", "bridal_specialist", "esthetician", "hairdresser", "brow_specialist", "waxing_specialist", "massage_therapist"]),
  budget: z.coerce.number().min(10, "Minimum budget is 10 MAD"),
  location: z.string().min(3, "Please enter a location"),
  scheduledTime: z.string().optional(),
});

const serviceLabels: Record<string, string> = {
  haircut: "Haircut",
  beard: "Beard Trim",
  nails: "Nails",
  full_grooming: "Full Grooming Package",
  makeup_artist: "💄 Mobile Makeup Artist (Bridal + Event) — 1000–3000 MAD",
  hair_colorist: "🎨 Mobile Hair Colorist (Highlights, Balayage) — 400–1200 MAD",
  nail_technician: "💅 Mobile Nail Technician (Manicure + Pedicure) — 150–400 MAD",
  lash_artist: "👁️ Mobile Lash Artist (Extensions) — 400–1200 MAD",
  bridal_specialist: "👰 Mobile Bridal Specialist (Full Package) — 2500–6000 MAD",
  esthetician: "🧖 Mobile Esthetician (Facials) — 250–600 MAD",
  hairdresser: "✂️ Mobile Hairdresser (Cut + Style) — 150–300 MAD",
  brow_specialist: "🤨 Mobile Brow Specialist (Shaping + Lamination) — 150–400 MAD",
  waxing_specialist: "🌸 Mobile Waxing Specialist (Brazilian) — 200–450 MAD",
  massage_therapist: "💆 Mobile Massage Therapist (Relaxing) — 300–550 MAD",
};

export default function PostJob() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createJob = useCreateJob();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { service: "haircut", budget: 80, location: "", scheduledTime: "" },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createJob.mutate(
      {
        data: {
          service: data.service,
          budget: data.budget,
          location: data.location,
          scheduledTime: data.scheduledTime || undefined,
        },
      },
      {
        onSuccess: (job) => {
          toast({ title: "Job posted!", description: "Professionals can now bid on your request." });
          setLocation(`/client/jobs/${job.id}/bids`);
        },
        onError: () => {
          toast({ title: "Failed to post job", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Link href="/client/dashboard">
          <button className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Post a Job</h1>
          <p className="text-muted-foreground text-sm">Describe what you need and professionals will bid</p>
        </div>
      </div>

      <Card className="bg-card border-card-border rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Scissors size={16} className="text-primary" />
            </div>
            Job Details
          </CardTitle>
          <CardDescription>The more details you provide, the better bids you'll receive</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-full bg-black/50 border-input">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-card-border">
                        <div className="px-2 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">✂️ Men's Grooming</div>
                        <SelectItem value="haircut">Haircut</SelectItem>
                        <SelectItem value="beard">Beard Trim</SelectItem>
                        <SelectItem value="nails">Nails</SelectItem>
                        <SelectItem value="full_grooming">Full Grooming Package</SelectItem>
                        <div className="px-2 pt-2 pb-1 text-xs font-bold tracking-wider" style={{ color: "#FF1F8E" }}>💄 Women's Beauty</div>
                        <SelectItem value="makeup_artist">💄 Makeup Artist (Bridal + Event) — 1000–3000 MAD</SelectItem>
                        <SelectItem value="hair_colorist">🎨 Hair Colorist (Highlights, Balayage) — 400–1200 MAD</SelectItem>
                        <SelectItem value="nail_technician">💅 Nail Technician (Manicure + Pedicure) — 150–400 MAD</SelectItem>
                        <SelectItem value="lash_artist">👁️ Lash Artist (Extensions) — 400–1200 MAD</SelectItem>
                        <SelectItem value="bridal_specialist">👰 Bridal Specialist (Full Package) — 2500–6000 MAD</SelectItem>
                        <SelectItem value="esthetician">🧖 Esthetician (Facials) — 250–600 MAD</SelectItem>
                        <SelectItem value="hairdresser">✂️ Hairdresser (Cut + Style) — 150–300 MAD</SelectItem>
                        <SelectItem value="brow_specialist">🤨 Brow Specialist (Shaping + Lamination) — 150–400 MAD</SelectItem>
                        <SelectItem value="waxing_specialist">🌸 Waxing Specialist (Brazilian) — 200–450 MAD</SelectItem>
                        <SelectItem value="massage_therapist">💆 Massage Therapist (Relaxing) — 300–550 MAD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (MAD)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="80"
                          className="rounded-full bg-black/50 border-input pl-8 focus-visible:ring-primary"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="e.g. Casablanca, Maarif"
                          className="rounded-full bg-black/50 border-input pl-8 focus-visible:ring-primary"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Time (optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          className="rounded-full bg-black/50 border-input pl-8 focus-visible:ring-primary"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_20px_rgba(0,193,255,0.4)] py-6 text-lg"
                  disabled={createJob.isPending}
                >
                  {createJob.isPending ? "Posting..." : "Post Job — Let Bids Come In"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/20 rounded-3xl">
        <CardContent className="p-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
            <Scissors size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-white mb-1">How it works</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Post your grooming request with budget</li>
              <li>Local professionals send competitive bids</li>
              <li>Accept the best offer and they come to you</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
