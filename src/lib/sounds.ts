"use client";

import * as Tone from 'tone';

let synth: Tone.Synth | null = null;

const initializeSound = async () => {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }
    if (!synth) {
        synth = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.3,
                release: 1
            }
        }).toDestination();
    }
};

export const playCompletionSound = () => {
    if (typeof window !== 'undefined') {
        initializeSound().then(() => {
            synth?.triggerAttackRelease("C5", "8n");
        }).catch(e => console.error("Could not play sound", e));
    }
};

export const playBigCompletionSound = () => {
    if (typeof window !== 'undefined') {
        initializeSound().then(() => {
            const now = Tone.now();
            synth?.triggerAttackRelease("C4", "8n", now);
            synth?.triggerAttackRelease("G4", "8n", now + 0.1);
            synth?.triggerAttackRelease("C5", "8n", now + 0.2);
        }).catch(e => console.error("Could not play sound", e));
    }
};
