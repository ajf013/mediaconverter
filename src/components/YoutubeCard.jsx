import React, { useState } from 'react';
import { Card, Button, Icon, Form, Input, Select, Message, Dimmer, Loader, Progress } from 'semantic-ui-react';
import axios from 'axios';

const YoutubeCard = ({ type, title, icon, color }) => {
    // type: 'video', 'audio'
    const [url, setUrl] = useState('');
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [videoInfo, setVideoInfo] = useState(null);
    const [selectedFormat, setSelectedFormat] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Download State
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');

    const fetchInfo = async () => {
        if (!url) return;
        setLoadingInfo(true);
        setErrorMsg('');
        setVideoInfo(null);
        setSelectedFormat('');

        try {
            // Assume backend is running on localhost:4000
            const res = await axios.get(`https://media-converter-backend-gpm0.onrender.com/api/info?url=${encodeURIComponent(url)}`);
            setVideoInfo(res.data);

            // Pre-select first option
            if (type === 'video' && res.data.videoFormats.length > 0) {
                setSelectedFormat(res.data.videoFormats[0].itag);
            } else if (type === 'audio' && res.data.audioFormats.length > 0) {
                setSelectedFormat(res.data.audioFormats[0].itag);
            }

        } catch (err) {
            console.error(err);
            const serverError = err.response?.data?.error;
            // If the error indicates a bot detection/sign-in issue, show a more user-friendly message
            if (serverError && serverError.includes('Sign in to confirm')) {
                setErrorMsg('Server IP blocked by YouTube. Please try again later or deploy locally.');
            } else {
                setErrorMsg(serverError || 'Failed to fetch video info. Make sure Server is running!');
            }
        } finally {
            setLoadingInfo(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedFormat) return;

        setDownloading(true);
        setStatus('Starting Download...');
        setProgress(0);

        try {
            // Find estimated size and quality label for progress/filename
            let estimatedSize = 0;
            let qualityTag = '';

            if (videoInfo) {
                if (type === 'video') {
                    const fmt = videoInfo.videoFormats.find(f => f.itag === selectedFormat);
                    estimatedSize = fmt ? fmt.fileSize : 0;
                    // Extract simplistic quality (e.g. 1080p)
                    if (fmt) qualityTag = `(${fmt.qualityLabel})`;
                } else {
                    const fmt = videoInfo.audioFormats.find(f => f.itag === selectedFormat);
                    estimatedSize = fmt ? fmt.fileSize : 0;
                    qualityTag = '(Audio)';
                }
            }

            const cleanTitle = `${videoInfo.title} ${qualityTag}`;

            const response = await axios.get(`https://media-converter-backend-gpm0.onrender.com/api/download`, {
                params: {
                    url: url,
                    itag: selectedFormat,
                    type: type,
                    title: cleanTitle // Pass title + quality for filename
                },
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    const total = progressEvent.total || estimatedSize;
                    if (total) {
                        const percent = Math.round((progressEvent.loaded * 100) / total);
                        setProgress(percent > 100 ? 99 : percent); // Cap at 99 until finished
                        setStatus(`Downloading... ${percent}%`);
                    } else {
                        // If total is unknown, we can't show percentage, just show spinner-like progress
                        setStatus(`Downloading... ${(progressEvent.loaded / 1024 / 1024).toFixed(1)} MB`);
                    }
                }
            });

            setStatus('Download Completed! Saving...');
            setProgress(100);

            // Create blob link to download
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;

            // Extract filename from header or default
            const contentDisp = response.headers['content-disposition'];
            let fileName = 'download.' + (type === 'audio' ? 'mp3' : 'mp4');

            // Try to get filename from Content-Disposition
            if (contentDisp && contentDisp.match(/filename="?([^"]+)"?/)) {
                fileName = contentDisp.match(/filename="?([^"]+)"?/)[1];
            } else if (videoInfo && videoInfo.title) {
                // Fallback to title from state
                const safeTitle = videoInfo.title.replace(/[^a-z0-9\s\-\.]/gi, '_');
                fileName = `${safeTitle}.${type === 'audio' ? 'mp3' : 'mp4'}`;
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => {
                setDownloading(false);
                setStatus('');
                setProgress(0);
            }, 3000);

        } catch (err) {
            console.error("Download failed", err);
            setErrorMsg('Download failed. Please try again.');
            setDownloading(false);
        }
    };

    // Helper to format bytes
    const formatBytes = (bytes, decimals = 2) => {
        if (!bytes) return 'N/A';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // Prepare options for Select
    const getOptions = () => {
        if (!videoInfo) return [];
        if (type === 'video') {
            // Remove duplicates based on qualityLabel
            const seen = new Set();
            return videoInfo.videoFormats.filter(f => {
                const dup = seen.has(f.qualityLabel);
                seen.add(f.qualityLabel);
                return !dup;
            }).map(f => ({
                key: f.itag,
                value: f.itag,
                text: `${f.qualityLabel} ${!f.hasAudio ? '(Video Only)' : ''} - ${f.container} (${formatBytes(f.fileSize)})`
            }));
        } else {
            return videoInfo.audioFormats.map(f => ({
                key: f.itag,
                value: f.itag,
                text: `MP3 (Source: ${f.container}) - ${f.audioBitrate}kbps (${formatBytes(f.fileSize)})`
            }));
        }
    };

    return (
        <Card className="glass-panel" fluid style={{ background: 'transparent', boxShadow: 'none' }}>
            {loadingInfo && <Dimmer active inverted><Loader>Fetching Info...</Loader></Dimmer>}
            <Card.Content>
                <Card.Header style={{ color: 'inherit', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <Icon name={icon} color={color} size='large' style={{ marginRight: '10px' }} />
                    {title}
                </Card.Header>

                <Form>
                    <Form.Field>
                        <Input
                            placeholder='Paste YouTube Link...'
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            action={{
                                icon: 'search',
                                onClick: fetchInfo,
                                disabled: !url || downloading
                            }}
                        />
                    </Form.Field>

                    {errorMsg && <Message negative size='tiny'>{errorMsg}</Message>}

                    {downloading && (
                        <div style={{ marginBottom: '1rem' }}>
                            <Progress percent={progress} active={progress < 100} success={progress === 100} color={color} size='small'>
                                {status}
                            </Progress>
                        </div>
                    )}

                    {videoInfo && !downloading && (
                        <>
                            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src={videoInfo.thumbnail} alt="thumb" style={{ width: '60px', borderRadius: '4px' }} />
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {videoInfo.title}
                                </span>
                            </div>

                            <Form.Field>
                                <Select
                                    placeholder='Select Quality'
                                    options={getOptions()}
                                    value={selectedFormat}
                                    onChange={(e, { value }) => setSelectedFormat(value)}
                                    fluid
                                />
                            </Form.Field>

                            <Button
                                color={color}
                                fluid
                                onClick={handleDownload}
                                icon='download'
                                content='Download Now'
                            />
                        </>
                    )}
                </Form>
            </Card.Content>
        </Card>
    );
};

export default YoutubeCard;
