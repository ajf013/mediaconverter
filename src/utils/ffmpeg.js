import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

export const loadFFmpeg = async () => {
    if (ffmpeg.loaded) return ffmpeg;

    // Load locally from public/ffmpeg to avoid COOP/COEP issues with external CDNs
    // Load locally from public/ffmpeg to avoid COOP/COEP issues with external CDNs
    const baseURL = window.location.origin + '/ffmpeg';

    if (!window.crossOriginIsolated) {
        console.warn("SharedArrayBuffer not available. Converting might fail.");
        // We could try to fallback or warn user
    }

    console.log("Loading FFmpeg from:", baseURL);

    try {
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    } catch (e) {
        console.error("FFmpeg Load Error:", e);
        throw e;
    }

    return ffmpeg;
};

export default ffmpeg;
