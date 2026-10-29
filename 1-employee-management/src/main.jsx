import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ToastProvider} from './common/ui.jsx';
import App from './App.jsx';
import './styles.css';
createRoot(document.getElementById('root')).render(<StrictMode><ToastProvider><App/></ToastProvider></StrictMode>);
