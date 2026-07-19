import { Button } from '@/components/ui/button';

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-3xl font-semibold">CodeCampus</h1>
      <p className="text-muted-foreground">Frontend scaffold is wired up.</p>
      <Button className="bg-brand text-brand-foreground hover:bg-brand/90">Get started</Button>
    </div>
  );
}

export default App;
