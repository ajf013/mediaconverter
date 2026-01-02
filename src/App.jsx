import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Grid, Container, Divider } from 'semantic-ui-react';
import Layout from './components/Layout';
import ConverterCard from './components/ConverterCard';
import YoutubeCard from './components/YoutubeCard';

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <Layout>
      <Container style={{ marginTop: '2rem' }}>

        <div data-aos="fade-down" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0' }}>Media Tools</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Convert, Extract, and Download with ease.</p>
        </div>

        <Grid stackable columns={2} padded>

          {/* YouTube Tools */}
          <Divider horizontal style={{ width: '100%', margin: '2rem 0', color: 'var(--text-color)', opacity: 0.5 }}>Online Tools</Divider>

          <Grid.Column>
            <div data-aos="fade-right" data-aos-delay="100">
              <YoutubeCard
                title="YouTube Video Downloader"
                type="video"
                icon="youtube"
                color="red"
              />
            </div>
          </Grid.Column>

          <Grid.Column>
            <div data-aos="fade-left" data-aos-delay="200">
              <YoutubeCard
                title="YouTube Audio Downloader"
                type="audio"
                icon="music"
                color="pink"
              />
            </div>
          </Grid.Column>

          {/* Local Tools */}
          <Divider horizontal style={{ width: '100%', margin: '2rem 0', color: 'var(--text-color)', opacity: 0.5 }}>Local Converters</Divider>

          <Grid.Column>
            <div data-aos="fade-right" data-aos-delay="300">
              <ConverterCard
                title="Video to Audio Converter"
                type="video-to-audio"
                icon="file audio"
                color="violet"
              />
            </div>
          </Grid.Column>

          <Grid.Column>
            <div data-aos="fade-left" data-aos-delay="400">
              <ConverterCard
                title="Audio Extractor from Video"
                type="extract-audio"
                icon="cut"
                color="purple"
              />
            </div>
          </Grid.Column>

          <Grid.Column>
            <div data-aos="fade-up" data-aos-delay="500">
              <ConverterCard
                title="MP4/MOV to MP3"
                type="video-convert"
                icon="exchange"
                color="blue"
              />
            </div>
          </Grid.Column>

        </Grid>
      </Container>
    </Layout>
  );
}

export default App;
