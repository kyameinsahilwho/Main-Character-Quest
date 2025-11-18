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
            // Ascending triumphant melody
            synth?.triggerAttackRelease("C4", "16n", now);
            synth?.triggerAttackRelease("E4", "16n", now + 0.1);
            synth?.triggerAttackRelease("G4", "16n", now + 0.2);
            synth?.triggerAttackRelease("C5", "8n", now + 0.3);
            synth?.triggerAttackRelease("E5", "8n", now + 0.45);
            synth?.triggerAttackRelease("G5", "4n", now + 0.6);
        }).catch(e => console.error("Could not play sound", e));
    }
};

export const playAddTaskSound = () => {
    if (typeof window !== 'undefined') {
        initializeSound().then(() => {
            const now = Tone.now();
            synth?.triggerAttackRelease("E4", "16n", now);
            synth?.triggerAttackRelease("A4", "16n", now + 0.08);
        }).catch(e => console.error("Could not play sound", e));
    }
};
