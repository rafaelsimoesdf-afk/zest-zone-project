import { useMemo } from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { VehicleStats } from "@/hooks/useOwnerDashboard";

interface VehicleBookingsChartProps {
  vehicleStats: VehicleStats[];
  isLoading: boolean;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 76%, 36%)",
  "hsl(47, 96%, 53%)",
  "hsl(199, 89%, 48%)",
  "hsl(280, 87%, 65%)",
  "hsl(340, 75%, 55%)",
  "hsl(25, 95%, 53%)",
  "hsl(173, 58%, 39%)",
];

export function VehicleBookingsChart({ vehicleStats, isLoading }: VehicleBookingsChartProps) {
  const chartData = useMemo(() => {
    if (!vehicleStats?.length) return [];

    return vehicleStats.map((vehicle, index) => ({
      name: `${vehicle.brand} ${vehicle.model}`.substring(0, 15),
      fullName: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
      confirmadas: vehicle.confirmed_bookings,
      pendentes: vehicle.pending_bookings,
      canceladas: vehicle.cancelled_bookings,
      total: vehicle.total_bookings,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [vehicleStats]);

  const chartConfig = {
    confirmadas: {
      label: "Confirmadas",
      color: "hsl(142, 76%, 36%)",
    },
    pendentes: {
      label: "Pendentes",
      color: "hsl(47, 96%, 53%)",
    },
    canceladas: {
      label: "Canceladas",
      color: "hsl(0, 84%, 60%)",
    },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reservas por Veículo</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reservas por Veículo</CardTitle>
          <CardDescription>Visualize as reservas de cada veículo</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservas por Veículo</CardTitle>
        <CardDescription>
          Quantidade de reservas por status para cada veículo cadastrado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
              className="fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0]?.payload;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="font-medium mb-2">{data?.fullName}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-green-500" />
                        <span className="text-muted-foreground">Confirmadas:</span>
                        <span className="font-medium">{data?.confirmadas}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                        <span className="text-muted-foreground">Pendentes:</span>
                        <span className="font-medium">{data?.pendentes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-red-500" />
                        <span className="text-muted-foreground">Canceladas:</span>
                        <span className="font-medium">{data?.canceladas}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1 border-t mt-1">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold">{data?.total}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => (
                <span className="text-sm text-foreground capitalize">{value}</span>
              )}
            />
            <Bar
              dataKey="confirmadas"
              name="Confirmadas"
              fill="hsl(142, 76%, 36%)"
              radius={[4, 4, 0, 0]}
              stackId="stack"
            />
            <Bar
              dataKey="pendentes"
              name="Pendentes"
              fill="hsl(47, 96%, 53%)"
              radius={[0, 0, 0, 0]}
              stackId="stack"
            />
            <Bar
              dataKey="canceladas"
              name="Canceladas"
              fill="hsl(0, 84%, 60%)"
              radius={[4, 4, 0, 0]}
              stackId="stack"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
