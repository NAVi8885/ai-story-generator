/**
 * Application Root (Frontend MVC Entrypoint)
 */

import React from 'react';
import './App.css';
import { StoryProvider } from './context/StoryContext';
import StudioWorkspaceView from './views/StudioWorkspaceView';

export default function App() {
  return (
    <StoryProvider>
      <StudioWorkspaceView />
    </StoryProvider>
  );
}
