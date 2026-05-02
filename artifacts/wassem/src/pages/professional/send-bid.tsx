import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetJob,
  getGetJobQueryKey,
  useCreateBid,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Scissors, MapPin, Clock, ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const schema = z.object({
  price: z.coerce.number().min(1, "Price must be at least 1 MAD"),
  estimatedArrival: z.string().optional(),
});

export default function SendBid() {
  const { jobId } = useParams<{ jobId: string }>();
  const id = parseInt(jobId, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: job, isLoading } = useGetJob(id, {
    query: { enabled: !!id, queryKey: getGetJobQueryKey(id) },
  });

  const createBid = useCreateBid();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { price: job?.budget || 0, estimatedArrival: "" },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createBid.mutate(
      {
        data: {
          jobId: id,
          price: data.price,
          estimatedArrival: data.estimatedArrival || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Bid sent!", description: "The client will review your offer." });
          setLocation("/professional/jobs");
        },
        onError: (err: any) => {
          toast({
            title: "Failed to send bid",
            description: err?.data?.message || "Something went wrong",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Link href="/professional/jobs">
          <button className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Send Bid</h1>
          <p className="text-muted-foreground text-sm">Make your best offer to win this job</p>
        </div>
      </div>

      {/* Job Summary */}
      {job && (
        <Card className="bg-gradient-to-br from-secondary/10 to-card border-secondary/20 rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Scissors size={22} className="text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold capitalize">{job.service?.replace("_", " ")}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><MapPin size={13} /> {job.location}</span>
                  {job.scheduledTime && (
                    <span className="flex items-center gap-1"><Clock size={13} /> {new Date(job.scheduledTime).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-white">{job.budget}</p>
                <p className="text-xs text-muted-foreground">MAD budget</p>
              </div>
            </div>
            {(job.bidsCount || 0) > 0 && (
              <div className="mt-4 pt-4 border-t border-secondary/20">
                <p className="text-xs text-muted-foreground">{job.bidsCount} other bid{job.bidsCount !== 1 ? "s" : ""} submitted — be competitive</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bid Form */}
      <Card className="bg-card border-card-border rounded-3xl">
        <CardHeader>
          <CardTitle>Your Offer</CardTitle>
          <CardDescription>Set a price that beats the competition while being fair</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Price (MAD)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder={String(job?.budget || 80)}
                          className="rounded-full bg-black/50 border-input focus-visible:ring-secondary text-lg font-bold pl-4 pr-16"
                          {...field}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">MAD</span>
                      </div>
                    </FormControl>
                    {job && form.watch("price") < job.budget && (
                      <p className="text-xs text-green-400 font-medium">You're offering {job.budget - form.watch("price")} MAD below budget</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedArrival"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Arrival (optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="e.g. 20 min, 1 hour"
                          className="rounded-full bg-black/50 border-input focus-visible:ring-secondary pl-8"
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
                  className="w-full rounded-full bg-gradient-to-r from-secondary to-primary text-black font-bold py-6 text-lg shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:shadow-[0_0_30px_rgba(255,0,255,0.4)] transition-all"
                  disabled={createBid.isPending}
                >
                  <Send size={18} className="mr-2" />
                  {createBid.isPending ? "Sending..." : "Send Bid"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
