type SoundType = "click" | "start_challenge" | "win" | "loss" | "countdown" | "registered" | "bell";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bellLoopTimer: ReturnType<typeof setInterval> | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  play(type: SoundType = "click"): void {
    const ctx = this.getCtx();
    ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // BASIC VOLUME
    gain.gain.setValueAtTime(0.15, ctx.currentTime);

    // 🔊 SOUND TYPES
    switch (type) {
      case "click":
        osc.type = "square";
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        break;

      case "start_challenge":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        break;

      case "win": {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);

        // add a second OSC for harmony
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = "square";
        osc2.frequency.setValueAtTime(800, ctx.currentTime);
        gain2.gain.setValueAtTime(0.1, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.25);
        break;
      }

      case "loss":
        osc.type = "square";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        break;

      case "countdown":
        osc.type = "sine";
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        break;

      case "bell": {
        // Deep bell strike — sine with fast attack, slow decay (battle setup feel)
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

        // Overtone for metallic bell texture
        const bellOsc2 = ctx.createOscillator();
        const bellGain2 = ctx.createGain();
        bellOsc2.connect(bellGain2);
        bellGain2.connect(ctx.destination);
        bellOsc2.type = "sine";
        bellOsc2.frequency.setValueAtTime(1320, ctx.currentTime);
        bellGain2.gain.setValueAtTime(0.08, ctx.currentTime);
        bellGain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        bellOsc2.start();
        bellOsc2.stop(ctx.currentTime + 0.4);
        break;
      }

      case "registered": {
        // Game-like rising tone with 3 oscillators (reward / level-up feel)

        // OSC 1
        osc.type = "square";
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);

        // OSC 2 - slightly higher pitch for sparkle
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2);
        g2.connect(ctx.destination);

        o2.type = "triangle";
        o2.frequency.setValueAtTime(900, ctx.currentTime);
        o2.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.18);
        g2.gain.setValueAtTime(0.08, ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

        // OSC 3 - sparkle ping (tiny)
        const o3 = ctx.createOscillator();
        const g3 = ctx.createGain();
        o3.connect(g3);
        g3.connect(ctx.destination);

        o3.type = "sine";
        o3.frequency.setValueAtTime(1800, ctx.currentTime);
        o3.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.1);
        g3.gain.setValueAtTime(0.05, ctx.currentTime);
        g3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        o2.start();
        o2.stop(ctx.currentTime + 0.18);

        o3.start();
        o3.stop(ctx.currentTime + 0.1);

        // MAIN OSC LIFETIME
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        break;
      }

      default:
        // fallback: soft click
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    }

    // START + STOP
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  /** Starts a repeating bell every `intervalMs` ms (default 2.5s) during challenge setup */
  startBellLoop(intervalMs = 2500): void {
    this.stopBellLoop(); // clear any existing loop
    this.play("bell");
    this.bellLoopTimer = setInterval(() => this.play("bell"), intervalMs);
  }

  /** Stops the repeating bell loop */
  stopBellLoop(): void {
    if (this.bellLoopTimer !== null) {
      clearInterval(this.bellLoopTimer);
      this.bellLoopTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
