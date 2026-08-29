// eKatalox sipariş zili. Eski masa telefonu zili (iki yakın tonun "vuruşu" +
// çekiç titreşimi) iki kez çalar, ardından kısa imza motifi (Sol-Do-Mi).
// Tamamen WebAudio ile üretilir; ses dosyası yok, ağ yok, ~1,9 sn.
export function playOrderRing() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const t0 = ctx.currentTime;

    // Ana çıkış: ince değil dolgun dursun diye alçak geçiren filtre + genel kazanç
    const master = ctx.createGain();
    master.gain.value = 0.9;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2200;
    master.connect(lp).connect(ctx.destination);

    // Zil: 400 Hz + 450 Hz (klasik telefon "vuruş" tonu) + bir oktav alt gövde,
    // 20 Hz çekiç titreşimiyle modüle. start..start+dur arası çalar.
    const ring = (start: number, dur: number) => {
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(0.6, start + 0.02);
      env.gain.setValueAtTime(0.6, start + dur - 0.05);
      env.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      const trem = ctx.createGain();
      trem.gain.value = 0.5;
      const lfo = ctx.createOscillator();
      lfo.type = "square";
      lfo.frequency.value = 20; // çekiç
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.5;
      lfo.connect(lfoGain).connect(trem.gain);

      for (const [freq, type, g] of [
        [400, "triangle", 0.7],
        [450, "triangle", 0.7],
        [200, "sine", 0.35],
      ] as const) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        const og = ctx.createGain();
        og.gain.value = g;
        osc.connect(og).connect(trem);
        osc.start(start);
        osc.stop(start + dur + 0.05);
      }
      trem.connect(env).connect(master);
      lfo.start(start);
      lfo.stop(start + dur + 0.05);
    };

    // "brrring — brrring"
    ring(t0, 0.55);
    ring(t0 + 0.8, 0.55);

    // İmza motifi: Sol4-Do5-Mi5, tok "tıng" sesleri
    const pluck = (freq: number, start: number) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(0.5, start + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.connect(env).connect(master);
      osc.start(start);
      osc.stop(start + 0.3);
    };
    pluck(392, t0 + 1.5);
    pluck(523.25, t0 + 1.62);
    pluck(659.25, t0 + 1.74);

    window.setTimeout(() => { void ctx.close(); }, 2400);
  } catch {
    /* ses çalınamadı: görsel uyarı yine çıkar */
  }
}
