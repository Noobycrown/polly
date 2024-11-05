import React, { useRef, useEffect } from 'react';

function AudioPlayer({ audioFile, playbackSpeed }) {
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    return (
        <div className="audio-container">
            {audioFile ? (
                <audio controls ref={audioRef} src={URL.createObjectURL(audioFile)} />
            ) : (
                <p>No audio to play. Please convert text first.</p>
            )}
        </div>
    );
}

export default AudioPlayer;
