let sharedAudioCtx = null;

/**
 * Beep de alerta sintetizado con Web Audio API (dos tonos ascendentes tipo
 * "ding-ding"). No depende de ningun archivo de audio externo, asi que
 * funciona offline y no agrega peso al bundle.
 *
 * Los navegadores bloquean el audio hasta que hay una interaccion del
 * usuario en la pagina; el login (un click) ya cuenta como esa interaccion,
 * asi que para cuando el pedido nuevo llega por socket, el audio ya esta
 * habilitado. Si de todos modos el navegador lo bloquea, fallamos en
 * silencio: un sonido que no suena nunca debe romper la pantalla de cocina.
 */
export function playAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    sharedAudioCtx = sharedAudioCtx || new AudioContextClass();
    const ctx = sharedAudioCtx;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    [
      { delay: 0, freq: 880 },
      { delay: 0.16, freq: 1180 },
    ].forEach(({ delay, freq }) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;

      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.35, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.22);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.24);
    });
  } catch (err) {
    console.warn('No se pudo reproducir el sonido de alerta de cocina', err);
  }
}
