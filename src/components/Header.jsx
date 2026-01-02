import React, { useContext, useState, useEffect } from 'react';
import { Menu, Icon, Container, Header as SemanticHeader } from 'semantic-ui-react';
import { ThemeContext } from '../context/ThemeContext';

const Typewriter = ({ text, speed = 100 }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText((prev) => prev + text.charAt(index));
                setIndex((prev) => prev + 1);
            }, speed);
            return () => clearTimeout(timeout);
        }
    }, [index, text, speed]);

    return <span>{displayedText}</span>;
};

const Header = () => {
    const { isDark, toggleTheme } = useContext(ThemeContext);

    return (
        <div className="glass-header">
            <Container>
                <Menu secondary size="tiny" style={{ border: 'none', margin: '0.5rem 0' }}>
                    <Menu.Item header>
                        <SemanticHeader as='h3' inverted={false} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                            <Icon name='sync alternate' color={isDark ? 'teal' : 'blue'} circular size="small" />
                            <SemanticHeader.Content className="header-text">
                                <span style={{
                                    background: 'linear-gradient(45deg, #2196F3, #00BCD4)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 800
                                }}>
                                    MediaFlux
                                </span>
                                <SemanticHeader.Subheader style={{ fontSize: '0.8rem', opacity: 0.8, color: 'var(--text-color)' }}>
                                    <Typewriter text="Convert & Download with ease" speed={50} />
                                </SemanticHeader.Subheader>
                            </SemanticHeader.Content>
                        </SemanticHeader>
                    </Menu.Item>

                    <Menu.Menu position='right'>
                        <Menu.Item onClick={toggleTheme} style={{ cursor: 'pointer' }}>
                            <div className="theme-toggle-btn">
                                <Icon
                                    name={isDark ? 'sun' : 'moon'}
                                    size='large'
                                    fitted
                                    style={{ color: isDark ? '#ffd700' : '#4a4a4a' }}
                                />
                            </div>
                        </Menu.Item>
                    </Menu.Menu>
                </Menu>
            </Container>
        </div>
    );
};

export default Header;
