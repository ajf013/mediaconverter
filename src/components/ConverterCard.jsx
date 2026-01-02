import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Progress, Sidebar, Form, Message } from 'semantic-ui-react';
import { fetchFile } from '@ffmpeg/util';
import { loadFFmpeg } from '../utils/ffmpeg';

const ConverterCard = ({ title, type, icon, color }) => {
    // type: 'video-to-audio', 'extract-audio', 'video-convert'
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, converting, done, error
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [ffmpegInstance, setFfmpegInstance] = useState(null);

    useEffect(() => {
        loadFFmpeg()
            .then(setFfmpegInstance)
            .catch(err => {
                console.error("Failed to load FFmpeg", err);
                // Show more detailed error
                let msg = "Failed to load converter engine.";
                if (!window.crossOriginIsolated) {
                    msg += " (Security Headers Missing: SharedArrayBuffer unavailable/crossOriginIsolated=false)";
                } else {
                    msg += " " + (err.message || err.toString());
                }
                setErrorMsg(msg);
            });
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus('idle');
        setDownloadUrl(null);
        setProgress(0);
    };

    const convert = async () => {
        if (!file || !ffmpegInstance) return;

        setStatus('converting');
        setProgress(0);
        setErrorMsg('');

        try {
            const ffmpeg = ffmpegInstance;
            const fileName = file.name;
            const inputName = 'input_' + fileName;

            await ffmpeg.writeFile(inputName, await fetchFile(file));

            ffmpeg.on('progress', ({ progress: p }) => {
                setProgress(Math.round(p * 100));
            });

            let outputName = '';
            let valid = true;

            if (type === 'video-to-audio' || type === 'extract-audio') {
                outputName = 'output.mp3';
                await ffmpeg.exec(['-i', inputName, outputName]);
            } else if (type === 'video-convert') {
                // mp4/mov to mp3 (same as above really, but generic naming)
                outputName = fileName.split('.')[0] + '.mp3';
                await ffmpeg.exec(['-i', inputName, outputName]);
            }

            const data = await ffmpeg.readFile(outputName);
            const blob = new Blob([data.buffer], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);

            setDownloadUrl(url);
            setStatus('done');

            // Clean up
            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);

        } catch (err) {
            console.error(err);
            setErrorMsg("Conversion failed. See console for details.");
            setStatus('error');
        }
    };

    return (
        <Card className="glass-panel" fluid style={{ background: 'transparent', boxShadow: 'none' }}>
            <Card.Content>
                <Card.Header style={{ color: 'inherit', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <Icon name={icon} color={color} size='large' style={{ marginRight: '10px' }} />
                    {title}
                </Card.Header>

                <Form>
                    <Form.Field>
                        <Button
                            as="label"
                            basic
                            color={color}
                            content={file ? file.name : "Choose File"}
                            icon="file"
                            htmlFor={`file-upload-${title}`}
                            fluid
                        />
                        <input
                            type="file"
                            id={`file-upload-${title}`}
                            hidden
                            onChange={handleFileChange}
                            accept={type.includes('audio') ? "video/*" : "video/*"}
                        />
                    </Form.Field>

                    {errorMsg && <Message negative size='small'>{errorMsg}</Message>}

                    {status === 'converting' && (
                        <Progress percent={progress} indicating size='tiny' color={color} active />
                    )}

                    {status === 'done' && (
                        <Button
                            color='green'
                            fluid
                            as='a'
                            href={downloadUrl}
                            download="converted_audio.mp3"
                            icon='download'
                            content='Download Result'
                        />
                    )}

                    {status !== 'getting-ready' && status !== 'converting' && status !== 'done' && (
                        <Button
                            primary
                            fluid
                            onClick={convert}
                            disabled={!file || !ffmpegInstance}
                            loading={!ffmpegInstance}
                        >
                            Start Conversion
                        </Button>
                    )}
                </Form>
            </Card.Content>
        </Card>
    );
};

export default ConverterCard;
