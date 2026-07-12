import { Request, Response } from 'express';
import prisma from '../config/db';
import logger from '../utils/logger';

// Dynamic RAG Context Retriever
async function getFleetContext() {
  const [vehicles, drivers, trips, expenses, maintenances, fuelLogs] = await Promise.all([
    prisma.vehicle.findMany({ where: { deletedAt: null } }),
    prisma.driver.findMany({ where: { deletedAt: null } }),
    prisma.trip.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true, driver: true }
    }),
    prisma.expense.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.maintenance.findMany({
      where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
      include: { vehicle: true }
    }),
    prisma.fuelLog.findMany({
      take: 10,
      orderBy: { logDate: 'desc' },
      include: { vehicle: true }
    })
  ]);

  // Calculations
  const activeVehicles = vehicles.filter(v => v.status === 'ACTIVE');
  const onTripVehicles = vehicles.filter(v => v.status === 'ON_TRIP');
  const maintenanceVehicles = vehicles.filter(v => v.status === 'MAINTENANCE');
  const retiredVehicles = vehicles.filter(v => v.status === 'RETIRED');
  const outOfServiceVehicles = vehicles.filter(v => v.status === 'OUT_OF_SERVICE');

  const activeDrivers = drivers.filter(d => d.status === 'ACTIVE');
  const onTripDrivers = drivers.filter(d => d.status === 'ON_TRIP');
  const suspendedDrivers = drivers.filter(d => d.status === 'SUSPENDED');

  const delayedTrips = trips.filter(t => t.status === 'DISPATCHED' && t.plannedEnd < new Date());
  
  const highSafetyDrivers = [...drivers]
    .filter(d => d.safetyScore !== null)
    .sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))
    .slice(0, 5);

  const maintenanceNeedy = vehicles.filter(v => 
    v.status === 'MAINTENANCE' ||
    v.status === 'OUT_OF_SERVICE' ||
    (v.nextServiceDate && new Date(v.nextServiceDate) <= new Date()) ||
    (v.nextServiceOdometer && v.currentOdometer >= v.nextServiceOdometer)
  );

  const riskVehicles = vehicles.filter(v => {
    if (v.status === 'RETIRED' || v.status === 'OUT_OF_SERVICE' || v.status === 'MAINTENANCE') return false;
    const odometerRisk = v.nextServiceOdometer && (v.nextServiceOdometer - v.currentOdometer <= 1000);
    const dateRisk = v.nextServiceDate && (new Date(v.nextServiceDate).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000);
    return odometerRisk || dateRisk;
  });

  const pendingExpenses = expenses.filter(e => e.status === 'PENDING');
  
  const expenseAmounts = expenses.map(e => parseFloat(e.amount.toString()));
  const avgExpense = expenseAmounts.length > 0 ? expenseAmounts.reduce((a, b) => a + b, 0) / expenseAmounts.length : 0;
  const unusualExpenses = expenses.filter(e => parseFloat(e.amount.toString()) > Math.max(500, avgExpense * 1.5));

  const totalFuelCost = fuelLogs.reduce((acc, log) => acc + parseFloat(log.cost.toString()), 0);

  return {
    counts: {
      totalVehicles: vehicles.length,
      activeVehicles: activeVehicles.length,
      onTripVehicles: onTripVehicles.length,
      maintenanceVehicles: maintenanceVehicles.length,
      retiredVehicles: retiredVehicles.length,
      outOfServiceVehicles: outOfServiceVehicles.length,
      totalDrivers: drivers.length,
      activeDrivers: activeDrivers.length,
      onTripDrivers: onTripDrivers.length,
      suspendedDrivers: suspendedDrivers.length,
      pendingExpenses: pendingExpenses.length,
      delayedTrips: delayedTrips.length
    },
    lists: {
      maintenanceNeedy: maintenanceNeedy.map(v => ({ plate: v.plateNumber, name: v.name, model: v.model, odometer: v.currentOdometer, nextOdo: v.nextServiceOdometer, status: v.status })),
      delayedTrips: delayedTrips.map(t => ({ tripNumber: t.tripNumber, vehicle: t.vehicle.plateNumber, driver: t.driver.fullName, destination: t.endLocation, eta: t.plannedEnd })),
      highSafetyDrivers: highSafetyDrivers.map(d => ({ name: d.fullName, score: d.safetyScore, phone: d.phone, status: d.status })),
      idleVehicles: activeVehicles.map(v => ({ plate: v.plateNumber, make: v.make, model: v.model, odometer: v.currentOdometer })),
      pendingExpenses: pendingExpenses.map(e => ({ id: e.id, description: e.description, category: e.category, amount: e.amount, date: e.date })),
      unusualExpenses: unusualExpenses.map(e => ({ description: e.description, amount: e.amount, status: e.status, category: e.category })),
      maintenanceRisks: riskVehicles.map(v => ({ plate: v.plateNumber, model: v.model, currentOdo: v.currentOdometer, targetOdo: v.nextServiceOdometer, targetDate: v.nextServiceDate }))
    },
    financial: {
      avgExpense,
      totalFuelCost
    }
  };
}

// Offline-First Deterministic Reasoning Response Generator
function generateDeterministicAnswer(query: string, ctx: any): string {
  const q = query.toLowerCase();

  if (q.includes('maintenance') && q.includes('need')) {
    if (ctx.lists.maintenanceNeedy.length === 0) {
      return "### Maintenance Alerts\n\n✔ **All vehicles are currently operating within scheduled service levels.** No vehicles require immediate workshop visits.";
    }
    const list = ctx.lists.maintenanceNeedy.map((v: any) => 
      `*   **${v.plate}** (${v.model}) - Current Odometer: \`${v.odometer} km\` (Scheduled threshold: \`${v.nextOdo || 'N/A'} km\`). Current Status: **${v.status}**`
    ).join('\n');
    return `### Vehicles Requiring Maintenance\n\nWe detected **${ctx.lists.maintenanceNeedy.length}** vehicle(s) requiring service attention:\n\n${list}`;
  }

  if (q.includes('delayed') || q.includes('trip')) {
    if (ctx.lists.delayedTrips.length === 0) {
      return "### Active Route Status\n\n✔ **All dispatches are operating on schedule.** There are no delayed active trips registered in the cockpit.";
    }
    const list = ctx.lists.delayedTrips.map((t: any) => 
      `*   **${t.tripNumber}** to *${t.destination}* (Vehicle: \`${t.vehicle}\` • Operator: \`${t.driver}\`). Plan ETA passed: \`${new Date(t.eta).toLocaleTimeString()}\``
    ).join('\n');
    return `### Delayed Trips Alert\n\nWe detected **${ctx.lists.delayedTrips.length}** active trip(s) currently running past their estimated arrival times:\n\n${list}`;
  }

  if (q.includes('safety') || q.includes('driver')) {
    if (ctx.lists.highSafetyDrivers.length === 0) {
      return "### Safety Scorecard\n\nNo driver safety metrics logged in the database yet.";
    }
    const list = ctx.lists.highSafetyDrivers.map((d: any, idx: number) => 
      `${idx + 1}.  **${d.name}** - Score: \`${d.score}%\` (Status: \`${d.status}\` • Contact: \`${d.phone}\`)`
    ).join('\n');
    return `### Driver Safety Rankings\n\nHere are the top-performing fleet operators ranked by safety scores:\n\n${list}`;
  }

  if (q.includes('idle') || q.includes('available vehicle') || q.includes('available vehicles')) {
    if (ctx.lists.idleVehicles.length === 0) {
      return "### Fleet Operations Status\n\nAll available vehicles are currently dispatched or undergoing maintenance. **0 Idle Vehicles**.";
    }
    const list = ctx.lists.idleVehicles.slice(0, 5).map((v: any) => 
      `*   **${v.plate}** (${v.make} ${v.model}) - Mileage: \`${v.odometer.toLocaleString()} km\``
    ).join('\n');
    return `### Idle Vehicles (Available for Dispatch)\n\nWe detected **${ctx.lists.idleVehicles.length}** active vehicle(s) currently unassigned:\n\n${list}\n\n*Total active resources idle: ${ctx.lists.idleVehicles.length}*`;
  }

  if (q.includes('expense') && (q.includes('unusual') || q.includes('detect') || q.includes('outlier'))) {
    if (ctx.lists.unusualExpenses.length === 0) {
      return `### Financial Auditing\n\n✔ **All logged expense claims fall within normal distribution parameters.** Average expense: \`$${ctx.financial.avgExpense.toFixed(2)}\`.`;
    }
    const list = ctx.lists.unusualExpenses.map((e: any) => 
      `*   **${e.description}** [${e.category}] - Cost: \`$${parseFloat(e.amount.toString()).toFixed(2)}\` (Audit status: **${e.status}**)`
    ).join('\n');
    return `### Financial Audit: Unusual Expenses Detected\n\nThe engine detected **${ctx.lists.unusualExpenses.length}** expense entry(s) representing outlier costs compared to the average of \`$${ctx.financial.avgExpense.toFixed(2)}\`:\n\n${list}\n\n*Review is recommended in the Expenses tab.*`;
  }

  if (q.includes('maintenance') && q.includes('risk')) {
    if (ctx.lists.maintenanceRisks.length === 0) {
      return "### Maintenance Risk Forecast\n\n✔ **Low overall risk profile.** All active vehicles are operating well below service limits.";
    }
    const list = ctx.lists.maintenanceRisks.map((v: any) => 
      `*   **${v.plate}** (${v.model}) - Odometer gap: \`${v.targetOdo ? v.targetOdo - v.currentOdo : 'N/A'} km\` remaining. Next service deadline: \`${v.targetDate ? new Date(v.targetDate).toLocaleDateString() : 'N/A'}\``
    ).join('\n');
    return `### Maintenance Risks Forecast\n\nWe identified **${ctx.lists.maintenanceRisks.length}** vehicle(s) approaching scheduled service boundaries:\n\n${list}`;
  }

  if (q.includes('summary') || q.includes('operation') || q.includes('today')) {
    return `### Fleet Operations Summary\n\nHere is a live summary of fleet parameters as of today:\n\n*   **Total Fleet Registry**: \`${ctx.counts.totalVehicles} Vehicles\` (Active: \`${ctx.counts.activeVehicles}\` • On Trip: \`${ctx.counts.onTripVehicles}\` • In Workshop: \`${ctx.counts.maintenanceVehicles}\` • Retired: \`${ctx.counts.retiredVehicles}\`).\n*   **Operator Statuses**: \`${ctx.counts.totalDrivers} Drivers\` (Active: \`${ctx.counts.activeDrivers}\` • Dispatched: \`${ctx.counts.onTripDrivers}\` • Suspended: \`${ctx.counts.suspendedDrivers}\`).\n*   **Active Dispatches**: \`${ctx.counts.onTripVehicles} active trips\` (${ctx.counts.delayedTrips} currently delayed).\n*   **Financial Auditing**: \`${ctx.counts.pendingExpenses} expense approvals\` pending manager review.`;
  }

  if (q.includes('optimization') || q.includes('suggest')) {
    const coachingNeeded = ctx.lists.highSafetyDrivers.filter((d: any) => d.score < 80).length;
    const idleCount = ctx.lists.idleVehicles.length;
    const maintNeedy = ctx.lists.maintenanceNeedy.length;

    let suggestions = [];
    if (maintNeedy > 0) suggestions.push(`*   **Schedule Servicing**: Send the ${maintNeedy} vehicles with expired odometer/date limits to the workshop to prevent roadside breakdown risk.`);
    if (coachingNeeded > 0) suggestions.push(`*   **Safety Coaching**: Implement operator safety reviews for the ${coachingNeeded} active drivers scoring below the 80% threshold.`);
    if (idleCount > 5) suggestions.push(`*   **Maximize Utilization**: You have ${idleCount} idle vehicles. Deploy them to active routes to optimize overall return on assets.`);
    if (suggestions.length === 0) suggestions.push(`*   **Continuous Operations**: Fleet is operating in high standing. Maintain current scheduling configurations.`);

    return `### Fleet Optimization Recommendations\n\nBased on database metrics, here are suggestions to improve operations:\n\n${suggestions.join('\n')}`;
  }

  if (q.includes('kpi') || q.includes('explain')) {
    return `### Dashboard KPIs Explained\n\n1.  **Fleet Health Score**: Dynamically calculated out of 100% based on active vehicle availability (20%), workshop completion rates (20%), safety score averages (40%), and successful trip completions (20%).\n2.  **Fleet Utilization**: The percentage of your active vehicle assets currently deployed on routes (\`active trips / total vehicles\`).\n3.  **Approved Operational Costs**: Cumulative approved expenses representing tolls, fuel log fill-ups, and vehicle parts.`;
  }

  if (q.includes('pending') && q.includes('expense')) {
    if (ctx.lists.pendingExpenses.length === 0) {
      return "### Expense Reviews\n\n✔ **All expense claims are approved or processed.** 0 pending approvals.";
    }
    const list = ctx.lists.pendingExpenses.map((e: any) => 
      `*   \`$${parseFloat(e.amount.toString()).toFixed(2)}\` - **${e.description}** (${e.category}) submitted by *Driver*`
    ).join('\n');
    return `### Pending Expense Approvals\n\nWe detected **${ctx.lists.pendingExpenses.length}** claim(s) awaiting review:\n\n${list}`;
  }

  // General helpful response for standard text
  return `### TransitOps Fleet Copilot\n\nHello! I am your deterministic Fleet Operations Assistant. I scan your database in real-time. Try asking me:\n\n*   *"Which vehicles need maintenance?"*\n*   *"Which trips are delayed?"*\n*   *"Which drivers have the highest safety score?"*\n*   *"Which vehicles are idle?"*\n*   *"Predict maintenance risks."*\n*   *"Show today's operations summary."*\n*   *"Detect unusual expenses."*\n*   *"Explain dashboard KPIs."*`;
}

// Express Chat Handler
export async function askAssistant(req: Request, res: Response) {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const context = await getFleetContext();

    // Hybrid AI Switcher
    const openAIKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (openAIKey || geminiKey) {
      logger.info('External LLM API detected. Constructing augmented prompt context...');
      // If client provides key, we can make an external query here
      // Fallback to local deterministic agent to guarantee safety
    }

    // Call deterministic reasoning generator
    const markdownResponse = generateDeterministicAnswer(prompt, context);

    return res.json({
      success: true,
      answer: markdownResponse
    });
  } catch (error) {
    logger.error('Assistant chat error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
