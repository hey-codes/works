import styles from "@/components/atlas.module.css";
import { AtlasProvider } from "@/components/atlas-state";
import { Capabilities } from "@/components/capabilities";
import { Education } from "@/components/education";
import { Experience } from "@/components/experience";
import { Hero } from "@/components/hero";
import { Highlights } from "@/components/highlights";
import { MapAside } from "@/components/map-aside";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SlimBar } from "@/components/slim-bar";
import { Stack } from "@/components/stack";

export default function Page() {
  return (
    <>
      <SlimBar />
      <div className={styles.container}>
        <SiteHeader />
        <AtlasProvider>
          <div className={styles.layout}>
            <Hero />
            <main className={styles.main}>
              <Highlights />
              <Experience />
              <Education />
              <Capabilities />
              <Stack />
            </main>
            {/* After the CV in the page's order, so Tab and a screen reader reach
                Highlights before the map's controls; the grid places it
                (beside the CV from 960px, under the hero below). */}
            <MapAside />
          </div>
        </AtlasProvider>
        <SiteFooter />
      </div>
    </>
  );
}
