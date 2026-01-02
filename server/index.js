const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const app = express();

app.use(cors());

// In production (Docker), we use system binaries installed in /usr/local/bin
// In development (macOS), we use local binaries in the project folder
const USE_SYSTEM = process.env.USE_SYSTEM_BINARIES === 'true' || process.env.USE_SYSTEM_BINARIES === true;

const YT_DLP_PATH = USE_SYSTEM ? 'yt-dlp' : path.join(__dirname, 'yt-dlp');
const FFMPEG_PATH = USE_SYSTEM ? 'ffmpeg' : path.join(__dirname, 'ffmpeg');

// Helper to run yt-dlp and get JSON output
const getYtInfo = (url) => {
    return new Promise((resolve, reject) => {
        // -J: dump JSON
        // --flat-playlist: don't list playlist videos if it's a playlist URL

        // Prepare spawn args. If using system binary, command is just 'yt-dlp'
        // If local, it's the full path.
        const command = YT_DLP_PATH;
        const args = ['-J', '--flat-playlist', url];

        const process = spawn(command, args);

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        process.on('close', (code) => {
            if (code !== 0) {
                console.error('yt-dlp error:', stderr);
                return reject(new Error(stderr || 'yt-dlp failed'));
            }
            try {
                const json = JSON.parse(stdout);
                resolve(json);
            } catch (e) {
                reject(e);
            }
        });
    });
};

app.get('/api/info', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'Invalid URL' });

    console.log(`Fetching info for: ${url}`);

    try {
        const info = await getYtInfo(url);

        const formats = info.formats || [];

        // Filter valid video formats (mp4/webm)
        const videoFormats = formats
            .filter(f => f.vcodec !== 'none' && f.video_ext !== 'none')
            .sort((a, b) => (b.height || 0) - (a.height || 0));

        // Filter audio
        const audioFormats = formats
            .filter(f => f.acodec !== 'none' && (f.vcodec === 'none' || f.video_ext === 'none'));

        res.json({
            title: info.title,
            thumbnail: info.thumbnail,
            videoFormats: videoFormats.map(f => ({
                itag: f.format_id, // yt-dlp uses format_id as generic identifier
                qualityLabel: f.format_note ? `${f.height}p (${f.format_note})` : `${f.height}p`,
                container: f.ext,
                hasVideo: true,
                hasAudio: f.acodec !== 'none',
                codecs: f.vcodec,
                fileSize: f.filesize || f.filesize_approx
            })),
            audioFormats: audioFormats.map(f => ({
                itag: f.format_id,
                container: f.ext,
                audioBitrate: f.abr,
                fileSize: f.filesize || f.filesize_approx
            }))
        });
    } catch (error) {
        console.error('Info Error:', error);
        res.status(500).json({ error: 'Failed to fetch info: ' + error.message });
    }
});

app.get('/api/download', (req, res) => {
    const { url, itag, type, title } = req.query;
    if (!url) return res.status(400).send('Invalid URL');

    console.log(`Downloading: ${url} [Format: ${itag}]`);

    // Sanitize title for filename
    const safeTitle = (title || 'download').replace(/[^a-z0-9\s\-\.]/gi, '_').replace(/_+/g, '_');
    const ext = type === 'audio' ? 'mp3' : 'mp4';
    const filename = `${safeTitle}.${ext}`;

    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.header('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');

    // If audio requested, we want to extract audio
    let args = [];
    if (type === 'audio') {
        // -x: extract audio, --audio-format mp3
        // -o - : output to stdout
        args = ['-x', '--audio-format', 'mp3', '-o', '-', url];
    } else {
        // Video
        // format selection: itag (format_id) + bestaudio (to merge if needed)
        // Format: -f "itag+bestaudio/best"

        const formatSelector = itag ? `${itag}+bestaudio/best` : 'bestvideo+bestaudio/best';

        // Pass ffmpeg location so yt-dlp can merge video+audio
        // If FFMPEG_PATH is just 'ffmpeg', yt-dlp might find it naturally, but explicit is safer if path known
        // However, --ffmpeg-location accepts a binary name if in PATH.
        args = ['--ffmpeg-location', FFMPEG_PATH, '-f', formatSelector, '-o', '-', url];
    }

    const process = spawn(YT_DLP_PATH, args);

    // Pipe stdout to response
    process.stdout.pipe(res);

    process.stderr.on('data', (data) => {
        // Log progress but don't crash response
        // console.error('yt-dlp stderr:', data.toString()); 
    });

    process.on('close', (code) => {
        console.log(`Download finished with code ${code}`);
    });
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Using yt-dlp at: ${YT_DLP_PATH}`);
});
