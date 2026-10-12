export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">
        ShipLog
      </h1>
      <p className="max-w-md text-muted-foreground">
        Registra tus proyectos y lleva un historial semanal de lo que
        construyes.
      </p>
    </main>
  );
}
