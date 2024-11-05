import './App.css';
import Header from './components/Header';
import Section from './components/Section';
import AudioPlayer from './components/AudioPlayer';
import { useState, useEffect } from 'react';
import AWS from 'aws-sdk';
import { toast, Toaster } from 'react-hot-toast';

// AWS Configuration
AWS.config.update({
    accessKeyId: process.env.REACT_APP_CLIENTID,
    secretAccessKey: process.env.REACT_APP_SECRETKEY,
    region: process.env.REACT_APP_REGION
});

const polly = new AWS.Polly();

// Voice options for language and accent selection
const voiceOptions = [
    { id: 'Joanna', name: 'English (US) - Joanna' },
    { id: 'Matthew', name: 'English (US) - Matthew' },
    { id: 'Salli', name: 'English (US) - Salli' },
    // Add other voices and languages here
];

function App() {
    const [text, setText] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [selectedVoice, setSelectedVoice] = useState('Joanna');
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [textHistory, setTextHistory] = useState([]);

    // Load text history from localStorage
    useEffect(() => {
        const savedHistory = JSON.parse(localStorage.getItem('textHistory')) || [];
        setTextHistory(savedHistory);
    }, []);

    // Function to save text to history
    const saveTextToHistory = (text) => {
        const updatedHistory = [...textHistory, text];
        localStorage.setItem('textHistory', JSON.stringify(updatedHistory));
        setTextHistory(updatedHistory);
    };

    // Function to delete text from history
    const deleteTextFromHistory = (index) => {
        const updatedHistory = textHistory.filter((_, i) => i !== index);
        localStorage.setItem('textHistory', JSON.stringify(updatedHistory));
        setTextHistory(updatedHistory);
    };

    // Function to handle text summarization (placeholder)
    const summarizeText = async (inputText) => {
        return inputText.slice(0, 1000); // Placeholder - returns the first 1000 characters
    };

    // Function to split long text into manageable chunks
    const chunkText = (text, chunkSize = 1000) => {
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize));
        }
        return chunks;
    };

    // Function to convert text to speech using AWS Polly
    const convertTextToSpeech = async () => {
        let textToConvert = text;

        if (text.length > 2000) {
            textToConvert = await summarizeText(text);
        }

        const textChunks = chunkText(textToConvert);
        const audioChunks = [];

        for (const chunk of textChunks) {
            try {
                const result = await polly.synthesizeSpeech({
                    Text: `<speak>${chunk}</speak>`,
                    OutputFormat: 'mp3',
                    VoiceId: selectedVoice,
                    TextType: 'ssml'
                }).promise();

                audioChunks.push(result.AudioStream);
            } catch (error) {
                console.error('Polly Error:', error);
                toast.error('An error occurred while converting text to speech');
                return;
            }
        }

        const combinedAudioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        setAudioFile(combinedAudioBlob);

        toast.success('Text converted to speech successfully!');
        saveTextToHistory(text);
    };

    return (
        <>
            <div className="container">
                <Header />

                <Section
                    text={text}
                    setText={setText}
                    convertTextToSpeech={convertTextToSpeech}
                />

                <div className="controls-container">
                    <div className="voice-selection">
                        <label htmlFor="voiceSelect">Choose Voice:</label>
                        <select
                            id="voiceSelect"
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                        >
                            {voiceOptions.map(voice => (
                                <option key={voice.id} value={voice.id}>{voice.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="playback-speed">
                        <label htmlFor="playbackSpeed">Playback Speed:</label>
                        <input
                            id="playbackSpeed"
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={playbackSpeed}
                            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                        />
                    </div>
                </div>

                <div className="history-container">
                    <h3>Text History</h3>
                    <ul>
                        {textHistory.map((historyItem, index) => (
                            <li key={index}>
                                {historyItem}
                                <button onClick={() => deleteTextFromHistory(index)} style={{ marginLeft: '10px', cursor: 'pointer', color: '#ff4d4d' }}>Delete</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <Toaster position="top-right" reverseOrder={false} />
            <AudioPlayer audioFile={audioFile} playbackSpeed={playbackSpeed} />
        </>
    );
}

export default App;
