import './style.css';
import { game } from './data/game';
import { drawIsland } from './render/island';
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Falta el contenedor principal');
root.innerHTML = `
  <header><a href="./" class="brand">MAREA<span> / SURVIVOR</span></a><span class="badge">${game.phase}</span></header>
  <main>
    <section class="intro"><p class="eyebrow">BITÁCORA 001 / EL COMIENZO</p><h1>El horizonte<br>nos espera<span>.</span></h1><p class="description">${game.subtitle}<br>Estamos construyendo la próxima gran aventura.</p><button id="explore">Explorar el proyecto <span>↗</span></button><p class="caption">Base técnica lista · Combate en la fase 1</p></section>
    <section class="map" aria-label="Vista procedural de East Blue"><div class="map-label"><span>01 / EAST BLUE</span><span>MAR EN CALMA</span></div><canvas aria-label="Isla pixel art con palmeras, embarcadero y un aventurero"></canvas><div class="map-footer"><span>UN MUNDO POR DESCUBRIR</span><span>✦</span></div></section>
    <section class="status" id="project" tabindex="-1"><div><span class="number">01</span><h2>Un núcleo que se sienta bien</h2><p>La siguiente fase pondrá a prueba cinco minutos de movimiento, combate y decisiones.</p></div><div><span class="number">02</span><h2>Arte con identidad propia</h2><p>Escenarios procedurales y una ruta preparada para incorporar tus propios assets.</p></div><div><span class="number">03</span><h2>Rumbo trazado</h2><p>Contenido, tripulación e islas llegarán por fases, con validación en cada etapa.</p></div></section>
  </main><footer>MAREA DE AVENTURAS <span>PROTOTIPO EN CONSTRUCCIÓN · SIN ASSETS OFICIALES</span></footer>`;
const canvas = root.querySelector('canvas');
if (!canvas) throw new Error('Falta el lienzo');
drawIsland(canvas, game.island.seed);
root.querySelector('#explore')?.addEventListener('click', () => {
  const project = document.querySelector<HTMLElement>('#project');
  project?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  project?.focus({ preventScroll: true });
});
if (new URLSearchParams(location.search).has('debug')) {
  const debug = document.createElement('p');
  debug.className = 'debug';
  debug.textContent = `Depuración · semilla ${game.island.seed} · paso ${game.fixedStep.toFixed(4)} s · fase 0`;
  root.append(debug);
}
