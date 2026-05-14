import React, { useState } from "react";
import { usePulse } from "@/hooks/use-pulse";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity, AlertTriangle, CheckCircle2, Loader2, HeartPulse, ActivitySquare } from "lucide-react";
import { AIStatus } from "@/lib/api";

export default function Dashboard() {
  const { readings, submitReading, isSubmitting, latestReading } = usePulse();
  const [userId, setUserId] = useState("PATIENT-001");
  const [bpm, setBpm] = useState<number | "">("");
  const [isMoving, setIsMoving] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || bpm === "" || bpm <= 0) return;
    submitReading({ user_id: userId, heart_rate: Number(bpm), is_moving: isMoving });
    setBpm("");
  };

  const currentStatus = latestReading?.analysis.status || "CALIBRATING";
  const calibrationCount = readings.length;
  const calibrationProgress = Math.min((calibrationCount / 10) * 100, 100);

  const statusColors: Record<AIStatus, string> = {
    CALIBRATING: "text-yellow-500 border-yellow-500/50 bg-yellow-500/10",
    NORMAL: "text-emerald-500 border-emerald-500/50 bg-emerald-500/10",
    CRITICAL_ANOMALY: "text-red-500 border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.5)]",
  };

  const statusIcons = {
    CALIBRATING: <Loader2 className="w-8 h-8 animate-spin" />,
    NORMAL: <CheckCircle2 className="w-8 h-8" />,
    CRITICAL_ANOMALY: <AlertTriangle className="w-8 h-8 animate-pulse" />,
  };

  const chartData = readings.map((r, i) => ({
    name: new Date(r.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
    bpm: r.input_hr,
    isAnomaly: r.analysis.status === "CRITICAL_ANOMALY",
  }));

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <HeartPulse className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tighter text-primary uppercase">PULSE<span className="text-foreground">GUARD</span></h1>
              <p className="text-sm text-muted-foreground uppercase tracking-widest">AI Heart Rate Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg border border-border">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm tracking-wider">SYSTEM ONLINE</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input & Status */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Live Status Display */}
            <Card className={`border-2 transition-all duration-500 ${statusColors[currentStatus]}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-widest opacity-80">System Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                {statusIcons[currentStatus]}
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight uppercase">{currentStatus.replace("_", " ")}</h2>
                  {latestReading?.analysis.message && (
                    <p className="text-sm opacity-90 max-w-[250px] mx-auto">
                      {latestReading.analysis.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Input Form */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">MANUAL OVERRIDE</CardTitle>
                <CardDescription>Input live telemetry data</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSend} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="userId" className="text-xs uppercase tracking-wider text-muted-foreground">Subject ID</Label>
                    <Input 
                      id="userId" 
                      value={userId} 
                      onChange={e => setUserId(e.target.value)} 
                      className="font-mono bg-background"
                      data-testid="input-userId"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bpm" className="text-xs uppercase tracking-wider text-muted-foreground">BPM</Label>
                      <Input 
                        id="bpm" 
                        type="number" 
                        placeholder="e.g. 72" 
                        value={bpm} 
                        onChange={e => setBpm(e.target.value ? Number(e.target.value) : "")} 
                        className="font-mono bg-background text-xl text-center h-12"
                        data-testid="input-bpm"
                      />
                    </div>
                    <div className="space-y-2 flex flex-col justify-end pb-1">
                      <div className="flex items-center space-x-2 bg-background p-3 rounded-md border border-input h-12">
                        <Switch 
                          id="moving" 
                          checked={isMoving} 
                          onCheckedChange={setIsMoving} 
                          data-testid="switch-moving"
                        />
                        <Label htmlFor="moving" className="text-xs uppercase cursor-pointer">Active</Label>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-sm tracking-widest uppercase font-bold" 
                    disabled={isSubmitting || !userId || bpm === ""}
                    data-testid="button-submit"
                  >
                    {isSubmitting ? "Transmitting..." : "Send Telemetry"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Calibration Progress */}
            {calibrationCount < 10 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground uppercase">
                  <span>Baseline Calibration</span>
                  <span>{calibrationCount} / 10</span>
                </div>
                <Progress value={calibrationProgress} className="h-1 bg-secondary" />
              </div>
            )}
          </div>

          {/* Right Column: Chart & Log */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Chart */}
            <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ActivitySquare className="w-5 h-5 text-primary" />
                    TELEMETRY FEED
                  </CardTitle>
                  <CardDescription>Last 20 readings</CardDescription>
                </div>
                {latestReading && (
                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary">{latestReading.input_hr}</div>
                    <div className="text-xs text-muted-foreground uppercase">Current BPM</div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="var(--color-muted-foreground)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          dy={10}
                        />
                        <YAxis 
                          stroke="var(--color-muted-foreground)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          domain={['dataMin - 10', 'dataMax + 10']}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--color-popover)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                          itemStyle={{ color: 'var(--color-foreground)' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="bpm" 
                          stroke="var(--color-primary)" 
                          strokeWidth={2} 
                          dot={(props) => {
                            const { cx, cy, payload } = props;
                            if (payload.isAnomaly) {
                              return <circle cx={cx} cy={cy} r={4} fill="var(--color-destructive)" stroke="none" />;
                            }
                            return <circle cx={cx} cy={cy} r={0} />;
                          }}
                          activeDot={{ r: 6, fill: "var(--color-primary)" }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg bg-secondary/20 text-sm uppercase tracking-widest">
                      Awaiting telemetry stream...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* History Log */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg text-muted-foreground uppercase tracking-widest">Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {[...readings].reverse().map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground w-20">
                          {new Date(r.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold w-8 text-right">{r.input_hr}</span>
                          <span className="text-muted-foreground text-xs">BPM</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {r.analysis.alert && <AlertTriangle className="w-4 h-4 text-destructive" />}
                        <Badge 
                          variant="outline" 
                          className={`uppercase text-[10px] tracking-wider
                            ${r.analysis.status === 'NORMAL' ? 'text-emerald-500 border-emerald-500/30' : ''}
                            ${r.analysis.status === 'CALIBRATING' ? 'text-yellow-500 border-yellow-500/30' : ''}
                            ${r.analysis.status === 'CRITICAL_ANOMALY' ? 'text-red-500 border-red-500/30 bg-red-500/10' : ''}
                          `}
                        >
                          {r.analysis.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {readings.length === 0 && (
                    <div className="text-center text-muted-foreground py-8 text-sm uppercase tracking-widest">
                      No logs recorded
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
