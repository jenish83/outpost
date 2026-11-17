import Image from "next/image";
import Link from "next/link";
import { FileText, Kanban, Workflow, type LucideIcon } from "lucide-react";
import { landing } from "@/app/_data/landing";
import { SurfaceMock } from "@/components/landing/SurfaceMock";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingTable } from "@clerk/nextjs";

const PRICING_TAB =
  "rounded-full px-5 py-1.5 data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground";

const surfaceIcons = {
  canvas: Workflow,
  docs: FileText,
  board: Kanban,
} satisfies Record<
  (typeof landing.features.surfaces)[number]["id"],
  LucideIcon
>;

export default function Home() {
  const { hero, audience, features, howItWorks, pricing, closing } = landing;

  return (
    <>
      <main>
        <section className="topo-bg px-6 pt-16 pb-24 md:pt-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="mb-6 flex items-center gap-2.5 font-mono text-xs tracking-[0.22em] text-primary uppercase">
              <span
                aria-hidden
                className="size-1.5 shrink-0 rotate-45 bg-primary"
              />
              {hero.eyebrow}
            </p>
            <h1 className="text-balance text-4xl font-medium tracking-tight text-foreground sm:text-6xl md:text-7xl md:leading-[1.05]">
              {hero.headline.before}{" "}
              <span className="text-primary">{hero.headline.accent}</span>{" "}
              {hero.headline.after}
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {hero.subtitle}
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 px-5">
                <Link href={hero.primaryCta.href}>{hero.primaryCta.label}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-5">
                <Link href={hero.secondaryCta.href}>
                  {hero.secondaryCta.label}
                </Link>
              </Button>
            </div>
          </div>
          <div className="survey-frame scroll-tilt mx-auto mt-16 w-full max-w-5xl">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              <video
                className="aspect-video w-full bg-card object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster={hero.video.poster}
                aria-label={hero.video.label}
              >
                <source src={hero.video.webm} type="video/webm" />
                <source src={hero.video.mp4} type="video/mp4" />
              </video>
            </div>
          </div>
        </section>

        <section aria-label={audience.label} className="border-y border-border">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-5 sm:flex-row sm:justify-center sm:gap-8">
            <p className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
              {audience.label}
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
              {audience.groups.map((group) => (
                <li
                  key={group}
                  className="flex items-center gap-3 text-sm text-foreground"
                >
                  <span aria-hidden className="size-1 rotate-45 bg-primary" />
                  {group}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id={features.id} className="scroll-mt-24 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mx-auto max-w-3xl text-center text-balance text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
              {features.heading}
            </h2>
            <div className="mt-20 flex flex-col gap-20 md:gap-28">
              {features.surfaces.map((surface, index) => {
                const Icon = surfaceIcons[surface.id];
                return (
                  <article
                    key={surface.id}
                    className={`flex flex-col items-center gap-10 lg:gap-16 ${
                      index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
                    }`}
                  >
                    <div className="w-full lg:w-1/2">
                      <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <h3 className="text-2xl font-medium tracking-tight">
                        {surface.title}
                      </h3>
                      <p className="mt-3 max-w-md text-pretty leading-relaxed text-muted-foreground">
                        {surface.description}
                      </p>
                      <ul className="mt-5 space-y-2.5">
                        {surface.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex items-start gap-2.5 text-sm"
                          >
                            <span
                              aria-hidden
                              className="mt-1.5 size-1.5 shrink-0 rotate-45 bg-primary"
                            />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="w-full lg:w-1/2">
                      <SurfaceMock kind={surface.mock} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id={howItWorks.id}
          className="scroll-mt-24 border-t border-border px-6 py-24"
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
              {howItWorks.heading}
            </h2>
            <ol className="relative mt-16 grid gap-10 md:mt-20 md:grid-cols-3 md:gap-8">
              {howItWorks.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="relative pl-12 md:pl-0 md:pt-14 md:text-center"
                >
                  {index < howItWorks.steps.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute top-3 left-[11px] h-[calc(100%+2.5rem)] w-px [background-image:repeating-linear-gradient(to_bottom,oklch(0.74_0.16_55/0.85)_0_6px,transparent_6px_12px)] md:top-[11px] md:left-1/2 md:h-px md:w-[calc(100%+2rem)] md:[background-image:repeating-linear-gradient(to_right,oklch(0.74_0.16_55/0.85)_0_8px,transparent_8px_14px)]"
                    />
                  )}
                  <span className="absolute top-0 left-0 z-10 flex size-6 items-center justify-center bg-background md:left-1/2 md:-translate-x-1/2">
                    <span
                      aria-hidden
                      className="size-2.5 rotate-45 bg-primary"
                    />
                  </span>
                  <p className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-xl font-medium tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:mx-auto md:max-w-xs">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id={pricing.id} className="scroll-mt-24 px-6 py-24">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <p className="mb-5 flex items-center gap-2.5 font-mono text-[11px] tracking-[0.22em] text-primary uppercase">
              <span aria-hidden className="size-1.5 shrink-0 rotate-45 bg-primary" />
              {pricing.eyebrow}
            </p>
            <h2 className="text-balance text-3xl font-medium tracking-tight sm:text-5xl">
              {pricing.heading}
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">{pricing.note}</p>
          </div>
        <Tabs defaultValue="free" className="mx-auto mt-10 max-w-5xl items-center gap-10">
          <TabsList>
            <TabsTrigger className={PRICING_TAB} value="user">Personal</TabsTrigger>
            <TabsTrigger className={PRICING_TAB} value="organization">Team</TabsTrigger>
          </TabsList>
          <TabsContent value="user" className="w-full">
              <PricingTable for="user"/>
          </TabsContent>  
          <TabsContent value="organization" className="w-full">
            <PricingTable for="organization"/>
          </TabsContent>
        </Tabs>
        </section>

        <section className="topo-bg px-6 py-24">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <Image
              src={closing.mascot.src}
              alt={closing.mascot.alt}
              width={1975}
              height={1975}
              className="mb-8 h-36 w-auto"
            />
            <h2 className="text-balance text-3xl font-medium tracking-tight sm:text-5xl">
              {closing.heading}
            </h2>
            <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
              {closing.subtitle}
            </p>
            <Button asChild size="lg" className="mt-8 h-11 px-5">
              <Link href={closing.cta.href}>{closing.cta.label}</Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        {landing.footer}
      </footer>
    </>
  );
}
