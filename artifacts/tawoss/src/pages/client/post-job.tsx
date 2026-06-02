import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useCreateJob } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const jobSchema = z.object({
  service: z.enum(["haircut", "beard", "nails", "full_grooming"]),
  budget: z.coerce.number().min(20, "Minimum budget is 20 MAD"),
  location: z.string().min(5, "Location is required"),
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function PostJob() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const createJob = useCreateJob();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      service: "haircut",
      budget: 50,
      location: "",
    },
  });

  const onSubmit = async (values: JobFormValues) => {
    try {
      const job = await createJob.mutateAsync({ data: values });
      toast({ title: t.jobPosted });
      setLocation(`/jobs/${job.id}/bids`);
    } catch (err: any) {
      toast({ title: t.couldNotPost, description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-md mx-auto animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black drop-shadow-[0_0_8px_rgba(0,180,255,0.4)] mb-2">{t.postJobTitle}</h2>
        <p className="text-muted-foreground">{t.setYourPrice}</p>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold tracking-wider uppercase text-muted-foreground">{t.serviceLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background h-14 text-lg">
                        <SelectValue placeholder={t.serviceLabel} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="haircut">{t.serviceHaircut}</SelectItem>
                      <SelectItem value="beard">{t.serviceBeard}</SelectItem>
                      <SelectItem value="nails">{t.serviceNails}</SelectItem>
                      <SelectItem value="full_grooming">{t.serviceFull}</SelectItem>
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
                  <FormLabel className="text-xs font-bold tracking-wider uppercase text-muted-foreground">{t.budgetLabel}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="number" {...field} className="bg-background h-14 text-2xl font-black pl-4 pr-16 border-primary/50 focus-visible:ring-primary" />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold">
                        {t.mad}
                      </div>
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
                  <FormLabel className="text-xs font-bold tracking-wider uppercase text-muted-foreground">{t.locationLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.locationPlaceholder} {...field} className="bg-background h-14" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold shadow-[0_0_20px_rgba(0,180,255,0.4)] hover:shadow-[0_0_30px_rgba(0,180,255,0.6)] transition-all" 
              disabled={createJob.isPending}
            >
              {createJob.isPending ? "..." : t.postJobBtn}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
