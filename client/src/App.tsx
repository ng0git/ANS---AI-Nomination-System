import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import Compare from "@/pages/Compare";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/qualified" component={() => <Dashboard activeSection="qualified" />} />
      <Route path="/attention" component={() => <Dashboard activeSection="attention" />} />
      <Route path="/disqualified" component={() => <Dashboard activeSection="disqualified" />} />
      <Route path="/compare/:candidateId" component={({ params }) => <Compare candidateId={params.candidateId} />} />
      <Route component={Dashboard} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
